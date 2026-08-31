/**
 * CODEFLOW — Java Interpreter
 * PRD-2 §8: Java Runtime Model
 *
 * Compilation pipeline:
 *   Java Source → Java Compiler → Bytecode → JVM → Execution
 *
 * Visualizes:
 *   Class loading concept, Bytecode generation, JVM execution,
 *   Stack frames, Local variables, Objects, Heap, Method calls,
 *   Return values, Console output
 *
 * Implementation: reuses CSParser concepts with Java-specific adaptations
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
class ThrowSignal { constructor(public message: string) {} }

// ── Types (reuse C# AST shapes with Java field names) ─────────────────────────
interface JNode { type: string; line: number }
interface JProgram extends JNode { type: 'Program'; body: JNode[] }
interface JVarDecl extends JNode { type: 'VarDecl'; jtype: string; name: string; init: JExpr | null; isFinal: boolean }
interface JMethodDecl extends JNode { type: 'MethodDecl'; returnType: string; name: string; params: JParam[]; body: JNode[]; isStatic: boolean }
interface JParam { jtype: string; name: string }
interface JIfStmt extends JNode { type: 'If'; test: JExpr; then: JNode[]; else_: JNode[] }
interface JWhileStmt extends JNode { type: 'While'; test: JExpr; body: JNode[] }
interface JForStmt extends JNode { type: 'For'; init: JNode | null; test: JExpr | null; update: JExpr | null; body: JNode[] }
interface JForEachStmt extends JNode { type: 'ForEach'; target: string; iter: JExpr; body: JNode[] }
interface JReturnStmt extends JNode { type: 'Return'; value: JExpr | null }
interface JBreakStmt extends JNode { type: 'Break' }
interface JContinueStmt extends JNode { type: 'Continue' }
interface JExprStmt extends JNode { type: 'ExprStmt'; expr: JExpr }
interface JPrintStmt extends JNode { type: 'Print'; args: JExpr[]; newline: boolean }
interface JThrowStmt extends JNode { type: 'Throw'; expr: JExpr }
interface JTryStmt extends JNode { type: 'Try'; body: JNode[]; catches: JCatch[]; finally_: JNode[] }
interface JCatch { exType: string | null; name: string | null; body: JNode[]; line: number }

type JStmt = JVarDecl | JMethodDecl | JIfStmt | JWhileStmt | JForStmt | JForEachStmt
  | JReturnStmt | JBreakStmt | JContinueStmt | JExprStmt | JPrintStmt | JThrowStmt | JTryStmt;

type JExpr =
  | { type: 'Num'; value: number; line: number }
  | { type: 'Str'; value: string; line: number }
  | { type: 'Bool'; value: boolean; line: number }
  | { type: 'Null'; line: number }
  | { type: 'Name'; id: string; line: number }
  | { type: 'BinOp'; left: JExpr; op: string; right: JExpr; line: number }
  | { type: 'UnaryOp'; op: string; operand: JExpr; line: number }
  | { type: 'Assign'; target: string; op: string; value: JExpr; line: number }
  | { type: 'Call'; callee: string; args: JExpr[]; line: number }
  | { type: 'MethodCall'; object: string; method: string; args: JExpr[]; line: number }
  | { type: 'New'; className: string; args: JExpr[]; line: number }
  | { type: 'Index'; array: string; index: JExpr; line: number }
  | { type: 'Member'; object: string; field: string; line: number }
  | { type: 'Cast'; jtype: string; expr: JExpr; line: number }
  | { type: 'Ternary'; test: JExpr; then: JExpr; else_: JExpr; line: number };

// ── Tokenizer ─────────────────────────────────────────────────────────────────
type JTokType = 'NUM'|'STR'|'CHAR'|'NAME'|'OP'|'SEMI'|'LBRACE'|'RBRACE'|'LPAREN'|'RPAREN'|'LBRACKET'|'RBRACKET'|'COMMA'|'EOF'|'DOT';
interface JTok { type: JTokType; value: string; line: number }

function javaTokenize(src: string): JTok[] {
  const tokens: JTok[] = [];
  let i = 0, line = 1;
  while (i < src.length) {
    const ch = src[i]!;
    if (ch === '\n') { line++; i++; continue; }
    if (' \t\r'.includes(ch)) { i++; continue; }
    if (ch === '/' && src[i+1] === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (ch === '/' && src[i+1] === '*') { i += 2; while (i < src.length && !(src[i] === '*' && src[i+1] === '/')) { if (src[i] === '\n') line++; i++; } i += 2; continue; }
    if (ch === '"') { let j = i+1; while (j < src.length && src[j] !== '"') { if (src[j] === '\\') j++; j++; } tokens.push({ type: 'STR', value: src.slice(i+1, j), line }); i = j+1; continue; }
    if (ch === "'") { let j = i+1; if (src[j] === '\\') j++; j++; tokens.push({ type: 'CHAR', value: src.slice(i+1, j), line }); i = j+1; continue; }
    if (ch >= '0' && ch <= '9') { let j = i; while (j < src.length && /[\d.fFdDlL]/.test(src[j]!)) j++; tokens.push({ type: 'NUM', value: src.slice(i, j), line }); i = j; continue; }
    if (/[a-zA-Z_]/.test(ch)) { let j = i; while (j < src.length && /[\w]/.test(src[j]!)) j++; tokens.push({ type: 'NAME', value: src.slice(i, j), line }); i = j; continue; }
    const two = src.slice(i, i+2);
    if (['==','!=','<=','>=','&&','||','++','--','+=','-=','*=','/=','%=','->','<<','>>'].includes(two)) { tokens.push({ type: 'OP', value: two, line }); i += 2; continue; }
    const singles: Record<string, JTokType> = { ';':'SEMI','{':'LBRACE','}':'RBRACE','(':'LPAREN',')':'RPAREN','[':'LBRACKET',']':'RBRACKET',',':'COMMA','.':'DOT' };
    if (singles[ch]) { tokens.push({ type: singles[ch]!, value: ch, line }); i++; continue; }
    if ('+−*/<%>^&|!?:=~'.includes(ch)) { tokens.push({ type: 'OP', value: ch, line }); i++; continue; }
    i++;
  }
  tokens.push({ type: 'EOF', value: '', line });
  return tokens;
}

