/**
 * CODEFLOW — C# Interpreter
 * PRD-2 §7: C# Runtime Model
 *
 * Compilation pipeline:
 *   C# Source → C# Compiler (Roslyn) → CIL/MSIL → CLR → JIT → Native Execution
 *
 * Runtime visualizes:
 *   Variables, Conditions, Loops, Functions/Methods, Objects,
 *   Stack Frames, Heap Objects, Method Calls, Return Values, Basic GC Events
 */

import {
  RuntimeState, RuntimeValue, ExecutionStep, ExecutionEvent, ExecutionEventType,
  ExecutionResult, Variable, Scope, CallFrame, ConsoleEntry, HeapObject,
  LanguageEngine, SupportedLanguage,
} from '../types';
import { createInitialState, cloneState } from '../runtime-state.factory';
import { CODEFLOW_LIMITS } from '../../../constants/codeflow.constants';

// ── Signals ────────────────────────────────────────────────────────────────────
class ReturnSignal { constructor(public value: RuntimeValue) {} }
class BreakSignal {}
class ContinueSignal {}

// ── AST nodes (simplified for C#) ─────────────────────────────────────────────
interface CSNode { type: string; line: number }
interface CSProgram extends CSNode { type: 'Program'; body: CSNode[] }
interface CSVarDecl extends CSNode { type: 'VarDecl'; cstype: string; name: string; init: CSExpr | null }
interface CSMethodDecl extends CSNode { type: 'MethodDecl'; returnType: string; name: string; params: CSParam[]; body: CSNode[]; isStatic: boolean }
interface CSParam { cstype: string; name: string }
interface CSIfStmt extends CSNode { type: 'If'; test: CSExpr; then: CSNode[]; else_: CSNode[] }
interface CSWhileStmt extends CSNode { type: 'While'; test: CSExpr; body: CSNode[] }
interface CSForStmt extends CSNode { type: 'For'; init: CSNode | null; test: CSExpr | null; update: CSExpr | null; body: CSNode[] }
interface CSForEachStmt extends CSNode { type: 'ForEach'; target: string; iter: CSExpr; body: CSNode[] }
interface CSReturnStmt extends CSNode { type: 'Return'; value: CSExpr | null }
interface CSBreakStmt extends CSNode { type: 'Break' }
interface CSContinueStmt extends CSNode { type: 'Continue' }
interface CSExprStmt extends CSNode { type: 'ExprStmt'; expr: CSExpr }
interface CSConsoleWrite extends CSNode { type: 'ConsoleWrite'; args: CSExpr[]; newline: boolean }
interface CSThrowStmt extends CSNode { type: 'Throw'; expr: CSExpr }
interface CSTryStmt extends CSNode { type: 'Try'; body: CSNode[]; catches: CSCatch[]; finally_: CSNode[] }
interface CSCatch { exType: string | null; name: string | null; body: CSNode[]; line: number }
interface CSObjectCreate extends CSNode { type: 'ObjectCreate'; className: string; args: CSExpr[] }

type CSStmt = CSVarDecl | CSMethodDecl | CSIfStmt | CSWhileStmt | CSForStmt | CSForEachStmt
  | CSReturnStmt | CSBreakStmt | CSContinueStmt | CSExprStmt | CSConsoleWrite | CSThrowStmt | CSTryStmt;

type CSExpr =
  | { type: 'Num'; value: number; line: number }
  | { type: 'Str'; value: string; line: number }
  | { type: 'Bool'; value: boolean; line: number }
  | { type: 'Null'; line: number }
  | { type: 'Name'; id: string; line: number }
  | { type: 'BinOp'; left: CSExpr; op: string; right: CSExpr; line: number }
  | { type: 'UnaryOp'; op: string; operand: CSExpr; line: number }
  | { type: 'Assign'; target: string; op: string; value: CSExpr; line: number }
  | { type: 'Call'; callee: string; args: CSExpr[]; line: number }
  | { type: 'MethodCall'; object: string; method: string; args: CSExpr[]; line: number }
  | { type: 'New'; className: string; args: CSExpr[]; line: number }
  | { type: 'Index'; array: string; index: CSExpr; line: number }
  | { type: 'Member'; object: string; field: string; line: number }
  | { type: 'Ternary'; test: CSExpr; then: CSExpr; else_: CSExpr; line: number }
  | { type: 'Cast'; cstype: string; expr: CSExpr; line: number };

// ── Tokenizer ─────────────────────────────────────────────────────────────────
type CSTokType = 'NUM' | 'STR' | 'CHAR' | 'NAME' | 'OP' | 'SEMI' | 'LBRACE' | 'RBRACE'
  | 'LPAREN' | 'RPAREN' | 'LBRACKET' | 'RBRACKET' | 'COMMA' | 'EOF' | 'DOT';

interface CSTok { type: CSTokType; value: string; line: number }

