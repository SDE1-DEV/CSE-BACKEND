/**
 * CODEFLOW — Zod validators
 * PRD-2: Multi-Language Execution Visualizer
 * Supports: javascript, python, c, cpp, csharp, java
 */

import { z } from 'zod';
import { CODEFLOW_LIMITS } from '../constants/codeflow.constants';

export const SUPPORTED_LANGUAGES = ['javascript', 'python', 'c', 'cpp', 'csharp', 'java'] as const;
export type SupportedLanguageInput = (typeof SUPPORTED_LANGUAGES)[number];

export const ExecuteCodeSchema = z.object({
  code: z
    .string({ required_error: 'code is required' })
    .min(1, 'code cannot be empty')
    .max(CODEFLOW_LIMITS.MAX_CODE_LENGTH, `code exceeds max length of ${CODEFLOW_LIMITS.MAX_CODE_LENGTH} chars`),
  language: z
    .enum(SUPPORTED_LANGUAGES, {
      required_error: 'language is required',
      invalid_type_error: 'Unsupported language. Supported: javascript, python, c, cpp, csharp, java',
    })
    .default('javascript'),
});

export type ExecuteCodeInput = z.infer<typeof ExecuteCodeSchema>;
