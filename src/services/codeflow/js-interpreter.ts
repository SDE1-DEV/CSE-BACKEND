/**
 * CODEFLOW — JavaScript AST Interpreter
 * PRD-2: Implements LanguageEngine interface
 *
 * Architecture:
 *   Source → acorn parser → AST → interpreter → ExecutionEvents → steps[]
 *
 * Rules:
 *  - Never eval() user code
 *  - One step = one meaningful execution event
 *  - Every step stores the full immutable state snapshot
 *  - Hoisting is shown as a separate CREATION_PHASE before EXECUTION_PHASE
 *  - Call stack frames appear/disappear per spec
 *  - Async: setTimeout → WebAPIs → Task Queue → Event Loop → Call Stack
 *  - let/const show TDZ
 */

import * as acorn from 'acorn';
import type { Node } from 'acorn';
import {
  RuntimeState,
  RuntimeValue,
  ExecutionStep,
  ExecutionEvent,
  ExecutionResult,
  Variable,
  VariableKind,
  Scope,
  CallFrame,
  WebApiEntry,
  QueueEntry,
  ConsoleEntry,
  RuntimeObject,
  RuntimeArray,
  RuntimeFunction,
  LanguageEngine,
} from './types';
import { createInitialState, cloneState } from './runtime-state.factory';
import { CODEFLOW_LIMITS } from '../../constants/codeflow.constants';

// ── Helpers ───────────────────────────────────────────────────────────────────
let _stepCounter = 0;
let _consoleCounter = 0;
let _scopeCounter = 0;
let _frameCounter = 0;
let _timerCounter = 0;
let _queueCounter = 0;

function freshScopeId() { return `scope-${++_scopeCounter}`; }
function freshFrameId() { return `frame-${++_frameCounter}`; }
function freshTimerId() { return `timer-${++_timerCounter}`; }
function freshQueueId() { return `queue-${++_queueCounter}`; }
function freshConsoleId() { return `con-${++_consoleCounter}`; }

function displayValue(v: RuntimeValue, depth = 0): string {
  if (depth > 2) return '...';
  if (v === null) return 'null';
  if (v === undefined) return 'undefined';
  if (typeof v === 'string') return `"${v}"`;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  const obj = v as RuntimeObject | RuntimeArray | RuntimeFunction;
  if (obj.__type === 'function') return `ƒ ${(obj as RuntimeFunction).name}()`;
  if (obj.__type === 'array') {
    const arr = obj as RuntimeArray;
    const items = arr.elements.slice(0, 5).map((e) => displayValue(e, depth + 1));
    return `[${items.join(', ')}${arr.elements.length > 5 ? ', ...' : ''}]`;
  }
  if (obj.__type === 'object') {
    const o = obj as RuntimeObject;
    const keys = Object.keys(o.properties).slice(0, 3);
    const pairs = keys.map((k) => `${k}: ${displayValue(o.properties[k], depth + 1)}`);
    return `{${pairs.join(', ')}${Object.keys(o.properties).length > 3 ? ', ...' : ''}}`;
  }
  return String(v);
}

// ── Return / Break / Continue signals ────────────────────────────────────────
class ReturnSignal { constructor(public value: RuntimeValue) {} }
class BreakSignal {}
class ContinueSignal {}

// ── Main Interpreter class ────────────────────────────────────────────────────
export class JsInterpreter implements LanguageEngine {
  readonly language = 'javascript' as const;
  private steps: ExecutionStep[] = [];
  private state: RuntimeState;
  private source: string;

  // Pending async callbacks (setTimeout / Promise.then)
  private pendingTimers: Array<{
    id: string;
    label: string;
    delay: number;
    callback: () => void;
  }> = [];
  private pendingMicrotasks: Array<{ id: string; label: string; fn: () => void }> = [];
  private pendingMacrotasks: Array<{ id: string; label: string; fn: () => void }> = [];

  constructor(source: string) {
    this.source = source;
    this.state = createInitialState('javascript');
    _stepCounter = 0;
    _consoleCounter = 0;
    _scopeCounter = 0;
    _frameCounter = 0;
    _timerCounter = 0;
    _queueCounter = 0;
  }

  // ── Public entry point ──────────────────────────────────────────────────────
  execute(): ExecutionResult {
    let ast: acorn.Program;
    try {
      ast = acorn.parse(this.source, {
        ecmaVersion: 2020,
        sourceType: 'script',
        locations: true,
      });
    } catch (e: unknown) {
      const msg = (e as Error).message ?? 'Syntax error';
      return {
        steps: [],
        totalSteps: 0,
        finalState: createInitialState('javascript'),
        hasError: true,
        parseError: msg,
        language: 'javascript',
      };
    }

    // Emit PROGRAM_START
    this.emit('PROGRAM_START', 1, 'Program starts executing.', {});

    try {
      // --- CREATION PHASE: hoisting (PRD §8) ---
      this.runCreationPhase(ast.body as Node[]);

      // --- EXECUTION PHASE ---
      this.emit('EXECUTION_PHASE', 1, 'Execution phase begins. Running statements top-to-bottom.', {});
      this.runStatements(ast.body as Node[], 'global');

      // --- Drain async queues (Event Loop — PRD §13/14/15/16) ---
      this.drainEventLoop();

      this.state.executionStatus = 'completed';
      this.emit('PROGRAM_END', 0, 'Program execution complete.', {});
    } catch (e: unknown) {
      if (e instanceof ReturnSignal || e instanceof BreakSignal || e instanceof ContinueSignal) {
        // top-level return/break — treat as end
        this.state.executionStatus = 'completed';
      } else {
        const err = e as Error;
        const line = this.state.currentLine;
        this.state.error = { type: err.name || 'Error', message: err.message, line };
        this.state.executionStatus = 'error';
        this.emit('ERROR', line,
          `${err.name || 'Error'}: ${err.message}`,
          { errorType: err.name || 'Error', message: err.message, line },
        );
      }
    }

    const finalState = cloneState(this.state);
    finalState.currentStep = this.steps.length;

    return {
      steps: this.steps,
      totalSteps: this.steps.length,
      finalState,
      hasError: !!this.state.error,
      language: 'javascript',
    };
  }