function csTokenize(src: string): CSTok[] {
  const tokens: CSTok[] = [];
  let i = 0, line = 1;
  while (i < src.length) {
    const ch = src[i]!;
    if (ch === '\n') { line++; i++; continue; }
    if (' \t\r'.includes(ch)) { i++; continue; }
    if (ch === '/' && src[i+1] === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (ch === '/' && src[i+1] === '*') { i += 2; while (i < src.length && !(src[i] === '*' && src[i+1] === '/')) { if (src[i] === '\n') line++; i++; } i += 2; continue; }
    // interpolated string @"..." or $"..."
    if ((ch === '@' || ch === '$') && src[i+1] === '"') {
      let j = i + 2;
      while (j < src.length && src[j] !== '"') { if (src[j] === '\\') j++; j++; }
      tokens.push({ type: 'STR', value: src.slice(i + 2, j), line });
      i = j + 1; continue;
    }
    if (ch === '"') {
      let j = i + 1;
      while (j < src.length && src[j] !== '"') { if (src[j] === '\\') j++; j++; }
      tokens.push({ type: 'STR', value: src.slice(i + 1, j), line });
      i = j + 1; continue;
    }
    if (ch === "'") { let j = i+1; if (src[j]==='\\') j++; j++; tokens.push({ type: 'CHAR', value: src.slice(i+1,j), line }); i = j+1; continue; }
    if (ch >= '0' && ch <= '9') {
      let j = i;
      while (j < src.length && (src[j]! >= '0' && src[j]! <= '9' || src[j] === '.' || src[j] === 'm' || src[j] === 'f' || src[j] === 'd' || src[j] === 'L')) j++;
      tokens.push({ type: 'NUM', value: src.slice(i, j), line }); i = j; continue;
    }
    if (/[a-zA-Z_]/.test(ch)) {
      let j = i;
      while (j < src.length && /[\w]/.test(src[j]!)) j++;
      tokens.push({ type: 'NAME', value: src.slice(i, j), line }); i = j; continue;
    }
    const two = src.slice(i, i + 2);
    if (['==','!=','<=','>=','&&','||','++','--','+=','-=','*=','/=','%=','??','?.','->'].includes(two)) {
      tokens.push({ type: 'OP', value: two, line }); i += 2; continue;
    }
    const singles: Record<string, CSTokType> = { ';':'SEMI', '{':'LBRACE', '}':'RBRACE', '(':'LPAREN', ')':'RPAREN', '[':'LBRACKET', ']':'RBRACKET', ',':'COMMA', '.':'DOT' };
    if (singles[ch]) { tokens.push({ type: singles[ch]!, value: ch, line }); i++; continue; }
    if ('+−*/<%>^&|!?:=~'.includes(ch)) { tokens.push({ type: 'OP', value: ch, line }); i++; continue; }
    i++;
  }
  tokens.push({ type: 'EOF', value: '', line });
  return tokens;
}

// ── Parser ────────────────────────────────────────────────────────────────────
class CSParser {
  private pos = 0;
  constructor(private tokens: CSTok[]) {}
  private peek(): CSTok { return this.tokens[this.pos] ?? { type: 'EOF', value: '', line: 0 }; }
  private advance(): CSTok { return this.tokens[this.pos++] ?? { type: 'EOF', value: '', line: 0 }; }
  private check(type: CSTokType, value?: string): boolean { const t = this.peek(); return t.type === type && (value === undefined || t.value === value); }
  private match(type: CSTokType, value?: string): boolean { if (this.check(type, value)) { this.advance(); return true; } return false; }

  parse(): CSProgram {
    const body: CSNode[] = [];
    // Skip namespace / using / class declarations wrapper
    this.skipClassWrapper();
    while (!this.check('EOF')) {
      const node = this.parseTopLevel();
      if (node) body.push(node);
    }
    return { type: 'Program', body, line: 1 };
  }

  private skipClassWrapper() {
    // Skip: using X; namespace Y { class Z {
    while (!this.check('EOF')) {
      const t = this.peek();
      if (t.type === 'NAME' && t.value === 'using') { while (!this.check('SEMI') && !this.check('EOF')) this.advance(); this.match('SEMI'); continue; }
      if (t.type === 'NAME' && (t.value === 'namespace' || t.value === 'class' || t.value === 'public' || t.value === 'private' || t.value === 'internal' || t.value === 'static' || t.value === 'abstract' || t.value === 'sealed')) {
        // check if followed eventually by {
        let found = false;
        for (let k = this.pos; k < Math.min(this.pos + 20, this.tokens.length); k++) {
          if (this.tokens[k]?.type === 'LBRACE') { found = true; break; }
        }
        if (found) {
          // skip until we find the opening brace of the class/namespace body
          while (!this.check('LBRACE') && !this.check('EOF')) this.advance();
          this.match('LBRACE'); // open brace of class/namespace
          break;
        }
      }
      break;
    }
  }

  private parseTopLevel(): CSNode | null {
    const t = this.peek();
    if (t.type === 'EOF' || t.type === 'RBRACE') { this.match('RBRACE'); return null; }

    const modifiers = ['public', 'private', 'protected', 'static', 'override', 'virtual', 'abstract', 'sealed', 'readonly', 'const'];
    while (t.type === 'NAME' && modifiers.includes(this.peek().value)) this.advance();

    const typeNames = ['void','int','string','bool','double','float','long','char','var','List','Dictionary','object','dynamic','String','Int32','Boolean','Double'];
    if (this.peek().type === 'NAME' && typeNames.includes(this.peek().value)) {
      return this.parseDeclarationOrMethod();
    }
    if (this.peek().type === 'NAME') {
      // could be a method or constructor
      return this.parseDeclarationOrMethod();
    }
    this.advance();
    return null;
  }

  private parseDeclarationOrMethod(): CSNode | null {
    const line = this.peek().line;
    const cstype = this.parseTypeSpec();
    const name = this.advance().value;

    if (this.check('LPAREN')) {
      this.advance();
      const params = this.parseParams();
      this.match('RPAREN');
      if (this.check('LBRACE')) {
        const body = this.parseBlock();
        return { type: 'MethodDecl', returnType: cstype, name, params, body, isStatic: false, line } as CSMethodDecl;
      }
      this.match('SEMI');
      return null;
    }

    // Variable
    let init: CSExpr | null = null;
    if (this.match('OP', '=')) init = this.parseExpr();
    this.match('SEMI');
    return { type: 'VarDecl', cstype, name, init, line } as CSVarDecl;
  }

  private parseTypeSpec(): string {
    const parts: string[] = [];
    const mods = ['public','private','protected','static','override','virtual','readonly','const','abstract'];
    while (this.peek().type === 'NAME' && mods.includes(this.peek().value)) this.advance();
    while (this.peek().type === 'NAME') {
      parts.push(this.advance().value);
      // generic: List<T>
      if (this.check('OP', '<')) {
        this.advance();
        while (!this.check('OP', '>') && !this.check('EOF')) this.advance();
        this.match('OP', '>');
        break;
      }
      if (!['int','string','bool','double','float','long','char','var','void','List','Dictionary','object','String'].includes(this.peek().value)) break;
    }
    // array: int[]
    if (this.check('LBRACKET')) { this.advance(); this.match('RBRACKET'); }
    // nullable: int?
    if (this.check('OP', '?')) this.advance();
    return parts.join(' ') || 'var';
  }

  private parseParams(): CSParam[] {
    const params: CSParam[] = [];
    while (!this.check('RPAREN') && !this.check('EOF')) {
      while (this.peek().type === 'NAME' && ['ref','out','in','params'].includes(this.peek().value)) this.advance();
      const cstype = this.parseTypeSpec();
      const name = this.advance().value;
      params.push({ cstype, name });
      // default value
      if (this.match('OP', '=')) this.parseExpr();
      this.match('COMMA');
    }
    return params;
  }

  private parseBlock(): CSNode[] {
    this.match('LBRACE');
    const stmts: CSNode[] = [];
    while (!this.check('RBRACE') && !this.check('EOF')) {
      const s = this.parseStatement();
      if (s) stmts.push(s);
    }
    this.match('RBRACE');
    return stmts;
  }

  private parseStatement(): CSNode | null {
    const t = this.peek();
    if (t.type === 'EOF' || t.type === 'RBRACE') return null;

    if (t.type === 'NAME') {
      if (t.value === 'if') return this.parseIf();
      if (t.value === 'while') return this.parseWhile();
      if (t.value === 'for') return this.parseFor();
      if (t.value === 'foreach') return this.parseForEach();
      if (t.value === 'return') return this.parseReturn();
      if (t.value === 'break') { this.advance(); this.match('SEMI'); return { type: 'Break', line: t.line }; }
      if (t.value === 'continue') { this.advance(); this.match('SEMI'); return { type: 'Continue', line: t.line }; }
      if (t.value === 'throw') return this.parseThrow();
      if (t.value === 'try') return this.parseTry();
      if (t.value === 'var' || t.value === 'const') return this.parseVarDecl();
      // Console.WriteLine / Console.Write
      if (t.value === 'Console') return this.parseConsoleWrite();
      // modifiers
      const mods = ['public','private','protected','static','override','virtual','readonly'];
      if (mods.includes(t.value)) {
        while (this.peek().type === 'NAME' && mods.includes(this.peek().value)) this.advance();
        return this.parseDeclarationOrMethod();
      }
      // check if it's a type declaration
      const typeNames = ['int','string','bool','double','float','long','char','List','Dictionary','String'];
      if (typeNames.includes(t.value)) return this.parseVarDecl();
    }

    if (t.type === 'LBRACE') {
      const body = this.parseBlock();
      return { type: 'ExprStmt', expr: { type: 'Null', line: t.line } as CSExpr, line: t.line } as CSExprStmt;
    }

    const expr = this.parseExpr();
    this.match('SEMI');
    return { type: 'ExprStmt', expr, line: t.line } as CSExprStmt;
  }

  private parseVarDecl(): CSVarDecl {
    const line = this.peek().line;
    const cstype = this.parseTypeSpec();
    const name = this.advance().value;
    let init: CSExpr | null = null;
    if (this.match('OP', '=')) init = this.parseExpr();
    this.match('SEMI');
    return { type: 'VarDecl', cstype, name, init, line };
  }

  private parseIf(): CSIfStmt {
    const line = this.peek().line;
    this.advance();
    this.match('LPAREN');
    const test = this.parseExpr();
    this.match('RPAREN');
    const then = this.check('LBRACE') ? this.parseBlock() : [this.parseStatement()!].filter(Boolean);
    let else_: CSNode[] = [];
    if (this.check('NAME', 'else')) {
      this.advance();
      if (this.check('NAME', 'if')) else_ = [this.parseIf()];
      else else_ = this.check('LBRACE') ? this.parseBlock() : [this.parseStatement()!].filter(Boolean);
    }
    return { type: 'If', test, then, else_, line };
  }

  private parseWhile(): CSWhileStmt {
    const line = this.peek().line;
    this.advance(); this.match('LPAREN');
    const test = this.parseExpr(); this.match('RPAREN');
    const body = this.check('LBRACE') ? this.parseBlock() : [this.parseStatement()!].filter(Boolean);
    return { type: 'While', test, body, line };
  }

  private parseFor(): CSForStmt {
    const line = this.peek().line;
    this.advance(); this.match('LPAREN');
    let init: CSNode | null = null;
    if (!this.check('SEMI')) {
      init = this.parseVarDecl();
    } else this.advance();
    const test = this.check('SEMI') ? null : this.parseExpr();
    this.match('SEMI');
    const update = this.check('RPAREN') ? null : this.parseExpr();
    this.match('RPAREN');
    const body = this.check('LBRACE') ? this.parseBlock() : [this.parseStatement()!].filter(Boolean);
    return { type: 'For', init, test, update, body, line };
  }

  private parseForEach(): CSForEachStmt {
    const line = this.peek().line;
    this.advance(); this.match('LPAREN');
    this.parseTypeSpec(); // type
    const target = this.advance().value; // variable name
    this.advance(); // 'in'
    const iter = this.parseExpr();
    this.match('RPAREN');
    const body = this.check('LBRACE') ? this.parseBlock() : [this.parseStatement()!].filter(Boolean);
    return { type: 'ForEach', target, iter, body, line };
  }

  private parseReturn(): CSReturnStmt {
    const line = this.peek().line;
    this.advance();
    if (this.check('SEMI')) { this.advance(); return { type: 'Return', value: null, line }; }
    const value = this.parseExpr();
    this.match('SEMI');
    return { type: 'Return', value, line };
  }

  private parseThrow(): CSThrowStmt {
    const line = this.peek().line;
    this.advance();
    const expr = this.parseExpr();
    this.match('SEMI');
    return { type: 'Throw', expr, line };
  }

  private parseTry(): CSTryStmt {
    const line = this.peek().line;
    this.advance();
    const body = this.parseBlock();
    const catches: CSCatch[] = [];
    let finally_: CSNode[] = [];
    while (this.check('NAME', 'catch')) {
      const cline = this.peek().line;
      this.advance(); this.match('LPAREN');
      const exType = this.peek().type === 'NAME' ? this.advance().value : null;
      const name = this.peek().type === 'NAME' ? this.advance().value : null;
      this.match('RPAREN');
      const cbody = this.parseBlock();
      catches.push({ exType, name, body: cbody, line: cline });
    }
    if (this.check('NAME', 'finally')) { this.advance(); finally_ = this.parseBlock(); }
    return { type: 'Try', body, catches, finally_, line };
  }

  private parseConsoleWrite(): CSConsoleWrite {
    const line = this.peek().line;
    this.advance(); // Console
    this.match('DOT');
    const method = this.advance().value; // Write / WriteLine
    const newline = method.toLowerCase().includes('writeline');
    this.match('LPAREN');
    const args: CSExpr[] = [];
    while (!this.check('RPAREN') && !this.check('EOF')) {
      args.push(this.parseExpr());
      this.match('COMMA');
    }
    this.match('RPAREN');
    this.match('SEMI');
    return { type: 'ConsoleWrite', args, newline, line };
  }

  // ── Expressions ──────────────────────────────────────────────────────────
  parseExpr(): CSExpr { return this.parseAssign(); }

  private parseAssign(): CSExpr {
    const left = this.parseTernary();
    const assignOps = ['=','+=','-=','*=','/=','%=','??='];
    if (this.peek().type === 'OP' && assignOps.includes(this.peek().value)) {
      const op = this.advance().value;
      const right = this.parseAssign();
      const target = left.type === 'Name' ? (left as any).id : '_';
      return { type: 'Assign', target, op, value: right, line: left.line };
    }
    return left;
  }

  private parseTernary(): CSExpr {
    const cond = this.parseOr();
    if (this.check('OP', '?')) {
      this.advance();
      const then = this.parseExpr();
      this.advance(); // :
      const else_ = this.parseExpr();
      return { type: 'Ternary', test: cond, then, else_, line: cond.line };
    }
    return cond;
  }

  private parseOr(): CSExpr {
    let l = this.parseAnd();
    while (this.check('OP','||')) { this.advance(); const r = this.parseAnd(); l = { type: 'BinOp', left: l, op: '||', right: r, line: l.line }; }
    return l;
  }
  private parseAnd(): CSExpr {
    let l = this.parseEq();
    while (this.check('OP','&&')) { this.advance(); const r = this.parseEq(); l = { type: 'BinOp', left: l, op: '&&', right: r, line: l.line }; }
    return l;
  }
  private parseEq(): CSExpr {
    let l = this.parseRel();
    while (this.check('OP','==') || this.check('OP','!=')) { const op = this.advance().value; const r = this.parseRel(); l = { type: 'BinOp', left: l, op, right: r, line: l.line }; }
    return l;
  }
  private parseRel(): CSExpr {
    let l = this.parseAdd();
    while (this.peek().type === 'OP' && ['<','>','<=','>='].includes(this.peek().value)) { const op = this.advance().value; const r = this.parseAdd(); l = { type: 'BinOp', left: l, op, right: r, line: l.line }; }
    return l;
  }
  private parseAdd(): CSExpr {
    let l = this.parseMul();
    while (this.check('OP','+') || this.check('OP','-')) { const op = this.advance().value; const r = this.parseMul(); l = { type: 'BinOp', left: l, op, right: r, line: l.line }; }
    return l;
  }
  private parseMul(): CSExpr {
    let l = this.parseUnary();
    while (this.check('OP','*') || this.check('OP','/') || this.check('OP','%')) { const op = this.advance().value; const r = this.parseUnary(); l = { type: 'BinOp', left: l, op, right: r, line: l.line }; }
    return l;
  }
  private parseUnary(): CSExpr {
    const t = this.peek();
    if (t.type === 'OP' && ['-','+','!','~'].includes(t.value)) { this.advance(); return { type: 'UnaryOp', op: t.value, operand: this.parseUnary(), line: t.line }; }
    if (t.type === 'OP' && (t.value === '++' || t.value === '--')) { const op = this.advance().value; return { type: 'UnaryOp', op: `pre${op}`, operand: this.parsePostfix(), line: t.line }; }
    return this.parsePostfix();
  }
  private parsePostfix(): CSExpr {
    let node = this.parsePrimary();
    while (true) {
      if (this.check('OP','++') || this.check('OP','--')) { const op = this.advance().value; node = { type: 'UnaryOp', op: `post${op}`, operand: node, line: node.line }; }
      else if (this.check('DOT')) {
        this.advance();
        const method = this.advance().value;
        if (this.check('LPAREN')) {
          this.advance();
          const args: CSExpr[] = [];
          while (!this.check('RPAREN') && !this.check('EOF')) { args.push(this.parseExpr()); this.match('COMMA'); }
          this.match('RPAREN');
          const objName = node.type === 'Name' ? (node as any).id : '_';
          node = { type: 'MethodCall', object: objName, method, args, line: node.line };
        } else {
          const objName = node.type === 'Name' ? (node as any).id : '_';
          node = { type: 'Member', object: objName, field: method, line: node.line };
        }
      }
      else if (this.check('LBRACKET')) {
        this.advance();
        const idx = this.parseExpr(); this.match('RBRACKET');
        node = { type: 'Index', array: (node as any).id ?? '_', index: idx, line: node.line };
      }
      else break;
    }
    return node;
  }
  private parsePrimary(): CSExpr {
    const t = this.peek();
    if (t.type === 'NUM') { this.advance(); return { type: 'Num', value: parseFloat(t.value), line: t.line }; }
    if (t.type === 'STR' || t.type === 'CHAR') { this.advance(); return { type: 'Str', value: t.value, line: t.line }; }
    if (t.type === 'NAME') {
      if (t.value === 'true') { this.advance(); return { type: 'Bool', value: true, line: t.line }; }
      if (t.value === 'false') { this.advance(); return { type: 'Bool', value: false, line: t.line }; }
      if (t.value === 'null') { this.advance(); return { type: 'Null', line: t.line }; }
      if (t.value === 'new') {
        this.advance();
        const className = this.advance().value;
        this.match('LPAREN');
        const args: CSExpr[] = [];
        while (!this.check('RPAREN') && !this.check('EOF')) { args.push(this.parseExpr()); this.match('COMMA'); }
        this.match('RPAREN');
        return { type: 'New', className, args, line: t.line };
      }
      this.advance();
      if (this.check('LPAREN')) {
        this.advance();
        const args: CSExpr[] = [];
        while (!this.check('RPAREN') && !this.check('EOF')) { args.push(this.parseExpr()); this.match('COMMA'); }
        this.match('RPAREN');
        return { type: 'Call', callee: t.value, args, line: t.line };
      }
      return { type: 'Name', id: t.value, line: t.line };
    }
    if (t.type === 'LPAREN') {
      this.advance();
      const expr = this.parseExpr();
      this.match('RPAREN');
      return expr;
    }
    if (t.type === 'OP' && t.value === '-') {
      this.advance();
      const inner = this.parsePrimary();
      return { type: 'UnaryOp', op: '-', operand: inner, line: t.line };
    }
    this.advance();
    return { type: 'Num', value: 0, line: t.line };
  }
}

// ── Interpreter ───────────────────────────────────────────────────────────────
let _sc = 0, _fc = 0, _cc = 0, _objId = 0;
function fScope() { return `cs-scope-${++_sc}`; }
function fFrame() { return `cs-frame-${++_fc}`; }
function fCon() { return `cs-con-${++_cc}`; }
function fObj() { return `cs-obj-${++_objId}`; }

function csDisplay(v: RuntimeValue, depth = 0): string {
  if (depth > 2) return '...';
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'string') return `"${v}"`;
  const obj = v as any;
  if (obj.__type === 'array') {
    const items = obj.elements.slice(0,5).map((e: RuntimeValue) => csDisplay(e, depth+1));
    return `[${items.join(', ')}]`;
  }
  if (obj.__type === 'object') {
    const keys = Object.keys(obj.properties).slice(0,3);
    return `{${keys.map((k: string) => `${k}: ${csDisplay(obj.properties[k], depth+1)}`).join(', ')}}`;
  }
  return String(v);
}

