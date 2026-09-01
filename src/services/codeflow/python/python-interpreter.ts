/**
 * CODEFLOW — Python Interpreter
 * PRD-2 §9: Python Runtime Model
 *
 * Pipeline visualized:
 *   Source → Compilation → Bytecode → Python Virtual Machine → Execution Frames
 *
 * Visualizes:
 *   - Global frame, function frames
 *   - Local variables, arguments, return values
 *   - Object references, loops, conditions, exceptions
 *   - Bytecode concept (simplified)
 *
 * Implementation: custom recursive-descent interpreter over a hand-rolled
 * line/token scanner — no native eval(), no child processes.
 */

import {
  RuntimeState,
  RuntimeValue,
  ExecutionStep,
  ExecutionResult,
  Variable,
  Scope,
  CallFrame,
  LanguageEngine,
  SupportedLanguage,
} from '../types';
import { createInitialState, cloneState } from '../runtime-state.factory';
import { CODEFLOW_LIMITS } from '../../../constants/codeflow.constants';

// ── Signals ───────────────────────────────────────────────────────────────────
class ReturnSignal { constructor(public value: RuntimeValue) {} }
class BreakSignal {}
class ContinueSignal {}
class ExceptionSignal { constructor(public message: string, public kind: string = 'Exception') {} }

// ── Token types ───────────────────────────────────────────────────────────────
type TokType =
  | 'NUMBER' | 'STRING' | 'BOOL' | 'NONE' | 'NAME'
  | 'OP' | 'NEWLINE' | 'INDENT' | 'DEDENT' | 'EOF'
  | 'COLON' | 'COMMA' | 'LPAREN' | 'RPAREN' | 'LBRACKET' | 'RBRACKET'
  | 'LBRACE' | 'RBRACE' | 'DOT' | 'ARROW';

interface Token {
  type: TokType;
  value: string;
  line: number;
}

// ── AST Nodes ─────────────────────────────────────────────────────────────────
interface ASTNode { type: string; line: number }
interface Program extends ASTNode { type: 'Program'; body: ASTNode[] }
interface AssignStmt extends ASTNode { type: 'Assign'; targets: string[]; value: Expr }
interface AugAssignStmt extends ASTNode { type: 'AugAssign'; target: string; op: string; value: Expr }
interface ExprStmt extends ASTNode { type: 'ExprStmt'; expr: Expr }
interface IfStmt extends ASTNode { type: 'If'; test: Expr; body: ASTNode[]; orelse: ASTNode[] }
interface WhileStmt extends ASTNode { type: 'While'; test: Expr; body: ASTNode[]; orelse: ASTNode[] }
interface ForStmt extends ASTNode { type: 'For'; target: string; iter: Expr; body: ASTNode[]; orelse: ASTNode[] }
interface FuncDef extends ASTNode { type: 'FuncDef'; name: string; params: string[]; body: ASTNode[] }
interface ReturnStmt extends ASTNode { type: 'Return'; value: Expr | null }
interface BreakStmt extends ASTNode { type: 'Break' }
interface ContinueStmt extends ASTNode { type: 'Continue' }
interface PassStmt extends ASTNode { type: 'Pass' }
interface RaiseStmt extends ASTNode { type: 'Raise'; exc: Expr | null }
interface TryStmt extends ASTNode { type: 'Try'; body: ASTNode[]; handlers: ExceptHandler[]; finalbody: ASTNode[] }
interface ExceptHandler { excType: string | null; name: string | null; body: ASTNode[]; line: number }
interface PrintStmt extends ASTNode { type: 'Print'; args: Expr[] }

type Stmt = AssignStmt | AugAssignStmt | ExprStmt | IfStmt | WhileStmt | ForStmt
  | FuncDef | ReturnStmt | BreakStmt | ContinueStmt | PassStmt | RaiseStmt | TryStmt | PrintStmt;

type Expr =
  | { type: 'Num'; value: number; line: number }
  | { type: 'Str'; value: string; line: number }
  | { type: 'Bool'; value: boolean; line: number }
  | { type: 'None'; line: number }
  | { type: 'Name'; id: string; line: number }
  | { type: 'BinOp'; left: Expr; op: string; right: Expr; line: number }
  | { type: 'UnaryOp'; op: string; operand: Expr; line: number }
  | { type: 'Compare'; left: Expr; ops: string[]; comparators: Expr[]; line: number }
  | { type: 'BoolOp'; op: string; values: Expr[]; line: number }
  | { type: 'Call'; func: Expr; args: Expr[]; line: number }
  | { type: 'Attribute'; value: Expr; attr: string; line: number }
  | { type: 'List'; elts: Expr[]; line: number }
  | { type: 'Dict'; keys: Expr[]; values: Expr[]; line: number }
  | { type: 'Tuple'; elts: Expr[]; line: number }
  | { type: 'Subscript'; value: Expr; slice: Expr; line: number }
  | { type: 'IfExp'; test: Expr; body: Expr; orelse: Expr; line: number };

