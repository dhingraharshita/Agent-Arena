import { BenchmarkTask, AgentTaskResult } from '../types';

export interface ApiStatusResponse {
  status: string;
  hasApiKey: boolean;
  model: string;
  provider: string;
  supportedAgents: string[];
  pricing: Record<string, { inputPerToken: number; outputPerToken: number }>;
}

export interface AgentRunResponse {
  success: boolean;
  result?: AgentTaskResult;
  error?: string;
}

/**
 * Checks server status and whether GEMINI_API_KEY is configured on the backend.
 * Never exposes the key.
 */
export async function checkServerApiStatus(): Promise<ApiStatusResponse> {
  try {
    const res = await fetch('/api/status');
    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err: any) {
    return {
      status: 'offline',
      hasApiKey: false,
      model: 'gemini-3.8-flash',
      provider: 'Offline / Demo Simulation',
      supportedAgents: ['Direct Agent', 'Planner Agent'],
      pricing: {}
    };
  }
}

/**
 * Runs a single agent on a task via the server-side Gemini endpoint.
 */
export async function executeAgentViaApi(
  agentId: string,
  agentType: 'direct' | 'planner',
  task: BenchmarkTask,
  model?: string,
  temperature?: number
): Promise<AgentRunResponse> {
  try {
    const res = await fetch('/api/agent/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        agentId,
        agentType,
        task,
        model,
        temperature
      })
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network request failed'
    };
  }
}
