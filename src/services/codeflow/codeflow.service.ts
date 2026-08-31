/**
 * CODEFLOW — Service Layer
 * PRD-2: Multi-Language Code Execution & Runtime Visualizer
 *
 * Language registry pattern — each language implements LanguageEngine.
 * Service routes execution to the correct engine based on language param.
 *
 * Supported: javascript, python, c, cpp, csharp, java
 */

import { JsInterpreter } from './js-interpreter';
import { PythonInterpreter } from './python/python-interpreter';
import { CInterpreter } from './c/c-interpreter';
import { CppInterpreter } from './cpp/cpp-interpreter';
import { CSharpInterpreter } from './csharp/csharp-interpreter';
import { JavaInterpreter } from './java/java-interpreter';
import { LanguageEngine, ExecutionResult, SupportedLanguage } from './types';
import { CODEFLOW_LIMITS, CODEFLOW_MESSAGES } from '../../constants/codeflow.constants';
import { AppError } from '../../middlewares/error.middleware';
import { HTTP_STATUS } from '../../constants';
import { logger } from '../../utils/logger';

// ── Language Registry ─────────────────────────────────────────────────────────
type EngineFactory = (source: string) => LanguageEngine;

const LANGUAGE_REGISTRY: Record<SupportedLanguage, EngineFactory> = {
  javascript: (source) => new JsInterpreter(source),
  python:     (source) => new PythonInterpreter(source),
  c:          (source) => new CInterpreter(source),
  cpp:        (source) => new CppInterpreter(source),
  csharp:     (source) => new CSharpInterpreter(source),
  java:       (source) => new JavaInterpreter(source),
};

export class CodeflowService {
  /**
   * Parse and interpret source code in the specified language.
   * Returns the full ordered list of execution steps (PRD-2 §12).
   *
   * @param code   - source code string
   * @param language - one of: javascript | python | c | cpp | csharp | java
   */
  execute(code: string, language: SupportedLanguage = 'javascript'): ExecutionResult {
    if (!code || typeof code !== 'string') {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, CODEFLOW_MESSAGES.CODE_REQUIRED);
    }

    const trimmed = code.trim();
    if (trimmed.length === 0) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, CODEFLOW_MESSAGES.CODE_REQUIRED);
    }

    if (trimmed.length > CODEFLOW_LIMITS.MAX_CODE_LENGTH) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, CODEFLOW_MESSAGES.CODE_TOO_LONG);
    }

    const factory = LANGUAGE_REGISTRY[language];
    if (!factory) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, CODEFLOW_MESSAGES.INVALID_LANGUAGE);
    }

    logger.debug('[CODEFLOW] Starting execution', { codeLength: trimmed.length, language });

    const start = Date.now();
    let result: ExecutionResult;

    try {
      const engine = factory(trimmed);
      result = engine.execute();
    } catch (e: unknown) {
      const msg = (e as Error).message ?? 'Unknown engine error';
      logger.error('[CODEFLOW] Engine error', { error: msg, language });
      throw new AppError(HTTP_STATUS.INTERNAL_SERVER_ERROR, CODEFLOW_MESSAGES.EXECUTION_ERROR);
    }

    const elapsed = Date.now() - start;
    logger.debug('[CODEFLOW] Execution complete', {
      language,
      steps: result.totalSteps,
      hasError: result.hasError,
      elapsed,
    });

    return result;
  }

  /**
   * Returns metadata for all supported languages.
   * Used by GET /api/codeflow/languages
   */
  getSupportedLanguages() {
    return [
      {
        id: 'javascript',
        name: 'JavaScript',
        version: 'ES2020',
        icon: 'js',
        description: 'JavaScript execution with full runtime visualization including Event Loop, Call Stack, Web APIs, Promises',
        runtimeModel: ['Call Stack', 'Web APIs', 'Microtask Queue', 'Task Queue', 'Event Loop'],
      },
      {
        id: 'python',
        name: 'Python',
        version: 'Python 3',
        icon: 'py',
        description: 'Python execution visualizing the PVM, execution frames, bytecode concept, global/function frames',
        runtimeModel: ['Bytecode Concept', 'Python Virtual Machine', 'Execution Frames', 'Objects'],
      },
      {
        id: 'c',
        name: 'C',
        version: 'C11',
        icon: 'c',
        description: 'C execution showing full compilation pipeline and runtime stack/heap/pointer visualization',
        runtimeModel: ['Compilation Pipeline', 'Stack', 'Heap', 'Pointers', 'Function Calls'],
      },
      {
        id: 'cpp',
        name: 'C++',
        version: 'C++17',
        icon: 'cpp',
        description: 'C++ execution with compilation pipeline, stack/heap, objects, constructors/destructors, references/pointers',
        runtimeModel: ['Compilation Pipeline', 'Stack', 'Heap', 'Objects', 'Constructors', 'Destructors', 'Pointers'],
      },
      {
        id: 'csharp',
        name: 'C#',
        version: '.NET 8',
        icon: 'cs',
        description: 'C# execution with Roslyn → MSIL → CLR → JIT pipeline, managed heap, stack frames, GC events',
        runtimeModel: ['Roslyn', 'MSIL/CIL', 'CLR', 'JIT', 'Managed Stack', 'Managed Heap', 'GC'],
      },
      {
        id: 'java',
        name: 'Java',
        version: 'Java 21',
        icon: 'java',
        description: 'Java execution with javac → bytecode → JVM pipeline, JVM stack frames, heap objects, GC events',
        runtimeModel: ['Bytecode', 'JVM', 'JVM Stack', 'JVM Heap', 'Frames', 'GC'],
      },
    ];
  }
}

export const codeflowService = new CodeflowService();
