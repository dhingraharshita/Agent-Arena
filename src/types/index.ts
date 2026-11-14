export type TaskCategory = 'reasoning' | 'mathematics' | 'extraction' | 'research' | 'planning' | 'code';

export type TaskDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

export type AgentFramework = 'LangChain' | 'AutoGen' | 'CrewAI' | 'ReAct Native' | 'LlamaIndex' | 'Custom';

export type AgentStatus = 'active' | 'testing' | 'archived';

export interface Agent {
  id: string;
  name: string;
  tagline: string;
  description: string;
  model: string;
  framework: AgentFramework;
  status: AgentStatus;
  version: string;
  temperature: number;
  maxSteps: number;
  memoryType: 'buffer' | 'summary' | 'vector' | 'stateless';
  tools: string[];
  systemPrompt: string;
  avatarColor: string;
  createdAt: string;
  totalRuns: number;
  avgAccuracy: number;
  avgLatencyMs: number;
}

export interface BenchmarkTask {
  id: string;
  title: string;
  category: TaskCategory;
  difficulty: TaskDifficulty;
  description: string;
  inputPrompt: string;
  groundTruth: string;
  evaluationCriteria: string[];
  timeoutSeconds: number;
  tags: string[];
  sampleInputSnippet?: string;
}

export interface ExecutionStep {
  stepNumber: number;
  type: 'thought' | 'action' | 'observation' | 'reflection' | 'final_answer';
  actionName?: string;
  content: string;
  durationMs: number;
}

export interface AgentTaskResult {
  agentId: string;
  taskId: string;
  status: 'pass' | 'fail' | 'partial';
  score: number; // 0 to 100
  latencyMs: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  toolCallsCount: number;
  errorRecoveryAttempts: number;
  generatedOutput: string;
  stepsTrace: ExecutionStep[];
  evaluationVerdict: 'EXCELLENT' | 'SATISFACTORY' | 'SUBOPTIMAL' | 'FAILED';
  evaluatorFeedback: string;
  isSimulated: boolean;
  executionProvider?: 'gemini-api' | 'demo-simulator';
  modelUsed?: string;
  errorMessage?: string;
}

export interface AgentRunSummary {
  agentId: string;
  avgScore: number;
  passRate: number;
  totalLatencyMs: number;
  avgLatencyMs: number;
  totalCostUsd: number;
  totalTokens: number;
  toolCallsCount: number;
  rank: number;
  isSimulated?: boolean;
}

export interface BenchmarkRun {
  id: string;
  name: string;
  timestamp: string;
  status: 'queued' | 'running' | 'completed' | 'cancelled';
  agentIds: string[];
  taskIds: string[];
  results: AgentTaskResult[];
  summaries: AgentRunSummary[];
  isDemoRun: boolean;
  totalExecutionTimeMs: number;
  executionMode?: 'real' | 'demo';
  modelUsed?: string;
}

export interface LeaderboardEntry {
  agentId: string;
  agentName: string;
  model: string;
  framework: AgentFramework;
  eloRating: number;
  winRate: number; // 0 - 100%
  completedTasks: number;
  avgAccuracy: number;
  avgLatencyMs: number;
  costPer1kTasks: number;
  reliabilityScore: number;
  categoryScores: Record<TaskCategory, number>;
  hasRealRuns?: boolean;
}

export interface EvaluationWeights {
  accuracy: number;
  latency: number;
  cost: number;
  reliability: number;
}

export interface ArenaSettings {
  evaluationWeights: EvaluationWeights;
  simulationSpeed: 'fast' | 'normal' | 'instant';
  simulatedNoise: boolean;
  customRunnerWebhook: string;
  showTraceDetails: boolean;
  currencySymbol: string;
  preferredGeminiModel: string;
  defaultExecutionMode: 'real' | 'demo';
}

export type ActiveTab = 
  | 'overview' 
  | 'agent-lab' 
  | 'benchmark-tasks' 
  | 'run-benchmark' 
  | 'results' 
  | 'leaderboard' 
  | 'documentation' 
  | 'settings';
