/**
 * CODEFLOW — C Interpreter
 * PRD-2 §5: C Runtime Model
 *
 * Compilation pipeline visualized:
 *   Source → Preprocessor → Compiler → Assembly → Object Code → Linker → Executable → Runtime
 *
 * Runtime visualizes:
 *   Stack, Heap, Variables, Pointers, Function Calls
 *
 * Events: DECLARE_VARIABLE, ASSIGN_VARIABLE, EVALUATE_CONDITION, LOOP_ITERATION,
 *         FUNCTION_CALL, FUNCTION_RETURN, STACK_ALLOCATE, HEAP_ALLOCATE,
 *         POINTER_REFERENCE, CONSOLE_OUTPUT
 */

import {
  RuntimeState, RuntimeValue, ExecutionStep, ExecutionEvent, ExecutionEventType,
  ExecutionResult, Variable, Scope, CallFrame, ConsoleEntry, MemoryCell,
  LanguageEngine, SupportedLanguage,
} from '../types';
import { createInitialState, cloneState } from '../runtime-state.factory';
import { CODEFLOW_LIMITS } from '../../../constants/codeflow.constants';

// ── Signals ────────────────────────────────────────────────────────────────────
class ReturnSignal { constructor(public value: RuntimeValue) {} }
class BreakSignal {}
class ContinueSignal {}

// ── Simple AST types ──────────────────────────────────────────────────────────
interface CNode { type: string; line: number }
interface CProgram extends CNode { type: 'Program'; body: CNode[] }
interface CVarDecl extends CNode { type: 'VarDecl'; ctype: string; name: string; init: CExpr | null; isPointer: boolean }
interface CFuncDecl extends CNode { type: 'FuncDecl'; returnType: string; name: string; params: CParam[]; body: CNode[] }
interface CParam { ctype: string; name: string; isPointer: boolean }
interface CIfStmt extends CNode { type: 'If'; test: CExpr; then: CNode[]; else_: CNode[] }
interface CWhileStmt extends CNode { type: 'While'; test: CExpr; body: CNode[] }
interface CForStmt extends CNode { type: 'For'; init: CNode | null; test: CExpr | null; update: CExpr | null; body: CNode[] }
interface CReturnStmt extends CNode { type: 'Return'; value: CExpr | null }
interface CBreakStmt extends CNode { type: 'Break' }
interface CContinueStmt extends CNode { type: 'Continue' }
interface CExprStmt extends CNode { type: 'ExprStmt'; expr: CExpr }
interface CPrintfStmt extends CNode { type: 'Printf'; format: string; args: CExpr[] }
interface CBlockStmt extends CNode { type: 'Block'; body: CNode[] }

type CStmt = CVarDecl | CFuncDecl | CIfStmt | CWhileStmt | CForStmt | CReturnStmt
  | CBreakStmt | CContinueStmt | CExprStmt | CPrintfStmt | CBlockStmt;

type CExpr =
  | { type: 'Num'; value: number; line: number }
  | { type: 'Str'; value: string; line: number }
  | { type: 'Char'; value: string; line: number }
  | { type: 'Name'; id: string; line: number }
  | { type: 'BinOp'; left: CExpr; op: string; right: CExpr; line: number }
  | { type: 'UnaryOp'; op: string; operand: CExpr; line: number }
  | { type: 'Assign'; target: string; op: string; value: CExpr; line: number }
  | { type: 'Call'; name: string; args: CExpr[]; line: number }
  | { type: 'Cast'; ctype: string; expr: CExpr; line: number }
  | { type: 'Index'; array: string; index: CExpr; line: number }
  | { type: 'Deref'; expr: CExpr; line: number }
  | { type: 'AddressOf'; name: string; line: number }
  | { type: 'Member'; object: string; field: string; line: number }
  | { type: 'Ternary'; test: CExpr; then: CExpr; else_: CExpr; line: number };

// ── Tokenizer ─────────────────────────────────────────────────────────────────
type CTokType = 'NUM' | 'STR' | 'CHAR' | 'NAME' | 'OP' | 'SEMI' | 'LBRACE' | 'RBRACE'
  | 'LPAREN' | 'RPAREN' | 'LBRACKET' | 'RBRACKET' | 'COMMA' | 'EOF' | 'HASH' | 'DOT' | 'ARROW';

interface CTok { type: CTokType; value: string; line: number }

const C_KEYWORDS = new Set(['int','char','float','double','long','short','unsigned','signed',
  'void','struct','typedef','enum','union','static','extern','const','volatile','register',
  'auto','if','else','while','for','do','return','break','continue','switch','case','default',
  'sizeof','NULL','true','false','include','define','main']);

