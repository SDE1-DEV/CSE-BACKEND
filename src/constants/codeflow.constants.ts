/**
 * CODEFLOW — Multi-Language Execution Visualizer Constants
 * PRD-2: All messages and event types for the CODEFLOW engine
 * Supports: JavaScript, Python, C, C++, C#, Java
 */

// ── CODEFLOW API Messages ─────────────────────────────────────────────────────
export const CODEFLOW_MESSAGES = {
  // Execution
  EXECUTION_STARTED: 'Code execution started successfully',
  EXECUTION_COMPLETE: 'Code execution completed successfully',
  STEP_EXECUTED: 'Execution step completed',
  STEPS_GENERATED: 'Execution steps generated successfully',
  EXECUTION_RESET: 'Execution reset successfully',

  // Validation
  CODE_REQUIRED: 'Source code is required',
  CODE_TOO_LONG: 'Source code exceeds maximum allowed length (50KB)',
  INVALID_LANGUAGE: 'Unsupported language. Supported: javascript, python, c, cpp, csharp, java',
  INVALID_STEP_INDEX: 'Invalid step index',
  NO_EXECUTION_FOUND: 'No execution session found',

  // Errors
  PARSE_ERROR: 'Failed to parse source code',
  EXECUTION_ERROR: 'Execution engine encountered an error',
  TIMEOUT_ERROR: 'Code execution timed out (max 5 seconds)',
  INFINITE_LOOP_DETECTED: 'Potential infinite loop detected — execution halted after 10,000 steps',
} as const;

// ── Execution Event Types (PRD §21 — Structured Execution Events) ─────────────
export const EXECUTION_EVENT_TYPES = {
  // Variable lifecycle
  DECLARE_VARIABLE: 'DECLARE_VARIABLE',
  ASSIGN_VARIABLE: 'ASSIGN_VARIABLE',
  HOISTING: 'HOISTING',

  // Functions
  ENTER_FUNCTION: 'ENTER_FUNCTION',
  EXIT_FUNCTION: 'EXIT_FUNCTION',
  RETURN_VALUE: 'RETURN_VALUE',

  // Control flow
  EVALUATE_CONDITION: 'EVALUATE_CONDITION',
  LOOP_START: 'LOOP_START',
  LOOP_ITERATION: 'LOOP_ITERATION',
  LOOP_END: 'LOOP_END',
  BREAK_STATEMENT: 'BREAK_STATEMENT',
  CONTINUE_STATEMENT: 'CONTINUE_STATEMENT',

  // Call stack
  PUSH_CALL_STACK: 'PUSH_CALL_STACK',
  POP_CALL_STACK: 'POP_CALL_STACK',

  // Async runtime
  REGISTER_TIMER: 'REGISTER_TIMER',
  TIMER_FIRED: 'TIMER_FIRED',
  MOVE_TO_TASK_QUEUE: 'MOVE_TO_TASK_QUEUE',
  MOVE_TO_MICROTASK_QUEUE: 'MOVE_TO_MICROTASK_QUEUE',
  EVENT_LOOP_CHECK: 'EVENT_LOOP_CHECK',
  PROCESS_MICROTASK: 'PROCESS_MICROTASK',
  PROCESS_TASK: 'PROCESS_TASK',
  PROMISE_CREATED: 'PROMISE_CREATED',
  PROMISE_RESOLVED: 'PROMISE_RESOLVED',
  PROMISE_REJECTED: 'PROMISE_REJECTED',

  // Output
  CONSOLE_OUTPUT: 'CONSOLE_OUTPUT',

  // Errors
  ERROR: 'ERROR',

  // Lifecycle
  PROGRAM_START: 'PROGRAM_START',
  PROGRAM_END: 'PROGRAM_END',
  CREATION_PHASE: 'CREATION_PHASE',
  EXECUTION_PHASE: 'EXECUTION_PHASE',
} as const;

export type ExecutionEventType = (typeof EXECUTION_EVENT_TYPES)[keyof typeof EXECUTION_EVENT_TYPES];

// ── Supported Languages ───────────────────────────────────────────────────────
export const CODEFLOW_LANGUAGES = {
  JAVASCRIPT: 'javascript',
  PYTHON: 'python',
  C: 'c',
  CPP: 'cpp',
  CSHARP: 'csharp',
  JAVA: 'java',
} as const;

export type CodeflowLanguage = (typeof CODEFLOW_LANGUAGES)[keyof typeof CODEFLOW_LANGUAGES];

// ── Engine Limits ──────────────────────────────────────────────────────────────
export const CODEFLOW_LIMITS = {
  MAX_CODE_LENGTH: 50_000,       // 50KB
  MAX_STEPS: 10_000,             // infinite loop guard
  MAX_EXECUTION_TIME_MS: 5_000,  // 5 seconds
  MAX_CALL_STACK_DEPTH: 500,     // stack overflow guard
  MAX_CONSOLE_OUTPUTS: 1_000,    // console.log spam guard
} as const;

// ── Default Speed Multipliers ─────────────────────────────────────────────────
export const PLAYBACK_SPEEDS = [0.5, 1, 1.5, 2] as const;
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];