// ── Tokenizer ─────────────────────────────────────────────────────────────────
function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  const lines = source.split('\n');
  const indentStack: number[] = [0];

  for (let lineNo = 0; lineNo < lines.length; lineNo++) {
    const rawLine = lines[lineNo]!;
    const line = lineNo + 1;

    // skip blank lines and comments
    const stripped = rawLine.trimEnd();
    if (stripped.trim() === '' || stripped.trim().startsWith('#')) {
      continue;
    }

    // measure indent
    let indent = 0;
    for (const ch of stripped) {
      if (ch === ' ') indent++;
      else if (ch === '\t') indent += 4;
      else break;
    }

    const currentIndent = indentStack[indentStack.length - 1]!;
    if (indent > currentIndent) {
      indentStack.push(indent);
      tokens.push({ type: 'INDENT', value: '', line });
    } else {
      while (indent < (indentStack[indentStack.length - 1] ?? 0)) {
        indentStack.pop();
        tokens.push({ type: 'DEDENT', value: '', line });
      }
    }

    // tokenize the content part
    let i = indent;
    const content = stripped;
    while (i < content.length) {
      const ch = content[i]!;

      if (ch === '#') break; // comment

      if (ch === ' ' || ch === '\t') { i++; continue; }

      // String literals
      if (ch === '"' || ch === "'") {
        const quote = ch;
        let j = i + 1;
        // triple-quote
        if (content[i + 1] === quote && content[i + 2] === quote) {
          j = i + 3;
          while (j < content.length && !(content[j] === quote && content[j+1] === quote && content[j+2] === quote)) j++;
          tokens.push({ type: 'STRING', value: content.slice(i + 3, j), line });
          i = j + 3;
          continue;
        }
        while (j < content.length && content[j] !== quote) {
          if (content[j] === '\\') j++;
          j++;
        }
        tokens.push({ type: 'STRING', value: content.slice(i + 1, j), line });
        i = j + 1;
        continue;
      }

      // f-string (simplified — treat as string)
      if ((ch === 'f' || ch === 'F') && (content[i+1] === '"' || content[i+1] === "'")) {
        const q = content[i+1]!;
        let j = i + 2;
        while (j < content.length && content[j] !== q) {
          if (content[j] === '\\') j++;
          j++;
        }
        tokens.push({ type: 'STRING', value: content.slice(i + 2, j), line });
        i = j + 1;
        continue;
      }

      // Numbers
      if ((ch >= '0' && ch <= '9') || (ch === '-' && i + 1 < content.length && content[i+1]! >= '0' && content[i+1]! <= '9')) {
        let j = i;
        if (ch === '-') j++;
        while (j < content.length && ((content[j]! >= '0' && content[j]! <= '9') || content[j] === '.')) j++;
        tokens.push({ type: 'NUMBER', value: content.slice(i, j), line });
        i = j;
        continue;
      }

      // Identifiers / keywords
      if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_') {
        let j = i;
        while (j < content.length && /[\w]/.test(content[j]!)) j++;
        const word = content.slice(i, j);
        if (word === 'True' || word === 'False') {
          tokens.push({ type: 'BOOL', value: word, line });
        } else if (word === 'None') {
          tokens.push({ type: 'NONE', value: 'None', line });
        } else {
          tokens.push({ type: 'NAME', value: word, line });
        }
        i = j;
        continue;
      }

      // Multi-char operators
      const two = content.slice(i, i + 2);
      if (['==', '!=', '<=', '>=', '//', '**', '+=', '-=', '*=', '/=', '%=', '->', '<<', '>>'].includes(two)) {
        tokens.push({ type: 'OP', value: two, line });
        i += 2;
        continue;
      }

      // Single-char
      const singles: Record<string, TokType> = {
        ':': 'COLON', ',': 'COMMA', '(': 'LPAREN', ')': 'RPAREN',
        '[': 'LBRACKET', ']': 'RBRACKET', '{': 'LBRACE', '}': 'RBRACE',
        '.': 'DOT',
      };
      if (singles[ch]) {
        tokens.push({ type: singles[ch]!, value: ch, line });
        i++;
        continue;
      }

      if (['+', '-', '*', '/', '%', '<', '>', '=', '!', '&', '|', '^', '~', '@'].includes(ch)) {
        tokens.push({ type: 'OP', value: ch, line });
        i++;
        continue;
      }

      i++;
    }

    tokens.push({ type: 'NEWLINE', value: '', line });
  }

  // close remaining indents
  while (indentStack.length > 1) {
    indentStack.pop();
    tokens.push({ type: 'DEDENT', value: '', line: lines.length });
  }

  tokens.push({ type: 'EOF', value: '', line: lines.length });
  return tokens;
}

// ── Parser ────────────────────────────────────────────────────────────────────
class Parser {
  private pos = 0;
  constructor(private tokens: Token[]) {}

  private peek(): Token { return this.tokens[this.pos] ?? { type: 'EOF', value: '', line: 0 }; }
  private advance(): Token { return this.tokens[this.pos++] ?? { type: 'EOF', value: '', line: 0 }; }
  private check(type: TokType, value?: string): boolean {
    const t = this.peek();
    return t.type === type && (value === undefined || t.value === value);
  }
  private match(type: TokType, value?: string): Token | null {
    if (this.check(type, value)) return this.advance();
    return null;
  }
  private skipNewlines() {
    while (this.check('NEWLINE')) this.advance();
  }

  parseProgram(): Program {
    const body: ASTNode[] = [];
    this.skipNewlines();
    while (!this.check('EOF')) {
      const stmt = this.parseStatement();
      if (stmt) body.push(stmt);
      this.skipNewlines();
    }
    return { type: 'Program', body, line: 1 };
  }

  private parseStatement(): ASTNode | null {
    this.skipNewlines();
    const t = this.peek();
    if (t.type === 'EOF' || t.type === 'DEDENT') return null;

    // def
    if (t.type === 'NAME' && t.value === 'def') return this.parseFuncDef();
    // if
    if (t.type === 'NAME' && t.value === 'if') return this.parseIf();
    // while
    if (t.type === 'NAME' && t.value === 'while') return this.parseWhile();
    // for
    if (t.type === 'NAME' && t.value === 'for') return this.parseFor();
    // return
    if (t.type === 'NAME' && t.value === 'return') return this.parseReturn();
    // break
    if (t.type === 'NAME' && t.value === 'break') { this.advance(); this.match('NEWLINE'); return { type: 'Break', line: t.line }; }
    // continue
    if (t.type === 'NAME' && t.value === 'continue') { this.advance(); this.match('NEWLINE'); return { type: 'Continue', line: t.line }; }
    // pass
    if (t.type === 'NAME' && t.value === 'pass') { this.advance(); this.match('NEWLINE'); return { type: 'Pass', line: t.line }; }
    // raise
    if (t.type === 'NAME' && t.value === 'raise') return this.parseRaise();
    // try
    if (t.type === 'NAME' && t.value === 'try') return this.parseTry();
    // print (Python 3 function call but treat specially too)
    // assignment or expression
    return this.parseAssignOrExpr();
  }

  private parseFuncDef(): FuncDef {
    const line = this.peek().line;
    this.advance(); // def
    const name = this.advance().value;
    this.match('LPAREN');
    const params: string[] = [];
    while (!this.check('RPAREN') && !this.check('EOF')) {
      if (this.check('NAME')) params.push(this.advance().value);
      this.match('COMMA');
    }
    this.match('RPAREN');
    // optional return type annotation
    if (this.check('OP', '->') || this.check('ARROW')) { this.advance(); this.parseExpr(); }
    this.match('COLON');
    this.match('NEWLINE');
    const body = this.parseBlock();
    return { type: 'FuncDef', name, params, body, line };
  }

