/**
 * CODEFLOW — Core TypeScript types
 * PRD-2: Multi-Language Execution Visualizer
 *
 * Shared across all six language engines:
 *   JavaScript, Python, C, C++, C#, Java
 */

// ── Supported Languages ───────────────────────────────────────────────────────
export type SupportedLanguage =
  | 'javascript'
  | 'python'
  | 'c'
  | 'cpp'
  | 'csharp'
  | 'java';

// ── Primitive/Runtime values ──────────────────────────────────────────────────
export type PrimitiveValue = string | number | boolean | null | undefined;

export interface RuntimeObject {
  __type: 'object';
  properties: Record<string, RuntimeValue>;
}
export interface RuntimeArray {
  __type: 'array';
  elements: RuntimeValue[];
}
export interface RuntimeFunction {
  __type: 'function';
  name: string;
  params: string[];
  bodyRef?: number;
}

export type RuntimeValue =
  | PrimitiveValue
  | RuntimeObject
  | RuntimeArray
  | RuntimeFunction;

export type VariableKind = 'var' | 'let' | 'const' | 'int' | 'float' | 'double'
  | 'char' | 'bool' | 'string' | 'long' | 'short' | 'auto' | 'void' | 'final'
  | 'static' | 'val' | 'def' | 'local';

/** TDZ = Temporal Dead Zone (let/const before initializer) */
export type VariableState = 'hoisted_undefined' | 'tdz' | 'initialized' | 'uninitialized';

export interface Variable {
  name: string;
  value: RuntimeValue;
  kind: VariableKind;
  state: VariableState;
  scopeId: string;
  type?: string;           // declared type for typed languages (int, String, etc.)
  address?: string;        // memory address for C/C++ pointer visualization
  isPointer?: boolean;     // C/C++ pointer flag
  changedAtStep?: number;
}

// ── Scope ─────────────────────────────────────────────────────────────────────
export type ScopeType = 'global' | 'function' | 'block' | 'class' | 'module';

export interface Scope {
  id: string;
  type: ScopeType;
  name: string;
  parentId: string | null;
  variables: Variable[];
}

// ── Call Stack ────────────────────────────────────────────────────────────────
export interface CallFrame {
  id: string;
  functionName: string;
  line: number;
  scopeId: string;
  returnValue?: RuntimeValue;
  returnType?: string;     // for typed languages
}

// ── Memory (C / C++ / Java / C#) ─────────────────────────────────────────────
export interface MemoryCell {
  address: string;
  value: RuntimeValue;
  type: string;
  label: string;         // variable name or object label
  isFree?: boolean;      // heap: freed by delete/free()
}

export interface HeapObject {
  id: string;
  address: string;
  type: string;
  fields: Record<string, RuntimeValue>;
  label: string;
  isGarbageCollected?: boolean;
}

// ── Async zones (JavaScript only) ────────────────────────────────────────────
export interface WebApiEntry {
  id: string;
  label: string;
  type: 'setTimeout' | 'setInterval' | 'Promise';
  delay?: number;
}

export interface QueueEntry {
  id: string;
  label: string;
  callbackLines?: number[];
}

export type EventLoopPhase =
  | 'idle'
  | 'checking'
  | 'stack_empty'
  | 'processing_microtasks'
  | 'processing_tasks';

// ── Console ───────────────────────────────────────────────────────────────────
export interface ConsoleEntry {
  id: string;
  value: string;
  line: number;
  stepIndex: number;
}

// ── Language-specific runtime panel data ─────────────────────────────────────
export interface JavaScriptRuntime {
  webApis: WebApiEntry[];
  taskQueue: QueueEntry[];
  microtaskQueue: QueueEntry[];
  eventLoopPhase: EventLoopPhase;
}

export interface PythonRuntime {
  /** concept display: source → bytecode → PVM → frames */
  compilationStage: 'source' | 'compilation' | 'bytecode' | 'pvm' | 'execution';
  bytecodeHint?: string;
}

export interface CRuntime {
  /** compilation pipeline stage for visualization */
  compilationStage: 'source' | 'preprocessor' | 'compiler' | 'assembly' | 'object_code' | 'linker' | 'executable' | 'runtime';
  stack: MemoryCell[];
  heap: MemoryCell[];
}

export interface CppRuntime extends CRuntime {
  objects: HeapObject[];
}

