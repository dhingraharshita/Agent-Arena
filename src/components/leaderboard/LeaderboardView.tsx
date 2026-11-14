import React, { useState } from 'react';
import { 
  Trophy, 
  Medal, 
  HelpCircle, 
  ShieldCheck, 
  ArrowUpRight, 
  Zap, 
  TrendingUp, 
  Award, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Brain, 
  X,
  Play,
  Sparkles
} from 'lucide-react';
import { useArena } from '../../context/ArenaContext';
import { TaskCategory } from '../../types';

export const LeaderboardView: React.FC = () => {
  const {
  leaderboard,
  setActiveTab,
  apiStatus,
  leaderboardModeFilter,
  setLeaderboardModeFilter
} = useArena();
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | 'overall'>('overall');
  const [showFormulaModal, setShowFormulaModal] = useState(false);

  // Sort according to category or overall ELO
  // Hide untested agents when a specific execution mode is selected
const visibleEntries = leaderboard.filter(entry =>
  leaderboardModeFilter === 'all' || entry.hasRecordedRuns
);

// Sort according to category or overall ELO
const sortedEntries = [...visibleEntries].sort((a, b) => {
  if (selectedCategory === 'overall') {
    return b.eloRating - a.eloRating;
  }

  const scoreA = a.categoryScores[selectedCategory] || 0;
  const scoreB = b.categoryScores[selectedCategory] || 0;

  return scoreB - scoreA;
});

  const categories: { id: TaskCategory | 'overall'; label: string }[] = [
    { id: 'overall', label: 'Overall Arena ELO' },
    { id: 'reasoning', label: 'Reasoning' },
    { id: 'mathematics', label: 'Mathematics' },
    { id: 'extraction', label: 'Extraction' },
    { id: 'research', label: 'Research' },
    { id: 'planning', label: 'Planning' },
    { id: 'code', label: 'Code Gen' },
  ];

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="w-7 h-7 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center justify-center font-bold text-xs">
          🥇
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-7 h-7 rounded-full bg-slate-300/20 text-slate-200 border border-slate-300/40 flex items-center justify-center font-bold text-xs">
          🥈
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-7 h-7 rounded-full bg-amber-700/20 text-amber-500 border border-amber-700/40 flex items-center justify-center font-bold text-xs">
          🥉
        </div>
      );
    }
    return (
      <span className="font-mono text-xs text-slate-400 font-bold px-2">
        #{rank}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Transparency & AI Status Banner */}
      <div className="arena-card rounded-2xl p-5 border border-arena-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-electric-blue/15 text-electric-blue flex items-center justify-center shrink-0 border border-electric-blue/30">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>AgentArena Leaderboard & Standings</span>
              {apiStatus?.hasApiKey ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  REAL GEMINI BENCHMARKS ENABLED
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  DEMO STANDINGS
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              Standings rank agents across accuracy, reliability, token cost, and latency. 
              Agents tested via live Gemini AI execution are visibly distinguished with a <span className="text-emerald-400 font-semibold">REAL AI</span> badge.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowFormulaModal(true)}
          className="px-3.5 py-1.5 rounded-xl bg-arena-850 hover:bg-arena-800 text-slate-200 border border-arena-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
        >
          <HelpCircle className="w-3.5 h-3.5 text-electric-blue" />
          <span>Ranking Methodology</span>
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat.id 
                ? 'bg-gradient-to-r from-electric-blue/20 to-electric-indigo/20 text-white border border-electric-blue/40 shadow-sm' 
                : 'bg-arena-900 text-slate-400 border border-arena-750 hover:text-slate-200 hover:bg-arena-850'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Benchmark Data Mode Filter */}