export class CSharpInterpreter implements LanguageEngine {
  readonly language: SupportedLanguage = 'csharp';

  private steps: ExecutionStep[] = [];
  private state: RuntimeState;
  private source: string;
  private methods: Map<string, CSMethodDecl> = new Map();

  constructor(source: string) {
    this.source = source;
    this.state = createInitialState('csharp');
    _sc = 0; _fc = 0; _cc = 0; _objId = 0;
  }

  execute(): ExecutionResult {
    // ── Compilation pipeline ─────────────────────────────────────────────────
    const pipeline: Array<[string, string]> = [
      ['source', 'C# source code loaded.'],
      ['roslyn', 'Roslyn compiler: parsing C# syntax tree and semantic analysis.'],
      ['msil', 'CIL/MSIL generated: language-neutral intermediate bytecode.'],
      ['clr', 'CLR (Common Language Runtime): loading assembly into managed environment.'],
      ['jit', 'JIT compiler: converting MSIL to native machine code on demand.'],
      ['native', 'Native execution begins in managed runtime environment.'],
    ];
    for (const [stage, desc] of pipeline) {
      this.state.compilationStage = stage;
      this.emit('COMPILATION_PIPELINE', 1, desc, { stage });
    }

    let ast: CSProgram;
    try {
      const tokens = csTokenize(this.source);
      const parser = new CSParser(tokens);
      ast = parser.parse();
    } catch (e) {
      return { steps: this.steps, totalSteps: this.steps.length, finalState: cloneState(this.state), hasError: true, parseError: (e as Error).message, language: 'csharp' };
    }

    // Register methods
    for (const node of ast.body) {
      if (node.type === 'MethodDecl') this.methods.set((node as CSMethodDecl).name, node as CSMethodDecl);
    }

    this.emit('PROGRAM_START', 1, 'C# program begins. CLR initializes managed environment.', {});

    try {
      const mainMethod = this.methods.get('Main') ?? this.methods.get('main');
      if (mainMethod) {
        this.callMethod(mainMethod, [], 1);
      } else {
        this.execBlock(ast.body as CSStmt[], 'global');
      }
      this.state.executionStatus = 'completed';
      this.emit('PROGRAM_END', 0, 'C# program execution complete. CLR performs final GC.', {});
      // Basic GC event
      this.state.gcEvents.push('Final GC: managed heap objects collected.');
      this.emit('GC_EVENT', 0, 'Garbage Collector: releasing managed heap objects.', { phase: 'final' });
    } catch (e) {
      if (!(e instanceof ReturnSignal)) {
        const err = e as Error;
        this.state.error = { type: err.name ?? 'Exception', message: err.message, line: this.state.currentLine };
        this.state.executionStatus = 'error';
        this.emit('ERROR', this.state.currentLine, `${err.name}: ${err.message}`, {});
      }
    }

    const finalState = cloneState(this.state);
    finalState.currentStep = this.steps.length;
    return { steps: this.steps, totalSteps: this.steps.length, finalState, hasError: !!this.state.error, language: 'csharp' };
  }