function cTokenize(src: string): CTok[] {
  const tokens: CTok[] = [];
  let i = 0;
  let line = 1;

  while (i < src.length) {
    const ch = src[i]!;

    if (ch === '\n') { line++; i++; continue; }
    if (ch === ' ' || ch === '\t' || ch === '\r') { i++; continue; }

    // Line comment
    if (ch === '/' && src[i+1] === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
    // Block comment
    if (ch === '/' && src[i+1] === '*') { i += 2; while (i < src.length && !(src[i] === '*' && src[i+1] === '/')) { if (src[i] === '\n') line++; i++; } i += 2; continue; }
    // Preprocessor
    if (ch === '#') { while (i < src.length && src[i] !== '\n') i++; continue; }

    // String
    if (ch === '"') {
      let j = i + 1;
      while (j < src.length && src[j] !== '"') { if (src[j] === '\\') j++; j++; }
      tokens.push({ type: 'STR', value: src.slice(i + 1, j), line });
      i = j + 1; continue;
    }

    // Char literal
    if (ch === "'") {
      let j = i + 1;
      if (src[j] === '\\') j++;
      j++;
      tokens.push({ type: 'CHAR', value: src.slice(i + 1, j), line });
      i = j + 1; continue;
    }

    // Number
    if (ch >= '0' && ch <= '9') {
      let j = i;
      while (j < src.length && (src[j]! >= '0' && src[j]! <= '9' || src[j] === '.' || src[j] === 'f' || src[j] === 'l')) j++;
      tokens.push({ type: 'NUM', value: src.slice(i, j), line });
      i = j; continue;
    }

    // Identifier / keyword
    if (ch >= 'a' && ch <= 'z' || ch >= 'A' && ch <= 'Z' || ch === '_') {
      let j = i;
      while (j < src.length && /[\w]/.test(src[j]!)) j++;
      tokens.push({ type: 'NAME', value: src.slice(i, j), line });
      i = j; continue;
    }

    // Multi-char ops
    const two = src.slice(i, i + 2);
    if (['==','!=','<=','>=','&&','||','++','--','+=','-=','*=','/=','%=','->','<<','>>'].includes(two)) {
      tokens.push({ type: 'OP', value: two, line }); i += 2; continue;
    }

    // Single-char
    const single: Record<string, CTokType> = {
      ';': 'SEMI', '{': 'LBRACE', '}': 'RBRACE', '(': 'LPAREN', ')': 'RPAREN',
      '[': 'LBRACKET', ']': 'RBRACKET', ',': 'COMMA', '.': 'DOT',
    };
    if (single[ch]) { tokens.push({ type: single[ch]!, value: ch, line }); i++; continue; }
    if (['+','-','*','/','%','<','>','=','!','&','|','^','~','?',':'].includes(ch)) {
      tokens.push({ type: 'OP', value: ch, line }); i++; continue;
    }
    i++;
  }
  tokens.push({ type: 'EOF', value: '', line });
  return tokens;
}

// ── Parser ────────────────────────────────────────────────────────────────────
class CParser {
  private pos = 0;
  constructor(private tokens: CTok[]) {}

  private peek(): CTok { return this.tokens[this.pos] ?? { type: 'EOF', value: '', line: 0 }; }
  private advance(): CTok { return this.tokens[this.pos++] ?? { type: 'EOF', value: '', line: 0 }; }
  private check(type: CTokType, value?: string): boolean {
    const t = this.peek();
    return t.type === type && (value === undefined || t.value === value);
  }
  private match(type: CTokType, value?: string): boolean {
    if (this.check(type, value)) { this.advance(); return true; }
    return false;
  }
  private expect(type: CTokType, value?: string): CTok {
    if (this.check(type, value)) return this.advance();
    return this.advance(); // lenient
  }

  parse(): CProgram {
    const body: CNode[] = [];
    while (!this.check('EOF')) {
      const node = this.parseTopLevel();
      if (node) body.push(node);
    }
    return { type: 'Program', body, line: 1 };
  }

  private parseTopLevel(): CNode | null {
    if (this.check('EOF')) return null;
    // Type specifiers
    const typeNames = ['int','char','float','double','long','short','unsigned','signed','void','struct','const'];
    if (this.peek().type === 'NAME' && typeNames.includes(this.peek().value)) {
      return this.parseDeclaration();
    }
    // Skip anything else
    this.advance();
    return null;
  }

  private parseDeclaration(): CNode {
    const line = this.peek().line;
    const ctype = this.parseTypeSpec();
    const isPointer = this.match('OP', '*') || this.check('OP', '*');
    if (isPointer && this.check('OP', '*')) this.advance();
    const name = this.advance().value;

    // Function declaration
    if (this.check('LPAREN')) {
      this.advance();
      const params = this.parseParams();
      this.match('RPAREN');
      if (this.check('LBRACE')) {
        const body = this.parseBlock();
        return { type: 'FuncDecl', returnType: ctype, name, params, body, line } as CFuncDecl;
      }
      this.match('SEMI');
      return { type: 'FuncDecl', returnType: ctype, name, params, body: [], line } as CFuncDecl;
    }

    // Variable declaration
    let init: CExpr | null = null;
    if (this.match('OP', '=')) {
      init = this.parseExpr();
    }
    this.match('SEMI');
    return { type: 'VarDecl', ctype, name, init, isPointer, line } as CVarDecl;
  }

  private parseTypeSpec(): string {
    const parts: string[] = [];
    const typeWords = ['int','char','float','double','long','short','unsigned','signed','void','struct','const','static','extern'];
    while (this.peek().type === 'NAME' && typeWords.includes(this.peek().value)) {
      parts.push(this.advance().value);
    }
    return parts.join(' ') || 'int';
  }

  private parseParams(): CParam[] {
    const params: CParam[] = [];
    while (!this.check('RPAREN') && !this.check('EOF')) {
      const ctype = this.parseTypeSpec();
      const isPointer = this.match('OP', '*');
      const name = this.advance().value;
      params.push({ ctype, name, isPointer });
      this.match('COMMA');
    }
    return params;
  }

  private parseBlock(): CNode[] {
    this.expect('LBRACE');
    const stmts: CNode[] = [];
    while (!this.check('RBRACE') && !this.check('EOF')) {
      const s = this.parseStatement();
      if (s) stmts.push(s);
    }
    this.expect('RBRACE');
    return stmts;
  }

  private parseStatement(): CNode | null {
    const t = this.peek();
    if (t.type === 'EOF' || t.type === 'RBRACE') return null;

    if (t.type === 'NAME' && t.value === 'if') return this.parseIf();
    if (t.type === 'NAME' && t.value === 'while') return this.parseWhile();
    if (t.type === 'NAME' && t.value === 'for') return this.parseFor();
    if (t.type === 'NAME' && t.value === 'return') return this.parseReturn();
    if (t.type === 'NAME' && t.value === 'break') { this.advance(); this.match('SEMI'); return { type: 'Break', line: t.line }; }
    if (t.type === 'NAME' && t.value === 'continue') { this.advance(); this.match('SEMI'); return { type: 'Continue', line: t.line }; }
    if (t.type === 'LBRACE') {
      const body = this.parseBlock();
      return { type: 'Block', body, line: t.line } as unknown as CBlockStmt;
    }

    // Declaration
    const typeNames = ['int','char','float','double','long','short','unsigned','signed','void','const','static'];
    if (t.type === 'NAME' && typeNames.includes(t.value)) {
      return this.parseDeclaration();
    }

    // printf / scanf
    if (t.type === 'NAME' && (t.value === 'printf' || t.value === 'puts')) {
      return this.parsePrintf();
    }

    // expression statement
    const expr = this.parseExpr();
    this.match('SEMI');
    return { type: 'ExprStmt', expr, line: t.line } as CExprStmt;
  }

  private parseIf(): CIfStmt {
    const line = this.peek().line;
    this.advance(); // if
    this.expect('LPAREN');
    const test = this.parseExpr();
    this.expect('RPAREN');
    const then = this.check('LBRACE') ? this.parseBlock() : [this.parseStatement()!].filter(Boolean);
    let else_: CNode[] = [];
    if (this.check('NAME', 'else')) {
      this.advance();
      if (this.check('NAME', 'if')) else_ = [this.parseIf()];
      else else_ = this.check('LBRACE') ? this.parseBlock() : [this.parseStatement()!].filter(Boolean);
    }
    return { type: 'If', test, then, else_, line };
  }

  private parseWhile(): CWhileStmt {
    const line = this.peek().line;
    this.advance();
    this.expect('LPAREN');
    const test = this.parseExpr();
    this.expect('RPAREN');
    const body = this.check('LBRACE') ? this.parseBlock() : [this.parseStatement()!].filter(Boolean);
    return { type: 'While', test, body, line };
  }

  private parseFor(): CForStmt {
    const line = this.peek().line;
    this.advance();
    this.expect('LPAREN');
    let init: CNode | null = null;
    if (!this.check('SEMI')) {
      const typeNames = ['int','char','float','double','long','short'];
      if (this.peek().type === 'NAME' && typeNames.includes(this.peek().value)) {
        init = this.parseDeclaration();
      } else {
        const expr = this.parseExpr();
        this.match('SEMI');
        init = { type: 'ExprStmt', expr, line } as CExprStmt;
      }
    } else this.advance();
    const test = this.check('SEMI') ? null : this.parseExpr();
    this.match('SEMI');
    const update = this.check('RPAREN') ? null : this.parseExpr();
    this.expect('RPAREN');
    const body = this.check('LBRACE') ? this.parseBlock() : [this.parseStatement()!].filter(Boolean);
    return { type: 'For', init, test, update, body, line };
  }

  private parseReturn(): CReturnStmt {
    const line = this.peek().line;
    this.advance();
    if (this.check('SEMI')) { this.advance(); return { type: 'Return', value: null, line }; }
    const value = this.parseExpr();
    this.match('SEMI');
    return { type: 'Return', value, line };
  }

  private parsePrintf(): CPrintfStmt {
    const line = this.peek().line;
    const name = this.advance().value;
    this.expect('LPAREN');
    const args: CExpr[] = [];
    if (this.check('STR')) {
      const fmt = this.advance().value;
      while (this.check('COMMA')) {
        this.advance();
        args.push(this.parseExpr());
      }
      this.expect('RPAREN');
      this.match('SEMI');
      return { type: 'Printf', format: fmt, args, line };
    }
    while (!this.check('RPAREN') && !this.check('EOF')) {
      args.push(this.parseExpr());
      this.match('COMMA');
    }
    this.expect('RPAREN');
    this.match('SEMI');
    return { type: 'Printf', format: '%s', args, line };
  }

  // ── Expression parsing ────────────────────────────────────────────────────
  parseExpr(): CExpr { return this.parseAssign(); }

  private parseAssign(): CExpr {
    const left = this.parseTernary();
    const assignOps = ['=','+=','-=','*=','/=','%=','<<=','>>=','&=','|=','^='];
    if (this.peek().type === 'OP' && assignOps.includes(this.peek().value)) {
      const op = this.advance().value;
      const right = this.parseAssign();
      const target = left.type === 'Name' ? (left as any).id : '_';
      return { type: 'Assign', target, op, value: right, line: left.line };
    }
    return left;
  }

  private parseTernary(): CExpr {
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

  private parseOr(): CExpr {
    let left = this.parseAnd();
    while (this.check('OP', '||')) { this.advance(); const right = this.parseAnd(); left = { type: 'BinOp', left, op: '||', right, line: left.line }; }
    return left;
  }

  private parseAnd(): CExpr {
    let left = this.parseEq();
    while (this.check('OP', '&&')) { this.advance(); const right = this.parseEq(); left = { type: 'BinOp', left, op: '&&', right, line: left.line }; }
    return left;
  }

  private parseEq(): CExpr {
    let left = this.parseRel();
    while (this.check('OP','==') || this.check('OP','!=')) {
      const op = this.advance().value;
      const right = this.parseRel();
      left = { type: 'BinOp', left, op, right, line: left.line };
    }
    return left;
  }

  private parseRel(): CExpr {
    let left = this.parseAdd();
    while (this.peek().type === 'OP' && ['<','>','<=','>='].includes(this.peek().value)) {
      const op = this.advance().value;
      const right = this.parseAdd();
      left = { type: 'BinOp', left, op, right, line: left.line };
    }
    return left;
  }

  private parseAdd(): CExpr {
    let left = this.parseMul();
    while (this.check('OP','+') || this.check('OP','-')) {
      const op = this.advance().value;
      const right = this.parseMul();
      left = { type: 'BinOp', left, op, right, line: left.line };
    }
    return left;
  }

  private parseMul(): CExpr {
    let left = this.parseUnary();
    while (this.check('OP','*') || this.check('OP','/') || this.check('OP','%')) {
      const op = this.advance().value;
      const right = this.parseUnary();
      left = { type: 'BinOp', left, op, right, line: left.line };
    }
    return left;
  }

  private parseUnary(): CExpr {
    const t = this.peek();
    if (t.type === 'OP' && ['-','+','!','~'].includes(t.value)) {
      this.advance();
      return { type: 'UnaryOp', op: t.value, operand: this.parseUnary(), line: t.line };
    }
    if (t.type === 'OP' && t.value === '*') {
      this.advance();
      return { type: 'Deref', expr: this.parseUnary(), line: t.line };
    }
    if (t.type === 'OP' && t.value === '&') {
      this.advance();
      const name = this.advance().value;
      return { type: 'AddressOf', name, line: t.line };
    }
    // pre-increment/decrement
    if (t.type === 'OP' && (t.value === '++' || t.value === '--')) {
      const op = this.advance().value;
      const operand = this.parsePostfix();
      return { type: 'UnaryOp', op: `pre${op}`, operand, line: t.line };
    }
    // cast: (type) expr
    if (t.type === 'LPAREN') {
      const saved = this.pos;
      this.advance();
      const typeWords = ['int','char','float','double','long','short','unsigned','signed','void'];
      if (this.peek().type === 'NAME' && typeWords.includes(this.peek().value)) {
        const ctype = this.parseTypeSpec();
        if (this.check('RPAREN')) {
          this.advance();
          const expr = this.parseUnary();
          return { type: 'Cast', ctype, expr, line: t.line };
        }
      }
      this.pos = saved;
    }
    return this.parsePostfix();
  }

  private parsePostfix(): CExpr {
    let node = this.parsePrimary();
    while (true) {
      if (this.check('OP','++') || this.check('OP','--')) {
        const op = this.advance().value;
        node = { type: 'UnaryOp', op: `post${op}`, operand: node, line: node.line };
      } else if (this.check('LBRACKET')) {
        this.advance();
        const idx = this.parseExpr();
        this.expect('RBRACKET');
        node = { type: 'Index', array: (node as any).id ?? '_', index: idx, line: node.line };
      } else if (this.check('DOT')) {
        this.advance();
        const field = this.advance().value;
        node = { type: 'Member', object: (node as any).id ?? '_', field, line: node.line };
      } else if (this.check('OP', '->')) {
        this.advance();
        const field = this.advance().value;
        node = { type: 'Member', object: (node as any).id ?? '_', field, line: node.line };
      } else break;
    }
    return node;
  }

  private parsePrimary(): CExpr {
    const t = this.peek();
    if (t.type === 'NUM') { this.advance(); return { type: 'Num', value: parseFloat(t.value), line: t.line }; }
    if (t.type === 'STR') { this.advance(); return { type: 'Str', value: t.value, line: t.line }; }
    if (t.type === 'CHAR') { this.advance(); return { type: 'Char', value: t.value, line: t.line }; }
    if (t.type === 'NAME') {
      this.advance();
      // function call
      if (this.check('LPAREN')) {
        this.advance();
        const args: CExpr[] = [];
        while (!this.check('RPAREN') && !this.check('EOF')) {
          args.push(this.parseExpr());
          this.match('COMMA');
        }
        this.expect('RPAREN');
        return { type: 'Call', name: t.value, args, line: t.line };
      }
      return { type: 'Name', id: t.value, line: t.line };
    }
    if (t.type === 'LPAREN') {
      this.advance();
      const expr = this.parseExpr();
      this.expect('RPAREN');
      return expr;
    }
    this.advance();
    return { type: 'Num', value: 0, line: t.line };
  }
}

// ── Memory helpers ─────────────────────────────────────────────────────────────
let _addrCounter = 0x1000;
function freshAddr(): string { return `0x${(_addrCounter += 4).toString(16).toUpperCase()}`; }

// ── Main Interpreter ──────────────────────────────────────────────────────────
let _sc = 0, _fc = 0, _cc = 0;
function fScope() { return `c-scope-${++_sc}`; }
function fFrame() { return `c-frame-${++_fc}`; }
function fCon() { return `c-con-${++_cc}`; }

function cDisplay(v: RuntimeValue): string {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'boolean') return v ? '1' : '0';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'string') return `"${v}"`;
  return String(v);
}

