import { IncomingMessage, ServerResponse } from 'http';
import {
  callGeminiApi,
  executeDirectAgentWithGemini,
  executePlannerAgentWithGemini,
  GEMINI_PRICING
} from './geminiService.ts';
import { evaluateAgentOutput } from '../src/utils/evaluator.ts';
import type { BenchmarkTask } from '../src/types/index.ts';

/**
 * Helper to parse JSON body from incoming HTTP request safely.
 */
export async function parseJsonBody(req: IncomingMessage): Promise<any> {
  const buffers: Buffer[] = [];
  for await (const chunk of req) {
    buffers.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const bodyText = Buffer.concat(buffers).toString('utf-8');
  if (!bodyText || bodyText.trim().length === 0) return {};
  try {
    return JSON.parse(bodyText);
  } catch (err: any) {
    throw new Error(`Malformed JSON request payload: ${err.message}`);
  }
}

/**
 * Helper to send JSON responses with appropriate headers.
 */
export function sendJsonResponse(res: ServerResponse, statusCode: number, data: any) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

/**
 * Handles all /api/* requests.
 */
export async function handleApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = req.url || '';

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return true;
  }

  // 1. GET /api/status - Check Gemini API key and configuration
  if (url === '/api/status' || url.startsWith('/api/status?')) {
    // Prefer the user's session-provided key; fall back to the server key.
const authorization = req.headers.authorization || '';
const userApiKey = authorization.startsWith('Bearer ')
  ? authorization.slice(7).trim()
  : '';

const apiKey = userApiKey || process.env.GEMINI_API_KEY || '';
    const hasApiKey = !!(apiKey && apiKey.trim().length > 0 && apiKey.trim() !== 'your_gemini_api_key_here');
    const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

    sendJsonResponse(res, 200, {
  status: 'ok',
  hasApiKey,
  supportsUserApiKey: true,
  model,
  provider: 'Google Gemini',
  supportedAgents: ['Direct Agent', 'Planner Agent'],
  pricing: GEMINI_PRICING
});
    return true;
  }
// 2. POST /api/gemini/test - Test a Gemini API key
if (url === '/api/gemini/test' && req.method === 'POST') {
  try {
    const body = await parseJsonBody(req);

    const authorization = req.headers.authorization || '';
    const userApiKey = authorization.startsWith('Bearer ')
      ? authorization.slice(7).trim()
      : '';

    const apiKey = userApiKey || process.env.GEMINI_API_KEY || '';

    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      sendJsonResponse(res, 400, {
        success: false,
        error: 'Please enter a valid Gemini API key.'
      });
      return true;
    }

    const model = body.model || process.env.GEMINI_MODEL || 'gemini-3.8-flash';

    const result = await callGeminiApi({
      userPrompt: 'Reply with exactly: AgentArena connection successful.',
      model,
      temperature: 0,
      apiKey,
      timeoutMs: 60000
    });

    sendJsonResponse(res, 200, {
      success: true,
      message: 'Gemini API connection successful.',
      model,
      latencyMs: result.durationMs
    });

    return true;
  } catch (err: any) {
    sendJsonResponse(res, 400, {
      success: false,
      error: err.message || 'Gemini connection test failed.'
    });
    return true;
  }
}
  // 2. POST /api/agent/run - Run a single agent against a task with Gemini
  if (url === '/api/agent/run' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const { agentId, agentType, task, model: customModel, temperature } = body;

      if (!agentId || !task) {
        sendJsonResponse(res, 400, {
          success: false,
          error: 'Missing required parameters: agentId and task are required.'
        });
        return true;
      }

      // Prefer the user's session-provided key; fall back to the server key.
const authorization = req.headers.authorization || '';
const userApiKey = authorization.startsWith('Bearer ')
  ? authorization.slice(7).trim()
  : '';



const apiKey = userApiKey || process.env.GEMINI_API_KEY || '';
      if (!apiKey || apiKey.trim().length === 0 || apiKey.trim() === 'your_gemini_api_key_here') {
        sendJsonResponse(res, 400, {
          success: false,
          error: 'GEMINI_API_KEY is not configured on the server. Please add your key to .env file or environment variable.'
        });
        return true;
      }

      const model = customModel || process.env.GEMINI_MODEL || 'gemini-3.8-flash';

      // Determine whether to use Direct or Planner flow
      const isPlanner = agentType === 'planner' || agentId.toLowerCase().includes('planner');
      
      let result;
      if (isPlanner) {
        result = await executePlannerAgentWithGemini(agentId, task as BenchmarkTask, model, apiKey, temperature);
      } else {
        result = await executeDirectAgentWithGemini(agentId, task as BenchmarkTask, model, apiKey, temperature);
      }

      sendJsonResponse(res, 200, {
        success: true,
        result
      });
      return true;
    } catch (err: any) {
      sendJsonResponse(res, 500, {
        success: false,
        error: err.message || 'Internal server error while executing agent'
      });
      return true;
    }
  }

  // 3. POST /api/evaluate - Deterministic evaluation standalone
  if (url === '/api/evaluate' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const { output, task } = body;

      if (typeof output !== 'string' || !task) {
        sendJsonResponse(res, 400, {
          success: false,
          error: 'Missing required parameters: output string and task object are required.'
        });
        return true;
      }

      const evaluation = evaluateAgentOutput(output, task as BenchmarkTask);
      sendJsonResponse(res, 200, {
        success: true,
        evaluation
      });
      return true;
    } catch (err: any) {
      sendJsonResponse(res, 500, {
        success: false,
        error: err.message || 'Error during evaluation'
      });
      return true;
    }
  }

  return false;
}