// ── Parser ────────────────────────────────────────────────────────────────────
class JParser {
  private pos = 0;
  constructor(private tokens: JTok[]) {}
  private peek(): JTok { return this.tokens[this.pos] ?? { type: 'EOF', value: '', line: 0 }; }
  private advance(): JTok { return this.tokens[this.pos++] ?? { type: 'EOF', value: '', line: 0 }; }
  private check(type: JTokType, value?: string): boolean { const t = this.peek(); return t.type === type && (value === undefined || t.value === value); }
  private match(type: JTokType, value?: string): boolean { if (this.check(type, value)) { this.advance(); return true; } return false; }

  parse(): JProgram {
    const body: JNode[] = [];
    this.skipClassWrapper();
    while (!this.check('EOF')) {
      const node = this.parseTopLevel();
      if (node) body.push(node);
    }
    return { type: 'Program', body, line: 1 };
  }

  private skipClassWrapper() {
    // Skip: import ...; public class Foo { main...
    while (!this.check('EOF')) {
      const t = this.peek();
      if (t.type === 'NAME' && t.value === 'import') { while (!this.check('SEMI') && !this.check('EOF')) this.advance(); this.match('SEMI'); continue; }
      if (t.type === 'NAME' && t.value === 'package') { while (!this.check('SEMI') && !this.check('EOF')) this.advance(); this.match('SEMI'); continue; }
      if (t.type === 'NAME' && (t.value === 'public' || t.value === 'private' || t.value === 'class')) {
        for (let k = this.pos; k < Math.min(this.pos+20, this.tokens.length); k++) {
          if (this.tokens[k]?.type === 'LBRACE') {
            while (!this.check('LBRACE') && !this.check('EOF')) this.advance();
            this.match('LBRACE');
            break;
          }
        }
        break;
      }
      break;
    }
  }

  private parseTopLevel(): JNode | null {
    if (this.check('EOF') || this.check('RBRACE')) { this.match('RBRACE'); return null; }
    const mods = ['public','private','protected','static','final','synchronized','abstract','native'];
    while (this.peek().type === 'NAME' && mods.includes(this.peek().value)) this.advance();
    if (this.peek().type === 'NAME') return this.parseDeclarationOrMethod();
    this.advance();
    return null;
  }

  private parseDeclarationOrMethod(): JNode | null {
    const line = this.peek().line;
    const jtype = this.parseTypeSpec();
    const name = this.advance().value;
    if (this.check('LPAREN')) {
      this.advance();
      const params = this.parseParams();
      this.match('RPAREN');
      // throws clause
      if (this.check('NAME', 'throws')) { this.advance(); while (this.peek().type === 'NAME') { this.advance(); this.match('COMMA'); } }
      if (this.check('LBRACE')) {
        const body = this.parseBlock();
        return { type: 'MethodDecl', returnType: jtype, name, params, body, isStatic: false, line } as JMethodDecl;
      }
      this.match('SEMI');
      return null;
    }
    let init: JExpr | null = null;
    if (this.match('OP', '=')) init = this.parseExpr();
    this.match('SEMI');
    return { type: 'VarDecl', jtype, name, init, isFinal: false, line } as JVarDecl;
  }

  private parseTypeSpec(): string {
    const parts: string[] = [];
    const typeWords = ['int','long','short','byte','char','float','double','boolean','void',
      'String','Integer','Double','Boolean','Long','Float','Object','ArrayList','LinkedList','HashMap','List','Map','Set'];
    while (this.peek().type === 'NAME' && typeWords.includes(this.peek().value)) {
      parts.push(this.advance().value);
      if (this.check('OP','<')) { this.advance(); while (!this.check('OP','>') && !this.check('EOF')) this.advance(); this.match('OP','>'); break; }
    }
    if (this.check('LBRACKET')) { this.advance(); this.match('RBRACKET'); }
    return parts.join(' ') || 'int';
  }

  private parseParams(): JParam[] {
    const params: JParam[] = [];
    while (!this.check('RPAREN') && !this.check('EOF')) {
      while (this.peek().type === 'NAME' && ['final'].includes(this.peek().value)) this.advance();
      const jtype = this.parseTypeSpec();
      // varargs
      if (this.check('OP', '.')) { this.advance(); this.advance(); this.advance(); }
      const name = this.advance().value;
      params.push({ jtype, name });
      this.match('COMMA');
    }
    return params;
  }

  private parseBlock(): JNode[] {
    this.match('LBRACE');
    const stmts: JNode[] = [];
    while (!this.check('RBRACE') && !this.check('EOF')) {
      const s = this.parseStatement();
      if (s) stmts.push(s);
    }
    this.match('RBRACE');
    return stmts;
  }

