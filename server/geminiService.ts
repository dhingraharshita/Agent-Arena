import type { BenchmarkTask, AgentTaskResult, ExecutionStep } from '../src/types/index.ts';
import { evaluateAgentOutput } from '../src/utils/evaluator.ts';

// Configurable estimated paid-tier pricing per token (USD), current through 2026-12-31.
// Gemini 3.8 Flash: $0.75 / 1M input tokens, $3.75 / 1M output tokens.
// Actual charges depend on the user's billing tier and current provider pricing.
export const GEMINI_PRICING = {
  'gemini-3.8-flash': {
    inputPerToken: 0.00000075,
    outputPerToken: 0.00000375
  }
};

export interface GeminiCallParams {
  systemInstruction?: string;
  userPrompt: string;
  model: string;
  temperature?: number;
  apiKey: string;
  timeoutMs?: number;
}

export interface GeminiCallResult {
  text: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  durationMs: number;
  rawUsageMetadata?: any;
}

/**
 * Raw server-side call to Google Gemini REST API.
 * Never exposes the API key to client or logs.
 */
export async function callGeminiApi({
  systemInstruction,
  userPrompt,
  model,
  temperature = 0.2,
  apiKey,
  timeoutMs = 45000
}: GeminiCallParams): Promise<GeminiCallResult> {
  const startTime = Date.now();
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  const bodyPayload: any = {
    contents: [
      {
        parts: [{ text: userPrompt }]
      }
    ],
    generationConfig: {
      temperature,
      maxOutputTokens: 2048
    }
  };

  if (systemInstruction) {
    bodyPayload.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify(bodyPayload),
      signal: controller.signal
    });

    const durationMs = Date.now() - startTime;

    if (!response.ok) {
      let errorMsg = `HTTP ${response.status} ${response.statusText}`;
      try {
        const errorJson: any = await response.json();
        if (errorJson?.error?.message) {
          errorMsg = errorJson.error.message;
        }
      } catch {
        // use fallback statusText
      }
      throw new Error(`Gemini API Error: ${errorMsg}`);
    }

    const data: any = await response.json();
    const candidate = data.candidates?.[0];
    const textPart = candidate?.content?.parts?.[0]?.text || '';
    const usage = data.usageMetadata || {};

    const promptTokens = typeof usage.promptTokenCount === 'number' ? usage.promptTokenCount : 0;
    const completionTokens = typeof usage.candidatesTokenCount === 'number' ? usage.candidatesTokenCount : 0;
    const totalTokens = typeof usage.totalTokenCount === 'number' ? usage.totalTokenCount : promptTokens + completionTokens;

    return {
      text: textPart,
      promptTokens,
      completionTokens,
      totalTokens,
      durationMs,
      rawUsageMetadata: usage
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Calculates estimated cost based on exact tokens and model pricing.
 */
export function calculateGeminiCost(model: string, promptTokens: number, completionTokens: number): number {
  const pricing = (GEMINI_PRICING as any)[model] || GEMINI_PRICING['gemini-3.8-flash'];
  const cost = (promptTokens * pricing.inputPerToken) + (completionTokens * pricing.outputPerToken);
  return Math.round(cost * 1000000) / 1000000; // retain 6 decimal places for precision
}

/**
 * Executes a Direct Agent using real Gemini API.
 */
export async function executeDirectAgentWithGemini(
  agentId: string,
  task: BenchmarkTask,
  model: string,
  apiKey: string,
  temperature: number = 0.1
): Promise<AgentTaskResult> {
  const systemInstruction = 
    `You are a Direct Response AI Agent in the AgentArena benchmarking harness.
Your role: Solve the task directly, rigorously, and concisely in a single response without formulating multi-turn plans.
Adhere strictly to all specified constraints, required output schemas, and accuracy criteria.`;

  const userPrompt = `### TASK INSTRUCTION:
Title: ${task.title}
Category: ${task.category.toUpperCase()}

${task.inputPrompt}`;

  try {
    const result = await callGeminiApi({
      systemInstruction,
      userPrompt,
      model,
      temperature,
      apiKey
    });

    // Evaluate output using deterministic evaluators
    const evalResult = evaluateAgentOutput(result.text, task);
    const estimatedCostUsd = calculateGeminiCost(model, result.promptTokens, result.completionTokens);

    const stepsTrace: ExecutionStep[] = [
      {
        stepNumber: 1,
        type: 'action',
        actionName: 'direct_inference',
        content: `Direct single-pass execution via ${model} (Prompt: ${result.promptTokens} tokens, Completion: ${result.completionTokens} tokens).`,
        durationMs: Math.round(result.durationMs * 0.3)
      },
      {
        stepNumber: 2,
        type: 'final_answer',
        content: result.text,
        durationMs: Math.round(result.durationMs * 0.7)
      }
    ];

    return {
      agentId,
      taskId: task.id,
      status: evalResult.status,
      score: evalResult.score,
      latencyMs: result.durationMs,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      totalTokens: result.totalTokens,
      estimatedCostUsd,
      toolCallsCount: 0,
      errorRecoveryAttempts: 0,
      generatedOutput: result.text,
      stepsTrace,
      evaluationVerdict: evalResult.verdict,
      evaluatorFeedback: evalResult.feedback,
      isSimulated: false
    };
  } catch (err: any) {
    return {
      agentId,
      taskId: task.id,
      status: 'fail',
      score: 0,
      latencyMs: 500,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      estimatedCostUsd: 0,
      toolCallsCount: 0,
      errorRecoveryAttempts: 0,
      generatedOutput: `[EXECUTION ERROR]: ${err.message || String(err)}`,
      stepsTrace: [
        {
          stepNumber: 1,
          type: 'action',
          actionName: 'error',
          content: `Failed to execute: ${err.message || String(err)}`,
          durationMs: 500
        }
      ],
      evaluationVerdict: 'FAILED',
      evaluatorFeedback: `Execution failed due to provider error: ${err.message || 'Unknown error'}`,
      isSimulated: false
    };
  }
}

/**
 * Executes a Planner Agent using real Gemini API.
 * Phase 1: Formulates a short step-by-step plan.
 * Phase 2: Solves the task following the plan.
 */
export async function executePlannerAgentWithGemini(
  agentId: string,
  task: BenchmarkTask,
  model: string,
  apiKey: string,
  temperature: number = 0.2
): Promise<AgentTaskResult> {
  const planningSystemInstruction = 
    `You are a Hierarchical Planning AI Agent in the AgentArena benchmarking harness.
Your role: Before solving any task, deconstruct it into a concise, structured execution plan (3 to 5 clear steps).
Identify key constraints, mathematical variables, schema requirements, and verification checkpoints.
DO NOT provide the final answer yet. Output ONLY the execution plan.`;

  const executionSystemInstruction = 
    `You are a Hierarchical Planning AI Agent in the AgentArena benchmarking harness.
You have already formulated a structured execution plan.
Now, execute the plan methodically step-by-step to arrive at the final verified solution.
Satisfy every constraint and ensure your final answer is complete and verified.`;

  try {
    // Step 1: Formulate the Plan
    const step1Start = Date.now();
    const planResult = await callGeminiApi({
      systemInstruction: planningSystemInstruction,
      userPrompt: `### TASK TO PLAN:
Title: ${task.title}
Category: ${task.category.toUpperCase()}

${task.inputPrompt}

Please produce a concise 3 to 5 step execution plan with explicit validation gates.`,
      model,
      temperature: 0.2,
      apiKey
    });
    const step1Duration = Date.now() - step1Start;

    // Step 2: Execute the Plan to solve the task
    const step2Start = Date.now();
    const solveResult = await callGeminiApi({
      systemInstruction: executionSystemInstruction,
      userPrompt: `### TASK:
Title: ${task.title}
Category: ${task.category.toUpperCase()}

${task.inputPrompt}

### FORMULATED EXECUTION PLAN:
${planResult.text}

Execute the plan above now and deliver the complete, verified solution.`,
      model,
      temperature,
      apiKey
    });
    const step2Duration = Date.now() - step2Start;

    const totalLatency = step1Duration + step2Duration;
    const totalPromptTokens = planResult.promptTokens + solveResult.promptTokens;
    const totalCompletionTokens = planResult.completionTokens + solveResult.completionTokens;
    const totalTokens = totalPromptTokens + totalCompletionTokens;
    const estimatedCostUsd = calculateGeminiCost(model, totalPromptTokens, totalCompletionTokens);

    // Evaluate the solved output
    const evalResult = evaluateAgentOutput(solveResult.text, task);

    const stepsTrace: ExecutionStep[] = [
      {
        stepNumber: 1,
        type: 'thought',
        actionName: 'formulate_plan',
        content: `Formulated Execution Plan:\n${planResult.text}`,
        durationMs: step1Duration
      },
      {
        stepNumber: 2,
        type: 'action',
        actionName: 'execute_plan',
        content: `Executing formulated plan milestones against task constraints using ${model}.`,
        durationMs: Math.round(step2Duration * 0.4)
      },
      {
        stepNumber: 3,
        type: 'final_answer',
        content: solveResult.text,
        durationMs: Math.round(step2Duration * 0.6)
      }
    ];

    return {
      agentId,
      taskId: task.id,
      status: evalResult.status,
      score: evalResult.score,
      latencyMs: totalLatency,
      promptTokens: totalPromptTokens,
      completionTokens: totalCompletionTokens,
      totalTokens,
      estimatedCostUsd,
      toolCallsCount: 1, // Planner tool step
      errorRecoveryAttempts: 0,
      generatedOutput: solveResult.text,
      stepsTrace,
      evaluationVerdict: evalResult.verdict,
      evaluatorFeedback: `[Planner Agent: 2-Stage Plan & Execute] ${evalResult.feedback}`,
      isSimulated: false
    };
  } catch (err: any) {
    return {
      agentId,
      taskId: task.id,
      status: 'fail',
      score: 0,
      latencyMs: 500,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      estimatedCostUsd: 0,
      toolCallsCount: 0,
      errorRecoveryAttempts: 0,
      generatedOutput: `[PLANNER EXECUTION ERROR]: ${err.message || String(err)}`,
      stepsTrace: [
        {
          stepNumber: 1,
          type: 'action',
          actionName: 'error',
          content: `Planner agent failed: ${err.message || String(err)}`,
          durationMs: 500
        }
      ],
      evaluationVerdict: 'FAILED',
      evaluatorFeedback: `Execution failed due to provider error: ${err.message || 'Unknown error'}`,
      isSimulated: false
    };
  }
}
