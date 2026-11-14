import { Agent, BenchmarkTask, BenchmarkRun, ArenaSettings } from '../../types/index.ts';
import { StorageExportBundle, ImportValidationResult } from './storageAdapter.ts';

export function validateAndSanitizeImport(
  rawJson: any,
  existingRuns: BenchmarkRun[],
  existingAgents: Agent[],
  existingTasks: BenchmarkTask[]
): {
  isValid: boolean;
  errors: string[];
  sanitizedBundle: {
    runsToAdd: BenchmarkRun[];
    agentsToAdd: Agent[];
    tasksToAdd: BenchmarkTask[];
    settingsToApply?: ArenaSettings;
    skippedRuns: number;
    skippedAgents: number;
    skippedTasks: number;
  };
} {
  const errors: string[] = [];

  if (!rawJson || typeof rawJson !== 'object') {
    return {
      isValid: false,
      errors: ['Import payload must be a valid JSON object.'],
      sanitizedBundle: { runsToAdd: [], agentsToAdd: [], tasksToAdd: [], skippedRuns: 0, skippedAgents: 0, skippedTasks: 0 }
    };
  }

  const existingRunIds = new Set(existingRuns.map(r => r.id));
  const existingAgentIds = new Set(existingAgents.map(a => a.id));
  const existingTaskIds = new Set(existingTasks.map(t => t.id));

  const runsToAdd: BenchmarkRun[] = [];
  const agentsToAdd: Agent[] = [];
  const tasksToAdd: BenchmarkTask[] = [];

  let skippedRuns = 0;
  let skippedAgents = 0;
  let skippedTasks = 0;

  // 1. Validate Runs
  if (rawJson.runs !== undefined) {
    if (!Array.isArray(rawJson.runs)) {
      errors.push('Property "runs" must be an array of benchmark runs.');
    } else {
      rawJson.runs.forEach((run: any, idx: number) => {
        if (!run || typeof run !== 'object') {
          errors.push(`Run at index ${idx} is not a valid object.`);
          return;
        }

        if (!run.id || typeof run.id !== 'string') {
          errors.push(`Run at index ${idx} is missing a valid "id".`);
          return;
        }

        if (existingRunIds.has(run.id)) {
          skippedRuns++;
          return;
        }

        if (!Array.isArray(run.results)) {
          errors.push(`Run "${run.id}" has invalid or missing "results" array.`);
          return;
        }

        // Validate results within run
        const sanitizedResults = run.results.map((res: any, rIdx: number) => {
          return {
            agentId: String(res.agentId || 'unknown-agent'),
            taskId: String(res.taskId || 'unknown-task'),
            status: ['pass', 'fail', 'partial'].includes(res.status) ? res.status : 'fail',
            score: typeof res.score === 'number' ? Math.max(0, Math.min(100, res.score)) : 0,
            latencyMs: typeof res.latencyMs === 'number' ? Math.max(0, res.latencyMs) : 0,
            promptTokens: typeof res.promptTokens === 'number' ? res.promptTokens : 0,
            completionTokens: typeof res.completionTokens === 'number' ? res.completionTokens : 0,
            totalTokens: typeof res.totalTokens === 'number' ? res.totalTokens : (res.promptTokens || 0) + (res.completionTokens || 0),
            estimatedCostUsd: typeof res.estimatedCostUsd === 'number' ? res.estimatedCostUsd : 0,
            toolCallsCount: typeof res.toolCallsCount === 'number' ? res.toolCallsCount : 0,
            errorRecoveryAttempts: typeof res.errorRecoveryAttempts === 'number' ? res.errorRecoveryAttempts : 0,
            generatedOutput: String(res.generatedOutput || ''),
            stepsTrace: Array.isArray(res.stepsTrace) ? res.stepsTrace : [],
            evaluationVerdict: ['EXCELLENT', 'SATISFACTORY', 'SUBOPTIMAL', 'FAILED'].includes(res.evaluationVerdict) 
              ? res.evaluationVerdict 
              : 'SATISFACTORY',
            evaluatorFeedback: String(res.evaluatorFeedback || ''),
            isSimulated: Boolean(res.isSimulated),
            executionProvider: res.executionProvider,
            errorMessage: res.errorMessage
          };
        });

        runsToAdd.push({
          id: run.id,
          name: String(run.name || `Imported Run ${run.id}`),
          timestamp: run.timestamp && !isNaN(Date.parse(run.timestamp)) ? run.timestamp : new Date().toISOString(),
          status: ['completed', 'queued', 'running', 'cancelled'].includes(run.status) ? run.status : 'completed',
          agentIds: Array.isArray(run.agentIds) ? run.agentIds.map(String) : [],
          taskIds: Array.isArray(run.taskIds) ? run.taskIds.map(String) : [],
          results: sanitizedResults,
          summaries: Array.isArray(run.summaries) ? run.summaries : [],
          isDemoRun: Boolean(run.isDemoRun),
          executionMode: run.executionMode === 'real' ? 'real' : 'demo',
          modelUsed: run.modelUsed,
          totalExecutionTimeMs: typeof run.totalExecutionTimeMs === 'number' ? run.totalExecutionTimeMs : 0
        });

        existingRunIds.add(run.id);
      });
    }
  }

  // 2. Validate Agents
  if (rawJson.agents !== undefined) {
    if (!Array.isArray(rawJson.agents)) {
      errors.push('Property "agents" must be an array.');
    } else {
      rawJson.agents.forEach((ag: any) => {
        if (!ag || typeof ag !== 'object' || !ag.id || typeof ag.name !== 'string') return;
        if (existingAgentIds.has(ag.id)) {
          skippedAgents++;
          return;
        }

        agentsToAdd.push({
          id: ag.id,
          name: ag.name,
          tagline: ag.tagline || ag.description || '',
          description: ag.description || ag.tagline || '',
          model: ag.model || 'Gemini 1.5 Flash',
          framework: ag.framework || 'Custom',
          status: ag.status || 'active',
          version: ag.version || '1.0.0',
          temperature: typeof ag.temperature === 'number' ? ag.temperature : 0.2,
          maxSteps: typeof ag.maxSteps === 'number' ? ag.maxSteps : 8,
          memoryType: ag.memoryType || 'summary',
          tools: Array.isArray(ag.tools) ? ag.tools : [],
          systemPrompt: ag.systemPrompt || '',
          avatarColor: ag.avatarColor || 'from-blue-500 to-indigo-600',
          createdAt: ag.createdAt || new Date().toISOString().split('T')[0],
          totalRuns: typeof ag.totalRuns === 'number' ? ag.totalRuns : 0,
          avgAccuracy: typeof ag.avgAccuracy === 'number' ? ag.avgAccuracy : 0,
          avgLatencyMs: typeof ag.avgLatencyMs === 'number' ? ag.avgLatencyMs : 0
        });
        existingAgentIds.add(ag.id);
      });
    }
  }

  // 3. Validate Tasks
  if (rawJson.tasks !== undefined) {
    if (!Array.isArray(rawJson.tasks)) {
      errors.push('Property "tasks" must be an array.');
    } else {
      rawJson.tasks.forEach((t: any) => {
        if (!t || typeof t !== 'object' || !t.id || typeof t.title !== 'string') return;
        if (existingTaskIds.has(t.id)) {
          skippedTasks++;
          return;
        }

        tasksToAdd.push({
          id: t.id,
          title: t.title,
          category: t.category || 'reasoning',
          difficulty: t.difficulty || 'medium',
          description: t.description || t.title,
          inputPrompt: t.inputPrompt || '',
          groundTruth: t.groundTruth || '',
          evaluationCriteria: Array.isArray(t.evaluationCriteria) ? t.evaluationCriteria : [],
          timeoutSeconds: typeof t.timeoutSeconds === 'number' ? t.timeoutSeconds : 30,
          tags: Array.isArray(t.tags) ? t.tags : []
        });
        existingTaskIds.add(t.id);
      });
    }
  }

  const isValid = errors.length === 0;

  return {
    isValid,
    errors,
    sanitizedBundle: {
      runsToAdd,
      agentsToAdd,
      tasksToAdd,
      settingsToApply: rawJson.settings,
      skippedRuns,
      skippedAgents,
      skippedTasks
    }
  };
}
