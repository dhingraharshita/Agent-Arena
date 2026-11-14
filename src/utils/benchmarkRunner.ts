import { Agent, BenchmarkTask, AgentTaskResult, ExecutionStep, BenchmarkRun, AgentRunSummary, EvaluationWeights } from '../types';

export function calculateArenaScore(
  accuracy: number,
  latencyMs: number,
  costUsd: number,
  reliability: number,
  weights: EvaluationWeights
): number {
  const normAcc = accuracy; // 0 - 100
  const normRel = reliability; // 0 - 100
  const normLat = Math.max(0, 100 - (latencyMs / 50)); // e.g. 2000ms -> 60
  const normCost = Math.max(0, 100 - (costUsd * 2000)); // e.g. $0.02 -> 60

  const totalWeight = weights.accuracy + weights.latency + weights.cost + weights.reliability;
  if (totalWeight === 0) return 0;

  const score = (
    (normAcc * weights.accuracy) +
    (normRel * weights.reliability) +
    (normLat * weights.latency) +
    (normCost * weights.cost)
  ) / totalWeight;

  return Math.round(score * 10) / 10;
}

export function generateSimulationResult(
  agent: Agent,
  task: BenchmarkTask,
  speedMultiplier: number = 1
): AgentTaskResult {
  // Deterministic seed based on agent id + task id string length & characters
  const seed = (agent.id + task.id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Base performance affinity matrix
  let baseScore = 75;
  let status: 'pass' | 'fail' | 'partial' = 'pass';
  let toolCalls = 0;
  let errorRecovery = 0;
  let steps: ExecutionStep[] = [];

  // Tailored agent behavior logic
  if (agent.id.includes('direct')) {
    // Direct agent: fast, no tools, misses multi-step temporal or edge logic
    if (task.category === 'reasoning' || task.category === 'code') {
      baseScore = 45 + (seed % 25);
      status = baseScore >= 60 ? 'partial' : 'fail';
    } else {
      baseScore = 70 + (seed % 20);
      status = 'pass';
    }
    toolCalls = 0;
    steps = [
      {
        stepNumber: 1,
        type: 'thought',
        content: `Ingesting task input. Running zero-shot autoregressive generation without scratchpad.`,
        durationMs: 250
      },
      {
        stepNumber: 2,
        type: 'final_answer',
        content: `Immediate terminal response derived from pre-trained weights directly: ${task.groundTruth.slice(0, 80)}...`,
        durationMs: 420
      }
    ];
  } else if (agent.id.includes('planner')) {
    // Planner agent: methodical, strong on reasoning, planning, synthesis
    baseScore = 88 + (seed % 11);
    toolCalls = 2 + (seed % 3);
    errorRecovery = seed % 2;
    steps = [
      {
        stepNumber: 1,
        type: 'thought',
        content: `Deconstructing problem domain into independent verification constraints for [${task.title}].`,
        durationMs: 450
      },
      {
        stepNumber: 2,
        type: 'action',
        actionName: 'step_planner',
        content: `Formulated 4-stage execution graph with validation checkpoints for criteria satisfaction.`,
        durationMs: 650
      },
      {
        stepNumber: 3,
        type: 'observation',
        content: `All sub-tasks validated against edge condition constraints.`,
        durationMs: 350
      },
      {
        stepNumber: 4,
        type: 'action',
        actionName: 'validator',
        content: `Auditing intermediate deduction steps against expected ground truth requirements.`,
        durationMs: 450
      },
      {
        stepNumber: 5,
        type: 'final_answer',
        content: `Synthesized formal output: ${task.groundTruth}`,
        durationMs: 800
      }
    ];
  } else if (agent.id.includes('critic')) {
    // Critic agent: ultra high score, checks proofs, higher latency
    baseScore = 93 + (seed % 7);
    toolCalls = 3 + (seed % 3);
    errorRecovery = 1;
    steps = [
      {
        stepNumber: 1,
        type: 'thought',
        content: `Drafting primary hypothesis for task criteria resolution.`,
        durationMs: 500
      },
      {
        stepNumber: 2,
        type: 'action',
        actionName: 'symbolic_solver',
        content: `Executing formal proof check and testing for counter-examples.`,
        durationMs: 700
      },
      {
        stepNumber: 3,
        type: 'reflection',
        content: `Critic agent flagged potential boundary condition oversight. Refining step 2.`,
        durationMs: 600
      },
      {
        stepNumber: 4,
        type: 'final_answer',
        content: `Refined and verified solution satisfying all rubric points: ${task.groundTruth}`,
        durationMs: 1100
      }
    ];
  } else if (agent.id.includes('tool')) {
    // REPL agent: math & extraction master
    if (task.category === 'mathematics' || task.category === 'extraction' || task.category === 'code') {
      baseScore = 95 + (seed % 5);
    } else {
      baseScore = 80 + (seed % 15);
    }
    toolCalls = 3;
    steps = [
      {
        stepNumber: 1,
        type: 'thought',
        content: `Writing deterministic Python code script to calculate solution without hallucination risk.`,
        durationMs: 380
      },
      {
        stepNumber: 2,
        type: 'action',
        actionName: 'python_repl',
        content: `exec("""import math, json\n# Computed verification script for ${task.title}\nprint('Status: Computed verified value.')""")`,
        durationMs: 520
      },
      {
        stepNumber: 3,
        type: 'observation',
        content: `Standard Output: Computed verified value. Exact numerical delta < 1e-9.`,
        durationMs: 200
      },
      {
        stepNumber: 4,
        type: 'final_answer',
        content: `Programmatically verified result: ${task.groundTruth}`,
        durationMs: 550
      }
    ];
  } else {
    // ReAct or generic
    baseScore = 82 + (seed % 14);
    toolCalls = 2;
    steps = [
      {
        stepNumber: 1,
        type: 'thought',
        content: `Analyzing goal requirements: ${task.inputPrompt.slice(0, 60)}...`,
        durationMs: 350
      },
      {
        stepNumber: 2,
        type: 'action',
        actionName: agent.tools[0] || 'calculator',
        content: `Querying tool for missing parameters.`,
        durationMs: 400
      },
      {
        stepNumber: 3,
        type: 'observation',
        content: `Returned structured data response.`,
        durationMs: 250
      },
      {
        stepNumber: 4,
        type: 'final_answer',
        content: `Formulated conclusion: ${task.groundTruth.slice(0, 120)}`,
        durationMs: 700
      }
    ];
  }

  // Calculate timing & token metrics
  const totalStepDuration = steps.reduce((sum, s) => sum + s.durationMs, 0);
  const latencyMs = Math.round(totalStepDuration * (0.8 + ((seed % 40) / 100)));
  const promptTokens = 450 + (seed % 350);
  const completionTokens = 300 + (seed % 500);
  const totalTokens = promptTokens + completionTokens;
  const estimatedCostUsd = Math.round(((promptTokens * 0.000003) + (completionTokens * 0.000015)) * 10000) / 10000;

  let verdict: 'EXCELLENT' | 'SATISFACTORY' | 'SUBOPTIMAL' | 'FAILED' = 'SATISFACTORY';
  let feedback = 'Met primary expected evaluation criteria successfully.';

  if (baseScore >= 92) {
    verdict = 'EXCELLENT';
    feedback = 'Exceptional constraint adherence, rigorous step traceability, and flawless final derivation.';
    status = 'pass';
  } else if (baseScore >= 75) {
    verdict = 'SATISFACTORY';
    feedback = 'Accurate final conclusion; slight verbosity or minor non-critical intermediate step deviations.';
    status = 'pass';
  } else if (baseScore >= 55) {
    verdict = 'SUBOPTIMAL';
    feedback = 'Partial criteria satisfaction. Failed on one boundary condition or missed formatting specification.';
    status = 'partial';
  } else {
    verdict = 'FAILED';
    feedback = 'Substantive reasoning gap or failure to resolve interdependent constraint preconditions.';
    status = 'fail';
  }

  return {
    agentId: agent.id,
    taskId: task.id,
    status,
    score: baseScore,
    latencyMs,
    promptTokens,
    completionTokens,
    totalTokens,
    estimatedCostUsd,
    toolCallsCount: toolCalls,
    errorRecoveryAttempts: errorRecovery,
    generatedOutput: `### Output from ${agent.name}\n\n**Task:** ${task.title}\n\n${steps[steps.length - 1].content}\n\n---\n*Verified against evaluation criteria: ${task.evaluationCriteria[0]}*`,
    stepsTrace: steps,
    evaluationVerdict: verdict,
    evaluatorFeedback: feedback,
    isSimulated: true
  };
}

export function buildRunSummary(
  agentIds: string[],
  results: AgentTaskResult[]
): AgentRunSummary[] {
  const summaries: AgentRunSummary[] = agentIds.map(agentId => {
    const agentResults = results.filter(r => r.agentId === agentId);
    if (agentResults.length === 0) {
      return {
        agentId,
        avgScore: 0,
        passRate: 0,
        totalLatencyMs: 0,
        avgLatencyMs: 0,
        totalCostUsd: 0,
        totalTokens: 0,
        toolCallsCount: 0,
        rank: 1
      };
    }

    const totalScore = agentResults.reduce((acc, r) => acc + r.score, 0);
    const passCount = agentResults.filter(r => r.status === 'pass').length;
    const totalLatency = agentResults.reduce((acc, r) => acc + r.latencyMs, 0);
    const totalCost = agentResults.reduce((acc, r) => acc + r.estimatedCostUsd, 0);
    const totalTokens = agentResults.reduce((acc, r) => acc + r.totalTokens, 0);
    const toolCalls = agentResults.reduce((acc, r) => acc + r.toolCallsCount, 0);

    return {
      agentId,
      avgScore: Math.round((totalScore / agentResults.length) * 10) / 10,
      passRate: Math.round((passCount / agentResults.length) * 100),
      totalLatencyMs: totalLatency,
      avgLatencyMs: Math.round(totalLatency / agentResults.length),
      totalCostUsd: Math.round(totalCost * 10000) / 10000,
      totalTokens,
      toolCallsCount: toolCalls,
      rank: 1
    };
  });

  // Sort descending by avgScore and assign ranks
  summaries.sort((a, b) => b.avgScore - a.avgScore);
  summaries.forEach((s, idx) => {
    s.rank = idx + 1;
  });

  return summaries;
}
