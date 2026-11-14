import React, { useState } from 'react';
import { 
  Bot, 
  ListChecks, 
  PlayCircle, 
  CheckCircle2, 
  TrendingUp, 
  Zap, 
  ArrowRight, 
  Clock, 
  DollarSign, 
  Cpu, 
  ShieldCheck, 
  BarChart2, 
  Compass, 
  Sparkles 
} from 'lucide-react';
import { useArena } from '../../context/ArenaContext';

export const OverviewView: React.FC<{ onOpenCreateAgent: () => void }> = ({ onOpenCreateAgent }) => {
  const { agents, tasks, runs, setActiveTab, setSelectedRunId } = useArena();
  const [selectedMetric, setSelectedMetric] = useState<'accuracy' | 'latency' | 'cost'>('accuracy');

  // Compute platform aggregate stats
  const totalAgents = agents.length;
  const totalTasks = tasks.length;
  const totalRuns = runs.length;

  let totalEvaluations = 0;
  let totalPasses = 0;
  let totalCostSum = 0;
  runs.forEach(r => {
    r.results.forEach(res => {
      totalEvaluations++;
      if (res.status === 'pass') totalPasses++;
      totalCostSum += res.estimatedCostUsd;
    });
  });

  const avgSuccessRate = totalEvaluations > 0 ? Math.round((totalPasses / totalEvaluations) * 100) : 84;
  const recentRuns = runs.slice(0, 3);

  // Top agents for comparative chart
  const topAgents = agents.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-arena-900 via-arena-850 to-arena-900 border border-arena-700/70 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-electric-violet/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-80 h-80 rounded-full bg-electric-blue/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-electric-blue/10 border border-electric-blue/30 text-electric-blue text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Gen Agent Evaluation Harness</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
            Benchmark Agent Loops, <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-electric-blue via-electric-indigo to-electric-violet bg-clip-text text-transparent">
              Not Just Token Predictions.
            </span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            Evaluate reasoning trajectories, multi-step planning, tool invocation precision, 
            and error recovery across real agent architectures in head-to-head arena trials.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('run-benchmark')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-electric-blue to-electric-indigo hover:from-electric-blue/90 hover:to-electric-indigo/90 text-white font-semibold text-sm shadow-lg shadow-electric-blue/25 hover:shadow-electric-blue/40 transition-all flex items-center gap-2"
            >
              <PlayCircle className="w-4 h-4 fill-current" />
              <span>Launch Arena Trial</span>
            </button>
            <button
              onClick={onOpenCreateAgent}
              className="px-4 py-2.5 rounded-xl bg-arena-800 hover:bg-arena-750 text-slate-200 font-semibold text-sm border border-arena-700 hover:border-slate-500 transition-all flex items-center gap-2"
            >
              <Bot className="w-4 h-4 text-electric-blue" />
              <span>Configure New Agent</span>
            </button>
            <button
              onClick={() => setActiveTab('documentation')}
              className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 text-sm font-medium transition-all"
            >
              Read Docs →
            </button>
          </div>
        </div>
      </div>

      {/* 4 Primary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="arena-card rounded-xl p-5 border border-arena-700/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Agents</span>
            <div className="w-9 h-9 rounded-lg bg-electric-blue/10 text-electric-blue flex items-center justify-center border border-electric-blue/20">
              <Bot className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight font-mono">{totalAgents}</div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
              <span className="text-emerald-400 font-medium">Active in Lab</span>
              <span>•</span>
              <span>4 Frameworks</span>
            </div>
          </div>
        </div>

        <div className="arena-card rounded-xl p-5 border border-arena-700/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Benchmark Tasks</span>
            <div className="w-9 h-9 rounded-lg bg-electric-violet/10 text-electric-violet flex items-center justify-center border border-electric-violet/20">
              <ListChecks className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight font-mono">{totalTasks}</div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
              <span className="text-electric-blue font-medium">6 Categories</span>
              <span>•</span>
              <span>Strict rubrics</span>
            </div>
          </div>
        </div>

        <div className="arena-card rounded-xl p-5 border border-arena-700/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed Trials</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight font-mono">{totalRuns}</div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
              <span className="text-emerald-400 font-mono font-medium">{totalEvaluations}</span>
              <span>Agent evaluations</span>
            </div>
          </div>
        </div>

        <div className="arena-card rounded-xl p-5 border border-arena-700/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Success Rate</span>
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight font-mono">{avgSuccessRate}%</div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
              <span className="text-amber-400 font-medium">Deterministic gate</span>
              <span>•</span>
              <span>Demo baseline</span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Comparison Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Comparison Chart Component */}
        <div className="lg:col-span-2 arena-card rounded-xl p-6 border border-arena-700/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-electric-blue" />
                <span>Agent Architecture Performance Comparison</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Head-to-head empirical trade-offs across standard benchmark suites
              </p>
            </div>

            {/* Metric Switcher */}
            <div className="flex items-center rounded-lg bg-arena-950 p-1 border border-arena-750">
              <button
                onClick={() => setSelectedMetric('accuracy')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  selectedMetric === 'accuracy' 
                    ? 'bg-electric-blue text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Accuracy (%)
              </button>
              <button
                onClick={() => setSelectedMetric('latency')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  selectedMetric === 'latency' 
                    ? 'bg-electric-blue text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Latency (ms)
              </button>
              <button
                onClick={() => setSelectedMetric('cost')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  selectedMetric === 'cost' 
                    ? 'bg-electric-blue text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Cost / 1k ($)
              </button>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="space-y-4">
            {topAgents.map((agent) => {
              let value = agent.avgAccuracy || 75;
              let maxValue = 100;
              let displayStr = `${value}%`;
              let barColor = 'from-electric-blue to-electric-indigo';

              if (selectedMetric === 'latency') {
                value = agent.avgLatencyMs || 1500;
                maxValue = 4000;
                displayStr = `${value} ms`;
                barColor = 'from-violet-500 to-purple-600';
              } else if (selectedMetric === 'cost') {
                const costScore = Math.round((agent.avgAccuracy > 90 ? 28 : agent.avgAccuracy > 80 ? 18 : 8) * 10) / 10;
                value = costScore;
                maxValue = 35;
                displayStr = `$${value.toFixed(2)}`;
                barColor = 'from-emerald-400 to-teal-500';
              }

              const percentage = Math.min(100, Math.max(8, (value / maxValue) * 100));

              return (
                <div key={agent.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200">{agent.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-arena-800 text-slate-400 border border-slate-700/50">
                        {agent.framework}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-white">{displayStr}</span>
                  </div>

                  {/* Bar */}
                  <div className="w-full bg-arena-950 rounded-full h-3 p-0.5 overflow-hidden border border-arena-800">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-500 ease-out`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-arena-750/70 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulated baseline runs for demonstration verification</span>
            </span>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className="text-electric-blue hover:text-electric-cyan font-medium flex items-center gap-1 transition-colors"
            >
              <span>View Full Leaderboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Launch & Category Overview */}
        <div className="space-y-4">
          {/* Quick Actions Card */}
          <div className="arena-card rounded-xl p-5 border border-arena-700/60">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              Quick Actions
            </h4>
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab('run-benchmark')}
                className="w-full text-left p-3 rounded-lg bg-arena-850 hover:bg-arena-800 border border-arena-750 hover:border-electric-blue/40 transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-electric-blue transition-colors">
                    Start Multi-Agent Benchmark
                  </div>
                  <div className="text-[11px] text-slate-400">Select agents & benchmark matrix</div>
                </div>
                <PlayCircle className="w-4 h-4 text-electric-blue" />
              </button>

              <button
                onClick={onOpenCreateAgent}
                className="w-full text-left p-3 rounded-lg bg-arena-850 hover:bg-arena-800 border border-arena-750 hover:border-electric-violet/40 transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-electric-violet transition-colors">
                    Register New Agent
                  </div>
                  <div className="text-[11px] text-slate-400">Configure prompt, tools & framework</div>
                </div>
                <Bot className="w-4 h-4 text-electric-violet" />
              </button>

              <button
                onClick={() => setActiveTab('benchmark-tasks')}
                className="w-full text-left p-3 rounded-lg bg-arena-850 hover:bg-arena-800 border border-arena-750 hover:border-emerald-500/40 transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-emerald-400 transition-colors">
                    Explore Task Library
                  </div>
                  <div className="text-[11px] text-slate-400">Reasoning, extraction, math & code</div>
                </div>
                <ListChecks className="w-4 h-4 text-emerald-400" />
              </button>
            </div>
          </div>

          {/* Evaluation Philosophy Summary */}
          <div className="arena-card rounded-xl p-5 border border-arena-700/60 bg-gradient-to-br from-arena-900 to-arena-850">
            <div className="flex items-center gap-2 mb-2 text-electric-blue text-xs font-bold uppercase tracking-wider">
              <Compass className="w-4 h-4" />
              <span>Evaluation Philosophy</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              AgentArena measures the complete cognitive system: tool dispatch accuracy, multi-step planning loops, and error recovery—not just static prompt completions.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Benchmark Activity Feed */}
      <div className="arena-card rounded-xl p-6 border border-arena-700/60">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-electric-blue" />
              <span>Recent Benchmark Trials</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              History of head-to-head evaluation runs with step traces
            </p>
          </div>
          <button
            onClick={() => setActiveTab('results')}
            className="text-xs font-semibold text-electric-blue hover:text-electric-cyan transition-colors"
          >
            All Results ({runs.length}) →
          </button>
        </div>

        <div className="space-y-3">
          {recentRuns.map((run) => (
            <div
              key={run.id}
              onClick={() => {
                setSelectedRunId(run.id);
                setActiveTab('results');
              }}
              className="p-4 rounded-xl bg-arena-850/80 hover:bg-arena-800 border border-arena-750/80 hover:border-slate-600 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-white group-hover:text-electric-blue transition-colors">
                    {run.name}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {run.status.toUpperCase()}
                  </span>
                  {run.isDemoRun && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      DEMO
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>{run.agentIds.length} Agents</span>
                  <span>•</span>
                  <span>{run.taskIds.length} Benchmark Tasks</span>
                  <span>•</span>
                  <span>{new Date(run.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="text-right">
                  <div className="text-slate-400">Top Performer</div>
                  <div className="font-bold text-electric-blue">
                    {run.summaries.length > 0 ? (agents.find(a => a.id === run.summaries[0].agentId)?.name || 'Agent') : 'N/A'}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
