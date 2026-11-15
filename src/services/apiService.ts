
import { BenchmarkTask, AgentTaskResult } from '../types';

export interface ApiStatusResponse {
  status: string;
  hasApiKey: boolean;
  supportsUserApiKey: boolean;
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
 * Checks server status and whether Gemini is configured.
 * Never exposes the server API key.
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
      supportsUserApiKey: false,
      model: 'gemini-3.8-flash',
      provider: 'Offline / Demo Simulation',
      supportedAgents: ['Direct Agent', 'Planner Agent'],
      pricing: {}
    };
  }
}

/**
 * Runs a single agent via the server-side Gemini endpoint.
 * The user's API key is sent only with this request.
 */
export async function executeAgentViaApi(
  agentId: string,
  agentType: 'direct' | 'planner',
  task: BenchmarkTask,
  model?: string,
  temperature?: number,
  apiKey?: string
): Promise<AgentRunResponse> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (apiKey?.trim()) {
      headers.Authorization = `Bearer ${apiKey.trim()}`;
    }

    const res = await fetch('/api/agent/run', {
      method: 'POST',
      headers,
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
export async function testGeminiApiKey(apiKey: string, model?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (apiKey.trim()) {
    headers.Authorization = `Bearer ${apiKey.trim()}`;
  }

  const res = await fetch('/api/gemini/test', {
    method: 'POST',
    headers,
    body: JSON.stringify({ model })
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || `Server returned HTTP ${res.status}`);
  }

  return data;
}