  // ── Emit ──────────────────────────────────────────────────────────────────
  private emit(type: ExecutionEventType, line: number, desc: string, detail: Record<string, unknown>) {
    if (this.steps.length >= CODEFLOW_LIMITS.MAX_STEPS) throw new Error('INFINITE_LOOP');
    this.state.currentLine = line;
    this.state.currentStep = this.steps.length;
    this.state.explanation = desc;
    this.steps.push({ index: this.steps.length, event: { type, line, description: desc, detail }, state: cloneState(this.state) });
  }

  // ── Scope helpers ─────────────────────────────────────────────────────────
  private getScope(id: string): Scope | undefined { return this.state.scopes.find(s => s.id === id); }
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
  private declareVar(name: string, cstype: string, value: RuntimeValue, scopeId: string, line: number) {
    const scope = this.getScope(scopeId);
    if (!scope) return;
    scope.variables = scope.variables.filter(v => v.name !== name);
    scope.variables.push({ name, value, kind: 'local', state: 'initialized', scopeId, type: cstype, changedAtStep: this.steps.length });
  }
  private setVar(name: string, value: RuntimeValue, scopeId: string, line: number) {
    let sid: string | null = scopeId;
    while (sid) {
      const scope = this.getScope(sid);
      if (!scope) break;
      const v = scope.variables.find(v => v.name === name);
      if (v) {
        const old = v.value;
        v.value = value; v.changedAtStep = this.steps.length;
        this.emit('ASSIGN_VARIABLE', line, `${name} = ${csDisplay(value)} (was ${csDisplay(old)})`, { name, oldValue: old, newValue: value });
        return;
      }
      sid = scope.parentId;
    }
    throw new Error(`Variable ${name} not declared`);
  }