  // ── Emit a step ─────────────────────────────────────────────────────────────
  private emit(
    type: ExecutionEvent['type'],
    line: number,
    description: string,
    detail: Record<string, unknown>,
  ): void {
    if (this.steps.length >= CODEFLOW_LIMITS.MAX_STEPS) {
      throw new Error('INFINITE_LOOP: Maximum step count reached.');
    }
    const idx = this.steps.length;
    this.state.currentLine = line;
    this.state.currentStep = idx;
    const event: ExecutionEvent = { type, line, description, detail };
    this.state.explanation = description;
    this.steps.push({ index: idx, event, state: cloneState(this.state) });
  }

  // ── Scope helpers ────────────────────────────────────────────────────────────
  private currentScopeId(): string {
    const frame = this.state.callStack[this.state.callStack.length - 1];
    return frame?.scopeId ?? 'global';
  }

  private getScope(id: string): Scope | undefined {
    return this.state.scopes.find((s) => s.id === id);
  }

  private lookupVar(name: string, scopeId: string): Variable | undefined {
    let sid: string | null = scopeId;
    while (sid) {
      const scope = this.getScope(sid);
      if (!scope) break;
      const v = scope.variables.find((v) => v.name === name);
      if (v) return v;
      sid = scope.parentId;
    }
    return undefined;
  }

  private declareVar(
    name: string,
    kind: VariableKind,
    value: RuntimeValue,
    state: 'hoisted_undefined' | 'tdz' | 'initialized',
    scopeId: string,
    _line: number,
  ): void {
    const scope = this.getScope(scopeId);
    if (!scope) return;
    // Remove existing declaration in same scope (re-declaration via var)
    scope.variables = scope.variables.filter((v) => v.name !== name);
    scope.variables.push({ name, value, kind, state, scopeId, changedAtStep: this.steps.length });
  }

  private assignVar(name: string, value: RuntimeValue, scopeId: string, line: number): void {
    let sid: string | null = scopeId;
    while (sid) {
      const scope = this.getScope(sid);
      if (!scope) break;
      const v = scope.variables.find((v_) => v_.name === name);
      if (v) {
        const old = v.value;
        if (v.kind === 'const' && v.state === 'initialized') {
          throw new TypeError(`Assignment to constant variable.`);
        }
        v.value = value;
        v.state = 'initialized';
        v.changedAtStep = this.steps.length;
        this.emit('ASSIGN_VARIABLE', line,
          `Variable "${name}" updated: ${displayValue(old)} → ${displayValue(value)}`,
          { name, oldValue: old, newValue: value, scopeId: sid },
        );
        return;
      }
      sid = scope.parentId;
    }
    throw new ReferenceError(`${name} is not defined`);
  }

  // ── Creation Phase / Hoisting (PRD §8) ──────────────────────────────────────
  private runCreationPhase(body: Node[]): void {
    const declarations: Array<{ name: string; kind: VariableKind }> = [];

    for (const node of body) {
      if (node.type === 'VariableDeclaration') {
        const decl = node as any;
        for (const d of decl.declarations) {
          const kind = decl.kind as VariableKind;
          if (d.id?.type === 'Identifier') {
            declarations.push({ name: d.id.name, kind });
          }
        }
      } else if (node.type === 'FunctionDeclaration') {
        const fd = node as any;
        if (fd.id?.name) {
          declarations.push({ name: fd.id.name, kind: 'var' });
        }
      }
    }

    if (declarations.length === 0) return;

    // Show creation phase
    this.emit('CREATION_PHASE', 1,
      'Creation phase: JavaScript engine scans for declarations before executing any code.',
      { declarations },
    );

    for (const { name, kind } of declarations) {
      let initVal: RuntimeValue;
      let state: Variable['state'];
      if (kind === 'var') {
        initVal = undefined;
        state = 'hoisted_undefined';
      } else {
        // let / const — TDZ
        initVal = undefined;
        state = 'tdz';
      }
      this.declareVar(name, kind, initVal, state, 'global', 1);
      const desc = kind === 'var'
        ? `Hoisting: var "${name}" → undefined (var is hoisted and initialized to undefined)`
        : `Hoisting: ${kind} "${name}" → <TDZ> (let/const exists but is in the Temporal Dead Zone)`;
      this.emit('HOISTING', 1, desc, { name, kind, initialValue: initVal, state });
    }
  }

  // ── Statement runner ─────────────────────────────────────────────────────────
  private runStatements(nodes: Node[], scopeId: string): void {
    for (const node of nodes) {
      this.runNode(node, scopeId);
    }
  }

