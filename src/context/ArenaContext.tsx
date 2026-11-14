import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { 
  Agent, 
  BenchmarkTask, 
  BenchmarkRun, 
  ActiveTab, 
  ArenaSettings, 
  AgentTaskResult,
  LeaderboardEntry 
} from '../types/index.ts';
import { STARTER_AGENTS } from '../data/starterAgents.ts';
import { BENCHMARK_TASKS } from '../data/benchmarkTasks.ts';
import { INITIAL_MOCK_RUNS } from '../data/mockRuns.ts';
import { generateSimulationResult, buildRunSummary } from '../utils/benchmarkRunner.ts';
import { checkServerApiStatus, executeAgentViaApi, ApiStatusResponse } from '../services/apiService.ts';
import { storageService } from '../services/storage/indexedDbAdapter.ts';
import { computeDynamicLeaderboard, DynamicLeaderboardEntry } from '../utils/leaderboardCalculator.ts';
import { ImportValidationResult, StorageExportBundle } from '../services/storage/storageAdapter.ts';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
}

export interface LiveRunningState {
  runId: string;
  runTitle: string;
  progress: number;
  currentAgentName: string;
  currentTaskTitle: string;
  currentStepMessage: string;
  logs: string[];
  executionMode: 'real' | 'demo';
}

interface ArenaContextType {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  
  // Storage & Loading
  isStorageReady: boolean;
  
  // API & Server Status
  apiStatus: ApiStatusResponse | null;
  refreshApiStatus: () => Promise<void>;
  
  // Agents
  agents: Agent[];
  addAgent: (agent: Omit<Agent, 'id' | 'createdAt' | 'totalRuns' | 'avgAccuracy' | 'avgLatencyMs'>) => Promise<void>;
  updateAgent: (agent: Agent) => Promise<void>;
  duplicateAgent: (agentId: string) => Promise<void>;
  deleteAgent: (agentId: string) => Promise<void>;
  