  // ── Block executor ────────────────────────────────────────────────────────
  private execBlock(stmts: CSStmt[], scopeId: string) {
    for (const stmt of stmts) this.execStmt(stmt, scopeId);
  }

  private execStmt(stmt: CSStmt, scopeId: string) {
    if (this.steps.length >= CODEFLOW_LIMITS.MAX_STEPS) throw new Error('INFINITE_LOOP');
    const line = stmt.line;

    switch (stmt.type) {
      case 'VarDecl': {
        const value = stmt.init ? this.evalExpr(stmt.init, scopeId) : this.defaultVal(stmt.cstype);
        this.declareVar(stmt.name, stmt.cstype, value, scopeId, line);
        this.emit('DECLARE_VARIABLE', line, `${stmt.cstype} ${stmt.name} = ${csDisplay(value)}`, { name: stmt.name, cstype: stmt.cstype, value });
        break;
      }

      case 'MethodDecl':
        this.methods.set(stmt.name, stmt);
        break;

      case 'If': {
        const cond = this.evalExpr(stmt.test, scopeId);
        const result = Boolean(cond);
        this.emit('EVALUATE_CONDITION', line, `if (${this.csExprText(stmt.test)}) → ${result ? 'true' : 'false'}`, { result });
        const bScope = fScope();
        this.state.scopes.push({ id: bScope, type: 'block', name: 'if', parentId: scopeId, variables: [] });
        try { if (result) this.execBlock(stmt.then as CSStmt[], bScope); else this.execBlock(stmt.else_ as CSStmt[], bScope); }
        finally { this.state.scopes = this.state.scopes.filter(s => s.id !== bScope); }
        break;
      }

      case 'While': {
        let iter = 0;
        this.emit('LOOP_START', line, 'while loop begins.', { loopType: 'while' });
        while (true) {
          const cond = this.evalExpr(stmt.test, scopeId);
          const result = Boolean(cond);
          this.emit('LOOP_ITERATION', line, `while (${this.csExprText(stmt.test)}) → ${result ? 'true' : 'false — exit'}`, { iteration: iter, conditionResult: result });
          if (!result) break;
          const ls = fScope();
          this.state.scopes.push({ id: ls, type: 'block', name: 'while_body', parentId: scopeId, variables: [] });
          try { this.execBlock(stmt.body as CSStmt[], ls); }
          catch (e) {
            if (e instanceof BreakSignal) { this.emit('BREAK_STATEMENT', line, 'break', {}); break; }
            if (e instanceof ContinueSignal) { this.emit('CONTINUE_STATEMENT', line, 'continue', {}); iter++; continue; }
            throw e;
          } finally { this.state.scopes = this.state.scopes.filter(s => s.id !== ls); }
          iter++;
        }
        this.emit('LOOP_END', line, 'while loop finished.', { loopType: 'while' });
        break;
      }

      case 'For': {
        const forScope = fScope();
        this.state.scopes.push({ id: forScope, type: 'block', name: 'for', parentId: scopeId, variables: [] });
        try {
          if (stmt.init) this.execStmt(stmt.init as CSStmt, forScope);
          let iter = 0;
          this.emit('LOOP_START', line, 'for loop begins.', { loopType: 'for' });
          while (true) {
            if (stmt.test) {
              const cond = this.evalExpr(stmt.test, forScope);
              const result = Boolean(cond);
              this.emit('LOOP_ITERATION', line, `for condition: ${this.csExprText(stmt.test)} → ${result ? 'true' : 'false — exit'}`, { iteration: iter, conditionResult: result });
              if (!result) break;
            }
            const bodyScope = fScope();
            this.state.scopes.push({ id: bodyScope, type: 'block', name: 'for_body', parentId: forScope, variables: [] });
            try { this.execBlock(stmt.body as CSStmt[], bodyScope); }
            catch (e) {
              if (e instanceof BreakSignal) break;
              if (e instanceof ContinueSignal) { /* continue to update */ }
              else throw e;
            } finally { this.state.scopes = this.state.scopes.filter(s => s.id !== bodyScope); }
            if (stmt.update) this.evalExpr(stmt.update, forScope);
            iter++;
          }
          this.emit('LOOP_END', line, 'for loop finished.', { loopType: 'for' });
        } finally { this.state.scopes = this.state.scopes.filter(s => s.id !== forScope); }
        break;
      }

      case 'ForEach': {
        const iterVal = this.evalExpr(stmt.iter, scopeId);
        const items = (iterVal as any)?.__type === 'array' ? (iterVal as any).elements : [];
        let iter = 0;
        this.emit('LOOP_START', line, `foreach (${stmt.target} in ...) — loop begins.`, { loopType: 'foreach' });
        for (const item of items) {
          const fs = fScope();
          this.state.scopes.push({ id: fs, type: 'block', name: 'foreach_body', parentId: scopeId, variables: [] });
          this.declareVar(stmt.target, 'var', item, fs, line);
          this.emit('LOOP_ITERATION', line, `foreach iteration ${iter+1}: ${stmt.target} = ${csDisplay(item)}`, { iteration: iter, value: item });
          try { this.execBlock(stmt.body as CSStmt[], fs); }
          catch (e) {
            if (e instanceof BreakSignal) { this.state.scopes = this.state.scopes.filter(s => s.id !== fs); break; }
            if (e instanceof ContinueSignal) { this.state.scopes = this.state.scopes.filter(s => s.id !== fs); iter++; continue; }
            throw e;
          } finally { this.state.scopes = this.state.scopes.filter(s => s.id !== fs); }
          iter++;
        }
        this.emit('LOOP_END', line, 'foreach loop finished.', { loopType: 'foreach' });
        break;
      }

      case 'Return': {
        const val = stmt.value ? this.evalExpr(stmt.value, scopeId) : undefined;
        this.emit('RETURN_VALUE', line, `return ${csDisplay(val)}`, { value: val });
        throw new ReturnSignal(val ?? null);
      }

      case 'Break': throw new BreakSignal();
      case 'Continue': throw new ContinueSignal();

      case 'ConsoleWrite': {
        const argVals = stmt.args.map(a => this.evalExpr(a, scopeId));
        const text = argVals.map(v => csDisplay(v)).join('');
        const full = stmt.newline ? text + '\n' : text;
        this.state.consoleOutput.push({ id: fCon(), value: full.trim(), line, stepIndex: this.steps.length });
        this.emit('CONSOLE_OUTPUT', line, `Console.${stmt.newline ? 'WriteLine' : 'Write'}(${csDisplay(argVals[0] ?? null)}) → "${full.trim()}"`, { value: full.trim() });
        break;
      }

      case 'Throw': {
        const val = this.evalExpr(stmt.expr, scopeId);
        throw new Error(csDisplay(val));
      }

      case 'Try': {
        try { this.execBlock(stmt.body as CSStmt[], scopeId); }
        catch (e) {
          if (e instanceof ReturnSignal || e instanceof BreakSignal || e instanceof ContinueSignal) throw e;
          const errMsg = (e as Error).message;
          let handled = false;
          for (const handler of stmt.catches) {
            const cs = fScope();
            this.state.scopes.push({ id: cs, type: 'block', name: 'catch', parentId: scopeId, variables: [] });
            if (handler.name) this.declareVar(handler.name, handler.exType ?? 'Exception', errMsg, cs, line);
            this.emit('EVALUATE_CONDITION', line, `catch (${handler.exType ?? 'Exception'}) — handling: ${errMsg}`, { message: errMsg });
            try { this.execBlock(handler.body as CSStmt[], cs); }
            finally { this.state.scopes = this.state.scopes.filter(s => s.id !== cs); }
            handled = true; break;
          }
          if (!handled) throw e;
        } finally {
          if (stmt.finally_.length) this.execBlock(stmt.finally_ as CSStmt[], scopeId);
        }
        break;
      }

      case 'ExprStmt':
        this.evalExpr(stmt.expr, scopeId);
        break;
    }
  }