  private runNode(node: Node, scopeId: string): RuntimeValue {
    if (this.steps.length >= CODEFLOW_LIMITS.MAX_STEPS) {
      throw new Error('INFINITE_LOOP: Maximum step count reached.');
    }

    const n = node as any;
    const line: number = n.loc?.start?.line ?? this.state.currentLine;

    switch (n.type) {
      // ── Variable declarations ──────────────────────────────────────────────
      case 'VariableDeclaration': {
        const kind = n.kind as VariableKind;
        for (const declarator of n.declarations) {
          if (declarator.id?.type === 'Identifier') {
            const name: string = declarator.id.name;
            let value: RuntimeValue = undefined;
            if (declarator.init) {
              value = this.evalExpr(declarator.init, scopeId);
            }
            // For let/const that are in TDZ from creation phase, now initialize
            const existing = this.lookupVar(name, scopeId);
            if (existing) {
              existing.value = value;
              existing.state = 'initialized';
              existing.changedAtStep = this.steps.length;
            } else {
              this.declareVar(name, kind, value, 'initialized', scopeId, line);
            }
            this.emit('DECLARE_VARIABLE', line,
              `${kind} ${name} = ${displayValue(value)}`,
              { name, kind, value, scopeId },
            );
          }
        }
        return undefined;
      }

      // ── Expression statement ───────────────────────────────────────────────
      case 'ExpressionStatement':
        return this.evalExpr(n.expression, scopeId);

      // ── Block ──────────────────────────────────────────────────────────────
      case 'BlockStatement': {
        const blockScopeId = freshScopeId();
        const blockScope: Scope = {
          id: blockScopeId,
          type: 'block',
          name: 'Block',
          parentId: scopeId,
          variables: [],
        };
        this.state.scopes.push(blockScope);
        try {
          this.runStatements(n.body, blockScopeId);
        } finally {
          this.state.scopes = this.state.scopes.filter((s) => s.id !== blockScopeId);
        }
        return undefined;
      }

      // ── Function declaration ───────────────────────────────────────────────
      case 'FunctionDeclaration': {
        const fnName: string = n.id?.name ?? '(anonymous)';
        const params: string[] = n.params.map((p: any) => p.name ?? '?');
        const fnVal: RuntimeFunction = { __type: 'function', name: fnName, params, bodyRef: n.start };
        this.declareVar(fnName, 'var', fnVal, 'initialized', scopeId, line);
        this.emit('DECLARE_VARIABLE', line,
          `Function "${fnName}" declared with params (${params.join(', ')})`,
          { name: fnName, kind: 'var', value: fnVal, scopeId },
        );
        // Store AST node for later calls
        (this as any)[`__fn_${n.start}`] = n;
        return undefined;
      }

      // ── Return ─────────────────────────────────────────────────────────────
      case 'ReturnStatement': {
        const retVal = n.argument ? this.evalExpr(n.argument, scopeId) : undefined;
        this.emit('RETURN_VALUE', line,
          `return ${displayValue(retVal)}`,
          { value: retVal },
        );
        throw new ReturnSignal(retVal);
      }

      // ── If / else ─────────────────────────────────────────────────────────
      case 'IfStatement': {
        const cond = this.evalExpr(n.test, scopeId);
        const result = Boolean(cond);
        const condText = this.nodeText(n.test);
        this.emit('EVALUATE_CONDITION', line,
          `if (${condText}) → ${result ? 'TRUE' : 'FALSE'}`,
          { expression: condText, result, context: 'if' },
        );
        if (result) {
          this.runNode(n.consequent, scopeId);
        } else if (n.alternate) {
          this.runNode(n.alternate, scopeId);
        }
        return undefined;
      }

      // ── While ─────────────────────────────────────────────────────────────
      case 'WhileStatement': {
        let iter = 0;
        this.emit('LOOP_START', line, 'while loop begins.', { loopType: 'while' });
        let jsWhileRunning = true;
        while (jsWhileRunning) {
          const cond = this.evalExpr(n.test, scopeId);
          const result = Boolean(cond);
          const condText = this.nodeText(n.test);
          this.emit('LOOP_ITERATION', line,
            `while (${condText}) → ${result ? 'TRUE — enter loop body' : 'FALSE — exit loop'}`,
            { loopType: 'while', iteration: iter, condition: condText, conditionResult: result },
          );
          if (!result) { jsWhileRunning = false; break; }
          try {
            this.runNode(n.body, scopeId);
          } catch (e) {
            if (e instanceof BreakSignal) { this.emit('BREAK_STATEMENT', line, 'break — exit loop', {}); jsWhileRunning = false; break; }
            if (e instanceof ContinueSignal) { this.emit('CONTINUE_STATEMENT', line, 'continue — next iteration', {}); iter++; continue; }
            throw e;
          }
          iter++;
        }
        this.emit('LOOP_END', line, 'while loop finished.', { loopType: 'while' });
        return undefined;
      }

      case 'DoWhileStatement': {
        let iter = 0;
        this.emit('LOOP_START', line, 'do...while loop begins.', { loopType: 'do_while' });
        let jsDoRunning = true;
        do {
          try {
            this.runNode(n.body, scopeId);
          } catch (e) {
            if (e instanceof BreakSignal) { jsDoRunning = false; break; }
            if (e instanceof ContinueSignal) { iter++; }
            else throw e;
          }
          const cond = this.evalExpr(n.test, scopeId);
          const result = Boolean(cond);
          const condText = this.nodeText(n.test);
          this.emit('LOOP_ITERATION', line,
            `do...while (${condText}) → ${result ? 'TRUE — loop again' : 'FALSE — exit'}`,
            { loopType: 'do_while', iteration: iter, condition: condText, conditionResult: result },
          );
          iter++;
          if (!result) { jsDoRunning = false; break; }
        } while (jsDoRunning);
        this.emit('LOOP_END', line, 'do...while loop finished.', { loopType: 'do_while' });
        return undefined;
      }

      case 'ForStatement': {
        const forScopeId = freshScopeId();
        const forScope: Scope = { id: forScopeId, type: 'block', name: 'for', parentId: scopeId, variables: [] };
        this.state.scopes.push(forScope);
        try {
          if (n.init) this.runNode(n.init, forScopeId);
          let iter = 0;
          this.emit('LOOP_START', line, 'for loop begins.', { loopType: 'for' });
          let jsForRunning = true;
          while (jsForRunning) {
            if (n.test) {
              const cond = this.evalExpr(n.test, forScopeId);
              const result = Boolean(cond);
              const condText = this.nodeText(n.test);
              this.emit('LOOP_ITERATION', line,
                `for condition: ${condText} → ${result ? 'TRUE' : 'FALSE — exit loop'}`,
                { loopType: 'for', iteration: iter, condition: condText, conditionResult: result },
              );
              if (!result) { jsForRunning = false; break; }
            }
            try {
              this.runNode(n.body, forScopeId);
            } catch (e) {
              if (e instanceof BreakSignal) { jsForRunning = false; break; }
              if (e instanceof ContinueSignal) { /* fall through to update */ }
              else throw e;
            }
            if (n.update) this.evalExpr(n.update, forScopeId);
            iter++;
          }
          this.emit('LOOP_END', line, 'for loop finished.', { loopType: 'for' });
        } finally {
          this.state.scopes = this.state.scopes.filter((s) => s.id !== forScopeId);
        }
        return undefined;
      }

      // ── Break / Continue ──────────────────────────────────────────────────
      case 'BreakStatement':
        throw new BreakSignal();
      case 'ContinueStatement':
        throw new ContinueSignal();

      // ── Try/Catch ─────────────────────────────────────────────────────────
      case 'TryStatement': {
        try {
          this.runNode(n.block, scopeId);
        } catch (e) {
          if (e instanceof ReturnSignal || e instanceof BreakSignal || e instanceof ContinueSignal) throw e;
          if (n.handler) {
            const catchScopeId = freshScopeId();
            this.state.scopes.push({ id: catchScopeId, type: 'block', name: 'catch', parentId: scopeId, variables: [] });
            if (n.handler.param?.name) {
              const errVal = String((e as Error).message ?? e);
              this.declareVar(n.handler.param.name, 'let', errVal, 'initialized', catchScopeId, line);
            }
            try { this.runNode(n.handler.body, catchScopeId); }
            finally { this.state.scopes = this.state.scopes.filter((s) => s.id !== catchScopeId); }
          }
        } finally {
          if (n.finalizer) this.runNode(n.finalizer, scopeId);
        }
        return undefined;
      }

      // ── Throw ─────────────────────────────────────────────────────────────
      case 'ThrowStatement': {
        const val = this.evalExpr(n.argument, scopeId);
        throw new Error(typeof val === 'string' ? val : displayValue(val));
      }

      default:
        // For any statement type we haven't handled, try expression fallback
        if (n.expression) return this.evalExpr(n.expression, scopeId);
        return undefined;
    }
  }

