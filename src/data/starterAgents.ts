import { Agent } from '../types/index.ts';

export const STARTER_AGENTS: Agent[] = [
  {
    id: 'agent-direct-1',
    name: 'Direct Agent (Zero-Shot)',
    tagline: 'Ultra-low latency single-turn responder with direct prompt solving.',
    description: 'A direct single-pass agent with no intermediate planning or scratchpads. Directly tackles task instructions in one unified inference step.',
    model: 'Gemini 1.5 Flash',
    framework: 'Custom',
    status: 'active',
    version: '2.0.0',
    temperature: 0.1,
    maxSteps: 1,
    memoryType: 'stateless',
    tools: [],
    avatarColor: 'from-cyan-400 to-blue-500',
    createdAt: '2026-11-01',
    totalRuns: 0,
    avgAccuracy: 0,
    avgLatencyMs: 0,
    systemPrompt: `You are a Direct Response AI Agent in the AgentArena benchmarking harness.
Your role: Solve the task directly, rigorously, and concisely in a single response without formulating multi-turn plans.
Adhere strictly to all specified constraints, required output schemas, and accuracy criteria.`
  },
  {
    id: 'agent-planner-1',
    name: 'Planner Agent (Hierarchical)',
    tagline: 'Decomposes complex goals into multi-stage execution trees with validation gates.',
    description: 'A two-stage planning agent that first synthesizes an explicit 3 to 5 step plan with validation checkpoints before executing the solution.',
    model: 'Gemini 1.5 Flash',
    framework: 'CrewAI',
    status: 'active',
    version: '2.4.1',
    temperature: 0.2,
    maxSteps: 8,
    memoryType: 'summary',
    tools: ['step_planner', 'validator'],
    avatarColor: 'from-blue-500 to-indigo-600',
    createdAt: '2026-11-01',
    totalRuns: 0,
    avgAccuracy: 0,
    avgLatencyMs: 0,
    systemPrompt: `You are an expert Hierarchical Planner Agent.
Before executing any task:
1. Deconstruct the problem into independent atomic milestones.
2. Verify input constraints and potential edge cases.
3. Validate each step result against the milestone criteria before advancing.
4. Output structured conclusions with explicit reasoning paths.`
  },
  {
    id: 'agent-react-1',
    name: 'ReAct Agent (Thought-Action)',
    tagline: 'Interleaved reasoning and action cycles with active observation feedback.',
    description: 'Implements the classic ReAct paradigm. Thinks through each observation, queries external tools, and self-corrects based on tool responses.',
    model: 'Gemini 1.5 Flash',
    framework: 'LangChain',
    status: 'active',
    version: '3.0.2',
    temperature: 0.1,
    maxSteps: 8,
    memoryType: 'buffer',
    tools: ['python_repl', 'web_search', 'calculator', 'regex_matcher'],
    avatarColor: 'from-violet-500 to-purple-600',
    createdAt: '2026-10-02',
    totalRuns: 0,
    avgAccuracy: 0,
    avgLatencyMs: 0,
    systemPrompt: `You are a ReAct Agent. Solve tasks using the following protocol:
Thought: Describe your analysis of the current state and what information is missing.
Action: [tool_name] with parameters.
Observation: Receive and process tool output.
... (repeat as needed)
Final Answer: Deliver the verified solution.`
  },
  {
    id: 'agent-critic-1',
    name: 'Critic Agent (Self-Refine)',
    tagline: 'Two-stage generator and critic loop that verifies proofs and edge cases.',
    description: 'An adversarial duo architecture where a generator drafts solutions and an independent critic audits against rubrics, forcing revision until confidence > 95%.',
    model: 'Gemini 1.5 Pro',
    framework: 'AutoGen',
    status: 'active',
    version: '1.8.0',
    temperature: 0.3,
    maxSteps: 10,
    memoryType: 'summary',
    tools: ['verifier', 'code_linter', 'symbolic_solver'],
    avatarColor: 'from-amber-400 to-orange-500',
    createdAt: '2026-10-20',
    totalRuns: 0,
    avgAccuracy: 0,
    avgLatencyMs: 0,
    systemPrompt: `You are a Dual-Role Critic Agent.
Phase 1: Draft initial proposal.
Phase 2: Assume persona of a ruthless proof checker. Identify assumptions, edge cases, and arithmetic errors.
Phase 3: Refine and produce final verified output.`
  },
  {
    id: 'agent-tool-1',
    name: 'Tool-Augmented REPL Agent',
    tagline: 'Deterministic execution specialist routing computation to Python sandbox.',
    description: 'Specializes in math, schema parsing, and deterministic transformations by writing and executing Python scripts in an isolated sandbox.',
    model: 'Gemini 1.5 Flash',
    framework: 'LlamaIndex',
    status: 'active',
    version: '2.1.0',
    temperature: 0.1,
    maxSteps: 6,
    memoryType: 'buffer',
    tools: ['python_repl', 'json_validator', 'math_kernel'],
    avatarColor: 'from-emerald-400 to-teal-600',
    createdAt: '2026-09-28',
    totalRuns: 0,
    avgAccuracy: 0,
    avgLatencyMs: 0,
    systemPrompt: `You are a deterministic REPL agent.
Whenever a question involves numbers, statistics, date calculations, or structured format transformations, write executable Python code rather than guessing mentally.`
  }
];