  // ── Expression evaluator ──────────────────────────────────────────────────
  private evalExpr(expr: CSExpr, scopeId: string): RuntimeValue {
    const line = expr.line;

    switch (expr.type) {
      case 'Num': return expr.value;
      case 'Str': return expr.value;
      case 'Bool': return expr.value;
      case 'Null': return null;

      case 'Name': {
        const v = this.lookupVar(expr.id, scopeId);
        return v?.value ?? null;
      }

      case 'BinOp': {
        const l = this.evalExpr(expr.left, scopeId) as any;
        const r = this.evalExpr(expr.right, scopeId) as any;
        switch (expr.op) {
          case '+': return typeof l === 'string' ? String(l) + String(r) : l + r;
          case '-': return l - r;
          case '*': return l * r;
          case '/': return r === 0 ? 0 : (typeof l === 'number' && Number.isInteger(l) && Number.isInteger(r) ? Math.trunc(l/r) : l/r);
          case '%': return l % r;
          case '<': return l < r;
          case '>': return l > r;
          case '<=': return l <= r;
          case '>=': return l >= r;
          case '==': return l === r;
          case '!=': return l !== r;
          case '&&': return Boolean(l) && Boolean(r);
          case '||': return Boolean(l) || Boolean(r);
          case '??': return l ?? r;
          default: return null;
        }
      }

      case 'UnaryOp': {
        const val = this.evalExpr(expr.operand, scopeId);
        const n = val as number;
        switch (expr.op) {
          case '-': return -n;
          case '!': return !val;
          case '~': return ~n;
          case 'pre++': { const name = (expr.operand as any).id; if (name) this.setVar(name, n+1, scopeId, line); return n+1; }
          case 'pre--': { const name = (expr.operand as any).id; if (name) this.setVar(name, n-1, scopeId, line); return n-1; }
          case 'post++': { const name = (expr.operand as any).id; if (name) this.setVar(name, n+1, scopeId, line); return n; }
          case 'post--': { const name = (expr.operand as any).id; if (name) this.setVar(name, n-1, scopeId, line); return n; }
          default: return val;
        }
      }

      case 'Assign': {
        let rhs = this.evalExpr(expr.value, scopeId) as any;
        const existing = this.lookupVar(expr.target, scopeId);
        if (existing && expr.op !== '=') {
          const old = existing.value as any;
          switch (expr.op) {
            case '+=': rhs = typeof old === 'string' ? String(old)+String(rhs) : old+rhs; break;
            case '-=': rhs = old - rhs; break;
            case '*=': rhs = old * rhs; break;
            case '/=': rhs = Math.trunc(old / rhs); break;
            case '%=': rhs = old % rhs; break;
            case '??=': rhs = old ?? rhs; break;
          }
        }
        if (existing) this.setVar(expr.target, rhs, scopeId, line);
        else { this.declareVar(expr.target, 'var', rhs, scopeId, line); this.emit('DECLARE_VARIABLE', line, `var ${expr.target} = ${csDisplay(rhs)}`, { name: expr.target, value: rhs }); }
        return rhs;
      }

      case 'New': {
        const id = fObj();
        const obj: HeapObject = { id, address: `ref@${id}`, type: expr.className, fields: {}, label: `new ${expr.className}()` };
        this.state.heap.push(obj);
        this.emit('OBJECT_CREATE', line, `new ${expr.className}() — object allocated on managed heap`, { className: expr.className, id });
        return { __type: 'object', properties: {} } as any;
      }

      case 'Call': {
        const argVals = expr.args.map(a => this.evalExpr(a, scopeId));
        if (expr.callee === 'Console.WriteLine' || expr.callee === 'Console.Write') {
          const text = argVals.map(v => csDisplay(v)).join('');
          this.state.consoleOutput.push({ id: fCon(), value: text, line, stepIndex: this.steps.length });
          this.emit('CONSOLE_OUTPUT', line, `${expr.callee}(${csDisplay(argVals[0] ?? null)}) → "${text}"`, { value: text });
          return null;
        }
        if (expr.callee === 'Math.Abs') return Math.abs(argVals[0] as number);
        if (expr.callee === 'Math.Sqrt') return Math.sqrt(argVals[0] as number);
        if (expr.callee === 'Math.Pow') return Math.pow(argVals[0] as number, argVals[1] as number);
        if (expr.callee === 'Math.Max') return Math.max(argVals[0] as number, argVals[1] as number);
        if (expr.callee === 'Math.Min') return Math.min(argVals[0] as number, argVals[1] as number);
        if (expr.callee === 'int.Parse') return parseInt(String(argVals[0]), 10);
        if (expr.callee === 'double.Parse') return parseFloat(String(argVals[0]));
        if (expr.callee === 'Convert.ToInt32') return parseInt(String(argVals[0]), 10);
        if (expr.callee === 'Convert.ToString') return csDisplay(argVals[0]);
        const method = this.methods.get(expr.callee);
        if (method) return this.callMethod(method, argVals, line);
        return null;
      }

      case 'MethodCall': {
        const argVals = expr.args.map(a => this.evalExpr(a, scopeId));
        const obj = this.lookupVar(expr.object, scopeId)?.value;
        if ((obj as any)?.__type === 'array') {
          const arr = (obj as any).elements as RuntimeValue[];
          if (expr.method === 'Add') { arr.push(argVals[0]); return null; }
          if (expr.method === 'Remove') { const i = arr.indexOf(argVals[0] as any); if (i >= 0) arr.splice(i,1); return null; }
          if (expr.method === 'Count' || expr.method === 'Length') return arr.length;
          if (expr.method === 'Contains') return arr.includes(argVals[0] as any);
          if (expr.method === 'Sort') { arr.sort((a,b) => (a as number)-(b as number)); return null; }
          if (expr.method === 'Clear') { arr.splice(0); return null; }
        }
        if (typeof obj === 'string') {
          if (expr.method === 'ToUpper') return (obj as string).toUpperCase();
          if (expr.method === 'ToLower') return (obj as string).toLowerCase();
          if (expr.method === 'Trim') return (obj as string).trim();
          if (expr.method === 'Contains') return (obj as string).includes(String(argVals[0]));
          if (expr.method === 'Length') return (obj as string).length;
          if (expr.method === 'Replace') return (obj as string).replace(String(argVals[0]), String(argVals[1]));
          if (expr.method === 'Substring') return (obj as string).slice(argVals[0] as number, (argVals[0] as number)+(argVals[1] as number));
          if (expr.method === 'ToString') return obj;
        }
        const method = this.methods.get(expr.method);
        if (method) return this.callMethod(method, argVals, line);
        return null;
      }

      case 'Member': {
        const v = this.lookupVar(expr.object, scopeId)?.value;
        if ((v as any)?.__type === 'array') { if (expr.field === 'Count' || expr.field === 'Length') return (v as any).elements.length; }
        if ((v as any)?.__type === 'object') return (v as any).properties[expr.field];
        return null;
      }

      case 'Index': {
        const v = this.lookupVar(expr.array, scopeId)?.value;
        const idx = this.evalExpr(expr.index, scopeId);
        if ((v as any)?.__type === 'array') return (v as any).elements[idx as number];
        if ((v as any)?.__type === 'object') return (v as any).properties[String(idx)];
        return null;
      }

      case 'Ternary': {
        const test = Boolean(this.evalExpr(expr.test, scopeId));
        return test ? this.evalExpr(expr.then, scopeId) : this.evalExpr(expr.else_, scopeId);
      }

      case 'Cast':
        return this.evalExpr(expr.expr, scopeId);

      default: return null;
    }
  }

