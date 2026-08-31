/**
 * CODEFLOW — Routes
 * PRD-2: Multi-Language Code Execution & Runtime Visualizer
 *
 * Public endpoints (no auth required) — learning tool accessible to all students.
 *
 * POST /api/codeflow/execute          — execute code, return steps
 * GET  /api/codeflow/languages        — list all 6 supported languages
 * GET  /api/codeflow/examples/:lang   — beginner examples for a language
 */

import { Router } from 'express';
import { executeCode, getSupportedLanguages, getLanguageExamples } from '../controllers/codeflow.controller';

const router = Router();

router.post('/execute', executeCode);
router.get('/languages', getSupportedLanguages);
router.get('/examples/:language', getLanguageExamples);

export default router;
