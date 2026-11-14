import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  BarChart3, 
  Clock, 
  Sparkles, 
  ShieldCheck, 
  Calendar, 
  Bot, 
  Filter, 
  Zap, 
  Layers, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { useArena } from '../../context/ArenaContext';
import { Agent, BenchmarkRun, TaskCategory } from '../../types/index.ts';

export const AnalyticsView: React.FC = () => {
  const { runs, agents, tasks, setActiveTab } = useArena();

  // Selected agents for comparison (defaults to all agents with runs, or first 3)
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>(() => {
    return agents.slice(0, 3).map(a => a.id);
  });

  const [dateFilter, setDateFilter] = useState<'all' | '7days' | '30days' | 'last5' | 'last10'>('all');
  const [modeFilter, setModeFilter] = useState<'all' | 'real' | 'demo'>('all');
  const [activeMetricTab, setActiveMetricTab] = useState<'accuracy' | 'latency' | 'tokens' | 'reliability'>('accuracy');

  // Filter completed runs based on date and mode
  const filteredRuns = useMemo(() => {
    let list = runs.filter(r => r.status === 'completed');

    if (modeFilter === 'real') {
      list = list.filter(r => r.executionMode === 'real' || !r.isDemoRun);
    } else if (modeFilter === 'demo') {
      list = list.filter(r => r.isDemoRun || r.executionMode === 'demo');
    }

    const now = Date.now();
    if (dateFilter === '7days') {
      const cut = now - (7 * 24 * 60 * 60 * 1000);
      list = list.filter(r => new Date(r.timestamp).getTime() >= cut);
    } else if (dateFilter === '30days') {
      const cut = now - (30 * 24 * 60 * 60 * 1000);
      list = list.filter(r => new Date(r.timestamp).getTime() >= cut);
    } else if (dateFilter === 'last5') {
      list = list.slice(0, 5);
    } else if (dateFilter === 'last10') {
      list = list.slice(0, 10);
    }

    return list;
  }, [runs, modeFilter, dateFilter]);

  // Aggregate stats per selected agent across filtered runs
  const agentAnalytics = useMemo(() => {
    return selectedAgentIds.map(agentId => {
      const agent = agents.find(a => a.id === agentId);
      if (!agent) return null;

      const results = filteredRuns.flatMap(r => r.results.filter(res => res.agentId === agentId));
      const totalEvaluations = results.length;

      if (totalEvaluations === 0) {
        return {
          agent,
          totalEvaluations: 0,
          avgAccuracy: null,
          avgLatencyMs: null,
          passRate: null,
          reliability: null,
          avgTokens: null,
          totalCost: 0,
          realCount: 0,
          demoCount: 0,
          historyPoints: []
        };
      }

      const totalScore = results.reduce((s, r) => s + r.score, 0);
      const totalLatency = results.reduce((s, r) => s + r.latencyMs, 0);
      const passes = results.filter(r => r.status === 'pass').length;
      const nonErrors = results.filter(r => !r.errorMessage && r.evaluationVerdict !== 'FAILED').length;
      const totalTokens = results.reduce((s, r) => s + (r.totalTokens || 0), 0);
      const totalCost = results.reduce((s, r) => s + (r.estimatedCostUsd || 0), 0);
      const realCount = results.filter(r => !r.isSimulated).length;
      const demoCount = results.filter(r => r.isSimulated).length;

      // History progression over runs (oldest to newest for charts)
      const historyPoints = [...filteredRuns]
        .reverse()
        .map(run => {
          const runResults = run.results.filter(r => r.agentId === agentId);
          if (runResults.length === 0) return null;
          const runScore = Math.round(runResults.reduce((s, r) => s + r.score, 0) / runResults.length);
          const runLatency = Math.round(runResults.reduce((s, r) => s + r.latencyMs, 0) / runResults.length);
          const runTokens = Math.round(runResults.reduce((s, r) => s + (r.totalTokens || 0), 0) / runResults.length);
          return {
            runId: run.id,
            runName: run.name,
            timestamp: run.timestamp,
            score: runScore,
            latency: runLatency,
            tokens: runTokens,
            isDemo: run.isDemoRun
          };
        })
        .filter(Boolean);

      return {
        agent,
        totalEvaluations,
        avgAccuracy: Math.round((totalScore / totalEvaluations) * 10) / 10,
        avgLatencyMs: Math.round(totalLatency / totalEvaluations),
        passRate: Math.round((passes / totalEvaluations) * 100),
        reliability: Math.round((nonErrors / totalEvaluations) * 100),
        avgTokens: Math.round(totalTokens / totalEvaluations),
        totalCost,
        realCount,
        demoCount,
        historyPoints
      };
    }).filter(Boolean);
  }, [selectedAgentIds, agents, filteredRuns]);

  // Check fair benchmarking conditions among selected agents
  const modelComparisonStatus = useMemo(() => {
    const selectedAgents = agents.filter(a => selectedAgentIds.includes(a.id));
    if (selectedAgents.length < 2) return null;

    const models = Array.from(new Set(selectedAgents.map(a => a.model)));
    if (models.length === 1) {
      return {
        isFair: true,
        label: `Fair Strategy Comparison: Identical Model (${models[0]})`,
        description: 'Both agents utilize the same underlying model and temperature parameters. Score variance reflects cognitive architecture and prompt strategy.'
      };
    } else {
      return {
        isFair: false,
        label: `Cross-Model Comparison (${models.join(' vs ')})`,
        description: 'Selected agents utilize different base foundation models. Performance metrics reflect both architectural differences and underlying model weights.'
      };
    }
  }, [selectedAgentIds, agents]);

  const toggleAgent = (id: string) => {
    setSelectedAgentIds(prev => 
      prev.includes(id) 
        ? (prev.length > 1 ? prev.filter(aId => aId !== id) : prev) 
        : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Fair Benchmarking Pill */}
      <div className="arena-card rounded-2xl p-6 border border-arena-700/60 bg-gradient-to-r from-arena-900 via-arena-850 to-arena-900 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-electric-blue text-xs font-semibold mb-1">
              <TrendingUp className="w-4 h-4" />
              <span>Persistent Analytics & Historical Trajectory</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Agent Performance Analytics</h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Comparative longitudinal telemetry computed strictly from saved benchmark trials
            </p>
          </div>

          <button
            onClick={() => setActiveTab('run-benchmark')}
            className="px-4 py-2 rounded-xl bg-electric-blue hover:bg-electric-blue/90 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-electric-blue/20 transition-all self-start sm:self-auto"
          >
            <span>Run New Benchmark</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Fair Strategy Status Banner */}
        {modelComparisonStatus && (
          <div className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
            modelComparisonStatus.isFair 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}>
            <span className="font-mono font-bold uppercase text-[10px] px-2 py-0.5 rounded bg-black/30 border border-current">
              {modelComparisonStatus.isFair ? 'FAIR COMPARISON' : 'CROSS-MODEL'}
            </span>
            <span className="font-semibold">{modelComparisonStatus.label}:</span>
            <span className="text-slate-300 hidden md:inline">{modelComparisonStatus.description}</span>
          </div>
        )}
      </div>

      {/* Global Filter Controls */}
      <div className="arena-card rounded-xl p-4 border border-arena-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Agent Selector Chips */}
        <div className="flex-1 space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Select Agents to Compare:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {agents.map(ag => {
              const isSelected = selectedAgentIds.includes(ag.id);
              return (
                <button
                  key={ag.id}
                  onClick={() => toggleAgent(ag.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all border ${
                    isSelected 
                      ? 'bg-electric-blue/20 text-electric-blue border-electric-blue/50 shadow-sm' 
                      : 'bg-arena-950 text-slate-400 border-arena-800 hover:text-slate-200'
                  }`}
                >
                  {ag.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Date & Mode Filters */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Mode Filter */}
          <div className="flex items-center rounded-xl bg-arena-950 p-1 border border-arena-750">
            {(['all', 'real', 'demo'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setModeFilter(mode)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium uppercase transition-all ${
                  modeFilter === mode 
                    ? 'bg-electric-blue text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode === 'all' ? 'All Trials' : mode === 'real' ? 'Real AI' : 'Demo'}
              </button>
            ))}
          </div>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl bg-arena-950 border border-arena-750 text-xs text-white focus:outline-none focus:border-electric-blue"
          >
            <option value="all">All Saved Runs ({filteredRuns.length})</option>
            <option value="last5">Last 5 Runs</option>
            <option value="last10">Last 10 Runs</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Aggregate Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {agentAnalytics.map((item: any) => {
          if (!item) return null;
          const { agent, totalEvaluations, avgAccuracy, avgLatencyMs, passRate, reliability, avgTokens, totalCost, realCount, demoCount } = item;

          return (
            <div key={agent.id} className="arena-card rounded-2xl p-5 border border-arena-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-arena-800 text-electric-cyan border border-electric-cyan/20">
                  {agent.framework}
                </span>
                <span className="text-[11px] font-mono text-slate-400 truncate max-w-[120px]">
                  {agent.model}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white">{agent.name}</h3>
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <span>{totalEvaluations} evaluated trials</span>
                  {realCount > 0 && (
                    <span className="text-emerald-400 font-semibold">• {realCount} Real AI</span>
                  )}
                  {demoCount > 0 && (
                    <span className="text-amber-400 font-semibold">• {demoCount} Demo</span>
                  )}
                </div>
              </div>

              {totalEvaluations > 0 ? (
                <div className="grid grid-cols-2 gap-2 text-center text-xs py-2 px-2.5 rounded-xl bg-arena-950 border border-arena-800">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Avg Accuracy</div>
                    <div className="font-mono font-bold text-emerald-400">{avgAccuracy}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Pass Rate</div>
                    <div className="font-mono font-bold text-electric-blue">{passRate}%</div>
                  </div>
                  <div className="pt-1.5 border-t border-arena-800">
                    <div className="text-[10px] text-slate-400 uppercase">Avg Latency</div>
                    <div className="font-mono text-slate-200">{avgLatencyMs} ms</div>
                  </div>
                  <div className="pt-1.5 border-t border-arena-800">
                    <div className="text-[10px] text-slate-400 uppercase">Reliability</div>
                    <div className="font-mono text-electric-violet">{reliability}%</div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-arena-950/60 border border-arena-800 text-center text-xs text-slate-500 italic">
                  No benchmark trials recorded in this filter window
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Metric Visualizer Section */}
      <div className="arena-card rounded-2xl p-6 border border-arena-700/60 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-arena-750">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-electric-blue" />
              <span>Comparative Benchmark Telemetry</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Empirical historical comparison across selected agent architectures
            </p>
          </div>

          <div className="flex items-center rounded-xl bg-arena-950 p-1 border border-arena-750">
            <button
              onClick={() => setActiveMetricTab('accuracy')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeMetricTab === 'accuracy' ? 'bg-electric-blue text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Accuracy (%)
            </button>
            <button
              onClick={() => setActiveMetricTab('latency')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeMetricTab === 'latency' ? 'bg-electric-blue text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Latency (ms)
            </button>
            <button
              onClick={() => setActiveMetricTab('tokens')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeMetricTab === 'tokens' ? 'bg-electric-blue text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Token Overhead
            </button>
            <button
              onClick={() => setActiveMetricTab('reliability')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeMetricTab === 'reliability' ? 'bg-electric-blue text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Reliability (%)
            </button>
          </div>
        </div>

        {/* Visual Multi-Bar Graph */}
        <div className="space-y-4">
          {agentAnalytics.map((item: any) => {
            if (!item) return null;
            const { agent, avgAccuracy, avgLatencyMs, avgTokens, reliability, totalEvaluations } = item;

            let value = 0;
            let displayVal = 'N/A';
            let barColor = 'from-electric-blue to-electric-indigo';
            let percentage = 0;

            if (totalEvaluations > 0) {
              if (activeMetricTab === 'accuracy') {
                value = avgAccuracy || 0;
                displayVal = `${value}%`;
                barColor = 'from-emerald-400 to-teal-500';
                percentage = Math.min(100, Math.max(5, value));
              } else if (activeMetricTab === 'latency') {
                value = avgLatencyMs || 0;
                displayVal = `${value} ms`;
                barColor = 'from-violet-500 to-purple-600';
                percentage = Math.min(100, Math.max(5, (value / 4000) * 100));
              } else if (activeMetricTab === 'tokens') {
                value = avgTokens || 0;
                displayVal = `${value} tokens / task`;
                barColor = 'from-cyan-400 to-blue-500';
                percentage = Math.min(100, Math.max(5, (value / 3000) * 100));
              } else if (activeMetricTab === 'reliability') {
                value = reliability || 0;
                displayVal = `${value}%`;
                barColor = 'from-amber-400 to-orange-500';
                percentage = Math.min(100, Math.max(5, value));
              }
            }

            return (
              <div key={agent.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">{agent.name}</span>
                    <span className="text-[10px] font-mono text-slate-400">({agent.model})</span>
                  </div>
                  <span className="font-mono font-bold text-white">{displayVal}</span>
                </div>

                <div className="w-full bg-arena-950 rounded-full h-3 p-0.5 border border-arena-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-arena-750 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-electric-blue" />
            <span>Metrics are derived from actual recorded runs in browser persistent storage.</span>
          </span>
          <span className="font-mono text-[11px] text-slate-500">
            {filteredRuns.length} total benchmark runs analyzed
          </span>
        </div>
      </div>
    </div>
  );
};