export interface CSharpRuntime {
  compilationStage: 'source' | 'roslyn' | 'msil' | 'clr' | 'jit' | 'native';
  managedStack: CallFrame[];
  managedHeap: HeapObject[];
  gcEvents: string[];
}

export interface JavaRuntime {
  compilationStage: 'source' | 'compiler' | 'bytecode' | 'jvm' | 'execution';
  jvmStack: CallFrame[];
  jvmHeap: HeapObject[];
  bytecodeHint?: string;
}

export type LanguageRuntime =
  | JavaScriptRuntime
  | PythonRuntime
  | CRuntime
  | CppRuntime
  | CSharpRuntime
  | JavaRuntime;

// ── Execution Events (all languages) ─────────────────────────────────────────
export type ExecutionEventType =
  // Shared
  | 'PROGRAM_START'
  | 'PROGRAM_END'
  | 'EXECUTION_PHASE'
  | 'DECLARE_VARIABLE'
  | 'ASSIGN_VARIABLE'
  | 'ENTER_FUNCTION'
  | 'EXIT_FUNCTION'
  | 'RETURN_VALUE'
  | 'EVALUATE_CONDITION'
  | 'LOOP_START'
  | 'LOOP_ITERATION'
  | 'LOOP_END'
  | 'BREAK_STATEMENT'
  | 'CONTINUE_STATEMENT'
  | 'PUSH_CALL_STACK'
  | 'POP_CALL_STACK'
  | 'CONSOLE_OUTPUT'
  | 'ERROR'
  // JavaScript-specific
  | 'CREATION_PHASE'
  | 'HOISTING'
  | 'REGISTER_TIMER'
  | 'MOVE_TO_TASK_QUEUE'
  | 'MOVE_TO_MICROTASK_QUEUE'
  | 'EVENT_LOOP_CHECK'
  | 'PROCESS_MICROTASK'
  | 'PROCESS_TASK'
  | 'PROMISE_CREATED'
  | 'PROMISE_RESOLVED'
  | 'PROMISE_REJECTED'
  // C / C++ specific
  | 'STACK_ALLOCATE'
  | 'HEAP_ALLOCATE'
  | 'HEAP_FREE'
  | 'POINTER_REFERENCE'
  | 'POINTER_DEREFERENCE'
  // C++ specific
  | 'CONSTRUCTOR_CALL'
  | 'DESTRUCTOR_CALL'
  // C# / Java specific
  | 'OBJECT_CREATE'
  | 'GC_EVENT'
  | 'CLASS_LOAD'
  // Python specific
  | 'COMPILATION_STAGE'
  // Compilation visualization (C/C++/C#/Java)
  | 'COMPILATION_PIPELINE';

export interface ExecutionEvent {
  type: ExecutionEventType;
  line: number;
  description: string;
  detail: Record<string, unknown>;
}

// ── Runtime State (universal across all languages) ───────────────────────────
export interface RuntimeState {
  currentLine: number;
  currentStep: number;
  scopes: Scope[];
  callStack: CallFrame[];
  consoleOutput: ConsoleEntry[];
  executionStatus: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  error: { type: string; message: string; line: number } | null;
  explanation: string;

  // JavaScript-only (kept for backwards compat)
  webApis: WebApiEntry[];
  taskQueue: QueueEntry[];
  microtaskQueue: QueueEntry[];
  eventLoopPhase: EventLoopPhase;

  // Memory visualization (C / C++ / Java / C#)
  stack: MemoryCell[];
  heap: HeapObject[];

  // Compilation pipeline stage (C / C++ / C# / Java / Python)
  compilationStage?: string;

  // GC events (C# / Java)
  gcEvents: string[];

  // Language-specific runtime panel data
  languageRuntime?: LanguageRuntime;
}

// ── Step ──────────────────────────────────────────────────────────────────────
export interface ExecutionStep {
  index: number;
  event: ExecutionEvent;
  state: RuntimeState;
}

// ── Full result ───────────────────────────────────────────────────────────────
export interface ExecutionResult {
  steps: ExecutionStep[];
  totalSteps: number;
  finalState: RuntimeState;
  hasError: boolean;
  parseError?: string;
  language: SupportedLanguage;
}

// ── Language Engine Interface (PRD-2 §18) ─────────────────────────────────────
export interface LanguageEngine {
  /** Language identifier */
  readonly language: SupportedLanguage;
  /** Parse source and generate all execution steps */
  execute(): ExecutionResult;
}