  // Tasks
  tasks: BenchmarkTask[];
  addTask: (task: Omit<BenchmarkTask, 'id'>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  
  // Runs
  runs: BenchmarkRun[];
  selectedRunId: string | null;
  setSelectedRunId: (runId: string | null) => void;
  deleteRun: (runId: string) => Promise<void>;
  
  // Live Runner
  liveRunningState: LiveRunningState | null;
  startBenchmarkRun: (
    selectedAgentIds: string[], 
    selectedTaskIds: string[], 
    runTitle?: string,
    executionMode?: 'real' | 'demo'
  ) => Promise<string>;
  cancelLiveRun: () => void;
  
  // Dynamic Leaderboard
  leaderboard: DynamicLeaderboardEntry[];
  leaderboardModeFilter: 'all' | 'real' | 'demo';
  setLeaderboardModeFilter: (mode: 'all' | 'real' | 'demo') => void;
  
  // Settings
  settings: ArenaSettings;
  updateSettings: (newSettings: Partial<ArenaSettings>) => Promise<void>;
  resetAllData: () => Promise<void>;
  
  // Export & Import
  exportDataBundle: () => Promise<StorageExportBundle>;
  importDataBundle: (rawJson: any) => Promise<ImportValidationResult>;
  
  // Notifications
  toasts: ToastMessage[];
  addToast: (message: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;
}

const DEFAULT_SETTINGS: ArenaSettings = {
  evaluationWeights: {
    accuracy: 50,
    latency: 15,
    cost: 10,
    reliability: 25
  },
  simulationSpeed: 'fast',
  simulatedNoise: true,
  customRunnerWebhook: 'http://localhost:8000/agent/benchmark',
  showTraceDetails: true,
  currencySymbol: '$',
  preferredGeminiModel: 'gemini-3.8-flash',
  defaultExecutionMode: 'demo'
};

const ArenaContext = createContext<ArenaContextType | null>(null);

export const ArenaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [apiStatus, setApiStatus] = useState<ApiStatusResponse | null>(null);
  const [isStorageReady, setIsStorageReady] = useState(false);

  const [agents, setAgents] = useState<Agent[]>(STARTER_AGENTS);
  const [tasks, setTasks] = useState<BenchmarkTask[]>(BENCHMARK_TASKS);
  const [runs, setRuns] = useState<BenchmarkRun[]>(INITIAL_MOCK_RUNS);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [settings, setSettings] = useState<ArenaSettings>(DEFAULT_SETTINGS);
  
  const [leaderboardModeFilter, setLeaderboardModeFilter] = useState<'all' | 'real' | 'demo'>('all');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [liveRunningState, setLiveRunningState] = useState<LiveRunningState | null>(null);
  const [cancelRequested, setCancelRequested] = useState<boolean>(false);

  // Initialize Persistent Storage (IndexedDB with LocalStorage fallback)
  useEffect(() => {
    let isMounted = true;

    async function loadStorage() {
      try {
        await storageService.init();

        const [loadedRuns, loadedAgents, loadedTasks, loadedSettings] = await Promise.all([
          storageService.getAllRuns(),
          storageService.getAllAgents(),
          storageService.getAllTasks(),
          storageService.getSettings()
        ]);

        if (!isMounted) return;

        if (loadedAgents.length > 0) setAgents(loadedAgents);
        if (loadedTasks.length > 0) setTasks(loadedTasks);
        if (loadedRuns.length > 0) {
          setRuns(loadedRuns);
          setSelectedRunId(loadedRuns[0].id);
        }
        if (loadedSettings) setSettings({ ...loadedSettings, preferredGeminiModel: 'gemini-3.8-flash' });

        setIsStorageReady(true);
      } catch (err) {
        console.error('Storage initialization failed:', err);
        setIsStorageReady(true);
      }
    }

    loadStorage();
    return () => { isMounted = false; };
  }, []);

  // Check server status on mount and gentle polling
  const refreshApiStatus = async () => {
    try {
      const status = await checkServerApiStatus();
      setApiStatus(status);
    } catch {
      setApiStatus(null);
    }
  };

  useEffect(() => {
    refreshApiStatus();
    const interval = setInterval(refreshApiStatus, 25000);
    return () => clearInterval(interval);
  }, []);

  const addToast = (message: string, type: ToastMessage['type'] = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Compute dynamic agent metrics based on actual runs
  const computedAgents = useMemo(() => {
    return agents.map(agent => {
      const agentResults: AgentTaskResult[] = [];
      runs.forEach(r => {
        if (r.status === 'completed') {
          r.results.forEach(res => {
            if (res.agentId === agent.id) {
              agentResults.push(res);
            }
          });
        }
      });

      if (agentResults.length === 0) {
        return {
          ...agent,
          totalRuns: 0,
          avgAccuracy: 0,
          avgLatencyMs: 0
        };
      }

      const totalScore = agentResults.reduce((s, r) => s + r.score, 0);
      const totalLatency = agentResults.reduce((s, r) => s + r.latencyMs, 0);

      return {
        ...agent,
        totalRuns: agentResults.length,
        avgAccuracy: Math.round((totalScore / agentResults.length) * 10) / 10,
        avgLatencyMs: Math.round(totalLatency / agentResults.length)
      };
    });
  }, [agents, runs]);

  // Agent Management
  const addAgent = async (data: Omit<Agent, 'id' | 'createdAt' | 'totalRuns' | 'avgAccuracy' | 'avgLatencyMs'>) => {
    const newAgent: Agent = {
      ...data,
      id: `agent-custom-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString().split('T')[0],
      totalRuns: 0,
      avgAccuracy: 0,
      avgLatencyMs: 0
    };
    setAgents(prev => [newAgent, ...prev]);
    await storageService.saveAgent(newAgent);
    addToast(`Agent "${newAgent.name}" created and saved`, 'success');
  };

  const updateAgent = async (updated: Agent) => {
    setAgents(prev => prev.map(a => a.id === updated.id ? updated : a));
    await storageService.saveAgent(updated);
    addToast(`Agent "${updated.name}" updated`, 'success');
  };

  const duplicateAgent = async (agentId: string) => {
    const source = agents.find(a => a.id === agentId);
    if (!source) return;
    const duplicated: Agent = {
      ...source,
      id: `agent-${Date.now().toString().slice(-5)}`,
      name: `${source.name} (Copy)`,
      createdAt: new Date().toISOString().split('T')[0],
      totalRuns: 0,
      avgAccuracy: 0,
      avgLatencyMs: 0
    };
    setAgents(prev => [duplicated, ...prev]);
    await storageService.saveAgent(duplicated);
    addToast(`Duplicated "${source.name}"`, 'success');
  };

  const deleteAgent = async (agentId: string) => {
    setAgents(prev => prev.filter(a => a.id !== agentId));
    await storageService.deleteAgent(agentId);
    addToast('Agent removed from lab', 'info');
  };

  // Task Management
  const addTask = async (data: Omit<BenchmarkTask, 'id'>) => {
    const newTask: BenchmarkTask = {
      ...data,
      id: `task-custom-${Date.now().toString().slice(-4)}`
    };
    setTasks(prev => [newTask, ...prev]);
    await storageService.saveTask(newTask);
    addToast(`Task "${newTask.title}" saved to library`, 'success');
  };

  const deleteTask = async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    await storageService.deleteTask(taskId);
    addToast('Benchmark task deleted', 'info');
  };

  // Run Management
  const deleteRun = async (runId: string) => {
    setRuns(prev => prev.filter(r => r.id !== runId));
    await storageService.deleteRun(runId);
    if (selectedRunId === runId) {
      const remaining = runs.filter(r => r.id !== runId);
      setSelectedRunId(remaining.length > 0 ? remaining[0].id : null);
    }
    addToast('Benchmark run permanently deleted', 'info');
  };

  // Live Runner Execution
  const cancelLiveRun = () => {
    setCancelRequested(true);
    setLiveRunningState(null);
    addToast('Benchmark execution cancelled', 'warning');
  };

  const startBenchmarkRun = async (
    selectedAgentIds: string[], 
    selectedTaskIds: string[], 
    runTitle?: string,
    executionMode: 'real' | 'demo' = 'demo'
  ): Promise<string> => {
    if (selectedAgentIds.length === 0 || selectedTaskIds.length === 0) {
      addToast('Select at least 1 agent and 1 benchmark task to run', 'error');
      throw new Error('Selection empty');
    }

    const isRealRun = executionMode === 'real';

    if (isRealRun && !apiStatus?.hasApiKey) {
      addToast('GEMINI_API_KEY is not configured on the server. Falling back to Demo mode.', 'warning');
      return startBenchmarkRun(selectedAgentIds, selectedTaskIds, runTitle, 'demo');
    }

    const runId = `run-${Date.now().toString().slice(-6)}`;
    const defaultTitle = isRealRun 
      ? `Gemini Live Run: ${selectedAgentIds.length} Agents × ${selectedTaskIds.length} Tasks` 
      : `Arena Simulation: ${selectedAgentIds.length} Agents × ${selectedTaskIds.length} Tasks`;
    const title = runTitle?.trim() || defaultTitle;
    setCancelRequested(false);

    const initialLogs: string[] = isRealRun ? [
      `[00:00.00] Initializing Google Gemini live execution engine...`,
      `[00:00.01] Model: ${settings.preferredGeminiModel || 'gemini-3.8-flash'} via server endpoint.`,
      `[00:00.02] Loaded ${selectedAgentIds.length} agents and ${selectedTaskIds.length} benchmark task suites.`,
      `[00:00.04] Measuring actual provider tokens and wall-clock latency.`
    ] : [
      `[00:00.00] Initializing deterministic mock benchmarking harness...`,
      `[00:00.02] Loaded ${selectedAgentIds.length} agents and ${selectedTaskIds.length} benchmark task suites.`,
      `[00:00.05] Environment: Local Deterministic Demo Runner (No API credits consumed).`
    ];

    setLiveRunningState({
      runId,
      runTitle: title,
      progress: 5,
      currentAgentName: 'Orchestrator',
      currentTaskTitle: 'Preparing task matrix...',
      currentStepMessage: isRealRun ? 'Verifying server-side Gemini connection...' : 'Allocating sandbox execution slots...',
      logs: initialLogs,
      executionMode
    });

    const activeSelectedAgents = agents.filter(a => selectedAgentIds.includes(a.id));
    const activeSelectedTasks = tasks.filter(t => selectedTaskIds.includes(t.id));

    const totalSteps = activeSelectedAgents.length * activeSelectedTasks.length;
    let completedSteps = 0;
    const allResults: AgentTaskResult[] = [];
    const collectedLogs = [...initialLogs];

    const delayPerStep = settings.simulationSpeed === 'instant' ? 50 : settings.simulationSpeed === 'fast' ? 350 : 900;

    for (const task of activeSelectedTasks) {
      for (const agent of activeSelectedAgents) {
        if (cancelRequested) {
          return runId;
        }

        const agentType = agent.id.toLowerCase().includes('planner') ? 'planner' : 'direct';
        const stepMsg = isRealRun 
          ? `Querying Gemini for ${agent.name} on "${task.title}"...` 
          : `Simulating ${agent.name} on "${task.title}"...`;

        collectedLogs.push(`[+] ${agent.name} (${agentType.toUpperCase()}) -> Starting "${task.title}" [${task.category.toUpperCase()}]`);

        // Update UI
        setLiveRunningState(prev => prev ? ({
          ...prev,
          progress: Math.min(95, Math.round(((completedSteps) / totalSteps) * 100)),
          currentAgentName: agent.name,
          currentTaskTitle: task.title,
          currentStepMessage: stepMsg,
          logs: [...collectedLogs].slice(-16)
        }) : null);

        let result: AgentTaskResult;

        if (isRealRun) {
          try {
            const apiResp = await executeAgentViaApi(
              agent.id,
              agentType,
              task,
              settings.preferredGeminiModel || 'gemini-3.8-flash',
              agent.temperature
            );

            if (apiResp.success && apiResp.result) {
              result = apiResp.result;
            } else {
              throw new Error(apiResp.error || 'Gemini execution failed');
            }
          } catch (err: any) {
            collectedLogs.push(`[!] Provider Error: ${err.message}. Logging failure.`);
            result = {
              agentId: agent.id,
              taskId: task.id,
              status: 'fail',
              score: 0,
              latencyMs: 400,
              promptTokens: 0,
              completionTokens: 0,
              totalTokens: 0,
              estimatedCostUsd: 0,
              toolCallsCount: 0,
              errorRecoveryAttempts: 0,
              generatedOutput: `[API Execution Error]: ${err.message}`,
              stepsTrace: [{ stepNumber: 1, type: 'action', content: `Error: ${err.message}`, durationMs: 400 }],
              evaluationVerdict: 'FAILED',
              evaluatorFeedback: `Provider Error: ${err.message}`,
              isSimulated: false,
              errorMessage: err.message
            };
          }
        } else {
          // Demo simulation run
          await new Promise(res => setTimeout(res, delayPerStep));
          result = generateSimulationResult(agent, task);
        }

        allResults.push(result);

        const tokenInfo = result.isSimulated ? `~${result.totalTokens} tok (sim)` : `${result.totalTokens} tok`;
        const costInfo = result.isSimulated ? `$${result.estimatedCostUsd.toFixed(4)} (est)` : `$${result.estimatedCostUsd.toFixed(6)}`;
        collectedLogs.push(`[✓] Done: ${result.status.toUpperCase()} (${result.score}%) | ${result.latencyMs}ms | ${tokenInfo} | Cost: ${costInfo}`);

        completedSteps++;
      }
    }

    // Build summaries
    const summaries = buildRunSummary(selectedAgentIds, allResults);
    const newRun: BenchmarkRun = {
      id: runId,
      name: title,
      timestamp: new Date().toISOString(),
      status: 'completed',
      agentIds: selectedAgentIds,
      taskIds: selectedTaskIds,
      results: allResults,
      summaries,
      isDemoRun: !isRealRun,
      executionMode,
      modelUsed: isRealRun ? (settings.preferredGeminiModel || 'gemini-3.8-flash') : undefined,
      totalExecutionTimeMs: allResults.reduce((acc, r) => acc + r.latencyMs, 0)
    };

    // Save to persistent storage immediately!
    await storageService.saveRun(newRun);

    setRuns(prev => [newRun, ...prev.filter(r => r.id !== newRun.id)]);
    setSelectedRunId(runId);

    setLiveRunningState(null);
    setActiveTab('results');
    const modeBadge = isRealRun ? 'Real Gemini AI' : 'Demo Simulation';
    addToast(`Benchmark "${title}" saved (${modeBadge})! Dynamic Leaderboard updated.`, 'success');

    return runId;
  };

  // Pure dynamic leaderboard calculated strictly from stored benchmark runs
  const leaderboard: DynamicLeaderboardEntry[] = useMemo(() => {
    return computeDynamicLeaderboard(
      computedAgents,
      runs,
      tasks,
      leaderboardModeFilter,
      settings.evaluationWeights
    );
  }, [computedAgents, runs, tasks, leaderboardModeFilter, settings.evaluationWeights]);

  const updateSettings = async (newSettings: Partial<ArenaSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await storageService.saveSettings(updated);
    addToast('Platform settings saved to persistent storage', 'info');
  };

  const exportDataBundle = async (): Promise<StorageExportBundle> => {
    return await storageService.exportData();
  };

  const importDataBundle = async (rawJson: any): Promise<ImportValidationResult> => {
    const result = await storageService.importData(rawJson);
    if (result.success) {
      // Reload from storage
      const [loadedRuns, loadedAgents, loadedTasks, loadedSettings] = await Promise.all([
        storageService.getAllRuns(),
        storageService.getAllAgents(),
        storageService.getAllTasks(),
        storageService.getSettings()
      ]);

      if (loadedAgents.length > 0) setAgents(loadedAgents);
      if (loadedTasks.length > 0) setTasks(loadedTasks);
      if (loadedRuns.length > 0) {
        setRuns(loadedRuns);
        setSelectedRunId(loadedRuns[0].id);
      }
      if (loadedSettings) setSettings({ ...loadedSettings, preferredGeminiModel: 'gemini-3.8-flash' });

      addToast(
        `Import complete: ${result.importedRuns} runs, ${result.importedAgents} agents, ${result.importedTasks} tasks (${result.skippedDuplicates} duplicates skipped).`,
        'success'
      );
    } else {
      addToast(`Import failed: ${result.errors[0] || 'Invalid file format'}`, 'error');
    }
    return result;
  };

  const resetAllData = async () => {
    await storageService.resetToDefaults();
    const [loadedRuns, loadedAgents, loadedTasks, loadedSettings] = await Promise.all([
      storageService.getAllRuns(),
      storageService.getAllAgents(),
      storageService.getAllTasks(),
      storageService.getSettings()
    ]);

    setAgents(loadedAgents);
    setTasks(loadedTasks);
    setRuns(loadedRuns);
    setSelectedRunId(loadedRuns.length > 0 ? loadedRuns[0].id : null);
    setSettings(loadedSettings || DEFAULT_SETTINGS);
    addToast('Reset to original sample data', 'info');
  };

  return (
    <ArenaContext.Provider
      value={{
        activeTab,
        setActiveTab,
        isStorageReady,
        apiStatus,
        refreshApiStatus,
        agents: computedAgents,
        addAgent,
        updateAgent,
        duplicateAgent,
        deleteAgent,
        tasks,
        addTask,
        deleteTask,
        runs,
        selectedRunId,
        setSelectedRunId,
        deleteRun,
        liveRunningState,
        startBenchmarkRun,
        cancelLiveRun,
        leaderboard,
        leaderboardModeFilter,
        setLeaderboardModeFilter,
        settings,
        updateSettings,
        resetAllData,
        exportDataBundle,
        importDataBundle,
        toasts,
        addToast,
        removeToast
      }}
    >
      {children}
    </ArenaContext.Provider>
  );
};

export const useArena = () => {
  const context = useContext(ArenaContext);
  if (!context) {
    throw new Error('useArena must be used within an ArenaProvider');
  }
  return context;
};