  private parseIf(): IfStmt {
    const line = this.peek().line;
    this.advance(); // if
    const test = this.parseExpr();
    this.match('COLON');
    this.match('NEWLINE');
    const body = this.parseBlock();
    let orelse: ASTNode[] = [];
    this.skipNewlines();
    if (this.check('NAME', 'elif')) {
      orelse = [this.parseIf()];
    } else if (this.check('NAME', 'else')) {
      this.advance();
      this.match('COLON');
      this.match('NEWLINE');
      orelse = this.parseBlock();
    }
    return { type: 'If', test, body, orelse, line };
  }

  private parseWhile(): WhileStmt {
    const line = this.peek().line;
    this.advance();
    const test = this.parseExpr();
    this.match('COLON');
    this.match('NEWLINE');
    const body = this.parseBlock();
    return { type: 'While', test, body, orelse: [], line };
  }

  private parseFor(): ForStmt {
    const line = this.peek().line;
    this.advance();
    const target = this.advance().value;
    this.advance(); // 'in'
    const iter = this.parseExpr();
    this.match('COLON');
    this.match('NEWLINE');
    const body = this.parseBlock();
    return { type: 'For', target, iter, body, orelse: [], line };
  }

  private parseReturn(): ReturnStmt {
    const line = this.peek().line;
    this.advance();
    if (this.check('NEWLINE') || this.check('EOF')) {
      this.match('NEWLINE');
      return { type: 'Return', value: null, line };
    }
    const value = this.parseExpr();
    this.match('NEWLINE');
    return { type: 'Return', value, line };
  }

  private parseRaise(): RaiseStmt {
    const line = this.peek().line;
    this.advance();
    if (this.check('NEWLINE') || this.check('EOF')) {
      return { type: 'Raise', exc: null, line };
    }
    const exc = this.parseExpr();
    this.match('NEWLINE');
    return { type: 'Raise', exc, line };
  }

  private parseTry(): TryStmt {
    const line = this.peek().line;
    this.advance();
    this.match('COLON');
    this.match('NEWLINE');
    const body = this.parseBlock();
    const handlers: ExceptHandler[] = [];
    let finalbody: ASTNode[] = [];
    this.skipNewlines();
    while (this.check('NAME', 'except')) {
      const hline = this.peek().line;
      this.advance();
      let excType: string | null = null;
      let ename: string | null = null;
      if (!this.check('COLON')) {
        excType = this.advance().value;
        if (this.check('NAME', 'as')) { this.advance(); ename = this.advance().value; }
      }
      this.match('COLON');
      this.match('NEWLINE');
      const hbody = this.parseBlock();
      handlers.push({ excType, name: ename, body: hbody, line: hline });
      this.skipNewlines();
    }
    if (this.check('NAME', 'finally')) {
      this.advance();
      this.match('COLON');
      this.match('NEWLINE');
      finalbody = this.parseBlock();
    }
    return { type: 'Try', body, handlers, finalbody, line };
  }

  private parseBlock(): ASTNode[] {
    const stmts: ASTNode[] = [];
    if (!this.match('INDENT')) {
      // single inline statement (shouldn't happen with our tokenizer)
      const s = this.parseStatement();
      if (s) stmts.push(s);
      return stmts;
    }
    while (!this.check('DEDENT') && !this.check('EOF')) {
      this.skipNewlines();
      if (this.check('DEDENT') || this.check('EOF')) break;
      const s = this.parseStatement();
      if (s) stmts.push(s);
    }
    this.match('DEDENT');
    return stmts;
  }

  private parseAssignOrExpr(): ASTNode {
    const line = this.peek().line;
    const expr = this.parseExpr();

    // augmented assignment?
    const augOps = ['+=', '-=', '*=', '/=', '%=', '//=', '**='];
    if (this.check('OP') && augOps.includes(this.peek().value)) {
      const op = this.advance().value;
      const value = this.parseExpr();
      this.match('NEWLINE');
      const target = (expr as any).id ?? (expr as any).attr ?? '';
      return { type: 'AugAssign', target, op, value, line } as AugAssignStmt;
    }

    // regular assignment?
    if (this.check('OP', '=')) {
      this.advance();
      const value = this.parseExpr();
      this.match('NEWLINE');
      const targets: string[] = [];
      if ((expr as any).type === 'Name') targets.push((expr as any).id);
      else if ((expr as any).type === 'Attribute') targets.push(`${(expr as any).value?.id}.${(expr as any).attr}`);
      else if ((expr as any).type === 'Subscript') targets.push('subscript');
      else targets.push('_');
      return { type: 'Assign', targets, value, line } as AssignStmt;
    }

    this.match('NEWLINE');
    return { type: 'ExprStmt', expr, line } as ExprStmt;
  }

  // ── Expression parsing (precedence climbing) ─────────────────────────────
  parseExpr(): Expr { return this.parseOrExpr(); }

  private parseOrExpr(): Expr {
    let left = this.parseAndExpr();
    while (this.check('NAME', 'or')) {
      this.advance();
      const right = this.parseAndExpr();
      left = { type: 'BoolOp', op: 'or', values: [left, right], line: left.line };
    }
    return left;
  }

  private parseAndExpr(): Expr {
    let left = this.parseNotExpr();
    while (this.check('NAME', 'and')) {
      this.advance();
      const right = this.parseNotExpr();
      left = { type: 'BoolOp', op: 'and', values: [left, right], line: left.line };
    }
    return left;
  }

  private parseNotExpr(): Expr {
    if (this.check('NAME', 'not')) {
      const line = this.peek().line;
      this.advance();
      return { type: 'UnaryOp', op: 'not', operand: this.parseNotExpr(), line };
    }
    return this.parseComparisons();
  }

  private parseComparisons(): Expr {
    let left = this.parseAddSub();
    while (this.peek().type === 'OP' && ['==','!=','<','>','<=','>='].includes(this.peek().value)
      || (this.peek().type === 'NAME' && ['in','is'].includes(this.peek().value))) {
      const op = this.advance().value;
      // handle 'not in', 'is not'
      let fullOp = op;
      if (op === 'not' && this.check('NAME', 'in')) { this.advance(); fullOp = 'not in'; }
      if (op === 'is' && this.check('NAME', 'not')) { this.advance(); fullOp = 'is not'; }
      const right = this.parseAddSub();
      left = { type: 'Compare', left, ops: [fullOp], comparators: [right], line: left.line };
    }
    return left;
  }

  private parseAddSub(): Expr {
    let left = this.parseMulDiv();
    while (this.check('OP', '+') || this.check('OP', '-')) {
      const op = this.advance().value;
      const right = this.parseMulDiv();
      left = { type: 'BinOp', left, op, right, line: left.line };
    }
    return left;
  }

