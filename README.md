# AgentArena – AI Agent Benchmarking Platform

AgentArena is a benchmarking platform designed to evaluate **autonomous AI agents** (prompts, tool loops, multi-turn state, and cognitive architectures), not merely foundation models.

Compare **Direct Agent** (single-pass zero-shot inference) against **Planner Agent** (two-stage hierarchical planning and execution) on identical tasks with Google's Gemini API under fair conditions.

---

## Key Features

- **Standardized Agent Architectures**:
  - **Direct Agent**: Receives task instructions and attempts to solve them in a single, direct pass. Measures raw model reasoning, lower latency, and minimum token cost.
  - **Planner Agent**: First formulates an explicit 3 to 5 step plan with validation checkpoints, then methodically executes the plan.
- **Fair Benchmarking Conditions**:
  - Both agents run on the exact same underlying Gemini model (default `gemini-3.8-flash`, configurable through the server-side `GEMINI_MODEL` setting).
  - Both receive the exact same task input instructions and are graded by the same deterministic evaluators.
- **Secure Server-Side Gemini API Integration**:
  - Model requests are executed through a secure server-side endpoint (`/api/agent/run`).
  - `GEMINI_API_KEY` is kept safe on the server and is **never** exposed to frontend JavaScript code.
  - Actual input and output tokens are measured directly from Gemini's `usageMetadata`.
- **Deterministic Evaluation Engine**:
  - Dedicated evaluators for **Structured Extraction** (JSON schema validation & entity checking), **Mathematics** (tolerance & milestone value checking), and **Constraint Logic** (temporal sequencing & causal deduction).
  - Explicit rubric checking across all benchmark categories.
- **Transparent Execution Modes**:
  - **Real Gemini AI Execution**: Real server-side LLM calls, measured tokens, and live wall-clock latency.
  - **Demo Simulation Mode**: Local deterministic simulation runner when no API key is configured. Clear badges visibly distinguish measured metrics from simulated demo data.
- **Dynamic Leaderboard & Weights**:
  - Live ELO rating formula combining Accuracy (50%), Reliability (25%), Latency Penalty (15%), and Cost (10%).
  - Configurable weights in Settings that dynamically re-score the entire leaderboard.

---

## Getting Started

### 1. Prerequisites
- Node.js 20+ and npm
- npm or pnpm

### 2. Configure Gemini API Key

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Add your Google Gemini API key to `.env`:
   ```env
   GEMINI_API_KEY=AIzaSy...your_gemini_api_key_here
   GEMINI_MODEL=gemini-3.8-flash
   ```

> **Note**: You can obtain a free Gemini API key at [Google AI Studio](https://aistudio.google.com/app/apikey).
> If no API key is provided, AgentArena automatically runs in **Demo Simulation Mode** without requiring any paid services or external credentials.

### 3. Run the Application

#### Development Mode (Vite + Integrated Server API):
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

#### Standalone Production Server:
```bash
npm run build
node server.js
```

---

## Benchmark Metrics & Evaluation

| Metric | Source | Description |
|---|---|---|
| **Accuracy (%)** | Deterministic Evaluator | Programmatic evaluation against task ground truth and constraints. |
| **Latency (ms)** | Server Timer | Wall-clock execution time for complete task resolution. |
| **Input / Output Tokens** | Gemini `usageMetadata` | Exact token counts reported by Google's API (displayed as N/A if unavailable). |
| **Estimated Cost ($)** | Token Pricing Formula | Calculated using documented provider rates ($0.75/1M input, $3.75/1M output for Gemini 3.8 Flash through December 31, 2026). |
| **Reliability Score (%)** | Runtime Monitor | Percentage of steps and tool calls executed without exceptions. |

---

## Project Structure

```
├── server/
│   ├── apiRouter.ts           # Server-side API endpoint dispatcher (/api/status, /api/agent/run)
│   └── geminiService.ts       # Direct Agent and Planner Agent Gemini execution logic
├── src/
│   ├── components/
│   │   ├── agentLab/          # Agent management, inspection, and creation modals
│   │   ├── documentation/    # Platform guides and mathematical formula documentation
│   │   ├── layout/            # Responsive sidebar, header, and toast notifications
│   │   ├── leaderboard/       # ELO rankings and category score tables
│   │   ├── overview/          # Dashboard metrics and comparative performance chart
│   │   ├── results/           # Head-to-head matrix and step-by-step trace inspector
│   │   ├── runBenchmark/      # Matrix configuration and live execution runner
│   │   ├── settings/          # Evaluation weights and model selection
│   │   └── tasks/             # Standardized benchmark task library
│   ├── context/
│   │   └── ArenaContext.tsx   # Global application state, live runner, and data persistence
│   ├── data/
│   │   ├── benchmarkTasks.ts  # Standardized benchmark task suites
│   │   ├── mockRuns.ts        # Historical benchmark trials
│   │   └── starterAgents.ts   # Starter agent architecture configurations
│   ├── services/
│   │   └── apiService.ts      # Frontend HTTP client connecting to server API
│   ├── types/
│   │   └── index.ts           # Unified TypeScript interfaces
│   └── utils/
│       ├── benchmarkRunner.ts # Deterministic simulation runner and summary builder
│       └── evaluator.ts       # Modular deterministic evaluation engine
├── .env.example               # Template environment configuration
├── server.js                  # Standalone Node.js production server
├── vite.config.ts             # Vite dev server with integrated API middleware
└── package.json
```

---

## Notes

- Estimated costs use Gemini 3.8 Flash paid-tier list prices of $0.75/1M input tokens and $3.75/1M output tokens through December 31, 2026. Eligible free-tier usage may have no model charge; the displayed estimate is not a billing statement. Check the [current official pricing](https://ai.google.dev/gemini-api/docs/pricing/) before relying on cost comparisons.
- Benchmark history is stored in this browser using IndexedDB, with a localStorage fallback. It is not automatically synchronized across devices.
- The development server (`npm run dev`) includes the API middleware. For deployed production use, deploy the API server and frontend together; a static-only host will not provide `/api/*` endpoints.

## License
MIT
