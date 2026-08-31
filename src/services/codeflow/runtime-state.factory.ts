/**
 * CODEFLOW — Runtime State Factory
 * PRD-2: Universal initial state for all language engines
 */

import { RuntimeState, Scope, CallFrame, SupportedLanguage } from './types';

export function createInitialState(language: SupportedLanguage = 'javascript'): RuntimeState {
  const globalScope: Scope = {
    id: 'global',
    type: 'global',
    name: 'Global',
    parentId: null,
    variables: [],
  };

  const globalFrame: CallFrame = {
    id: 'frame-global',
    functionName: 'Global',
    line: 0,
    scopeId: 'global',
  };

  return {
    currentLine: 0,
    currentStep: 0,
    scopes: [globalScope],
    callStack: [globalFrame],
    consoleOutput: [],
    executionStatus: 'idle',
    error: null,
    explanation: 'Program ready. Press Run or Step to begin.',

    // JavaScript async (only used by JS engine)
    webApis: [],
    taskQueue: [],
    microtaskQueue: [],
    eventLoopPhase: 'idle',

    // Memory (C / C++ / Java / C#)
    stack: [],
    heap: [],

    // GC
    gcEvents: [],

    // Compilation pipeline stage
    compilationStage: undefined,
  };
}

/** Deep clone a state snapshot so every step has an immutable snapshot */
export function cloneState(state: RuntimeState): RuntimeState {
  return JSON.parse(JSON.stringify(state)) as RuntimeState;
}