  private parseMulDiv(): Expr {
    let left = this.parseUnary();
    while (this.check('OP', '*') || this.check('OP', '/') || this.check('OP', '%') || this.check('OP', '//') || this.check('OP', '**')) {
      const op = this.advance().value;
      const right = this.parseUnary();
      left = { type: 'BinOp', left, op, right, line: left.line };
    }
    return left;
  }

  private parseUnary(): Expr {
    if (this.check('OP', '-') || this.check('OP', '+') || this.check('OP', '~')) {
      const line = this.peek().line;
      const op = this.advance().value;
      return { type: 'UnaryOp', op, operand: this.parseUnary(), line };
    }
    return this.parsePostfix();
  }

  private parsePostfix(): Expr {
    let node = this.parsePrimary();
    let pyKeepParsing = true;
    while (pyKeepParsing) {
      if (this.check('DOT')) {
        this.advance();
        const attr = this.advance().value;
        node = { type: 'Attribute', value: node, attr, line: node.line };
        if (this.check('LPAREN')) {
          this.advance();
          const args = this.parseArgList();
          this.match('RPAREN');
          node = { type: 'Call', func: node, args, line: node.line };
        }
      } else if (this.check('LPAREN')) {
        this.advance();
        const args = this.parseArgList();
        this.match('RPAREN');
        node = { type: 'Call', func: node, args, line: node.line };
      } else if (this.check('LBRACKET')) {
        this.advance();
        const slice = this.parseExpr();
        this.match('RBRACKET');
        node = { type: 'Subscript', value: node, slice, line: node.line };
      } else { pyKeepParsing = false; }
    }
    return node;
  }

  private parsePrimary(): Expr {
    const t = this.peek();
    if (t.type === 'NUMBER') { this.advance(); return { type: 'Num', value: parseFloat(t.value), line: t.line }; }
    if (t.type === 'STRING') { this.advance(); return { type: 'Str', value: t.value, line: t.line }; }
    if (t.type === 'BOOL') { this.advance(); return { type: 'Bool', value: t.value === 'True', line: t.line }; }
    if (t.type === 'NONE') { this.advance(); return { type: 'None', line: t.line }; }
    if (t.type === 'NAME') { this.advance(); return { type: 'Name', id: t.value, line: t.line }; }
    if (t.type === 'LPAREN') {
      this.advance();
      if (this.check('RPAREN')) { this.advance(); return { type: 'Tuple', elts: [], line: t.line }; }
      const expr = this.parseExpr();
      if (this.check('COMMA')) {
        const elts = [expr];
        while (this.check('COMMA')) { this.advance(); if (!this.check('RPAREN')) elts.push(this.parseExpr()); }
        this.match('RPAREN');
        return { type: 'Tuple', elts, line: t.line };
      }
      this.match('RPAREN');
      return expr;
    }
    if (t.type === 'LBRACKET') {
      this.advance();
      const elts: Expr[] = [];
      while (!this.check('RBRACKET') && !this.check('EOF')) {
        elts.push(this.parseExpr());
        this.match('COMMA');
      }
      this.match('RBRACKET');
      return { type: 'List', elts, line: t.line };
    }
    if (t.type === 'LBRACE') {
      this.advance();
      const keys: Expr[] = [];
      const vals: Expr[] = [];
      while (!this.check('RBRACE') && !this.check('EOF')) {
        keys.push(this.parseExpr());
        this.match('COLON');
        vals.push(this.parseExpr());
        this.match('COMMA');
      }
      this.match('RBRACE');
      return { type: 'Dict', keys, values: vals, line: t.line };
    }
    // fallback name
    this.advance();
    return { type: 'Name', id: t.value, line: t.line };
  }

  private parseArgList(): Expr[] {
    const args: Expr[] = [];
    while (!this.check('RPAREN') && !this.check('EOF')) {
      // skip keyword args key=value
      const maybeKw = this.parseExpr();
      if (this.check('OP', '=')) {
        this.advance();
        this.parseExpr(); // value — skip
      } else {
        args.push(maybeKw);
      }
      this.match('COMMA');
    }
    return args;
  }
}

// ── Interpreter ───────────────────────────────────────────────────────────────
let _sc = 0, _fc = 0, _cc = 0;
function fScope() { return `py-scope-${++_sc}`; }
function fFrame() { return `py-frame-${++_fc}`; }
function fCon() { return `py-con-${++_cc}`; }

function pyDisplay(v: RuntimeValue, depth = 0): string {
  if (depth > 2) return '...';
  if (v === null || v === undefined) return 'None';
  if (typeof v === 'boolean') return v ? 'True' : 'False';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'string') return `'${v}'`;
  const obj = v as any;
  if (obj.__type === 'array') {
    const items = (obj.elements as RuntimeValue[]).slice(0, 5).map((e: RuntimeValue) => pyDisplay(e, depth + 1));
    return `[${items.join(', ')}${obj.elements.length > 5 ? ', ...' : ''}]`;
  }
  if (obj.__type === 'object') {
    const keys = Object.keys(obj.properties).slice(0, 3);
    const pairs = keys.map((k: string) => `'${k}': ${pyDisplay(obj.properties[k], depth + 1)}`);
    return `{${pairs.join(', ')}${Object.keys(obj.properties).length > 3 ? ', ...' : ''}}`;
  }
  return String(v);
}

export class PythonInterpreter implements LanguageEngine {
  readonly language: SupportedLanguage = 'python';

  private steps: ExecutionStep[] = [];
  private state: RuntimeState;
  private source: string;
  // stored function bodies: name → FuncDef node
  private functions: Map<string, FuncDef> = new Map();

  constructor(source: string) {
    this.source = source;
    this.state = createInitialState('python');
    _sc = 0; _fc = 0; _cc = 0;
  }