  private parseStatement(): JNode | null {
    const t = this.peek();
    if (t.type === 'EOF' || t.type === 'RBRACE') return null;
    if (t.type === 'NAME') {
      if (t.value === 'if') return this.parseIf();
      if (t.value === 'while') return this.parseWhile();
      if (t.value === 'for') return this.parseFor();
      if (t.value === 'return') return this.parseReturn();
      if (t.value === 'break') { this.advance(); this.match('SEMI'); return { type: 'Break', line: t.line }; }
      if (t.value === 'continue') { this.advance(); this.match('SEMI'); return { type: 'Continue', line: t.line }; }
      if (t.value === 'throw') return this.parseThrow();
      if (t.value === 'try') return this.parseTry();
      // System.out.println / System.out.print
      if (t.value === 'System') return this.parseSystemPrint();
      const mods = ['public','private','protected','static','final'];
      if (mods.includes(t.value)) { while (this.peek().type === 'NAME' && mods.includes(this.peek().value)) this.advance(); return this.parseDeclarationOrMethod(); }
      const typeWords = ['int','long','short','byte','char','float','double','boolean','String','Integer','Double','Boolean','var','ArrayList','LinkedList','HashMap','List','Map'];
      if (typeWords.includes(t.value)) return this.parseVarDecl();
    }
    if (t.type === 'LBRACE') { const body = this.parseBlock(); return null; }
    const expr = this.parseExpr();
    this.match('SEMI');
    return { type: 'ExprStmt', expr, line: t.line } as JExprStmt;
  }

  private parseVarDecl(): JVarDecl {
    const line = this.peek().line;
    let isFinal = false;
    if (this.check('NAME', 'final')) { this.advance(); isFinal = true; }
    const jtype = this.parseTypeSpec();
    const name = this.advance().value;
    let init: JExpr | null = null;
    if (this.match('OP', '=')) init = this.parseExpr();
    this.match('SEMI');
    return { type: 'VarDecl', jtype, name, init, isFinal, line };
  }

  private parseIf(): JIfStmt {
    const line = this.peek().line;
    this.advance(); this.match('LPAREN');
    const test = this.parseExpr(); this.match('RPAREN');
    const then = this.check('LBRACE') ? this.parseBlock() : [this.parseStatement()!].filter(Boolean);
    let else_: JNode[] = [];
    if (this.check('NAME', 'else')) { this.advance(); if (this.check('NAME','if')) else_ = [this.parseIf()]; else else_ = this.check('LBRACE') ? this.parseBlock() : [this.parseStatement()!].filter(Boolean); }
    return { type: 'If', test, then, else_, line };
  }

  private parseWhile(): JWhileStmt {
    const line = this.peek().line;
    this.advance(); this.match('LPAREN');
    const test = this.parseExpr(); this.match('RPAREN');
    const body = this.check('LBRACE') ? this.parseBlock() : [this.parseStatement()!].filter(Boolean);
    return { type: 'While', test, body, line };
  }

  private parseFor(): JForStmt | JForEachStmt {
    const line = this.peek().line;
    this.advance(); this.match('LPAREN');
    // Check for enhanced for: for (Type var : collection)
    // We peek ahead to see if there's a colon
    const saved = this.pos;
    let isEnhanced = false;
    let depth = 0;
    for (let k = this.pos; k < Math.min(this.pos+15, this.tokens.length); k++) {
      if (this.tokens[k]?.type === 'RPAREN') break;
      if (this.tokens[k]?.value === ':') { isEnhanced = true; break; }
      if (this.tokens[k]?.type === 'SEMI') break;
    }
    if (isEnhanced) {
      const jtype = this.parseTypeSpec();
      const target = this.advance().value;
      this.advance(); // :
      const iter = this.parseExpr();
      this.match('RPAREN');
      const body = this.check('LBRACE') ? this.parseBlock() : [this.parseStatement()!].filter(Boolean);
      return { type: 'ForEach', target, iter, body, line } as JForEachStmt;
    }
    let init: JNode | null = null;
    if (!this.check('SEMI')) {
      const typeWords = ['int','long','short','double','float','boolean','char','String','var'];
      if (this.peek().type === 'NAME' && typeWords.includes(this.peek().value)) init = this.parseVarDecl();
      else { const expr = this.parseExpr(); this.match('SEMI'); init = { type: 'ExprStmt', expr, line } as JExprStmt; }
    } else this.advance();
    const test = this.check('SEMI') ? null : this.parseExpr();
    this.match('SEMI');
    const update = this.check('RPAREN') ? null : this.parseExpr();
    this.match('RPAREN');
    const body = this.check('LBRACE') ? this.parseBlock() : [this.parseStatement()!].filter(Boolean);
    return { type: 'For', init, test, update, body, line } as JForStmt;
  }

  private parseReturn(): JReturnStmt {
    const line = this.peek().line;
    this.advance();
    if (this.check('SEMI')) { this.advance(); return { type: 'Return', value: null, line }; }
    const value = this.parseExpr(); this.match('SEMI');
    return { type: 'Return', value, line };
  }

  private parseThrow(): JThrowStmt {
    const line = this.peek().line;
    this.advance();
    const expr = this.parseExpr(); this.match('SEMI');
    return { type: 'Throw', expr, line };
  }

  private parseTry(): JTryStmt {
    const line = this.peek().line;
    this.advance();
    const body = this.parseBlock();
    const catches: JCatch[] = [];
    let finally_: JNode[] = [];
    while (this.check('NAME', 'catch')) {
      const cline = this.peek().line;
      this.advance(); this.match('LPAREN');
      const exType = this.peek().type === 'NAME' ? this.advance().value : null;
      const name = this.peek().type === 'NAME' ? this.advance().value : null;
      this.match('RPAREN');
      const cbody = this.parseBlock();
      catches.push({ exType, name, body: cbody, line: cline });
    }
    if (this.check('NAME','finally')) { this.advance(); finally_ = this.parseBlock(); }
    return { type: 'Try', body, catches, finally_, line };
  }

