import { Agent, BenchmarkRun, BenchmarkTask, LeaderboardEntry, TaskCategory, EvaluationWeights } from '../types/index.ts';

export interface DynamicLeaderboardEntry extends LeaderboardEntry {
  hasRecordedRuns: boolean;
  totalCostUsd: number;
  totalTokens: number;
  realRunCount: number;
  demoRunCount: number;
}

/**
 * Computes dynamic leaderboard standings purely from saved, completed benchmark results.
 * Never invents or hardcodes scores.
 */
export function computeDynamicLeaderboard(
  agents: Agent[],
  runs: BenchmarkRun[],
  tasks: BenchmarkTask[],
  modeFilter: 'all' | 'real' | 'demo' = 'all',
  weights?: EvaluationWeights
): DynamicLeaderboardEntry[] {
  // 1. Filter completed runs only
  const validCompletedRuns = runs.filter(r => {
    if (r.status !== 'completed') return false;
    if (modeFilter === 'real') {
      return r.executionMode === 'real' || !r.isDemoRun;
    }
    if (modeFilter === 'demo') {
      return r.isDemoRun || r.executionMode === 'demo';
    }
    return true;
  });

  const taskMap = new Map<string, BenchmarkTask>();
  tasks.forEach(t => taskMap.set(t.id, t));

  // 2. Compute metrics for each agent
  const entries: DynamicLeaderboardEntry[] = agents.map(agent => {
    const allAgentResults: any[] = [];
    let realCount = 0;
    let demoCount = 0;

    validCompletedRuns.forEach(run => {
      run.results.forEach(res => {
        if (res.agentId === agent.id) {
          allAgentResults.push(res);
          if (res.isSimulated) {
            demoCount++;
          } else {
            realCount++;
          }
        }
      });
    });

    const completedTasks = allAgentResults.length;
    const hasRecordedRuns = completedTasks > 0;

    if (!hasRecordedRuns) {
      return {
        agentId: agent.id,
        agentName: agent.name,
        model: agent.model,
        framework: agent.framework,
        eloRating: 0,
        winRate: 0,
        completedTasks: 0,
        avgAccuracy: 0,
        avgLatencyMs: 0,
        costPer1kTasks: 0,
        reliabilityScore: 0,
        categoryScores: {
          reasoning: 0,
          mathematics: 0,
          extraction: 0,
          research: 0,
          planning: 0,
          code: 0
        },
        hasRealRuns: false,
        hasRecordedRuns: false,
        totalCostUsd: 0,
        totalTokens: 0,
        realRunCount: 0,
        demoRunCount: 0
      };
    }

    const passes = allAgentResults.filter(r => r.status === 'pass').length;
    const winRate = Math.round((passes / completedTasks) * 100);
    const avgAccuracy = Math.round((allAgentResults.reduce((s, r) => s + r.score, 0) / completedTasks) * 10) / 10;
    const avgLatencyMs = Math.round(allAgentResults.reduce((s, r) => s + r.latencyMs, 0) / completedTasks);
    const totalCostUsd = allAgentResults.reduce((s, r) => s + (r.estimatedCostUsd || 0), 0);
    const totalTokens = allAgentResults.reduce((s, r) => s + (r.totalTokens || 0), 0);
    const costPer1kTasks = Math.round((totalCostUsd / completedTasks) * 1000 * 100) / 100;
    
    // Reliability = tasks that didn't fail due to an error / exception
    const nonErrors = allAgentResults.filter(r => !r.errorMessage && r.evaluationVerdict !== 'FAILED').length;
    const reliabilityScore = Math.round((nonErrors / completedTasks) * 100);

    // Category scores: strictly computed from tasks of that category
    const categoryScores: Record<TaskCategory, number> = {
      reasoning: 0,
      mathematics: 0,
      extraction: 0,
      research: 0,
      planning: 0,
      code: 0
    };

    (['reasoning', 'mathematics', 'extraction', 'research', 'planning', 'code'] as const).forEach(cat => {
      const catResults = allAgentResults.filter(r => {
        const t = taskMap.get(r.taskId);
        return t ? t.category === cat : false;
      });

      if (catResults.length > 0) {
        categoryScores[cat] = Math.round((catResults.reduce((s, r) => s + r.score, 0) / catResults.length) * 10) / 10;
      } else {
        categoryScores[cat] = 0; // Not tested in this category
      }
    });

    // ELO formula:
    // Base 1400 + Accuracy contribution + Win rate contribution - Latency penalty
    const baseElo = 1400;
    const accuracyDelta = (avgAccuracy - 70) * 14;
    const winRateDelta = (winRate - 60) * 8;
    const latencyPenalty = (avgLatencyMs / 1000) * 15;
    const rawElo = Math.round(baseElo + accuracyDelta + winRateDelta - latencyPenalty);
    const eloRating = Math.max(800, rawElo);

    return {
      agentId: agent.id,
      agentName: agent.name,
      model: agent.model,
      framework: agent.framework,
      eloRating,
      winRate,
      completedTasks,
      avgAccuracy,
      avgLatencyMs,
      costPer1kTasks,
      reliabilityScore,
      categoryScores,
      hasRealRuns: realCount > 0,
      hasRecordedRuns: true,
      totalCostUsd,
      totalTokens,
      realRunCount: realCount,
      demoRunCount: demoCount
    };
  });

  // Sort: Active runs first (descending ELO), unranked at the bottom
  entries.sort((a, b) => {
    if (a.hasRecordedRuns && !b.hasRecordedRuns) return -1;
    if (!a.hasRecordedRuns && b.hasRecordedRuns) return 1;
    return b.eloRating - a.eloRating;
  });

  return entries;
}