  execute(): ExecutionResult {
    // ── Compilation pipeline visualization ──────────────────────────────────
    this.emitPipeline('source', 1, 'Python source code loaded.');
    this.emitPipeline('compilation', 1, 'Python compiles source code to bytecode (CPython .pyc).');
    this.emitPipeline('bytecode', 1, 'Bytecode generated — Python VM instructions ready.');
    this.emitPipeline('pvm', 1, 'Python Virtual Machine (PVM) begins execution.');
    this.emitPipeline('execution', 1, 'Execution frames created. Global frame is active.');

    let ast: Program;
    try {
      const tokens = tokenize(this.source);
      const parser = new Parser(tokens);
      ast = parser.parseProgram();
    } catch (e: unknown) {
      const msg = (e as Error).message ?? 'Syntax error';
      return {
        steps: this.steps,
        totalSteps: this.steps.length,
        finalState: cloneState(this.state),
        hasError: true,
        parseError: msg,
        language: 'python',
      };
    }

    this.emit('PROGRAM_START', 1, 'Python program begins executing in the global frame.', {});

    try {
      this.execBlock(ast.body, 'global');
      this.state.executionStatus = 'completed';
      this.emit('PROGRAM_END', 0, 'Python program execution complete.', {});
    } catch (e) {
      if (e instanceof ExceptionSignal) {
        const line = this.state.currentLine;
        this.state.error = { type: e.kind, message: e.message, line };
        this.state.executionStatus = 'error';
        this.emit('ERROR', line, `${e.kind}: ${e.message}`, { errorType: e.kind, message: e.message, line });
      } else if (!(e instanceof ReturnSignal)) {
        const err = e as Error;
        const line = this.state.currentLine;
        this.state.error = { type: 'RuntimeError', message: err.message, line };
        this.state.executionStatus = 'error';
        this.emit('ERROR', line, `RuntimeError: ${err.message}`, {});
      }
    }

    const finalState = cloneState(this.state);
    finalState.currentStep = this.steps.length;
    return {
      steps: this.steps,
      totalSteps: this.steps.length,
      finalState,
      hasError: !!this.state.error,
      language: 'python',
    };
  }

  // ── Emit helpers ──────────────────────────────────────────────────────────
  private emit(type: ExecutionEventType, line: number, description: string, detail: Record<string, unknown>) {
    if (this.steps.length >= CODEFLOW_LIMITS.MAX_STEPS) throw new Error('INFINITE_LOOP');
    this.state.currentLine = line;
    this.state.currentStep = this.steps.length;
    this.state.explanation = description;
    const event: ExecutionEvent = { type, line, description, detail };
    this.steps.push({ index: this.steps.length, event, state: cloneState(this.state) });
  }

  private emitPipeline(stage: string, line: number, description: string) {
    this.state.compilationStage = stage;
    this.emit('COMPILATION_PIPELINE', line, description, { stage });
  }

  // ── Scope helpers ─────────────────────────────────────────────────────────
  private getScope(id: string): Scope | undefined {
    return this.state.scopes.find(s => s.id === id);
  }

  private lookupVar(name: string, scopeId: string): Variable | undefined {
    let sid: string | null = scopeId;
    while (sid) {
      const scope = this.getScope(sid);
      if (!scope) break;
      const v = scope.variables.find(v => v.name === name);
      if (v) return v;
      sid = scope.parentId;
    }
    return undefined;
  }

  private setVar(name: string, value: RuntimeValue, scopeId: string) {
    // look up existing
    let sid: string | null = scopeId;
    while (sid) {
      const scope = this.getScope(sid);
      if (!scope) break;
      const v = scope.variables.find(v => v.name === name);
      if (v) { v.value = value; v.state = 'initialized'; v.changedAtStep = this.steps.length; return; }
      sid = scope.parentId;
    }
    // new variable in current scope
    const scope = this.getScope(scopeId);
    if (scope) {
      scope.variables.push({ name, value, kind: 'local', state: 'initialized', scopeId, changedAtStep: this.steps.length });
    }
  }

  // ── Statement executor ────────────────────────────────────────────────────
  private execBlock(stmts: ASTNode[], scopeId: string) {
    for (const stmt of stmts) {
      this.execStmt(stmt as Stmt, scopeId);
    }
  }