  private parseSystemPrint(): JPrintStmt {
    const line = this.peek().line;
    this.advance(); // System
    this.match('DOT');
    this.advance(); // out / err
    this.match('DOT');
    const method = this.advance().value; // println / print / printf / format
    const newline = method !== 'print';
    this.match('LPAREN');
    const args: JExpr[] = [];
    while (!this.check('RPAREN') && !this.check('EOF')) { args.push(this.parseExpr()); this.match('COMMA'); }
    this.match('RPAREN');
    this.match('SEMI');
    return { type: 'Print', args, newline, line };
  }

  // ── Expressions ──────────────────────────────────────────────────────────
  parseExpr(): JExpr { return this.parseAssign(); }
  private parseAssign(): JExpr {
    const left = this.parseTernary();
    const assignOps = ['=','+=','-=','*=','/=','%=','&=','|=','^=','<<=','>>='];
    if (this.peek().type === 'OP' && assignOps.includes(this.peek().value)) {
      const op = this.advance().value;
      const right = this.parseAssign();
      const target = left.type === 'Name' ? (left as any).id : '_';
      return { type: 'Assign', target, op, value: right, line: left.line };
    }
    return left;
  }
  private parseTernary(): JExpr {
    const cond = this.parseOr();
    if (this.check('OP','?')) { this.advance(); const then = this.parseExpr(); this.advance(); const else_ = this.parseExpr(); return { type: 'Ternary', test: cond, then, else_, line: cond.line }; }
    return cond;
  }
  private parseOr(): JExpr { let l = this.parseAnd(); while (this.check('OP','||')) { this.advance(); const r = this.parseAnd(); l = { type: 'BinOp', left: l, op: '||', right: r, line: l.line }; } return l; }
  private parseAnd(): JExpr { let l = this.parseEq(); while (this.check('OP','&&')) { this.advance(); const r = this.parseEq(); l = { type: 'BinOp', left: l, op: '&&', right: r, line: l.line }; } return l; }
  private parseEq(): JExpr { let l = this.parseRel(); while (this.check('OP','==') || this.check('OP','!=')) { const op = this.advance().value; const r = this.parseRel(); l = { type: 'BinOp', left: l, op, right: r, line: l.line }; } return l; }
  private parseRel(): JExpr { let l = this.parseAdd(); while (this.peek().type==='OP' && ['<','>','<=','>='].includes(this.peek().value)) { const op = this.advance().value; const r = this.parseAdd(); l = { type: 'BinOp', left: l, op, right: r, line: l.line }; } return l; }
  private parseAdd(): JExpr { let l = this.parseMul(); while (this.check('OP','+') || this.check('OP','-')) { const op = this.advance().value; const r = this.parseMul(); l = { type: 'BinOp', left: l, op, right: r, line: l.line }; } return l; }
  private parseMul(): JExpr { let l = this.parseUnary(); while (this.check('OP','*') || this.check('OP','/') || this.check('OP','%')) { const op = this.advance().value; const r = this.parseUnary(); l = { type: 'BinOp', left: l, op, right: r, line: l.line }; } return l; }
  private parseUnary(): JExpr {
    const t = this.peek();
    if (t.type==='OP' && ['-','+','!','~'].includes(t.value)) { this.advance(); return { type: 'UnaryOp', op: t.value, operand: this.parseUnary(), line: t.line }; }
    if (t.type==='OP' && (t.value==='++'||t.value==='--')) { const op = this.advance().value; return { type: 'UnaryOp', op: `pre${op}`, operand: this.parsePostfix(), line: t.line }; }
    return this.parsePostfix();
  }
  private parsePostfix(): JExpr {
    let node = this.parsePrimary();
    while (true) {
      if (this.check('OP','++') || this.check('OP','--')) { const op = this.advance().value; node = { type: 'UnaryOp', op: `post${op}`, operand: node, line: node.line }; }
      else if (this.check('DOT')) {
        this.advance();
        const method = this.advance().value;
        if (this.check('LPAREN')) {
          this.advance();
          const args: JExpr[] = [];
          while (!this.check('RPAREN') && !this.check('EOF')) { args.push(this.parseExpr()); this.match('COMMA'); }
          this.match('RPAREN');
          node = { type: 'MethodCall', object: (node as any).id ?? '_', method, args, line: node.line };
        } else {
          node = { type: 'Member', object: (node as any).id ?? '_', field: method, line: node.line };
        }
      }
      else if (this.check('LBRACKET')) { this.advance(); const idx = this.parseExpr(); this.match('RBRACKET'); node = { type: 'Index', array: (node as any).id ?? '_', index: idx, line: node.line }; }
      else break;
    }
    return node;
  }
  private parsePrimary(): JExpr {
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
        // skip generic
        if (this.check('OP','<')) { this.advance(); while (!this.check('OP','>') && !this.check('EOF')) this.advance(); this.advance(); }
        this.match('LPAREN');
        const args: JExpr[] = [];
        while (!this.check('RPAREN') && !this.check('EOF')) { args.push(this.parseExpr()); this.match('COMMA'); }
        this.match('RPAREN');
        // array init
        if (this.check('LBRACE')) { this.advance(); while (!this.check('RBRACE') && !this.check('EOF')) { args.push(this.parseExpr()); this.match('COMMA'); } this.advance(); }
        return { type: 'New', className, args, line: t.line };
      }
      this.advance();
      if (this.check('LPAREN')) {
        this.advance();
        const args: JExpr[] = [];
        while (!this.check('RPAREN') && !this.check('EOF')) { args.push(this.parseExpr()); this.match('COMMA'); }
        this.match('RPAREN');
        return { type: 'Call', callee: t.value, args, line: t.line };
      }
      return { type: 'Name', id: t.value, line: t.line };
    }
    if (t.type === 'LPAREN') { this.advance(); const expr = this.parseExpr(); this.match('RPAREN'); return expr; }
    this.advance();
    return { type: 'Num', value: 0, line: t.line };
  }
}