function formatPrintf(fmt: string, args: RuntimeValue[]): string {
  let i = 0;
  return fmt.replace(/%[diouxXeEfgGcs%]/g, (spec) => {
    if (spec === '%%') return '%';
    const val = args[i++];
    if (spec === '%d' || spec === '%i') return String(Math.trunc(val as number));
    if (spec === '%f') return (val as number).toFixed(6);
    if (spec === '%g') return String(val);
    if (spec === '%s') return String(val ?? '');
    if (spec === '%c') return typeof val === 'number' ? String.fromCharCode(val) : String(val ?? '');
    return String(val ?? '');
  });
}

export class CInterpreter implements LanguageEngine {
  readonly language: SupportedLanguage = 'c';

  private steps: ExecutionStep[] = [];
  private state: RuntimeState;
  private source: string;
  private functions: Map<string, CFuncDecl> = new Map();

  constructor(source: string) {
    this.source = source;
    this.state = createInitialState('c');
    _sc = 0; _fc = 0; _cc = 0; _addrCounter = 0x1000;
  }

  execute(): ExecutionResult {
    // ── Compilation pipeline ─────────────────────────────────────────────────
    const pipeline: Array<[string, string]> = [
      ['source', 'C source code loaded.'],
      ['preprocessor', 'Preprocessor: expanding #include, #define macros.'],
      ['compiler', 'Compiler: translating C source to intermediate representation.'],
      ['assembly', 'Assembly: generating assembly instructions from C code.'],
      ['object_code', 'Object Code: assembler produces relocatable machine code.'],
      ['linker', 'Linker: resolving symbols and linking object files.'],
      ['executable', 'Executable: final binary ready for execution.'],
      ['runtime', 'Runtime: program loaded into memory — stack and heap initialized.'],
    ];
    for (const [stage, desc] of pipeline) {
      this.state.compilationStage = stage;
      this.emit('COMPILATION_PIPELINE', 1, desc, { stage });
    }

    let ast: CProgram;
    try {
      const tokens = cTokenize(this.source);
      const parser = new CParser(tokens);
      ast = parser.parse();
    } catch (e: unknown) {
      return {
        steps: this.steps,
        totalSteps: this.steps.length,
        finalState: cloneState(this.state),
        hasError: true,
        parseError: (e as Error).message,
        language: 'c',
      };
    }

    // Register all function declarations
    for (const node of ast.body) {
      if (node.type === 'FuncDecl') this.functions.set((node as CFuncDecl).name, node as CFuncDecl);
    }

    this.emit('PROGRAM_START', 1, 'C program begins. Entering main().', {});

    try {
      const mainFn = this.functions.get('main');
      if (mainFn) {
        this.callFunction(mainFn, [], 1);
      } else {
        // no main — execute top-level statements as a script
        this.execBlock(ast.body as CStmt[], 'global');
      }
      this.state.executionStatus = 'completed';
      this.emit('PROGRAM_END', 0, 'C program execution complete.', {});
    } catch (e) {
      if (!(e instanceof ReturnSignal)) {
        const err = e as Error;
        const line = this.state.currentLine;
        this.state.error = { type: 'RuntimeError', message: err.message, line };
        this.state.executionStatus = 'error';
        this.emit('ERROR', line, `RuntimeError: ${err.message}`, {});
      }
    }

    const finalState = cloneState(this.state);
    finalState.currentStep = this.steps.length;
    return { steps: this.steps, totalSteps: this.steps.length, finalState, hasError: !!this.state.error, language: 'c' };
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

  private declareVar(name: string, ctype: string, value: RuntimeValue, scopeId: string, isPointer = false, line = 0) {
    const scope = this.getScope(scopeId);
    if (!scope) return;
    const addr = freshAddr();
    scope.variables.push({ name, value, kind: 'local', state: 'initialized', scopeId, type: ctype, address: addr, isPointer, changedAtStep: this.steps.length });
    // Also push to stack visualization
    this.state.stack.push({ address: addr, value, type: ctype, label: name });
    this.emit('STACK_ALLOCATE', line, `Stack: allocate "${name}" (${ctype}) at ${addr} = ${cDisplay(value)}`, { name, ctype, address: addr, value });
  }

  private assignVar(name: string, value: RuntimeValue, scopeId: string, line: number) {
    let sid: string | null = scopeId;
    while (sid) {
      const scope = this.getScope(sid);
      if (!scope) break;
      const v = scope.variables.find(v => v.name === name);
      if (v) {
        const old = v.value;
        v.value = value;
        v.changedAtStep = this.steps.length;
        // update stack cell
        const cell = this.state.stack.find(c => c.address === v.address);
        if (cell) cell.value = value;
        this.emit('ASSIGN_VARIABLE', line,
          `${name} = ${cDisplay(value)} (was ${cDisplay(old)})`,
          { name, oldValue: old, newValue: value });
        return;
      }
      sid = scope.parentId;
    }
    throw new Error(`Undeclared variable: ${name}`);
  }

  // ── Block executor ────────────────────────────────────────────────────────
  private execBlock(stmts: CStmt[], scopeId: string) {
    for (const stmt of stmts) this.execStmt(stmt, scopeId);
  }

  private execStmt(stmt: CStmt, scopeId: string) {
    if (this.steps.length >= CODEFLOW_LIMITS.MAX_STEPS) throw new Error('INFINITE_LOOP');
    const line = stmt.line;

    switch (stmt.type) {
      case 'VarDecl': {
        const value = stmt.init ? this.evalExpr(stmt.init, scopeId) : (stmt.isPointer ? null : 0);
        this.declareVar(stmt.name, stmt.ctype, value, scopeId, stmt.isPointer, line);
        this.emit('DECLARE_VARIABLE', line,
          `${stmt.ctype}${stmt.isPointer ? ' *' : ''} ${stmt.name} = ${cDisplay(value)}`,
          { name: stmt.name, ctype: stmt.ctype, value, isPointer: stmt.isPointer });
        break;
      }

      case 'FuncDecl':
        this.functions.set(stmt.name, stmt);
        break;

      case 'If': {
        const cond = this.evalExpr(stmt.test, scopeId);
        const result = Boolean(cond);
        this.emit('EVALUATE_CONDITION', line,
          `if (${this.cExprText(stmt.test)}) → ${result ? 'TRUE' : 'FALSE'}`,
          { result });
        const branchScopeId = fScope();
        this.state.scopes.push({ id: branchScopeId, type: 'block', name: 'if', parentId: scopeId, variables: [] });
        try {
          if (result) this.execBlock(stmt.then as CStmt[], branchScopeId);
          else this.execBlock(stmt.else_ as CStmt[], branchScopeId);
        } finally {
          this.state.scopes = this.state.scopes.filter(s => s.id !== branchScopeId);
          this.cleanStackForScope(branchScopeId);
        }
        break;
      }

      case 'While': {
        let iter = 0;
        this.emit('LOOP_START', line, 'while loop begins.', { loopType: 'while' });
        while (true) {
          const cond = this.evalExpr(stmt.test, scopeId);
          const result = Boolean(cond);
          this.emit('LOOP_ITERATION', line,
            `while (${this.cExprText(stmt.test)}) → ${result ? 'TRUE — enter body' : 'FALSE — exit loop'}`,
            { iteration: iter, conditionResult: result });
          if (!result) break;
          const loopScope = fScope();
          this.state.scopes.push({ id: loopScope, type: 'block', name: 'while_body', parentId: scopeId, variables: [] });
          try { this.execBlock(stmt.body as CStmt[], loopScope); }
          catch (e) {
            if (e instanceof BreakSignal) { this.emit('BREAK_STATEMENT', line, 'break — exit loop', {}); break; }
            if (e instanceof ContinueSignal) { this.emit('CONTINUE_STATEMENT', line, 'continue', {}); iter++; continue; }
            throw e;
          } finally {
            this.state.scopes = this.state.scopes.filter(s => s.id !== loopScope);
            this.cleanStackForScope(loopScope);
          }
          iter++;
        }
        this.emit('LOOP_END', line, 'while loop finished.', { loopType: 'while' });
        break;
      }

      case 'For': {
        const forScopeId = fScope();
        this.state.scopes.push({ id: forScopeId, type: 'block', name: 'for', parentId: scopeId, variables: [] });
        try {
          if (stmt.init) this.execStmt(stmt.init as CStmt, forScopeId);
          let iter = 0;
          this.emit('LOOP_START', line, 'for loop begins.', { loopType: 'for' });
          while (true) {
            if (stmt.test) {
              const cond = this.evalExpr(stmt.test, forScopeId);
              const result = Boolean(cond);
              this.emit('LOOP_ITERATION', line,
                `for condition: ${this.cExprText(stmt.test)} → ${result ? 'TRUE' : 'FALSE — exit loop'}`,
                { iteration: iter, conditionResult: result });
              if (!result) break;
            }
            const bodyScope = fScope();
            this.state.scopes.push({ id: bodyScope, type: 'block', name: 'for_body', parentId: forScopeId, variables: [] });
            try { this.execBlock(stmt.body as CStmt[], bodyScope); }
            catch (e) {
              if (e instanceof BreakSignal) { break; }
              if (e instanceof ContinueSignal) { /* fall through to update */ }
              else throw e;
            } finally {
              this.state.scopes = this.state.scopes.filter(s => s.id !== bodyScope);
              this.cleanStackForScope(bodyScope);
            }
            if (stmt.update) this.evalExpr(stmt.update, forScopeId);
            iter++;
          }
          this.emit('LOOP_END', line, 'for loop finished.', { loopType: 'for' });
        } finally {
          this.state.scopes = this.state.scopes.filter(s => s.id !== forScopeId);
          this.cleanStackForScope(forScopeId);
        }
        break;
      }

      case 'Return': {
        const val = stmt.value ? this.evalExpr(stmt.value, scopeId) : undefined;
        this.emit('RETURN_VALUE', line, `return ${cDisplay(val)}`, { value: val });
        throw new ReturnSignal(val ?? null);
      }

      case 'Break': throw new BreakSignal();
      case 'Continue': throw new ContinueSignal();

      case 'Printf': {
        const argVals = stmt.args.map(a => this.evalExpr(a, scopeId));
        const text = formatPrintf(stmt.format, argVals);
        this.state.consoleOutput.push({ id: fCon(), value: text, line, stepIndex: this.steps.length });
        this.emit('CONSOLE_OUTPUT', line, `printf: "${text}"`, { value: text, format: stmt.format });
        break;
      }

      case 'ExprStmt':
        this.evalExpr(stmt.expr, scopeId);
        break;

      case 'Block': {
        const bScope = fScope();
        this.state.scopes.push({ id: bScope, type: 'block', name: 'block', parentId: scopeId, variables: [] });
        try { this.execBlock(stmt.body as CStmt[], bScope); }
        finally {
          this.state.scopes = this.state.scopes.filter(s => s.id !== bScope);
          this.cleanStackForScope(bScope);
        }
        break;
      }
    }
  }

  private cleanStackForScope(scopeId: string) {
    const scope = this.state.scopes.find(s => s.id === scopeId);
    if (!scope) return;
    const addrs = new Set(scope.variables.map(v => v.address));
    this.state.stack = this.state.stack.filter(c => !addrs.has(c.address));
  }

  // ── Expression evaluator ──────────────────────────────────────────────────
  private evalExpr(expr: CExpr, scopeId: string): RuntimeValue {
    const line = expr.line;

    switch (expr.type) {
      case 'Num': return expr.value;
      case 'Str': return expr.value;
      case 'Char': return expr.value.charCodeAt(0);

      case 'Name': {
        if (expr.id === 'NULL') return null;
        if (expr.id === 'true') return 1;
        if (expr.id === 'false') return 0;
        const v = this.lookupVar(expr.id, scopeId);
        return v?.value ?? 0;
      }

      case 'BinOp': {
        const l = this.evalExpr(expr.left, scopeId) as number;
        const r = this.evalExpr(expr.right, scopeId) as number;
        switch (expr.op) {
          case '+': return l + r;
          case '-': return l - r;
          case '*': return l * r;
          case '/': if (r === 0) throw new Error('Division by zero'); return Math.trunc(l / r);
          case '%': return l % r;
          case '<': return l < r ? 1 : 0;
          case '>': return l > r ? 1 : 0;
          case '<=': return l <= r ? 1 : 0;
          case '>=': return l >= r ? 1 : 0;
          case '==': return l === r ? 1 : 0;
          case '!=': return l !== r ? 1 : 0;
          case '&&': return (l && r) ? 1 : 0;
          case '||': return (l || r) ? 1 : 0;
          case '&': return l & r;
          case '|': return l | r;
          case '^': return l ^ r;
          case '<<': return l << r;
          case '>>': return l >> r;
          default: return 0;
        }
      }

      case 'UnaryOp': {
        const val = this.evalExpr(expr.operand, scopeId) as number;
        switch (expr.op) {
          case '-': return -val;
          case '+': return +val;
          case '!': return val ? 0 : 1;
          case '~': return ~val;
          case 'pre++': {
            const name = (expr.operand as any).id;
            if (name) this.assignVar(name, val + 1, scopeId, line);
            return val + 1;
          }
          case 'pre--': {
            const name = (expr.operand as any).id;
            if (name) this.assignVar(name, val - 1, scopeId, line);
            return val - 1;
          }
          case 'post++': {
            const name = (expr.operand as any).id;
            if (name) this.assignVar(name, val + 1, scopeId, line);
            return val;
          }
          case 'post--': {
            const name = (expr.operand as any).id;
            if (name) this.assignVar(name, val - 1, scopeId, line);
            return val;
          }
          default: return val;
        }
      }

      case 'Assign': {
        let rhs = this.evalExpr(expr.value, scopeId) as number;
        const existing = this.lookupVar(expr.target, scopeId);
        if (existing && expr.op !== '=') {
          const old = existing.value as number;
          switch (expr.op) {
            case '+=': rhs = old + rhs; break;
            case '-=': rhs = old - rhs; break;
            case '*=': rhs = old * rhs; break;
            case '/=': rhs = Math.trunc(old / rhs); break;
            case '%=': rhs = old % rhs; break;
          }
        }
        if (existing) this.assignVar(expr.target, rhs, scopeId, line);
        return rhs;
      }

      case 'AddressOf': {
        const v = this.lookupVar(expr.name, scopeId);
        const addr = v?.address ?? freshAddr();
        this.emit('POINTER_REFERENCE', line, `&${expr.name} = ${addr}`, { name: expr.name, address: addr });
        return addr;
      }

      case 'Deref': {
        const ptr = this.evalExpr(expr.expr, scopeId);
        this.emit('POINTER_DEREFERENCE', line, `*ptr = dereference ${ptr}`, { pointer: ptr });
        // find the var at that address
        for (const scope of this.state.scopes) {
          const v = scope.variables.find(v => v.address === ptr);
          if (v) return v.value;
        }
        return 0;
      }

      case 'Cast': return this.evalExpr(expr.expr, scopeId);

      case 'Index': {
        const v = this.lookupVar(expr.array, scopeId);
        const idx = this.evalExpr(expr.index, scopeId) as number;
        if ((v?.value as any)?.__type === 'array') return (v!.value as any).elements[idx];
        return 0;
      }

      case 'Ternary': {
        const cond = this.evalExpr(expr.test, scopeId);
        return Boolean(cond) ? this.evalExpr(expr.then, scopeId) : this.evalExpr(expr.else_, scopeId);
      }

      case 'Call': {
        const argVals = expr.args.map(a => this.evalExpr(a, scopeId));
        // built-ins
        if (expr.name === 'printf' || expr.name === 'puts') {
          const text = expr.name === 'puts' ? String(argVals[0]) : formatPrintf(String(argVals[0] ?? ''), argVals.slice(1));
          this.state.consoleOutput.push({ id: fCon(), value: text, line, stepIndex: this.steps.length });
          this.emit('CONSOLE_OUTPUT', line, `${expr.name}: "${text}"`, { value: text });
          return 0;
        }
        if (expr.name === 'scanf') return 0;
        if (expr.name === 'malloc' || expr.name === 'calloc') {
          const addr = freshAddr();
          const size = argVals[0] as number;
          this.state.heap.push({ id: addr, address: addr, type: 'heap', fields: {}, label: `malloc(${size})` });
          this.emit('HEAP_ALLOCATE', line, `malloc(${size}) → ${addr}`, { address: addr, size });
          return addr;
        }
        if (expr.name === 'free') {
          const addr = String(argVals[0]);
          const obj = this.state.heap.find(h => h.address === addr);
          if (obj) { obj.isGarbageCollected = true; }
          this.emit('HEAP_FREE', line, `free(${addr})`, { address: addr });
          return 0;
        }
        if (expr.name === 'abs') return Math.abs(argVals[0] as number);
        if (expr.name === 'sqrt') return Math.sqrt(argVals[0] as number);
        if (expr.name === 'pow') return Math.pow(argVals[0] as number, argVals[1] as number);
        if (expr.name === 'strlen') return String(argVals[0] ?? '').length;
        if (expr.name === 'sizeof') return 4;

        const fn = this.functions.get(expr.name);
        if (!fn) return 0;
        return this.callFunction(fn, argVals, line);
      }

      case 'Member': {
        const v = this.lookupVar(expr.object, scopeId);
        if ((v?.value as any)?.__type === 'object') return (v!.value as any).properties[expr.field];
        return 0;
      }

      default: return 0;
    }
  }

  private callFunction(fn: CFuncDecl, argVals: RuntimeValue[], callLine: number): RuntimeValue {
    const fnScopeId = fScope();
    const fnScope: Scope = { id: fnScopeId, type: 'function', name: fn.name, parentId: 'global', variables: [] };
    this.state.scopes.push(fnScope);

    // Bind params
    for (let i = 0; i < fn.params.length; i++) {
      const p = fn.params[i]!;
      const addr = freshAddr();
      fnScope.variables.push({ name: p.name, value: argVals[i] ?? 0, kind: 'local', state: 'initialized', scopeId: fnScopeId, type: p.ctype, address: addr, isPointer: p.isPointer });
      this.state.stack.push({ address: addr, value: argVals[i] ?? 0, type: p.ctype, label: p.name });
    }

    const frameId = fFrame();
    const frame: CallFrame = { id: frameId, functionName: fn.name, line: callLine, scopeId: fnScopeId };
    this.state.callStack.push(frame);

    const paramDesc = fn.params.map((p, i) => `${p.name}=${cDisplay(argVals[i] ?? 0)}`).join(', ');
    this.emit('PUSH_CALL_STACK', callLine, `Function "${fn.name}" called (${paramDesc}) — new stack frame`, { frame });
    this.emit('ENTER_FUNCTION', callLine, `Entering ${fn.name}(${paramDesc})`, { functionName: fn.name, args: argVals });

    let returnValue: RuntimeValue = 0;
    try {
      this.execBlock(fn.body as CStmt[], fnScopeId);
    } catch (e) {
      if (e instanceof ReturnSignal) returnValue = e.value;
      else {
        this.state.callStack = this.state.callStack.filter(f => f.id !== frameId);
        this.state.scopes = this.state.scopes.filter(s => s.id !== fnScopeId);
        this.cleanStackForScope(fnScopeId);
        throw e;
      }
    }

    this.emit('EXIT_FUNCTION', callLine, `${fn.name} returns ${cDisplay(returnValue)} — frame popped`, { functionName: fn.name, returnValue });
    this.state.callStack = this.state.callStack.filter(f => f.id !== frameId);
    this.state.scopes = this.state.scopes.filter(s => s.id !== fnScopeId);
    this.cleanStackForScope(fnScopeId);
    this.emit('POP_CALL_STACK', callLine, `"${fn.name}" stack frame removed`, { functionName: fn.name });

    return returnValue;
  }

  private cExprText(expr: CExpr): string {
    switch (expr.type) {
      case 'Num': return String(expr.value);
      case 'Name': return expr.id;
      case 'BinOp': return `${this.cExprText(expr.left)} ${expr.op} ${this.cExprText(expr.right)}`;
      case 'UnaryOp': return `${expr.op}${this.cExprText(expr.operand)}`;
      default: return '(expr)';
    }
  }
}