  private execStmt(stmt: Stmt, scopeId: string) {
    if (this.steps.length >= CODEFLOW_LIMITS.MAX_STEPS) throw new Error('INFINITE_LOOP');
    const line = stmt.line;

    switch (stmt.type) {
      case 'Assign': {
        const value = this.evalExpr(stmt.value, scopeId);
        for (const target of stmt.targets) {
          this.setVar(target, value, scopeId);
          this.emit('DECLARE_VARIABLE', line, `${target} = ${pyDisplay(value)}`, { name: target, value, scopeId });
        }
        break;
      }

      case 'AugAssign': {
        const old = this.lookupVar(stmt.target, scopeId)?.value;
        const rhs = this.evalExpr(stmt.value, scopeId);
        const op = stmt.op.replace('=', '');
        const result = this.applyBinOp(old, op, rhs);
        this.setVar(stmt.target, result, scopeId);
        this.emit('ASSIGN_VARIABLE', line,
          `${stmt.target} ${stmt.op} ${pyDisplay(rhs)} → ${stmt.target} = ${pyDisplay(result)}`,
          { name: stmt.target, oldValue: old, newValue: result });
        break;
      }

      case 'ExprStmt':
        this.evalExpr(stmt.expr, scopeId);
        break;

      case 'If': {
        const cond = this.evalExpr(stmt.test, scopeId);
        const result = this.pyBool(cond);
        this.emit('EVALUATE_CONDITION', line,
          `if ${this.exprText(stmt.test)} → ${result ? 'True' : 'False'}`,
          { result, context: 'if' });
        if (result) {
          this.execBlock(stmt.body, scopeId);
        } else if (stmt.orelse.length > 0) {
          this.execBlock(stmt.orelse, scopeId);
        }
        break;
      }

      case 'While': {
        let iter = 0;
        this.emit('LOOP_START', line, 'while loop begins.', { loopType: 'while' });
        let pyWhileRunning = true;
        while (pyWhileRunning) {
          const cond = this.evalExpr(stmt.test, scopeId);
          const result = this.pyBool(cond);
          this.emit('LOOP_ITERATION', line,
            `while ${this.exprText(stmt.test)} → ${result ? 'True — enter body' : 'False — exit loop'}`,
            { loopType: 'while', iteration: iter, conditionResult: result });
          if (!result) { pyWhileRunning = false; break; }
          try { this.execBlock(stmt.body, scopeId); }
          catch (e) {
            if (e instanceof BreakSignal) { this.emit('BREAK_STATEMENT', line, 'break — exit loop', {}); pyWhileRunning = false; break; }
            if (e instanceof ContinueSignal) { this.emit('CONTINUE_STATEMENT', line, 'continue — next iteration', {}); iter++; continue; }
            throw e;
          }
          iter++;
        }
        this.emit('LOOP_END', line, 'while loop finished.', { loopType: 'while' });
        break;
      }

      case 'For': {
        const iterVal = this.evalExpr(stmt.iter, scopeId);
        const items = this.toIterable(iterVal);
        let iter = 0;
        this.emit('LOOP_START', line, `for ${stmt.target} in ... — loop begins.`, { loopType: 'for' });
        for (const item of items) {
          this.setVar(stmt.target, item, scopeId);
          this.emit('LOOP_ITERATION', line,
            `for iteration ${iter + 1}: ${stmt.target} = ${pyDisplay(item)}`,
            { loopType: 'for', iteration: iter, variable: stmt.target, value: item });
          try { this.execBlock(stmt.body, scopeId); }
          catch (e) {
            if (e instanceof BreakSignal) { this.emit('BREAK_STATEMENT', line, 'break — exit loop', {}); return; }
            if (e instanceof ContinueSignal) { this.emit('CONTINUE_STATEMENT', line, 'continue', {}); iter++; continue; }
            throw e;
          }
          iter++;
        }
        this.emit('LOOP_END', line, 'for loop finished.', { loopType: 'for' });
        break;
      }

      case 'FuncDef': {
        this.functions.set(stmt.name, stmt);
        this.setVar(stmt.name, { __type: 'function', name: stmt.name, params: stmt.params } as any, scopeId);
        this.emit('DECLARE_VARIABLE', line,
          `def ${stmt.name}(${stmt.params.join(', ')}) — function defined`,
          { name: stmt.name, params: stmt.params });
        break;
      }

      case 'Return': {
        const val = stmt.value ? this.evalExpr(stmt.value, scopeId) : null;
        this.emit('RETURN_VALUE', line, `return ${pyDisplay(val)}`, { value: val });
        throw new ReturnSignal(val);
      }

      case 'Break': throw new BreakSignal();
      case 'Continue': throw new ContinueSignal();
      case 'Pass': this.emit('EXECUTION_PHASE', line, 'pass — no operation', {}); break;

      case 'Raise': {
        const msg = stmt.exc ? pyDisplay(this.evalExpr(stmt.exc, scopeId)) : 'exception';
        this.emit('ERROR', line, `raise ${msg}`, { message: msg });
        throw new ExceptionSignal(msg, 'Exception');
      }

      case 'Try': {
        try {
          this.execBlock(stmt.body, scopeId);
        } catch (e) {
          if (e instanceof ReturnSignal || e instanceof BreakSignal || e instanceof ContinueSignal) throw e;
          const errMsg = e instanceof ExceptionSignal ? e.message : (e as Error).message;
          let handled = false;
          for (const handler of stmt.handlers) {
            if (!handler.excType || handler.excType === 'Exception') {
              const hScopeId = fScope();
              this.state.scopes.push({ id: hScopeId, type: 'block', name: 'except', parentId: scopeId, variables: [] });
              if (handler.name) this.setVar(handler.name, errMsg, hScopeId);
              this.emit('EVALUATE_CONDITION', line, `except ${handler.excType ?? ''} — handling exception: ${errMsg}`, { message: errMsg });
              try { this.execBlock(handler.body, hScopeId); }
              finally { this.state.scopes = this.state.scopes.filter(s => s.id !== hScopeId); }
              handled = true;
              break;
            }
          }
          if (!handled) throw e;
        } finally {
          if (stmt.finalbody.length > 0) this.execBlock(stmt.finalbody, scopeId);
        }
        break;
      }

      case 'Print': {
        const args = stmt.args.map(a => this.evalExpr(a, scopeId));
        const text = args.map(a => pyDisplay(a)).join(' ');
        this.state.consoleOutput.push({ id: fCon(), value: text, line, stepIndex: this.steps.length });
        this.emit('CONSOLE_OUTPUT', line, `print(${text}) → Output: ${text}`, { value: text, args });
        break;
      }
    }
  }

  // ── Expression evaluator ──────────────────────────────────────────────────
  private evalExpr(expr: Expr, scopeId: string): RuntimeValue {
    // expr.line available for future error reporting
    switch (expr.type) {
      case 'Num': return expr.value;
      case 'Str': return expr.value;
      case 'Bool': return expr.value;
      case 'None': return null;

      case 'Name': {
        if (expr.id === 'True') return true;
        if (expr.id === 'False') return false;
        if (expr.id === 'None') return null;
        const v = this.lookupVar(expr.id, scopeId);
        if (v === undefined) throw new ExceptionSignal(`name '${expr.id}' is not defined`, 'NameError');
        return v.value;
      }

      case 'BinOp': {
        const l = this.evalExpr(expr.left, scopeId);
        const r = this.evalExpr(expr.right, scopeId);
        return this.applyBinOp(l, expr.op, r);
      }

      case 'UnaryOp': {
        const val = this.evalExpr(expr.operand, scopeId);
        if (expr.op === '-') return -(val as number);
        if (expr.op === '+') return +(val as number);
        if (expr.op === 'not') return !this.pyBool(val);
        if (expr.op === '~') return ~(val as number);
        return val;
      }

      case 'Compare': {
        let left = this.evalExpr(expr.left, scopeId);
        let result = true;
        for (let i = 0; i < expr.ops.length; i++) {
          const right = this.evalExpr(expr.comparators[i]!, scopeId);
          result = result && this.applyCmp(left, expr.ops[i]!, right);
          left = right;
        }
        return result;
      }

      case 'BoolOp': {
        if (expr.op === 'and') {
          let v: RuntimeValue = true;
          for (const val of expr.values) { v = this.evalExpr(val, scopeId); if (!this.pyBool(v)) return v; }
          return v;
        }
        if (expr.op === 'or') {
          let v: RuntimeValue = false;
          for (const val of expr.values) { v = this.evalExpr(val, scopeId); if (this.pyBool(v)) return v; }
          return v;
        }
        return null;
      }

      case 'IfExp': {
        const test = this.pyBool(this.evalExpr(expr.test, scopeId));
        return test ? this.evalExpr(expr.body, scopeId) : this.evalExpr(expr.orelse, scopeId);
      }

      case 'List': {
        const elements = expr.elts.map(e => this.evalExpr(e, scopeId));
        return { __type: 'array', elements } as any;
      }

      case 'Tuple': {
        const elements = expr.elts.map(e => this.evalExpr(e, scopeId));
        return { __type: 'array', elements } as any;
      }

      case 'Dict': {
        const properties: Record<string, RuntimeValue> = {};
        for (let i = 0; i < expr.keys.length; i++) {
          const k = String(this.evalExpr(expr.keys[i]!, scopeId));
          properties[k] = this.evalExpr(expr.values[i]!, scopeId);
        }
        return { __type: 'object', properties } as any;
      }

      case 'Subscript': {
        const obj = this.evalExpr(expr.value, scopeId);
        const idx = this.evalExpr(expr.slice, scopeId);
        if ((obj as any)?.__type === 'array') return (obj as any).elements[idx as number];
        if ((obj as any)?.__type === 'object') return (obj as any).properties[String(idx)];
        if (typeof obj === 'string') return (obj as string)[idx as number];
        return undefined;
      }

      case 'Attribute': {
        const obj = this.evalExpr(expr.value, scopeId);
        if ((obj as any)?.__type === 'object') return (obj as any).properties[expr.attr];
        if ((obj as any)?.__type === 'array') {
          if (expr.attr === 'length' || expr.attr === '__len__') return (obj as any).elements.length;
        }
        if (typeof obj === 'string') {
          if (expr.attr === 'upper') return obj.toUpperCase();
          if (expr.attr === 'lower') return obj.toLowerCase();
          if (expr.attr === 'strip') return obj.trim();
          if (expr.attr === 'length' || expr.attr === '__len__') return obj.length;
        }
        return undefined;
      }

      case 'Call': {
        return this.evalCall(expr, scopeId);
      }

      default:
        return undefined;
    }
  }