<div className="arena-card rounded-xl p-4 border border-arena-700/60 space-y-3">
  <div>
    <h3 className="text-sm font-bold text-white">
      Benchmark Data Source
    </h3>
    <p className="text-xs text-slate-400 mt-1">
      Compare simulated demonstrations separately from actual AI executions.
    </p>
  </div>

  <div className="flex flex-wrap gap-2">
    {[
      { id: 'all', label: 'All Results' },
      { id: 'real', label: 'Real Gemini Runs' },
      { id: 'demo', label: 'Demo Simulations' }
    ].map(mode => (
      <button
        key={mode.id}
        onClick={() =>
          setLeaderboardModeFilter(
            mode.id as 'all' | 'real' | 'demo'
          )
        }
        className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
          leaderboardModeFilter === mode.id
            ? 'bg-electric-blue/20 text-electric-blue border-electric-blue/50'
            : 'bg-arena-900 text-slate-400 border-arena-750 hover:text-white'
        }`}
      >
        {mode.label}
      </button>
    ))}
  </div>

  {leaderboardModeFilter === 'demo' && (
    <p className="text-xs text-amber-300">
      Demo results are simulated and must not be treated as actual AI performance.
    </p>
  )}

  {leaderboardModeFilter === 'real' && (
    <p className="text-xs text-emerald-300">
      Showing results from real agent executions only.
    </p>
  )}
</div>

      {/* Leaderboard Table Card */}
      <div className="arena-card rounded-2xl border border-arena-700/60 overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-arena-750 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-electric-blue" />
            <div>
              <h3 className="text-base font-bold text-white">Agent Standings</h3>
              <p className="text-xs text-slate-400">
                Sorted by {selectedCategory === 'overall' ? 'Arena Composite ELO' : `${selectedCategory.toUpperCase()} Category Score`}
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('run-benchmark')}
            className="px-3.5 py-1.5 rounded-xl bg-electric-blue/15 hover:bg-electric-blue/25 text-electric-blue border border-electric-blue/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Run New Trial</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-arena-900 border-b border-arena-750 text-slate-400 uppercase tracking-wider text-[10px] font-mono">
              <tr>
                <th className="py-3 px-4 w-12 text-center">Rank</th>
                <th className="py-3 px-4 min-w-[200px]">Agent Architecture</th>
                <th className="py-3 px-4">Arena ELO</th>
                <th className="py-3 px-4">Win Rate</th>
                <th className="py-3 px-4">Avg Accuracy</th>
                <th className="py-3 px-4">Avg Latency</th>
                <th className="py-3 px-4">Cost / 1k</th>
                <th className="py-3 px-4">Reliability</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-arena-800 bg-arena-950/40">
            {sortedEntries.length === 0 && (
  <tr>
    <td colSpan={9} className="py-12 text-center">
      <p className="text-slate-300 font-semibold">
        No benchmark results available
      </p>
      <p className="text-slate-500 text-xs mt-2">
        Run a benchmark in this execution mode to populate the leaderboard.
      </p>
    </td>
  </tr>
)}
              {sortedEntries.map((entry, idx) => {
                const rank = idx + 1;
                const isTop1 = rank === 1;

                return (
                  <tr 
                    key={entry.agentId} 
                    className={`hover:bg-arena-850/50 transition-colors ${
                      isTop1 ? 'bg-electric-blue/5' : ''
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center">
                        {getRankBadge(rank)}
                      </div>
                    </td>

                    {/* Agent Name & Framework */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{entry.agentName}</span>
                        {entry.hasRealRuns ? (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            REAL AI
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-arena-800 text-slate-400 border border-slate-700/50">
                            DEMO
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-arena-800 text-electric-cyan">
                          {entry.framework}
                        </span>
                        <span className="text-slate-400 font-mono text-[11px] truncate max-w-[140px]">
                          {entry.model}
                        </span>
                      </div>
                    </td>

                    {/* ELO Rating */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-extrabold text-sm text-electric-blue">
                        {entry.eloRating}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {entry.completedTasks} trials
                      </div>
                    </td>

                    {/* Win Rate */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-200">{entry.winRate}%</span>
                        <div className="w-12 bg-arena-800 rounded-full h-1.5 overflow-hidden hidden sm:block">
                          <div 
                            className="bg-emerald-400 h-full rounded-full"
                            style={{ width: `${entry.winRate}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Accuracy */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-emerald-400">
                        {entry.avgAccuracy}%
                      </span>
                    </td>

                    {/* Latency */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-slate-300">
                        {entry.avgLatencyMs} ms
                      </span>
                    </td>

                    {/* Cost */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-slate-300">
                        ${entry.costPer1kTasks.toFixed(2)}
                      </span>
                    </td>

                    {/* Reliability */}
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-electric-violet/10 text-electric-violet border border-electric-violet/30">
                        {entry.reliabilityScore}%
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setActiveTab('run-benchmark')}
                        className="px-2.5 py-1 rounded-lg bg-arena-850 hover:bg-arena-800 text-electric-blue hover:text-white border border-arena-750 text-xs font-semibold transition-colors"
                      >
                        Benchmark
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ELO Methodology Modal */}
      {showFormulaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="arena-card max-w-xl w-full rounded-2xl border border-arena-600/70 shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-4 border-b border-arena-750 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-electric-blue/20 text-electric-blue flex items-center justify-center border border-electric-blue/30">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Arena ELO & Scoring Formula</h3>
                  <p className="text-xs text-slate-400">How AgentArena ranks autonomous agents</p>
                </div>
              </div>
              <button
                onClick={() => setShowFormulaModal(false)}
                className="p-1 rounded-lg hover:bg-arena-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <p>
                Unlike single-turn LLM benchmarks, AgentArena uses a multi-factor composite rating:
              </p>

              <div className="p-3.5 rounded-xl bg-arena-950 border border-arena-800 font-mono text-xs text-electric-cyan">
                ELO = 1400 + ((Accuracy - 70) * 14) + ((WinRate - 60) * 8) - ((Latency / 1000) * 15)
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Accuracy Gate (50% weight):</strong> Ground truth adherence, schema validation, and constraint resolution.
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Reliability & Recovery (25% weight):</strong> Tool invocation success rate and resilience against exceptions.
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Latency & Compute Penalty (15% weight):</strong> Wall-clock duration normalized by step complexity.
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Token Cost Efficiency (10% weight):</strong> Normalized dollar cost per 1,000 completed tasks based on measured token usage.
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-arena-750 flex justify-end">
              <button
                onClick={() => setShowFormulaModal(false)}
                className="px-4 py-2 rounded-xl bg-arena-800 hover:bg-arena-750 text-xs font-semibold text-slate-200"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
