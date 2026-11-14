export interface DocSection {
  id: string;
  title: string;
  category: 'core' | 'architecture' | 'metrics' | 'integration' | 'tasks';
  content: string;
  codeSnippet?: string;
}

export const DOCUMENTATION_SECTIONS: DocSection[] = [
  {
    id: 'direct-vs-planner',
    title: 'Direct Agent vs Planner Agent Architecture',
    category: 'architecture',
    content: `AgentArena implements two core standardized agent architectures to benchmark cognitive planning trade-offs under fair conditions:

### 1. Direct Agent (Zero-Shot)
- **Workflow**: The agent receives the benchmark task instructions and attempts to solve it directly in a single cognitive pass.
- **Characteristics**: Ultra-low latency, fewer total tokens, lowest cost.
- **Vulnerabilities**: On complex multi-step constraint problems (such as parallel shipping dependencies or multi-variable financial compounding), single-pass generation frequently suffers reasoning shortcuts, misses maintenance windows, or produces arithmetic hallucinations.

### 2. Planner Agent (Hierarchical Plan & Execute)
- **Workflow**: 
  - **Stage 1 (Planning)**: Receives the task and formulates a concise 3 to 5 step execution graph with validation checkpoints and edge-case isolation.
  - **Stage 2 (Execution)**: Follows the formulated plan step-by-step to compute and verify the final solution.
- **Characteristics**: Higher latency and token consumption, but dramatically higher accuracy and constraint satisfaction on complex reasoning tasks.

### Fair Comparison Guarantee:
Both agents use the exact same underlying Gemini model (e.g., \`gemini-3.8-flash\`), identical temperature settings, and are evaluated against the same deterministic rubrics.`
  },
  {
    id: 'gemini-integration',
    title: 'Google Gemini API Server-Side Integration',
    category: 'integration',
    content: `AgentArena connects to Google's Gemini API via a secure server-side endpoint:

- **Security**: The \`GEMINI_API_KEY\` is read exclusively from server-side environment variables and is **never** exposed to frontend JavaScript code.
- **Measured Metrics**: Prompt and candidate token counts are extracted directly from Gemini's \`usageMetadata\`. Latency is measured using high-resolution server timers.
- **Documented Pricing**:
  - **Gemini 3.8 Flash**: $0.75 per 1M input tokens and $3.75 per 1M output tokens (paid-tier list pricing through December 31, 2026).

If no API key is configured, AgentArena operates in **Deterministic Demo Mode**, clearly labeled with demo badges so that demo runs are never mistaken for real model telemetry.`
  },
  {
    id: 'deterministic-evaluators',
    title: 'Deterministic Evaluation Engine',
    category: 'metrics',
    content: `To ensure empirical reproducibility, AgentArena uses deterministic evaluators rather than black-box non-deterministic graders:

1. **Structured Extraction Evaluator**:
   - Parses JSON outputs (handling markdown fences or embedded objects).
   - Validates top-level and nested schema keys (e.g. \`patientId\`, \`adverseEvents\`).
   - Verifies extracted entities (symptoms, grading, causality, and intervention actions).

2. **Mathematics Evaluator**:
   - Normalizes numerical expressions, fractions, percentages, and currencies.
   - Verifies exact milestone values (e.g., Kelly Criterion \\(f^* = 0.40\\), Half-Kelly \\(0.20\\), and final capital \\$110,592).
   - Verifies stationary probability vectors in Markov chains (\\(27/83\\), \\(40/83\\), \\(16/83\\)).

3. **Constraint Logic & Reasoning Evaluator**:
   - Verifies temporal sequencing (e.g., business days vs maintenance shutdowns arriving at October 11).
   - Tests causal counterfactual deductions (e.g., Simpson's Paradox confounding identification and \\(do(\\text{Treatment})\\) routing).`
  },
  {
    id: 'metrics-calculation',
    title: 'How Metrics & Arena ELO are Calculated',
    category: 'metrics',
    content: `AgentArena evaluates each agent trial along 5 key dimensions:

- **Accuracy Score (0 - 100%)**: Evaluated using task-specific deterministic rule evaluators.
- **Latency (ms)**: Total wall-clock time from task submission to final answer completion.
- **Input & Output Tokens**: Actual token counts reported by Gemini API's \`usageMetadata\`. (Displayed as N/A if unavailable).
- **Estimated Cost (\\$)**: Computed with standard model pricing per token.
- **Tool Reliability Index**: Percentage of tool invocations or intermediate steps executed without failure.

### Arena Composite Formula:
$$\\text{Score} = w_{\\text{acc}} \\cdot \\text{Acc} + w_{\\text{rel}} \\cdot \\text{Rel} - w_{\\text{lat}} \\cdot \\min\\left(1, \\frac{\\text{Lat}}{10000}\\right) - w_{\\text{cost}} \\cdot \\min\\left(1, \\frac{\\text{Cost}}{0.10}\\right)$$

Default weights: Accuracy = 50%, Reliability = 25%, Latency = 15%, Cost = 10%. Fine-tune these in Settings.`
  },
  {
    id: 'integration-spec',
    title: 'Connecting Custom Agents (REST & Python SDK)',
    category: 'integration',
    content: `You can connect any custom agent framework (LangChain, AutoGen, CrewAI, LlamaIndex, or proprietary internal frameworks) by implementing our lightweight JSON Webhook specification:

Your endpoint receives the task payload, runs your internal loop, and streams or returns structured steps and final output.`,
    codeSnippet: `# Python FastAPI / AgentArena Runner Example
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI()

class TaskPayload(BaseModel):
    task_id: str
    prompt: str
    timeout_seconds: int

class StepTrace(BaseModel):
    step_number: int
    type: str # 'thought' | 'action' | 'observation' | 'final_answer'
    content: str
    duration_ms: int

class AgentResponse(BaseModel):
    agent_id: str
    output: str
    steps: List[StepTrace]
    tool_calls_count: int

@app.post("/agent/execute")
async def execute_task(payload: TaskPayload) -> AgentResponse:
    # 1. Run your agent loop (LangChain, CrewAI, AutoGen, etc.)
    # 2. Collect step traces and tool executions
    # 3. Return structured payload
    return AgentResponse(
        agent_id="my-custom-agent",
        output="The calculated answer is ...",
        steps=[...],
        tool_calls_count=2
    )`
  }
];