  private evalCall(expr: { type: 'Call'; func: Expr; args: Expr[]; line: number }, scopeId: string): RuntimeValue {
    const line = expr.line;
    const argVals = expr.args.map(a => this.evalExpr(a, scopeId));

    // ── print() ──────────────────────────────────────────────────────────────
    if (expr.func.type === 'Name' && expr.func.id === 'print') {
      const text = argVals.map(a => pyDisplay(a)).join(' ');
      this.state.consoleOutput.push({ id: fCon(), value: text, line, stepIndex: this.steps.length });
      this.emit('CONSOLE_OUTPUT', line, `print(${text}) → Output: ${text}`, { value: text });
      return null;
    }

    // ── len() ─────────────────────────────────────────────────────────────────
    if (expr.func.type === 'Name' && expr.func.id === 'len') {
      const v = argVals[0];
      if ((v as any)?.__type === 'array') return (v as any).elements.length;
      if (typeof v === 'string') return v.length;
      return 0;
    }

    // ── range() ──────────────────────────────────────────────────────────────
    if (expr.func.type === 'Name' && expr.func.id === 'range') {
      const [start, stop, step] = argVals.length === 1
        ? [0, argVals[0] as number, 1]
        : argVals.length === 2
          ? [argVals[0] as number, argVals[1] as number, 1]
          : [argVals[0] as number, argVals[1] as number, argVals[2] as number];
      const elements: RuntimeValue[] = [];
      for (let i = start; i < stop; i += step) elements.push(i);
      return { __type: 'array', elements } as any;
    }

    // ── int() / float() / str() / bool() ─────────────────────────────────────
    if (expr.func.type === 'Name') {
      if (expr.func.id === 'int') return parseInt(String(argVals[0]), 10);
      if (expr.func.id === 'float') return parseFloat(String(argVals[0]));
      if (expr.func.id === 'str') return pyDisplay(argVals[0]);
      if (expr.func.id === 'bool') return this.pyBool(argVals[0]);
      if (expr.func.id === 'abs') return Math.abs(argVals[0] as number);
      if (expr.func.id === 'max') return Math.max(...(argVals as number[]));
      if (expr.func.id === 'min') return Math.min(...(argVals as number[]));
      if (expr.func.id === 'sum') {
        const v = argVals[0];
        const arr = (v as any)?.__type === 'array' ? (v as any).elements as number[] : [];
        return arr.reduce((a: number, b: number) => a + b, 0);
      }
      if (expr.func.id === 'list') {
        const v = argVals[0];
        if ((v as any)?.__type === 'array') return v;
        return { __type: 'array', elements: [] } as any;
      }
      if (expr.func.id === 'dict') return { __type: 'object', properties: {} } as any;
      if (expr.func.id === 'input') return '';
      if (expr.func.id === 'type') return typeof argVals[0];
      if (expr.func.id === 'enumerate') {
        const v = argVals[0];
        const arr = (v as any)?.__type === 'array' ? (v as any).elements as RuntimeValue[] : [];
        const elements = arr.map((el, i) => ({ __type: 'array', elements: [i, el] }));
        return { __type: 'array', elements } as any;
      }
      if (expr.func.id === 'zip') {
        const a1 = (argVals[0] as any)?.elements ?? [];
        const a2 = (argVals[1] as any)?.elements ?? [];
        const elements = a1.slice(0, Math.min(a1.length, a2.length)).map((v: RuntimeValue, i: number) => ({ __type: 'array', elements: [v, a2[i]] }));
        return { __type: 'array', elements } as any;
      }
    }

    // ── list/dict method calls ─────────────────────────────────────────────
    if (expr.func.type === 'Attribute') {
      const obj = this.evalExpr(expr.func.value, scopeId);
      const method = expr.func.attr;
      if ((obj as any)?.__type === 'array') {
        const arr = (obj as any).elements as RuntimeValue[];
        if (method === 'append') { arr.push(argVals[0]); return null; }
        if (method === 'extend') { const ex = (argVals[0] as any)?.elements ?? []; arr.push(...ex); return null; }
        if (method === 'pop') { return arr.pop() ?? null; }
        if (method === 'remove') { const idx = arr.indexOf(argVals[0] as any); if (idx >= 0) arr.splice(idx, 1); return null; }
        if (method === 'sort') { arr.sort((a, b) => (a as number) - (b as number)); return null; }
        if (method === 'reverse') { arr.reverse(); return null; }
        if (method === 'index') return arr.indexOf(argVals[0] as any);
        if (method === 'count') return arr.filter(v => v === argVals[0]).length;
        if (method === 'clear') { arr.splice(0); return null; }
        if (method === 'copy') return { __type: 'array', elements: [...arr] } as any;
      }
      if ((obj as any)?.__type === 'object') {
        const props = (obj as any).properties as Record<string, RuntimeValue>;
        if (method === 'keys') return { __type: 'array', elements: Object.keys(props) } as any;
        if (method === 'values') return { __type: 'array', elements: Object.values(props) } as any;
        if (method === 'items') return { __type: 'array', elements: Object.entries(props).map(([k, v]) => ({ __type: 'array', elements: [k, v] })) } as any;
        if (method === 'get') return props[String(argVals[0])] ?? argVals[1] ?? null;
        if (method === 'update') { Object.assign(props, (argVals[0] as any)?.properties ?? {}); return null; }
      }
      if (typeof obj === 'string') {
        if (method === 'upper') return (obj as string).toUpperCase();
        if (method === 'lower') return (obj as string).toLowerCase();
        if (method === 'strip') return (obj as string).trim();
        if (method === 'split') return { __type: 'array', elements: (obj as string).split(argVals[0] as string ?? ' ') } as any;
        if (method === 'join') { const arr = (argVals[0] as any)?.elements ?? []; return arr.map((v: RuntimeValue) => String(v)).join(obj as string); }
        if (method === 'replace') return (obj as string).replace(String(argVals[0]), String(argVals[1]));
        if (method === 'find' || method === 'index') return (obj as string).indexOf(String(argVals[0]));
        if (method === 'startswith') return (obj as string).startsWith(String(argVals[0]));
        if (method === 'endswith') return (obj as string).endsWith(String(argVals[0]));
        if (method === 'format') {
          let s = obj as string;
          argVals.forEach((v, i) => { s = s.replace(`{${i}}`, pyDisplay(v)); });
          s = s.replace(/\{\}/g, () => pyDisplay(argVals.shift() ?? null));
          return s;
        }
      }
    }

    // ── User-defined function ─────────────────────────────────────────────
    const fnName = expr.func.type === 'Name' ? expr.func.id : 'unknown';
    const fnDef = this.functions.get(fnName);
    if (!fnDef) return undefined;

    // Create function scope
    const fnScopeId = fScope();
    const fnScope: Scope = { id: fnScopeId, type: 'function', name: fnName, parentId: 'global', variables: [] };
    this.state.scopes.push(fnScope);

    // Bind params
    for (let i = 0; i < fnDef.params.length; i++) {
      fnScope.variables.push({ name: fnDef.params[i]!, value: argVals[i] ?? null, kind: 'local', state: 'initialized', scopeId: fnScopeId });
    }

    // Push frame
    const frameId = fFrame();
    const frame: CallFrame = { id: frameId, functionName: fnName, line, scopeId: fnScopeId };
    this.state.callStack.push(frame);

    const paramDesc = fnDef.params.map((p, i) => `${p}=${pyDisplay(argVals[i] ?? null)}`).join(', ');
    this.emit('PUSH_CALL_STACK', line,
      `Function "${fnName}" called — new frame pushed (${paramDesc})`,
      { frame, args: argVals });
    this.emit('ENTER_FUNCTION', line,
      `Entering function "${fnName}"(${paramDesc}) — execution frame created`,
      { functionName: fnName, params: fnDef.params, args: argVals });

    let returnValue: RuntimeValue = null;
    try {
      this.execBlock(fnDef.body, fnScopeId);
    } catch (e) {
      if (e instanceof ReturnSignal) returnValue = e.value;
      else {
        this.state.callStack = this.state.callStack.filter(f => f.id !== frameId);
        this.state.scopes = this.state.scopes.filter(s => s.id !== fnScopeId);
        throw e;
      }
    }

    this.emit('EXIT_FUNCTION', line,
      `Function "${fnName}" returns ${pyDisplay(returnValue)} — frame removed`,
      { functionName: fnName, returnValue });
    this.state.callStack = this.state.callStack.filter(f => f.id !== frameId);
    this.state.scopes = this.state.scopes.filter(s => s.id !== fnScopeId);
    this.emit('POP_CALL_STACK', line,
      `"${fnName}" frame popped — back to calling context`,
      { functionName: fnName, returnValue });

    return returnValue;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  private pyBool(v: RuntimeValue): boolean {
    if (v === null || v === undefined || v === false || v === 0 || v === '') return false;
    if ((v as any)?.__type === 'array') return (v as any).elements.length > 0;
    if ((v as any)?.__type === 'object') return Object.keys((v as any).properties).length > 0;
    return true;
  }

  private applyBinOp(l: RuntimeValue, op: string, r: RuntimeValue): RuntimeValue {
    const a = l as any, b = r as any;
    switch (op) {
      case '+': return typeof a === 'string' ? a + String(b) : (a + b);
      case '-': return a - b;
      case '*': return a * b;
      case '/': return a / b;
      case '//': return Math.floor(a / b);
      case '%': return a % b;
      case '**': return Math.pow(a, b);
      case '&': return a & b;
      case '|': return a | b;
      case '^': return a ^ b;
      case '<<': return a << b;
      case '>>': return a >> b;
      default: return undefined;
    }
  }

  private applyCmp(l: RuntimeValue, op: string, r: RuntimeValue): boolean {
    switch (op) {
      case '==': return l == r;
      case '!=': return l != r;
      case '<': return (l as number) < (r as number);
      case '>': return (l as number) > (r as number);
      case '<=': return (l as number) <= (r as number);
      case '>=': return (l as number) >= (r as number);
      case 'in': {
        if ((r as any)?.__type === 'array') return (r as any).elements.includes(l);
        if (typeof r === 'string') return (r as string).includes(String(l));
        return false;
      }
      case 'not in': {
        if ((r as any)?.__type === 'array') return !(r as any).elements.includes(l);
        if (typeof r === 'string') return !(r as string).includes(String(l));
        return true;
      }
      case 'is': return l === r;
      case 'is not': return l !== r;
      default: return false;
    }
  }

  private toIterable(v: RuntimeValue): RuntimeValue[] {
    if ((v as any)?.__type === 'array') return (v as any).elements;
    if (typeof v === 'string') return (v as string).split('');
    return [];
  }

  private exprText(expr: Expr): string {
    switch (expr.type) {
      case 'Name': return expr.id;
      case 'Num': return String(expr.value);
      case 'Bool': return expr.value ? 'True' : 'False';
      case 'None': return 'None';
      case 'Compare': return `${this.exprText(expr.left)} ${expr.ops[0]} ${this.exprText(expr.comparators[0]!)}`;
      case 'BinOp': return `${this.exprText(expr.left)} ${expr.op} ${this.exprText(expr.right)}`;
      case 'BoolOp': return expr.values.map(v => this.exprText(v)).join(` ${expr.op} `);
      default: return '(expr)';
    }
  }
}