  // ── Expression evaluator ─────────────────────────────────────────────────────
  private evalExpr(node: any, scopeId: string): RuntimeValue {
    if (!node) return undefined;
    const line: number = node.loc?.start?.line ?? this.state.currentLine;

    switch (node.type) {
      // ── Literals ──────────────────────────────────────────────────────────
      case 'Literal':
        return node.value as RuntimeValue;

      case 'TemplateLiteral': {
        let result = '';
        for (let i = 0; i < node.quasis.length; i++) {
          result += node.quasis[i].value.cooked;
          if (i < node.expressions.length) {
            result += displayValue(this.evalExpr(node.expressions[i], scopeId));
          }
        }
        return result;
      }

      // ── Identifier ────────────────────────────────────────────────────────
      case 'Identifier': {
        if (node.name === 'undefined') return undefined;
        if (node.name === 'null') return null;
        if (node.name === 'Infinity') return Infinity;
        if (node.name === 'NaN') return NaN;
        if (node.name === 'true') return true;
        if (node.name === 'false') return false;
        const v = this.lookupVar(node.name, scopeId);
        if (!v) throw new ReferenceError(`${node.name} is not defined`);
        if (v.state === 'tdz') throw new ReferenceError(`Cannot access '${node.name}' before initialization`);
        return v.value;
      }

      // ── Array ─────────────────────────────────────────────────────────────
      case 'ArrayExpression': {
        const elements: RuntimeValue[] = node.elements.map((el: any) =>
          el ? this.evalExpr(el, scopeId) : undefined,
        );
        return { __type: 'array', elements } as RuntimeArray;
      }

      // ── Object ────────────────────────────────────────────────────────────
      case 'ObjectExpression': {
        const properties: Record<string, RuntimeValue> = {};
        for (const prop of node.properties) {
          const key = prop.key?.name ?? prop.key?.value ?? '';
          properties[String(key)] = this.evalExpr(prop.value, scopeId);
        }
        return { __type: 'object', properties } as RuntimeObject;
      }

      // ── Unary ─────────────────────────────────────────────────────────────
      case 'UnaryExpression': {
        const arg = this.evalExpr(node.argument, scopeId);
        switch (node.operator) {
          case '-': return -(arg as number);
          case '+': return +(arg as number);
          case '!': return !arg;
          case 'typeof': return typeof arg;
          case 'void': return undefined;
          default: return undefined;
        }
      }

      // ── Binary ────────────────────────────────────────────────────────────
      case 'BinaryExpression': {
        const left = this.evalExpr(node.left, scopeId) as any;
        const right = this.evalExpr(node.right, scopeId) as any;
        switch (node.operator) {
          case '+': return left + right;
          case '-': return left - right;
          case '*': return left * right;
          case '/': return left / right;
          case '%': return left % right;
          case '**': return Math.pow(left, right);
          case '===': return left === right;
          case '!==': return left !== right;
          case '==': return left == right;   // eslint-disable-line eqeqeq
          case '!=': return left != right;   // eslint-disable-line eqeqeq
          case '<': return left < right;
          case '<=': return left <= right;
          case '>': return left > right;
          case '>=': return left >= right;
          case '&': return left & right;
          case '|': return left | right;
          case '^': return left ^ right;
          case '<<': return left << right;
          case '>>': return left >> right;
          case '>>>': return left >>> right;
          default: return undefined;
        }
      }

      // ── Logical ───────────────────────────────────────────────────────────
      case 'LogicalExpression': {
        const lv = this.evalExpr(node.left, scopeId);
        if (node.operator === '&&') return lv ? this.evalExpr(node.right, scopeId) : lv;
        if (node.operator === '||') return lv ? lv : this.evalExpr(node.right, scopeId);
        if (node.operator === '??') return lv ?? this.evalExpr(node.right, scopeId);
        return undefined;
      }

      // ── Assignment ────────────────────────────────────────────────────────
      case 'AssignmentExpression': {
        if (node.left.type === 'Identifier') {
          const name: string = node.left.name;
          let rhs = this.evalExpr(node.right, scopeId);
          const existing = this.lookupVar(name, scopeId);
          if (node.operator !== '=') {
            const old = existing?.value as any;
            const r = rhs as any;
            switch (node.operator) {
              case '+=': rhs = old + r; break;
              case '-=': rhs = old - r; break;
              case '*=': rhs = old * r; break;
              case '/=': rhs = old / r; break;
              case '%=': rhs = old % r; break;
              case '**=': rhs = Math.pow(old, r); break;
            }
          }
          if (existing) {
            this.assignVar(name, rhs, scopeId, line);
          } else {
            // implicit global
            this.declareVar(name, 'var', rhs, 'initialized', 'global', line);
            this.emit('DECLARE_VARIABLE', line,
              `var ${name} = ${displayValue(rhs)} (implicit global)`,
              { name, kind: 'var', value: rhs, scopeId: 'global' },
            );
          }
          return rhs;
        }
        if (node.left.type === 'MemberExpression') {
          const obj = this.evalExpr(node.left.object, scopeId) as RuntimeObject | RuntimeArray;
          const key = node.left.computed
            ? String(this.evalExpr(node.left.property, scopeId))
            : node.left.property.name;
          const rhs = this.evalExpr(node.right, scopeId);
          if (obj && (obj as RuntimeObject).__type === 'object') {
            (obj as RuntimeObject).properties[key] = rhs;
          } else if (obj && (obj as RuntimeArray).__type === 'array') {
            (obj as RuntimeArray).elements[Number(key)] = rhs;
          }
          this.emit('ASSIGN_VARIABLE', line, `${node.left.object.name ?? '?'}[${key}] = ${displayValue(rhs)}`, { key, value: rhs });
          return rhs;
        }
        return undefined;
      }

      // ── Update (i++ / i--) ────────────────────────────────────────────────
      case 'UpdateExpression': {
        if (node.argument.type === 'Identifier') {
          const name: string = node.argument.name;
          const v = this.lookupVar(name, scopeId);
          if (!v) throw new ReferenceError(`${name} is not defined`);
          const old = v.value as number;
          const next = node.operator === '++' ? old + 1 : old - 1;
          v.value = next;
          v.changedAtStep = this.steps.length;
          const prefix = node.prefix;
          this.emit('ASSIGN_VARIABLE', line,
            `${name}${node.operator} → ${name} = ${next}`,
            { name, oldValue: old, newValue: next, operator: node.operator },
          );
          return prefix ? next : old;
        }
        return undefined;
      }

      // ── Conditional (ternary) ─────────────────────────────────────────────
      case 'ConditionalExpression': {
        const test = this.evalExpr(node.test, scopeId);
        const result = Boolean(test);
        const testText = this.nodeText(node.test);
        this.emit('EVALUATE_CONDITION', line,
          `Ternary: ${testText} → ${result ? 'TRUE' : 'FALSE'}`,
          { expression: testText, result, context: 'ternary' },
        );
        return result
          ? this.evalExpr(node.consequent, scopeId)
          : this.evalExpr(node.alternate, scopeId);
      }

      // ── Call expression ───────────────────────────────────────────────────
      case 'CallExpression':
        return this.evalCall(node, scopeId, line);

      // ── Arrow / function expression ───────────────────────────────────────
      case 'ArrowFunctionExpression':
      case 'FunctionExpression': {
        const name = node.id?.name ?? '(anonymous)';
        const params: string[] = node.params.map((p: any) => p.name ?? '?');
        const fnVal: RuntimeFunction = { __type: 'function', name, params, bodyRef: node.start };
        (this as any)[`__fn_${node.start}`] = node;
        return fnVal;
      }

      // ── Member expression ─────────────────────────────────────────────────
      case 'MemberExpression': {
        const obj = this.evalExpr(node.object, scopeId);
        const prop = node.computed
          ? String(this.evalExpr(node.property, scopeId))
          : node.property.name;
        if (obj === null || obj === undefined) {
          throw new TypeError(`Cannot read properties of ${obj} (reading '${prop}')`);
        }
        if (typeof obj === 'string') {
          if (prop === 'length') return obj.length;
          const idx = Number(prop);
          if (!isNaN(idx)) return obj[idx];
          return undefined;
        }
        if ((obj as RuntimeArray).__type === 'array') {
          const arr = obj as RuntimeArray;
          if (prop === 'length') return arr.elements.length;
          return arr.elements[Number(prop)];
        }
        if ((obj as RuntimeObject).__type === 'object') {
          return (obj as RuntimeObject).properties[prop];
        }
        return undefined;
      }

      // ── Sequence ──────────────────────────────────────────────────────────
      case 'SequenceExpression': {
        let last: RuntimeValue = undefined;
        for (const expr of node.expressions) last = this.evalExpr(expr, scopeId);
        return last;
      }

      // ── Spread (treated as passthrough in isolation) ───────────────────────
      case 'SpreadElement':
        return this.evalExpr(node.argument, scopeId);

      default:
        return undefined;
    }
  }