  private callMethod(method: CSMethodDecl, argVals: RuntimeValue[], callLine: number): RuntimeValue {
    const fnScopeId = fScope();
    const fnScope: Scope = { id: fnScopeId, type: 'function', name: method.name, parentId: 'global', variables: [] };
    this.state.scopes.push(fnScope);

    for (let i = 0; i < method.params.length; i++) {
      const p = method.params[i]!;
      fnScope.variables.push({ name: p.name, value: argVals[i] ?? this.defaultVal(p.cstype), kind: 'local', state: 'initialized', scopeId: fnScopeId, type: p.cstype });
    }

    const frameId = fFrame();
    const frame: CallFrame = { id: frameId, functionName: method.name, line: callLine, scopeId: fnScopeId };
    this.state.callStack.push(frame);

    const paramDesc = method.params.map((p, i) => `${p.name}=${csDisplay(argVals[i] ?? null)}`).join(', ');
    this.emit('PUSH_CALL_STACK', callLine, `Method "${method.name}" called (${paramDesc})`, { frame });
    this.emit('ENTER_FUNCTION', callLine, `Entering ${method.name}(${paramDesc})`, { functionName: method.name });

    let returnValue: RuntimeValue = null;
    try {
      this.execBlock(method.body as CSStmt[], fnScopeId);
    } catch (e) {
      if (e instanceof ReturnSignal) returnValue = e.value;
      else {
        this.state.callStack = this.state.callStack.filter(f => f.id !== frameId);
        this.state.scopes = this.state.scopes.filter(s => s.id !== fnScopeId);
        throw e;
      }
    }

    this.emit('EXIT_FUNCTION', callLine, `${method.name} returns ${csDisplay(returnValue)}`, { functionName: method.name, returnValue });
    this.state.callStack = this.state.callStack.filter(f => f.id !== frameId);
    this.state.scopes = this.state.scopes.filter(s => s.id !== fnScopeId);
    this.emit('POP_CALL_STACK', callLine, `"${method.name}" frame popped`, { functionName: method.name });

    return returnValue;
  }

  private defaultVal(cstype: string): RuntimeValue {
    if (cstype === 'int' || cstype === 'double' || cstype === 'float' || cstype === 'long') return 0;
    if (cstype === 'bool') return false;
    if (cstype === 'string' || cstype === 'char*' || cstype === 'String') return '';
    return null;
  }

  private csExprText(expr: CSExpr): string {
    switch (expr.type) {
      case 'Name': return expr.id;
      case 'Num': return String(expr.value);
      case 'Bool': return String(expr.value);
      case 'BinOp': return `${this.csExprText(expr.left)} ${expr.op} ${this.csExprText(expr.right)}`;
      default: return '(expr)';
    }
  }
}
