import { ProgrammingLanguage, SubmissionStatus } from '@prisma/client';

export interface ExecutionRequest {
  sourceCode: string;
  language: ProgrammingLanguage;
  testCases: Array<{
    id: string;
    input: string;
    expectedOutput: string;
    weight: number;
    isHidden: boolean;
  }>;
  timeLimit: number;   // milliseconds
  memoryLimit: number; // MB
}

export interface TestCaseResult {
  testCaseId: string;
  passed: boolean;
  actualOutput?: string;
  expectedOutput: string;
  runtime?: number;
  memoryUsed?: number;
  error?: string;
}

export interface ExecutionResult {
  status: SubmissionStatus;
  runtime: number;      // ms
  memoryUsed: number;   // MB
  score: number;
  passedTestCases: number;
  totalTestCases: number;
  testCaseResults: TestCaseResult[];
  compileError?: string;
  stderr?: string;
}

/**
 * Abstraction for code execution engines.
 * Implementations: MockExecutor | Judge0Adapter | PistonAdapter | DockerSandboxAdapter
 */
export interface IExecutionService {
  execute(request: ExecutionRequest): Promise<ExecutionResult>;
}