  // ── Function call handler ────────────────────────────────────────────────────
  private evalCall(node: any, scopeId: string, line: number): RuntimeValue {
    // ---- console.log --------------------------------------------------------
    if (
      node.callee.type === 'MemberExpression' &&
      node.callee.object?.name === 'console' &&
      node.callee.property?.name === 'log'
    ) {
      const args = node.arguments.map((a: any) => this.evalExpr(a, scopeId));
      const text = args.map((a: RuntimeValue) => displayValue(a)).join(' ');
      const entry: ConsoleEntry = {
        id: freshConsoleId(),
        value: text,
        line,
        stepIndex: this.steps.length,
      };
      this.state.consoleOutput.push(entry);
      this.emit('CONSOLE_OUTPUT', line,
        `console.log(${text})  → Output: ${text}`,
        { value: text, args },
      );
      return undefined;
    }

    // ---- setTimeout ----------------------------------------------------------
    if (node.callee.type === 'Identifier' && node.callee.name === 'setTimeout') {
      const callbackArg = node.arguments[0];
      const delayArg = node.arguments[1] ? this.evalExpr(node.arguments[1], scopeId) : 0;
      const delay = typeof delayArg === 'number' ? delayArg : 0;
      const timerId = freshTimerId();

      const timerEntry: WebApiEntry = { id: timerId, label: `setTimeout(${delay}ms)`, type: 'setTimeout', delay };
      this.state.webApis.push(timerEntry);

      this.emit('REGISTER_TIMER', line,
        `setTimeout() registered in Web APIs — callback will run after ${delay}ms`,
        { timerId, delay, type: 'setTimeout' },
      );

      // Save callback AST for later execution
      const capturedScopeId = scopeId;
      this.pendingTimers.push({
        id: timerId,
        label: `setTimeout callback (${delay}ms)`,
        delay,
        callback: () => {
          // Move from WebAPIs → Task Queue
          this.state.webApis = this.state.webApis.filter((w) => w.id !== timerId);
          const qEntry: QueueEntry = { id: freshQueueId(), label: `setTimeout callback` };
          this.state.taskQueue.push(qEntry);
          this.emit('MOVE_TO_TASK_QUEUE', line,
            `setTimeout callback moved: Web APIs → Task Queue`,
            { timerId },
          );
          this.pendingMacrotasks.push({
            id: qEntry.id,
            label: qEntry.label,
            fn: () => {
              this.state.taskQueue = this.state.taskQueue.filter((q) => q.id !== qEntry.id);
              // Push callback frame
              const cbScopeId = freshScopeId();
              const cbScope: Scope = { id: cbScopeId, type: 'function', name: 'setTimeout callback', parentId: capturedScopeId, variables: [] };
              this.state.scopes.push(cbScope);
              const cbFrameId = freshFrameId();
              const cbFrame: CallFrame = { id: cbFrameId, functionName: 'setTimeout callback', line, scopeId: cbScopeId };
              this.state.callStack.push(cbFrame);
              this.emit('PUSH_CALL_STACK', line,
                `setTimeout callback pushed onto Call Stack`,
                { frame: cbFrame },
              );
              try {
                if (callbackArg) {
                  const cbNode = callbackArg;
                  const body = cbNode.body?.type === 'BlockStatement' ? cbNode.body.body : [cbNode.body];
                  this.runStatements(body, cbScopeId);
                }
              } catch (e) {
                if (!(e instanceof ReturnSignal)) throw e;
              } finally {
                this.state.callStack = this.state.callStack.filter((f) => f.id !== cbFrameId);
                this.state.scopes = this.state.scopes.filter((s) => s.id !== cbScopeId);
                this.emit('POP_CALL_STACK', line,
                  `setTimeout callback execution complete — frame removed`,
                  { functionName: 'setTimeout callback' },
                );
              }
            },
          });
        },
      });
      return timerId;
    }

    // ---- setInterval --------------------------------------------------------
    if (node.callee.type === 'Identifier' && node.callee.name === 'setInterval') {
      const delayArg = node.arguments[1] ? this.evalExpr(node.arguments[1], scopeId) : 1000;
      const delay = typeof delayArg === 'number' ? delayArg : 1000;
      const timerId = freshTimerId();
      const timerEntry: WebApiEntry = { id: timerId, label: `setInterval(${delay}ms)`, type: 'setInterval', delay };
      this.state.webApis.push(timerEntry);
      this.emit('REGISTER_TIMER', line,
        `setInterval() registered in Web APIs — interval: ${delay}ms`,
        { timerId, delay, type: 'setInterval' },
      );
      // For visualization we run it once (would loop forever otherwise)
      const capturedScopeId = scopeId;
      const callbackArg = node.arguments[0];
      this.pendingTimers.push({
        id: timerId, label: `setInterval callback (${delay}ms)`, delay,
        callback: () => {
          this.state.webApis = this.state.webApis.filter((w) => w.id !== timerId);
          const qEntry: QueueEntry = { id: freshQueueId(), label: 'setInterval callback' };
          this.state.taskQueue.push(qEntry);
          this.emit('MOVE_TO_TASK_QUEUE', line, `setInterval callback → Task Queue`, { timerId });
          this.pendingMacrotasks.push({
            id: qEntry.id, label: qEntry.label,
            fn: () => {
              this.state.taskQueue = this.state.taskQueue.filter((q) => q.id !== qEntry.id);
              const cbScopeId = freshScopeId();
              this.state.scopes.push({ id: cbScopeId, type: 'function', name: 'setInterval callback', parentId: capturedScopeId, variables: [] });
              const cbFrameId = freshFrameId();
              const cbFrame: CallFrame = { id: cbFrameId, functionName: 'setInterval callback', line, scopeId: cbScopeId };
              this.state.callStack.push(cbFrame);
              this.emit('PUSH_CALL_STACK', line, `setInterval callback on Call Stack`, { frame: cbFrame });
              try {
                if (callbackArg) {
                  const body = callbackArg.body?.type === 'BlockStatement' ? callbackArg.body.body : [callbackArg.body];
                  this.runStatements(body, cbScopeId);
                }
              } catch (e) { if (!(e instanceof ReturnSignal)) throw e; }
              finally {
                this.state.callStack = this.state.callStack.filter((f) => f.id !== cbFrameId);
                this.state.scopes = this.state.scopes.filter((s) => s.id !== cbScopeId);
                this.emit('POP_CALL_STACK', line, `setInterval callback complete`, { functionName: 'setInterval callback' });
              }
            },
          });
        },
      });
      return timerId;
    }

    // ---- Promise.resolve().then / Promise.reject() ---------------------------
    if (
      node.callee.type === 'MemberExpression' &&
      node.callee.object?.type === 'CallExpression' &&
      node.callee.object?.callee?.type === 'MemberExpression' &&
      node.callee.object?.callee?.object?.name === 'Promise'
    ) {
      const method: string = node.callee.object?.callee?.property?.name ?? '';
      const thenMethod: string = node.callee.property?.name ?? '';
      const resolved = method === 'resolve';
      const value = node.callee.object.arguments[0]
        ? this.evalExpr(node.callee.object.arguments[0], scopeId)
        : undefined;

      const promId = `prom-${++_timerCounter}`;
      this.emit('PROMISE_CREATED', line,
        `Promise.${method}(${displayValue(value)}) created`,
        { promiseId: promId, state: resolved ? 'resolved' : 'rejected', value },
      );

      if (thenMethod === 'then' || thenMethod === 'catch' || thenMethod === 'finally') {
        const callbackArg = node.arguments[0];
        const capturedScopeId = scopeId;
        if (callbackArg) {
          const qEntry: QueueEntry = { id: freshQueueId(), label: `Promise.${thenMethod} callback` };
          this.state.microtaskQueue.push(qEntry);
          this.emit('MOVE_TO_MICROTASK_QUEUE', line,
            `Promise.${thenMethod}() callback → Microtask Queue`,
            { promiseId: promId },
          );
          this.pendingMicrotasks.push({
            id: qEntry.id,
            label: qEntry.label,
            fn: () => {
              this.state.microtaskQueue = this.state.microtaskQueue.filter((q) => q.id !== qEntry.id);
              const cbScopeId = freshScopeId();
              this.state.scopes.push({ id: cbScopeId, type: 'function', name: `Promise.${thenMethod}`, parentId: capturedScopeId, variables: [] });
              const cbFrameId = freshFrameId();
              const cbFrame: CallFrame = { id: cbFrameId, functionName: `Promise.${thenMethod}`, line, scopeId: cbScopeId };
              this.state.callStack.push(cbFrame);
              this.emit('PUSH_CALL_STACK', line,
                `Promise.${thenMethod} callback pushed onto Call Stack`,
                { frame: cbFrame },
              );
              try {
                const body = callbackArg.body?.type === 'BlockStatement'
                  ? callbackArg.body.body
                  : [callbackArg.body ?? callbackArg];
                this.runStatements(body, cbScopeId);
              } catch (e) { if (!(e instanceof ReturnSignal)) throw e; }
              finally {
                this.state.callStack = this.state.callStack.filter((f) => f.id !== cbFrameId);
                this.state.scopes = this.state.scopes.filter((s) => s.id !== cbScopeId);
                this.emit('POP_CALL_STACK', line,
                  `Promise.${thenMethod} callback complete — frame removed`,
                  { functionName: `Promise.${thenMethod}` },
                );
              }
            },
          });
        }
      }
      return undefined;
    }

    // ---- User-defined function call ─────────────────────────────────────────
    const callee = node.callee;
    let fnVal: RuntimeValue;
    let fnName = '(anonymous)';

    if (callee.type === 'Identifier') {
      fnName = callee.name;
      fnVal = this.lookupVar(fnName, scopeId)?.value;
    } else if (callee.type === 'MemberExpression') {
      fnVal = this.evalExpr(callee, scopeId);
      fnName = callee.property?.name ?? '(method)';
    } else {
      fnVal = this.evalExpr(callee, scopeId);
    }

    if (!fnVal || (fnVal as RuntimeFunction).__type !== 'function') {
      throw new TypeError(`${fnName} is not a function`);
    }

    const fn = fnVal as RuntimeFunction;
    const fnNode: any = (this as any)[`__fn_${fn.bodyRef}`];
    if (!fnNode) {
      // Built-in or unresolvable — just return undefined
      return undefined;
    }

    // Evaluate arguments
    const argVals: RuntimeValue[] = node.arguments.map((a: any) => this.evalExpr(a, scopeId));
    const params: string[] = fnNode.params?.map((p: any) => p.name ?? '?') ?? [];

    // Create function scope
    const fnScopeId = freshScopeId();
    const fnScope: Scope = {
      id: fnScopeId,
      type: 'function',
      name: fn.name,
      parentId: 'global',  // lexical scope — simplified to global for PRD-1
      variables: [],
    };
    this.state.scopes.push(fnScope);

    // Bind params
    for (let i = 0; i < params.length; i++) {
      this.declareVar(params[i]!, 'let', argVals[i] ?? undefined, 'initialized', fnScopeId, line);
    }

    // Push call frame
    const frameId = freshFrameId();
    const frame: CallFrame = { id: frameId, functionName: fn.name, line, scopeId: fnScopeId };
    this.state.callStack.push(frame);

    const paramDesc = params.map((p, i) => `${p}=${displayValue(argVals[i])}`).join(', ');
    this.emit('PUSH_CALL_STACK', line,
      `Function "${fn.name}" called — new frame pushed onto Call Stack (${paramDesc})`,
      { frame, args: argVals },
    );
    this.emit('ENTER_FUNCTION', line,
      `Entering function "${fn.name}"(${paramDesc}) — new execution context created`,
      { functionName: fn.name, params: params.map((p, i) => ({ name: p, value: argVals[i] })), frameId },
    );

    let returnValue: RuntimeValue = undefined;
    try {
      const body = fnNode.body?.type === 'BlockStatement'
        ? fnNode.body.body
        : [{ type: 'ReturnStatement', argument: fnNode.body }];
      this.runStatements(body, fnScopeId);
    } catch (e) {
      if (e instanceof ReturnSignal) {
        returnValue = e.value;
      } else {
        // clean up before re-throw
        this.state.callStack = this.state.callStack.filter((f) => f.id !== frameId);
        this.state.scopes = this.state.scopes.filter((s) => s.id !== fnScopeId);
        throw e;
      }
    }

    this.emit('EXIT_FUNCTION', line,
      `Function "${fn.name}" returns ${displayValue(returnValue)} — frame removed from Call Stack`,
      { functionName: fn.name, returnValue, frameId },
    );

    // Pop call frame and scope
    this.state.callStack = this.state.callStack.filter((f) => f.id !== frameId);
    this.state.scopes = this.state.scopes.filter((s) => s.id !== fnScopeId);

    this.emit('POP_CALL_STACK', line,
      `"${fn.name}" frame popped — Call Stack returns to previous context`,
      { functionName: fn.name, returnValue },
    );

    return returnValue;
  }

