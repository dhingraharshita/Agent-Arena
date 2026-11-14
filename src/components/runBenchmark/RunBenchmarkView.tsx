import React, { useState } from 'react';
import { 
  PlayCircle, 
  Bot, 
  ListChecks, 
  Check, 
  ShieldCheck, 
  AlertTriangle, 
  Sliders, 
  Terminal, 
  Activity, 
  RotateCcw, 
  Zap,
  Sparkles,
  Info,
  KeyRound,
  ExternalLink,
  Cpu
} from 'lucide-react';
import { useArena } from '../../context/ArenaContext';

export const RunBenchmarkView: React.FC = () => {
  const { 
    agents, 
    tasks, 
    startBenchmarkRun, 
    liveRunningState, 
    cancelLiveRun,
    settings,
    updateSettings,
    apiStatus,
    refreshApiStatus,
    setActiveTab
  } = useArena();

  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>(() => 
    agents.slice(0, 2).map(a => a.id) // Default Direct + Planner
  );

  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>(() => 
    tasks.slice(0, 3).map(t => t.id)
  );

  const [runTitle, setRunTitle] = useState('');
  const [executionMode, setExecutionMode] = useState<'real' | 'demo'>(() => 
    apiStatus?.hasApiKey ? 'real' : 'demo'
  );
  const [isLaunching, setIsLaunching] = useState(false);
  const [showKeySetupModal, setShowKeySetupModal] = useState(false);

  // Agent selection toggle
  const toggleAgent = (id: string) => {
    setSelectedAgentIds(prev => 
      prev.includes(id) 
        ? (prev.length > 1 ? prev.filter(aId => aId !== id) : prev) 
        : [...prev, id]
    );
  };

  const selectAllAgents = () => {
    setSelectedAgentIds(agents.map(a => a.id));
  };

  const selectDirectAndPlannerOnly = () => {
    const directAndPlanner = agents
      .filter(a => a.id.includes('direct') || a.id.includes('planner'))
      .map(a => a.id);
    if (directAndPlanner.length > 0) {
      setSelectedAgentIds(directAndPlanner);
    }
  };

  // Task selection toggle
  const toggleTask = (id: string) => {
    setSelectedTaskIds(prev => 
      prev.includes(id) 
        ? (prev.length > 1 ? prev.filter(tId => tId !== id) : prev) 
        : [...prev, id]
    );
  };

  const selectAllTasks = () => {
    setSelectedTaskIds(tasks.map(t => t.id));
  };

  const handleLaunch = async () => {
    if (selectedAgentIds.length === 0 || selectedTaskIds.length === 0) return;
    setIsLaunching(true);
    try {
      await startBenchmarkRun(selectedAgentIds, selectedTaskIds, runTitle, executionMode);
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* If benchmark is actively running, show full live runner view */}
      {liveRunningState ? (
        <div className="arena-card rounded-2xl p-6 sm:p-8 border border-electric-blue/50 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-arena-750">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold border ${
                liveRunningState.executionMode === 'real'
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-electric-blue/15 text-electric-blue border-electric-blue/30'
              }">
                <Activity className="w-3.5 h-3.5 animate-spin" />
                <span>
                  {liveRunningState.executionMode === 'real' ? 'REAL GEMINI AI TRIAL IN PROGRESS' : 'DEMO SIMULATION TRIAL IN PROGRESS'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">{liveRunningState.runTitle}</h2>
              <p className="text-xs text-slate-400">
                Evaluating {selectedAgentIds.length} agents against {selectedTaskIds.length} benchmark task suites
                {liveRunningState.executionMode === 'real' ? ' via server-side Gemini API' : ' (Local deterministic simulator)'}
              </p>
            </div>

            <button
              onClick={cancelLiveRun}
              className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-all self-start sm:self-auto"
            >
              Cancel Execution
            </button>
          </div>

          {/* Overall Progress Meter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">
                Overall Matrix Progress ({liveRunningState.progress}%)
              </span>
              <span className="font-mono text-electric-blue">
                Current Agent: {liveRunningState.currentAgentName}
              </span>
            </div>
            <div className="w-full bg-arena-950 rounded-full h-3 p-0.5 border border-arena-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-electric-blue via-electric-indigo to-electric-violet transition-all duration-300 shadow-sm"
                style={{ width: `${liveRunningState.progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="truncate">Task: <strong className="text-slate-200">{liveRunningState.currentTaskTitle}</strong></span>
              <span className="font-mono text-slate-400">{liveRunningState.currentStepMessage}</span>
            </div>
          </div>

          {/* Active Agents Live Status Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {selectedAgentIds.map(aId => {
              const agent = agents.find(a => a.id === aId);
              const isCurrent = liveRunningState.currentAgentName === agent?.name;
              return (
                <div
                  key={aId}
                  className={`p-3 rounded-xl border text-xs transition-all ${
                    isCurrent 
                      ? 'bg-electric-blue/10 border-electric-blue/50 text-white shadow-md' 
                      : 'bg-arena-950/60 border-arena-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold truncate">{agent?.name}</span>
                    {isCurrent && <span className="w-2 h-2 rounded-full bg-electric-blue animate-ping" />}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">{agent?.framework}</div>
                </div>
              );
            })}
          </div>

          {/* Live Terminal Output Stream */}
          <div className="rounded-xl bg-arena-950 border border-arena-800 overflow-hidden font-mono text-xs">
            <div className="px-4 py-2 bg-arena-900 border-b border-arena-800 flex items-center justify-between text-slate-400">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-electric-cyan" />
                <span className="text-[11px] font-semibold text-slate-300">Live Execution Stream</span>
              </div>
              <span className={`text-[10px] font-mono ${
                liveRunningState.executionMode === 'real' ? 'text-emerald-400 font-bold' : 'text-amber-400'
              }`}>
                {liveRunningState.executionMode === 'real' ? 'REAL GEMINI API' : 'DEMO HARNESS'}
              </span>
            </div>
            <div className="p-4 space-y-1.5 max-h-60 overflow-y-auto text-[11px]">
              {liveRunningState.logs.map((log, i) => (
                <div key={i} className="text-slate-300 leading-relaxed font-mono">
                  {log.includes('Completed') || log.includes('Finished') ? (
                    <span className="text-emerald-400 font-semibold">{log}</span>
                  ) : log.includes('Starting') ? (
                    <span className="text-electric-blue">{log}</span>
                  ) : log.includes('Error') ? (
                    <span className="text-rose-400 font-semibold">{log}</span>
                  ) : (
                    <span className="text-slate-400">{log}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Configuration & Setup View */
        <div className="space-y-6">
          {/* Header Info Banner */}
          <div className="arena-card rounded-2xl p-5 border border-arena-700/60 bg-gradient-to-r from-arena-900 via-arena-850 to-arena-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Configure Benchmark Matrix</h2>
                {apiStatus?.hasApiKey ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>GEMINI API READY</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>DEMO MODE ACTIVE</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Benchmark **Direct Agent** vs **Planner Agent** on identical tasks under fair conditions. 
                Execute with Google's Gemini API server-side or run instant local deterministic simulations.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-white">
                  {selectedAgentIds.length} Agents × {selectedTaskIds.length} Tasks
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  = {selectedAgentIds.length * selectedTaskIds.length} Total Trials
                </div>
              </div>

              <button
                onClick={handleLaunch}
                disabled={selectedAgentIds.length === 0 || selectedTaskIds.length === 0 || isLaunching}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-electric-blue via-electric-indigo to-electric-violet hover:from-electric-blue/90 hover:to-electric-violet/90 text-white text-xs font-bold shadow-xl shadow-electric-blue/20 hover:shadow-electric-blue/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
              >
                <PlayCircle className="w-4 h-4 fill-current" />
                <span>
                  {executionMode === 'real' ? 'Run Live Gemini Benchmark' : 'Run Benchmark (Demo)'}
                </span>
              </button>
            </div>
          </div>

          {/* Execution Engine Selector & Options */}
          <div className="arena-card rounded-xl p-5 border border-arena-700/60 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-arena-750">
              <div>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-electric-blue" />
                  <span>Execution Engine Mode</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Select between server-side Gemini execution or deterministic local simulation
                </p>
              </div>

              {/* Engine Switcher */}
              <div className="flex items-center rounded-xl bg-arena-950 p-1 border border-arena-750">
                <button
                  onClick={() => {
                    if (!apiStatus?.hasApiKey) {
                      setShowKeySetupModal(true);
                    } else {
                      setExecutionMode('real');
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    executionMode === 'real'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Real Gemini API</span>
                  {apiStatus?.hasApiKey ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-white ml-0.5" />
                  ) : (
                    <KeyRound className="w-3 h-3 text-amber-400 ml-0.5" />
                  )}
                </button>

                <button
                  onClick={() => setExecutionMode('demo')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    executionMode === 'demo'
                      ? 'bg-electric-blue text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Demo Simulation</span>
                </button>
              </div>
            </div>

            {/* Mode Explanation Banner */}
            {executionMode === 'real' ? (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-semibold flex items-center gap-2">
                    <span>Active Model: {settings.preferredGeminiModel || 'gemini-3.8-flash'}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200 border border-emerald-500/40">
                      LIVE SERVER-SIDE
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Runs real LLM prompts server-side without exposing API keys. Evaluates outputs against deterministic rubrics and records exact token metrics reported by Google.
                  </p>
                </div>
                <div className="text-[11px] font-mono text-emerald-300 shrink-0">
                  Input: $0.075/1M • Output: $0.30/1M
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-semibold flex items-center gap-2">
                    <span>Deterministic Mock Simulation Mode</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-500/40">
                      NO CREDITS REQUIRED
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Generates reproducible step traces and test scores locally. All resulting rows will be explicitly labeled as DEMO DATA.
                  </p>
                </div>
                {!apiStatus?.hasApiKey && (
                  <button
                    onClick={() => setShowKeySetupModal(true)}
                    className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold text-xs border border-amber-500/40 shrink-0 flex items-center gap-1.5 transition-colors"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Configure Gemini Key</span>
                  </button>
                )}
              </div>
            )}

            {/* Trial Details Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Custom Benchmark Run Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Direct vs Planner Head-to-Head Comparison"
                  value={runTitle}
                  onChange={(e) => setRunTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-arena-950 border border-arena-750 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-electric-blue"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Pacing / Speed
                </label>
                <div className="flex items-center rounded-xl bg-arena-950 p-1 border border-arena-750">
                  <button
                    onClick={() => updateSettings({ simulationSpeed: 'fast' })}
                    className={`flex-1 py-1 rounded-lg text-xs font-medium transition-all ${
                      settings.simulationSpeed === 'fast' 
                        ? 'bg-electric-blue text-white shadow-sm' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Fast (1x)
                  </button>
                  <button
                    onClick={() => updateSettings({ simulationSpeed: 'instant' })}
                    className={`flex-1 py-1 rounded-lg text-xs font-medium transition-all ${
                      settings.simulationSpeed === 'instant' 
                        ? 'bg-electric-blue text-white shadow-sm' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Instant
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Agent Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-electric-blue" />
                <h3 className="text-sm font-bold text-white">Select Agents to Benchmark</h3>
                <span className="text-xs text-slate-400">({selectedAgentIds.length} selected)</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={selectDirectAndPlannerOnly}
                  className="text-xs font-semibold text-electric-cyan hover:underline transition-colors"
                  title="Direct Agent vs Planner Agent"
                >
                  Direct vs Planner Only
                </button>
                <button
                  onClick={selectAllAgents}
                  className="text-xs font-semibold text-electric-blue hover:text-electric-cyan transition-colors"
                >
                  Select All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {agents.map(agent => {
                const isSelected = selectedAgentIds.includes(agent.id);
                const isCoreAgent = agent.id.includes('direct') || agent.id.includes('planner');
                return (
                  <div
                    key={agent.id}
                    onClick={() => toggleAgent(agent.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-electric-blue/10 border-electric-blue/50 text-white shadow-md shadow-electric-blue/5'
                        : 'bg-arena-900/80 border-arena-750/70 text-slate-400 hover:bg-arena-850 hover:text-slate-200'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md mt-0.5 flex items-center justify-center border shrink-0 transition-all ${
                      isSelected ? 'bg-electric-blue border-electric-blue text-white' : 'border-slate-600'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-xs font-bold truncate text-white">{agent.name}</span>
                        {isCoreAgent && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            GEMINI READY
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono truncate">{agent.model}</p>
                      <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-400">
                        <span>Tools: <strong className="text-slate-300">{agent.tools.length}</strong></span>
                        <span>•</span>
                        <span>Avg Acc: <strong className="text-emerald-400">{agent.avgAccuracy}%</strong></span>
                        <span>•</span>
                        <span>{agent.avgLatencyMs}ms</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Task Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-electric-violet" />
                <h3 className="text-sm font-bold text-white">Select Benchmark Tasks</h3>
                <span className="text-xs text-slate-400">({selectedTaskIds.length} selected)</span>
              </div>
              <button
                onClick={selectAllTasks}
                className="text-xs font-semibold text-electric-blue hover:text-electric-cyan transition-colors"
              >
                Select All Tasks
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {tasks.map(task => {
                const isSelected = selectedTaskIds.includes(task.id);
                return (
                  <div
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-electric-violet/10 border-electric-violet/50 text-white shadow-md shadow-electric-violet/5'
                        : 'bg-arena-900/80 border-arena-750/70 text-slate-400 hover:bg-arena-850 hover:text-slate-200'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md mt-0.5 flex items-center justify-center border shrink-0 transition-all ${
                      isSelected ? 'bg-electric-violet border-electric-violet text-white' : 'border-slate-600'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-bold truncate text-white">{task.title}</span>
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-arena-800 text-electric-blue">
                          {task.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                        {task.description}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400">
                        <span className="uppercase font-semibold text-amber-400">{task.difficulty}</span>
                        <span>•</span>
                        <span>{task.timeoutSeconds}s timeout</span>
                        <span>•</span>
                        <span>{task.evaluationCriteria.length} criteria checkpoints</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Launch Action Bar */}
          <div className="pt-4 border-t border-arena-750/70 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              {executionMode === 'real' ? (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Real AI Agent execution will query Google Gemini server-side and calculate actual token counts.</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Simulated environment: Results will be clearly identified with DEMO DATA badges.</span>
                </>
              )}
            </div>

            <button
              onClick={handleLaunch}
              disabled={selectedAgentIds.length === 0 || selectedTaskIds.length === 0 || isLaunching}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-electric-blue via-electric-indigo to-electric-violet hover:from-electric-blue/90 hover:to-electric-violet/90 text-white text-xs font-bold shadow-xl shadow-electric-blue/20 hover:shadow-electric-blue/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <PlayCircle className="w-4 h-4 fill-current" />
              <span>
                {executionMode === 'real' ? 'Execute Live Gemini Matrix' : 'Execute Demo Simulation'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Gemini API Key Setup Modal */}
      {showKeySetupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="arena-card max-w-lg w-full rounded-2xl p-6 border border-arena-600/70 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                <KeyRound className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-white">Configure Gemini API Key</h3>
                <p className="text-xs text-amber-400 font-mono mt-0.5">
                  Server-Side Environment Variable Setup
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
              <p>
                To enable **Real AI Agent Execution**, set your Gemini API key on the server. Your key is kept secure on the backend and is never exposed to the frontend.
              </p>

              <div className="p-3.5 rounded-xl bg-arena-950 border border-arena-800 space-y-2 font-mono text-[11px]">
                <div className="text-slate-400"># 1. Create a .env file in the project root:</div>
                <div className="text-electric-cyan font-bold">GEMINI_API_KEY=AIzaSy...your_key_here</div>
                <div className="text-slate-400"># 2. (Optional) Set the model:</div>
                <div className="text-electric-blue">GEMINI_MODEL=gemini-3.8-flash</div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span>Don't have a Gemini API key?</span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-electric-blue hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>Get one free at Google AI Studio</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="pt-3 border-t border-arena-750 flex items-center justify-between">
              <button
                onClick={async () => {
                  await refreshApiStatus();
                  if (apiStatus?.hasApiKey) {
                    setExecutionMode('real');
                    setShowKeySetupModal(false);
                  }
                }}
                className="px-3.5 py-1.5 rounded-lg bg-arena-850 hover:bg-arena-800 text-xs font-semibold text-slate-300 transition-colors"
              >
                Re-check API Key
              </button>

              <button
                onClick={() => setShowKeySetupModal(false)}
                className="px-4 py-2 rounded-xl bg-electric-blue hover:bg-electric-blue/90 text-white text-xs font-semibold"
              >
                Continue in Demo Mode
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