// ── Interpreter ───────────────────────────────────────────────────────────────
let _sc = 0, _fc = 0, _cc = 0, _objId = 0;
function fScope() { return `j-scope-${++_sc}`; }
function fFrame() { return `j-frame-${++_fc}`; }
function fCon() { return `j-con-${++_cc}`; }
function fObj() { return `j-obj-${++_objId}`; }

function jDisplay(v: RuntimeValue, depth = 0): string {
  if (depth > 2) return '...';
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'boolean') return String(v);
  if (typeof v === 'number') return String(v);
  if (typeof v === 'string') return `"${v}"`;
  const o = v as any;
  if (o.__type === 'array') return `[${o.elements.slice(0,5).map((e: RuntimeValue) => jDisplay(e, depth+1)).join(', ')}]`;
  if (o.__type === 'object') { const keys = Object.keys(o.properties).slice(0,3); return `{${keys.map((k: string) => `${k}=${jDisplay(o.properties[k], depth+1)}`).join(', ')}}`; }
  return String(v);
}

export class JavaInterpreter implements LanguageEngine {
  readonly language: SupportedLanguage = 'java';

  private steps: ExecutionStep[] = [];
  private state: RuntimeState;
  private source: string;
  private methods: Map<string, JMethodDecl> = new Map();

  constructor(source: string) {
    this.source = source;
    this.state = createInitialState('java');
    _sc = 0; _fc = 0; _cc = 0; _objId = 0;
  }

  execute(): ExecutionResult {
    // ── JVM pipeline ─────────────────────────────────────────────────────────
    const pipeline: Array<[string, string]> = [
      ['source', 'Java source code (.java) loaded.'],
      ['compiler', 'javac: compiling Java source to platform-independent bytecode.'],
      ['bytecode', 'Bytecode (.class) generated — JVM instruction set.'],
      ['jvm', 'JVM: loading class, verifying bytecode, initializing static fields.'],
      ['execution', 'JVM executes bytecode — stack frames created for each method call.'],
    ];
    for (const [stage, desc] of pipeline) {
      this.state.compilationStage = stage;
      this.emit('COMPILATION_PIPELINE', 1, desc, { stage });
    }

    // Class loading
    this.emit('CLASS_LOAD', 1, 'JVM: class loaded into Method Area. Static initializers run.', { phase: 'class_load' });

    let ast: JProgram;
    try {
      const tokens = javaTokenize(this.source);
      const parser = new JParser(tokens);
      ast = parser.parse();
    } catch (e) {
      return { steps: this.steps, totalSteps: this.steps.length, finalState: cloneState(this.state), hasError: true, parseError: (e as Error).message, language: 'java' };
    }

    // Register methods
    for (const node of ast.body) {
      if (node.type === 'MethodDecl') this.methods.set((node as JMethodDecl).name, node as JMethodDecl);
    }

    this.emit('PROGRAM_START', 1, 'JVM invokes main() — program starts executing.', {});

    try {
      const mainMethod = this.methods.get('main');
      if (mainMethod) {
        this.callMethod(mainMethod, [], 1);
      } else {
        this.execBlock(ast.body as JStmt[], 'global');
      }
      this.state.executionStatus = 'completed';
      this.emit('PROGRAM_END', 0, 'JVM: main() returned. GC eligible objects collected.', {});
      this.emit('GC_EVENT', 0, 'JVM: Garbage Collector reclaims heap objects with no references.', { phase: 'final' });
    } catch (e) {
      if (!(e instanceof ReturnSignal)) {
        const err = e as Error;
        this.state.error = { type: err.name ?? 'RuntimeException', message: err.message, line: this.state.currentLine };
        this.state.executionStatus = 'error';
        this.emit('ERROR', this.state.currentLine, `${err.name}: ${err.message}`, {});
      }
    }

    const finalState = cloneState(this.state);
    finalState.currentStep = this.steps.length;
    return { steps: this.steps, totalSteps: this.steps.length, finalState, hasError: !!this.state.error, language: 'java' };
  }

