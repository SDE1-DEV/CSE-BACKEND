/**
 * CODEFLOW — Controller
 * PRD-2: Multi-Language Code Execution & Runtime Visualizer
 *
 * POST /api/codeflow/execute
 *   body: { code: string, language: "javascript" | "python" | "c" | "cpp" | "csharp" | "java" }
 *   returns: ExecutionResult (steps[], totalSteps, finalState, hasError, language)
 *
 * GET /api/codeflow/languages
 *   returns: list of all 6 supported languages with metadata
 */

import { Request, Response, NextFunction } from 'express';
import { codeflowService } from '../services/codeflow/codeflow.service';
import { ExecuteCodeSchema, SUPPORTED_LANGUAGES } from '../validators/codeflow.validator';
import { getExamplesForLanguage } from '../services/codeflow/examples/language-examples';
import { sendSuccess } from '../utils/response';
import { CODEFLOW_MESSAGES } from '../constants/codeflow.constants';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS } from '../constants';
import { SupportedLanguage } from '../services/codeflow/types';

/**
 * @swagger
 * tags:
 *   name: CodeFlow
 *   description: Multi-Language Code Execution & Runtime Visualizer
 */

/**
 * @swagger
 * /api/codeflow/execute:
 *   post:
 *     tags: [CodeFlow]
 *     summary: Execute code in any supported language and return full execution steps
 *     description: >
 *       Parses source code, walks the AST, and returns a complete ordered list of
 *       execution steps. Each step contains the execution event type, description,
 *       source line, and full runtime state snapshot.
 *       Supports: JavaScript, Python, C, C++, C#, Java.
 *       No eval() is used — all execution runs through isolated AST interpreters.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, language]
 *             properties:
 *               code:
 *                 type: string
 *                 description: Source code (max 50KB)
 *               language:
 *                 type: string
 *                 enum: [javascript, python, c, cpp, csharp, java]
 *                 default: javascript
 *     responses:
 *       200:
 *         description: Execution steps generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     steps: { type: array }
 *                     totalSteps: { type: integer }
 *                     finalState: { type: object }
 *                     hasError: { type: boolean }
 *                     language: { type: string }
 *       400:
 *         description: Invalid input or parse error
 */
export const executeCode = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const parsed = ExecuteCodeSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(
        HTTP_STATUS.BAD_REQUEST,
        parsed.error.errors.map((e) => e.message).join(', '),
      );
    }

    const { code, language } = parsed.data;
    const result = codeflowService.execute(code, language);

    sendSuccess(res, CODEFLOW_MESSAGES.STEPS_GENERATED, result);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/codeflow/languages:
 *   get:
 *     tags: [CodeFlow]
 *     summary: Get list of all 6 supported languages with runtime model metadata
 *     responses:
 *       200:
 *         description: Supported languages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     languages:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: string }
 *                           name: { type: string }
 *                           version: { type: string }
 *                           icon: { type: string }
 *                           description: { type: string }
 *                           runtimeModel: { type: array, items: { type: string } }
 */
export const getSupportedLanguages = (
  _req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const languages = codeflowService.getSupportedLanguages();
    sendSuccess(res, 'Supported languages fetched', { languages });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/codeflow/examples/{language}:
 *   get:
 *     tags: [CodeFlow]
 *     summary: Get beginner examples for a specific language (6 levels)
 *     parameters:
 *       - in: path
 *         name: language
 *         required: true
 *         schema:
 *           type: string
 *           enum: [javascript, python, c, cpp, csharp, java]
 *     responses:
 *       200:
 *         description: Examples for the requested language
 *       400:
 *         description: Unsupported language
 */
export const getLanguageExamples = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const lang = req.params['language'] as string;
    if (!SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage)) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, CODEFLOW_MESSAGES.INVALID_LANGUAGE);
    }
    const examples = getExamplesForLanguage(lang as SupportedLanguage);
    sendSuccess(res, `Examples for ${lang} fetched`, { language: lang, examples });
  } catch (error) {
    next(error);
  }
};