  // ── Event Loop drain (PRD §13 / §14 / §15 / §16 / §17) ────────────────────
  private drainEventLoop(): void {
    if (this.pendingTimers.length === 0 && this.pendingMicrotasks.length === 0) return;

    // Fire all timers → move callbacks into queues
    for (const t of this.pendingTimers) {
      t.callback();
    }
    this.pendingTimers = [];

    // Now run: microtasks first, then macrotasks — repeating until all drained
    let safetyCounter = 0;
    while (
      this.pendingMicrotasks.length > 0 ||
      this.pendingMacrotasks.length > 0
    ) {
      if (++safetyCounter > 200) break;

      // Check call stack is empty
      const onlyGlobal = this.state.callStack.length === 1 &&
        this.state.callStack[0]?.functionName === 'Global';

      if (onlyGlobal) {
        this.state.eventLoopPhase = 'checking';
        this.emit('EVENT_LOOP_CHECK', 0,
          'Event Loop: Checking… Call Stack is empty.',
          { phase: 'checking' },
        );

        // Drain microtask queue first (PRD §16)
        if (this.pendingMicrotasks.length > 0) {
          this.state.eventLoopPhase = 'processing_microtasks';
          this.emit('EVENT_LOOP_CHECK', 0,
            'Event Loop: Call Stack empty → processing Microtask Queue first',
            { phase: 'processing_microtasks' },
          );
          while (this.pendingMicrotasks.length > 0) {
            const mt = this.pendingMicrotasks.shift()!;
            this.emit('PROCESS_MICROTASK', 0,
              `Microtask "${mt.label}" moved from Microtask Queue → Call Stack`,
              { id: mt.id, label: mt.label },
            );
            mt.fn();
          }
        }

        // Then one macrotask (PRD §16)
        if (this.pendingMacrotasks.length > 0) {
          this.state.eventLoopPhase = 'processing_tasks';
          this.emit('EVENT_LOOP_CHECK', 0,
            'Event Loop: Microtask Queue empty → processing one Task from Task Queue',
            { phase: 'processing_tasks' },
          );
          const task = this.pendingMacrotasks.shift()!;
          this.emit('PROCESS_TASK', 0,
            `Task "${task.label}" moved from Task Queue → Call Stack`,
            { id: task.id, label: task.label },
          );
          task.fn();
          // After one task, loop back to drain microtasks first
        }
      } else {
        break;
      }
    }

    this.state.eventLoopPhase = 'idle';
  }

  // ── Utilities ────────────────────────────────────────────────────────────────
  private nodeText(node: any): string {
    try {
      return this.source.slice(node.start, node.end);
    } catch {
      return '(expression)';
    }
  }
}