  private emit(type: ExecutionEventType, line: number, desc: string, detail: Record<string, unknown>) {
    if (this.steps.length >= CODEFLOW_LIMITS.MAX_STEPS) throw new Error('INFINITE_LOOP');
    this.state.currentLine = line;
    this.state.currentStep = this.steps.length;
    this.state.explanation = desc;
    this.steps.push({ index: this.steps.length, event: { type, line, description: desc, detail }, state: cloneState(this.state) });
  }

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
  private declareVar(name: string, jtype: string, value: RuntimeValue, scopeId: string, line: number) {
    const scope = this.getScope(scopeId);
    if (!scope) return;
    scope.variables = scope.variables.filter(v => v.name !== name);
    scope.variables.push({ name, value, kind: 'local', state: 'initialized', scopeId, type: jtype, changedAtStep: this.steps.length });
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
        this.emit('ASSIGN_VARIABLE', line, `${name} = ${jDisplay(value)} (was ${jDisplay(old)})`, { name, oldValue: old, newValue: value });
        return;
      }
      sid = scope.parentId;
    }
    throw new Error(`Variable ${name} not declared`);
  }

  private execBlock(stmts: JStmt[], scopeId: string) {
    for (const stmt of stmts) this.execStmt(stmt, scopeId);
  }

  private execStmt(stmt: JStmt, scopeId: string) {
    if (this.steps.length >= CODEFLOW_LIMITS.MAX_STEPS) throw new Error('INFINITE_LOOP');
    const line = stmt.line;

    switch (stmt.type) {
      case 'VarDecl': {
        const value = stmt.init ? this.evalExpr(stmt.init, scopeId) : this.defaultVal(stmt.jtype);
        this.declareVar(stmt.name, stmt.jtype, value, scopeId, line);
        this.emit('DECLARE_VARIABLE', line, `${stmt.jtype} ${stmt.name} = ${jDisplay(value)}`, { name: stmt.name, jtype: stmt.jtype, value });
        break;
      }
      case 'MethodDecl': this.methods.set(stmt.name, stmt); break;
      case 'If': {
        const cond = this.evalExpr(stmt.test, scopeId);
        const result = Boolean(cond);
        this.emit('EVALUATE_CONDITION', line, `if (${this.jExprText(stmt.test)}) → ${result}`, { result });
        const bs = fScope();
        this.state.scopes.push({ id: bs, type: 'block', name: 'if', parentId: scopeId, variables: [] });
        try { if (result) this.execBlock(stmt.then as JStmt[], bs); else this.execBlock(stmt.else_ as JStmt[], bs); }
        finally { this.state.scopes = this.state.scopes.filter(s => s.id !== bs); }
        break;
      }
      case 'While': {
        let iter = 0;
        this.emit('LOOP_START', line, 'while loop begins.', { loopType: 'while' });
        while (true) {
          const cond = this.evalExpr(stmt.test, scopeId);
          const result = Boolean(cond);
          this.emit('LOOP_ITERATION', line, `while (${this.jExprText(stmt.test)}) → ${result ? 'true' : 'false — exit'}`, { iteration: iter, conditionResult: result });
          if (!result) break;
          const ls = fScope();
          this.state.scopes.push({ id: ls, type: 'block', name: 'while_body', parentId: scopeId, variables: [] });
          try { this.execBlock(stmt.body as JStmt[], ls); }
          catch (e) { if (e instanceof BreakSignal) { this.state.scopes = this.state.scopes.filter(s => s.id !== ls); break; } if (e instanceof ContinueSignal) { this.state.scopes = this.state.scopes.filter(s => s.id !== ls); iter++; continue; } throw e; }
          finally { this.state.scopes = this.state.scopes.filter(s => s.id !== ls); }
          iter++;
        }
        this.emit('LOOP_END', line, 'while loop finished.', { loopType: 'while' });
        break;
      }
      case 'For': {
        const fs = fScope();
        this.state.scopes.push({ id: fs, type: 'block', name: 'for', parentId: scopeId, variables: [] });
        try {
          if (stmt.init) this.execStmt(stmt.init as JStmt, fs);
          let iter = 0;
          this.emit('LOOP_START', line, 'for loop begins.', { loopType: 'for' });
          while (true) {
            if (stmt.test) {
              const cond = this.evalExpr(stmt.test, fs);
              const result = Boolean(cond);
              this.emit('LOOP_ITERATION', line, `for condition: ${this.jExprText(stmt.test)} → ${result ? 'true' : 'false — exit'}`, { iteration: iter, conditionResult: result });
              if (!result) break;
            }
            const bs = fScope();
            this.state.scopes.push({ id: bs, type: 'block', name: 'for_body', parentId: fs, variables: [] });
            try { this.execBlock(stmt.body as JStmt[], bs); }
            catch (e) { if (e instanceof BreakSignal) { this.state.scopes = this.state.scopes.filter(s => s.id !== bs); break; } if (e instanceof ContinueSignal) { this.state.scopes = this.state.scopes.filter(s => s.id !== bs); } else throw e; }
            finally { this.state.scopes = this.state.scopes.filter(s => s.id !== bs); }
            if (stmt.update) this.evalExpr(stmt.update, fs);
            iter++;
          }
          this.emit('LOOP_END', line, 'for loop finished.', { loopType: 'for' });
        } finally { this.state.scopes = this.state.scopes.filter(s => s.id !== fs); }
        break;
      }
      case 'ForEach': {
        const iterVal = this.evalExpr(stmt.iter, scopeId);
        const items = (iterVal as any)?.__type === 'array' ? (iterVal as any).elements : [];
        let iter = 0;
        this.emit('LOOP_START', line, `for (${stmt.target} : ...) — enhanced for loop begins.`, { loopType: 'enhanced_for' });
        for (const item of items) {
          const bs = fScope();
          this.state.scopes.push({ id: bs, type: 'block', name: 'foreach_body', parentId: scopeId, variables: [] });
          this.declareVar(stmt.target, 'var', item, bs, line);
          this.emit('LOOP_ITERATION', line, `for each iteration ${iter+1}: ${stmt.target} = ${jDisplay(item)}`, { iteration: iter, value: item });
          try { this.execBlock(stmt.body as JStmt[], bs); }
          catch (e) { if (e instanceof BreakSignal) { this.state.scopes = this.state.scopes.filter(s => s.id !== bs); break; } if (e instanceof ContinueSignal) { this.state.scopes = this.state.scopes.filter(s => s.id !== bs); iter++; continue; } throw e; }
          finally { this.state.scopes = this.state.scopes.filter(s => s.id !== bs); }
          iter++;
        }
        this.emit('LOOP_END', line, 'enhanced for loop finished.', { loopType: 'enhanced_for' });
        break;
      }
      case 'Return': { const val = stmt.value ? this.evalExpr(stmt.value, scopeId) : null; this.emit('RETURN_VALUE', line, `return ${jDisplay(val)}`, { value: val }); throw new ReturnSignal(val); }
      case 'Break': throw new BreakSignal();
      case 'Continue': throw new ContinueSignal();
      case 'Print': {
        const argVals = stmt.args.map(a => this.evalExpr(a, scopeId));
        const text = argVals.map(v => jDisplay(v)).join('');
        const full = stmt.newline ? text : text;
        this.state.consoleOutput.push({ id: fCon(), value: full, line, stepIndex: this.steps.length });
        this.emit('CONSOLE_OUTPUT', line, `System.out.${stmt.newline ? 'println' : 'print'}(${jDisplay(argVals[0] ?? null)}) → "${full}"`, { value: full });
        break;
      }
      case 'Throw': { const val = this.evalExpr(stmt.expr, scopeId); throw new Error(jDisplay(val)); }
      case 'Try': {
        try { this.execBlock(stmt.body as JStmt[], scopeId); }
        catch (e) {
          if (e instanceof ReturnSignal || e instanceof BreakSignal || e instanceof ContinueSignal) throw e;
          const errMsg = (e as Error).message;
          let handled = false;
          for (const handler of stmt.catches) {
            const cs = fScope();
            this.state.scopes.push({ id: cs, type: 'block', name: 'catch', parentId: scopeId, variables: [] });
            if (handler.name) this.declareVar(handler.name, handler.exType ?? 'Exception', errMsg, cs, line);
            this.emit('EVALUATE_CONDITION', line, `catch (${handler.exType ?? 'Exception'}) — handling: ${errMsg}`, { message: errMsg });
            try { this.execBlock(handler.body as JStmt[], cs); }
            finally { this.state.scopes = this.state.scopes.filter(s => s.id !== cs); }
            handled = true; break;
          }
          if (!handled) throw e;
        } finally { if (stmt.finally_.length) this.execBlock(stmt.finally_ as JStmt[], scopeId); }
        break;
      }
      case 'ExprStmt': this.evalExpr(stmt.expr, scopeId); break;
    }
  }

  private evalExpr(expr: JExpr, scopeId: string): RuntimeValue {
    const line = expr.line;
    switch (expr.type) {
      case 'Num': return expr.value;
      case 'Str': return expr.value;
      case 'Bool': return expr.value;
      case 'Null': return null;
      case 'Name': return this.lookupVar(expr.id, scopeId)?.value ?? null;
      case 'BinOp': {
        const l = this.evalExpr(expr.left, scopeId) as any;
        const r = this.evalExpr(expr.right, scopeId) as any;
        switch (expr.op) {
          case '+': return typeof l === 'string' ? String(l)+String(r) : l+r;
          case '-': return l-r; case '*': return l*r;
          case '/': return r===0 ? 0 : (Number.isInteger(l)&&Number.isInteger(r) ? Math.trunc(l/r) : l/r);
          case '%': return l%r;
          case '<': return l<r; case '>': return l>r; case '<=': return l<=r; case '>=': return l>=r;
          case '==': return l===r; case '!=': return l!==r;
          case '&&': return Boolean(l)&&Boolean(r); case '||': return Boolean(l)||Boolean(r);
          case '&': return l&r; case '|': return l|r; case '^': return l^r;
          case '<<': return l<<r; case '>>': return l>>r;
          default: return null;
        }
      }
      case 'UnaryOp': {
        const val = this.evalExpr(expr.operand, scopeId);
        const n = val as number;
        switch (expr.op) {
          case '-': return -n; case '!': return !val; case '~': return ~n;
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
            case '+=': rhs = typeof old==='string' ? String(old)+String(rhs) : old+rhs; break;
            case '-=': rhs = old-rhs; break; case '*=': rhs = old*rhs; break;
            case '/=': rhs = Math.trunc(old/rhs); break; case '%=': rhs = old%rhs; break;
          }
        }
        if (existing) this.setVar(expr.target, rhs, scopeId, line);
        else { this.declareVar(expr.target, 'var', rhs, scopeId, line); this.emit('DECLARE_VARIABLE', line, `var ${expr.target} = ${jDisplay(rhs)}`, { name: expr.target, value: rhs }); }
        return rhs;
      }
      case 'New': {
        const id = fObj();
        const obj: HeapObject = { id, address: `ref@${id}`, type: expr.className, fields: {}, label: `new ${expr.className}()` };
        this.state.heap.push(obj);
        this.emit('OBJECT_CREATE', line, `new ${expr.className}() — JVM allocates object on heap`, { className: expr.className, id });
        if (['ArrayList','LinkedList','List'].includes(expr.className)) return { __type: 'array', elements: [] } as any;
        if (['HashMap','LinkedHashMap','TreeMap','Map'].includes(expr.className)) return { __type: 'object', properties: {} } as any;
        return { __type: 'object', properties: {} } as any;
      }
      case 'Call': {
        const argVals = expr.args.map(a => this.evalExpr(a, scopeId));
        if (expr.callee === 'Math.abs') return Math.abs(argVals[0] as number);
        if (expr.callee === 'Math.sqrt') return Math.sqrt(argVals[0] as number);
        if (expr.callee === 'Math.pow') return Math.pow(argVals[0] as number, argVals[1] as number);
        if (expr.callee === 'Math.max') return Math.max(argVals[0] as number, argVals[1] as number);
        if (expr.callee === 'Math.min') return Math.min(argVals[0] as number, argVals[1] as number);
        if (expr.callee === 'Integer.parseInt') return parseInt(String(argVals[0]), 10);
        if (expr.callee === 'Double.parseDouble') return parseFloat(String(argVals[0]));
        if (expr.callee === 'String.valueOf') return jDisplay(argVals[0]);
        const method = this.methods.get(expr.callee);
        if (method) return this.callMethod(method, argVals, line);
        return null;
      }
      case 'MethodCall': {
        const argVals = expr.args.map(a => this.evalExpr(a, scopeId));
        const obj = this.lookupVar(expr.object, scopeId)?.value;
        if ((obj as any)?.__type === 'array') {
          const arr = (obj as any).elements as RuntimeValue[];
          if (expr.method === 'add') { arr.push(argVals[0]); return null; }
          if (expr.method === 'remove') { const i = typeof argVals[0]==='number' ? argVals[0] : arr.indexOf(argVals[0] as any); arr.splice(i as number, 1); return null; }
          if (expr.method === 'get') return arr[argVals[0] as number] ?? null;
          if (expr.method === 'set') { arr[argVals[0] as number] = argVals[1]; return null; }
          if (expr.method === 'size' || expr.method === 'length') return arr.length;
          if (expr.method === 'contains') return arr.includes(argVals[0] as any);
          if (expr.method === 'isEmpty') return arr.length === 0;
          if (expr.method === 'clear') { arr.splice(0); return null; }
          if (expr.method === 'sort') { arr.sort((a,b) => (a as number)-(b as number)); return null; }
          if (expr.method === 'indexOf') return arr.indexOf(argVals[0] as any);
          if (expr.method === 'toArray') return { __type: 'array', elements: [...arr] } as any;
        }
        if (typeof obj === 'string') {
          if (expr.method === 'length') return (obj as string).length;
          if (expr.method === 'charAt') return (obj as string).charAt(argVals[0] as number);
          if (expr.method === 'substring') return (obj as string).slice(argVals[0] as number, argVals[1] as number);
          if (expr.method === 'equals') return obj === String(argVals[0]);
          if (expr.method === 'equalsIgnoreCase') return (obj as string).toLowerCase() === String(argVals[0]).toLowerCase();
          if (expr.method === 'contains') return (obj as string).includes(String(argVals[0]));
          if (expr.method === 'startsWith') return (obj as string).startsWith(String(argVals[0]));
          if (expr.method === 'endsWith') return (obj as string).endsWith(String(argVals[0]));
          if (expr.method === 'toUpperCase') return (obj as string).toUpperCase();
          if (expr.method === 'toLowerCase') return (obj as string).toLowerCase();
          if (expr.method === 'trim') return (obj as string).trim();
          if (expr.method === 'replace') return (obj as string).replace(String(argVals[0]), String(argVals[1]));
          if (expr.method === 'split') return { __type: 'array', elements: (obj as string).split(String(argVals[0])) } as any;
          if (expr.method === 'indexOf') return (obj as string).indexOf(String(argVals[0]));
          if (expr.method === 'toString') return obj;
          if (expr.method === 'isEmpty') return (obj as string).length === 0;
        }
        const method = this.methods.get(expr.method);
        if (method) return this.callMethod(method, argVals, line);
        return null;
      }
      case 'Member': {
        const v = this.lookupVar(expr.object, scopeId)?.value;
        if ((v as any)?.__type === 'array') { if (expr.field === 'length') return (v as any).elements.length; }
        if ((v as any)?.__type === 'object') return (v as any).properties[expr.field];
        return null;
      }
      case 'Index': {
        const v = this.lookupVar(expr.array, scopeId)?.value;
        const idx = this.evalExpr(expr.index, scopeId);
        if ((v as any)?.__type === 'array') return (v as any).elements[idx as number];
        return null;
      }
      case 'Ternary': return Boolean(this.evalExpr(expr.test, scopeId)) ? this.evalExpr(expr.then, scopeId) : this.evalExpr(expr.else_, scopeId);
      case 'Cast': return this.evalExpr(expr.expr, scopeId);
      default: return null;
    }
  }

  private callMethod(method: JMethodDecl, argVals: RuntimeValue[], callLine: number): RuntimeValue {
    const fnScopeId = fScope();
    const fnScope: Scope = { id: fnScopeId, type: 'function', name: method.name, parentId: 'global', variables: [] };
    this.state.scopes.push(fnScope);
    for (let i = 0; i < method.params.length; i++) {
      const p = method.params[i]!;
      fnScope.variables.push({ name: p.name, value: argVals[i] ?? this.defaultVal(p.jtype), kind: 'local', state: 'initialized', scopeId: fnScopeId, type: p.jtype });
    }
    const frameId = fFrame();
    const frame: CallFrame = { id: frameId, functionName: method.name, line: callLine, scopeId: fnScopeId };
    this.state.callStack.push(frame);
    const paramDesc = method.params.map((p, i) => `${p.name}=${jDisplay(argVals[i] ?? null)}`).join(', ');
    this.emit('PUSH_CALL_STACK', callLine, `Method "${method.name}" called (${paramDesc}) — JVM frame pushed`, { frame });
    this.emit('ENTER_FUNCTION', callLine, `Entering ${method.name}(${paramDesc}) — local variables in JVM frame`, { functionName: method.name });
    let returnValue: RuntimeValue = null;
    try { this.execBlock(method.body as JStmt[], fnScopeId); }
    catch (e) {
      if (e instanceof ReturnSignal) returnValue = e.value;
      else { this.state.callStack = this.state.callStack.filter(f => f.id !== frameId); this.state.scopes = this.state.scopes.filter(s => s.id !== fnScopeId); throw e; }
    }
    this.emit('EXIT_FUNCTION', callLine, `${method.name} returns ${jDisplay(returnValue)} — JVM frame removed`, { functionName: method.name, returnValue });
    this.state.callStack = this.state.callStack.filter(f => f.id !== frameId);
    this.state.scopes = this.state.scopes.filter(s => s.id !== fnScopeId);
    this.emit('POP_CALL_STACK', callLine, `"${method.name}" JVM stack frame popped`, { functionName: method.name });
    return returnValue;
  }

  private defaultVal(jtype: string): RuntimeValue {
    if (['int','long','short','byte','float','double'].includes(jtype)) return 0;
    if (jtype === 'boolean') return false;
    if (jtype === 'char') return '\0';
    return null;
  }

  private jExprText(expr: JExpr): string {
    switch (expr.type) {
      case 'Name': return expr.id;
      case 'Num': return String(expr.value);
      case 'Bool': return String(expr.value);
      case 'BinOp': return `${this.jExprText(expr.left)} ${expr.op} ${this.jExprText(expr.right)}`;
      default: return '(expr)';
    }
  }
}
