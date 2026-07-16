/**
 * Execution Service Factory
 *
 * Swap the active executor here to integrate a real code execution engine.
 * The submission workflow does not need to change — only this export.
 *
 * Available implementations:
 *   - MockExecutor       → Development stub (currently active)
 *   - Judge0Adapter      → https://judge0.com (TODO)
 *   - PistonAdapter      → https://github.com/engineer-man/piston (TODO)
 *   - DockerSandboxAdapter → Custom Docker sandbox (TODO)
 */
export { mockExecutor as executionService } from './mock.executor';
export type { IExecutionService, ExecutionRequest, ExecutionResult, TestCaseResult } from './execution.interface';
