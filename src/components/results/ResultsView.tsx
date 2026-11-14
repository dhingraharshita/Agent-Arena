import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  DollarSign, 
  Cpu, 
  ShieldCheck, 
  Trash2, 
  ArrowUpDown, 
  Terminal, 
  Layers, 
  X,
  Sparkles,
  FileText,
  Search,
  ExternalLink,
  Zap,
  TrendingUp,
  Filter,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { useArena } from '../../context/ArenaContext';
import { BenchmarkRun, AgentTaskResult, ExecutionStep } from '../../types/index.ts';
import { AnalyticsView } from '../analytics/AnalyticsView.tsx';

export const ResultsView: React.FC = () => {
  const { runs, selectedRunId, setSelectedRunId, deleteRun, agents, tasks, setActiveTab } = useArena();
  
  // Tab switcher: 'matrix' | 'analytics'
  const [activeSubTab, setActiveSubTab] = useState<'matrix' | 'analytics'>('matrix');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState<'all' | 'real' | 'demo'>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'score' | 'latency'>('newest');

  // Modal inspection & deletion states
  const [inspectingResult, setInspectingResult] = useState<AgentTaskResult | null>(null);
  const [runToDelete, setRunToDelete] = useState<BenchmarkRun | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filtered and sorted runs
  const filteredRuns = useMemo(() => {
    return runs.filter(run => {
      const matchesSearch = 
        run.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        run.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        run.results.some(r => r.generatedOutput.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesMode = 
        modeFilter === 'all' || 
        (modeFilter === 'real' && (run.executionMode === 'real' || !run.isDemoRun)) ||
        (modeFilter === 'demo' && (run.executionMode === 'demo' || run.isDemoRun));

      const matchesAgent = 
        agentFilter === 'all' || run.agentIds.includes(agentFilter);

      return matchesSearch && matchesMode && matchesAgent;
    }).sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      if (sortBy === 'oldest') return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      if (sortBy === 'score') {
        const avgA = a.summaries.reduce((s, x) => s + x.avgScore, 0) / (a.summaries.length || 1);
        const avgB = b.summaries.reduce((s, x) => s + x.avgScore, 0) / (b.summaries.length || 1);
        return avgB - avgA;
      }
      if (sortBy === 'latency') return a.totalExecutionTimeMs - b.totalExecutionTimeMs;
      return 0;
    });
  }, [runs, searchQuery, modeFilter, agentFilter, sortBy]);

  const currentRun: BenchmarkRun | undefined = runs.find(r => r.id === selectedRunId) || filteredRuns[0] || runs[0];

  const downloadBenchmarkFile = (
    content: string,
    filename: string,
    mimeType: string
  ) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const exportRunAsJSON = () => {
    if (!currentRun) return;

    const report = {
      exportedAt: new Date().toISOString(),
      platform: 'AgentArena',
      reportType: currentRun.isDemoRun ? 'SIMULATED' : 'REAL_EXECUTION',
      run: currentRun,
      agents: runAgents,
      tasks: runTasks
    };

    downloadBenchmarkFile(
      JSON.stringify(report, null, 2),
      `agentarena-report-${currentRun.id}.json`,
      'application/json'
    );
  };

  const exportRunAsCSV = () => {
    if (!currentRun) return;

    const escapeCSV = (value: unknown) =>
      `"${String(value ?? '').replace(/"/g, '""')}"`;

    const headers = [
      'Run Name',
      'Execution Mode',
      'Date',
      'Agent',
      'Model',
      'Task',
      'Status',
      'Score',
      'Latency (ms)',
      'Prompt Tokens',
      'Completion Tokens',
      'Total Tokens',
      'Estimated Cost (USD)',
      'Tool Calls',
      'Simulated'
    ];

    const rows = currentRun.results.map(result => {
      const agent = agents.find(a => a.id === result.agentId);
      const task = tasks.find(t => t.id === result.taskId);

      return [
        currentRun.name,
        currentRun.isDemoRun ? 'DEMO' : 'REAL',
        currentRun.timestamp,
        agent?.name ?? result.agentId,
        result.modelUsed ?? agent?.model ?? 'Unknown',
        task?.title ?? result.taskId,
        result.status,
        result.score,
        result.latencyMs,
        result.promptTokens,
        result.completionTokens,
        result.totalTokens,
        result.estimatedCostUsd,
        result.toolCallsCount,
        result.isSimulated ? 'Yes' : 'No'
      ];
    });

    const csv = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');

    downloadBenchmarkFile(
      '\uFEFF' + csv,
      `agentarena-report-${currentRun.id}.csv`,
      'text/csv;charset=utf-8'
    );
  };


  const runAgents = currentRun ? agents.filter(a => currentRun.agentIds.includes(a.id)) : [];
  const runTasks = currentRun ? tasks.filter(t => currentRun.taskIds.includes(t.id)) : [];

  const handleDeleteConfirm = async () => {
    if (runToDelete) {
      await deleteRun(runToDelete.id);
      setRunToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Benchmark Results & Analytics</span>
            <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-arena-850 text-slate-300 border border-arena-750">
              {runs.length} Saved Runs
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Inspect individual task executions, view step traces, and analyze historical trends
          </p>
        </div>

        {/* View Switcher: Matrix vs Analytics */}
        <div className="flex items-center rounded-xl bg-arena-900 p-1 border border-arena-750 self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab('matrix')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeSubTab === 'matrix' 
                ? 'bg-electric-blue text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Run Results & Traces</span>
          </button>
          <button
            onClick={() => setActiveSubTab('analytics')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeSubTab === 'analytics' 
                ? 'bg-electric-blue text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Historical Analytics</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'analytics' ? (
        <AnalyticsView />
      ) : (
        /* Matrix & Trace Inspection View */
        <div className="space-y-6">
          {/* Search, Filter & Run Selector Bar */}
          <div className="arena-card rounded-2xl p-5 border border-arena-700/60 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search runs, tasks, prompt text..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-arena-950 border border-arena-750 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-electric-blue"
                />
              </div>

              {/* Mode Filter */}
              <div>
                <select
                  value={modeFilter}
                  onChange={(e) => setModeFilter(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-arena-950 border border-arena-750 text-xs text-white focus:outline-none focus:border-electric-blue"
                >
                  <option value="all">All Execution Modes</option>
                  <option value="real">Real Gemini AI Only</option>
                  <option value="demo">Demo Simulation Only</option>
                </select>
              </div>

              {/* Agent Filter */}
              <div>
                <select
                  value={agentFilter}
                  onChange={(e) => setAgentFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-arena-950 border border-arena-750 text-xs text-white focus:outline-none focus:border-electric-blue"
                >
                  <option value="all">All Agents</option>
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-arena-950 border border-arena-750 text-xs text-white focus:outline-none focus:border-electric-blue"
                >
                  <option value="newest">Sort: Newest First</option>
                  <option value="oldest">Sort: Oldest First</option>
                  <option value="score">Sort: Highest Score</option>
                  <option value="latency">Sort: Fastest Execution</option>
                </select>
              </div>
            </div>

            {/* Run Selection Strip */}
            <div className="pt-3 border-t border-arena-750 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-xs font-semibold text-slate-400 shrink-0">Selected Run:</span>
                <select
                  value={currentRun?.id || ''}
                  onChange={(e) => setSelectedRunId(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-arena-950 border border-arena-750 text-xs text-white focus:outline-none focus:border-electric-blue flex-1 max-w-lg truncate"
                >
                  {filteredRuns.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.isDemoRun ? '[DEMO]' : '[GEMINI]'} {r.name} — {new Date(r.timestamp).toLocaleDateString()} {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </option>
                  ))}
                </select>
              </div>

              {currentRun && (
                <button
                  onClick={() => setRunToDelete(currentRun)}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete This Run</span>
                </button>
              )}
            </div>
          </div>

              {currentRun && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-arena-700/60 bg-arena-900/60 p-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Export Benchmark Report
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Download the selected run's metrics and execution data.
                      {currentRun.isDemoRun
                        ? ' This report contains simulated results.'
                        : ' This report contains real execution results.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={exportRunAsCSV}
                      className="px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/20"
                    >
                      Export CSV
                    </button>

                    <button
                      onClick={exportRunAsJSON}
                      className="px-4 py-2 rounded-lg bg-electric-blue/10 border border-electric-blue/30 text-electric-blue text-xs font-semibold hover:bg-electric-blue/20"
                    >
                      Export JSON
                    </button>
                  </div>
                </div>
              )}

          {/* Current Run Scorecard & Metadata */}
          {currentRun ? (
            <>
              <div className="arena-card rounded-2xl p-5 border border-arena-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase font-semibold">
                      {currentRun.status}
                    </span>

                    {currentRun.isDemoRun ? (
                      <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-amber-400" />
                        <span>DEMO DATA (SIMULATED)</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold flex items-center gap-1 shadow-sm">
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        <span>REAL GEMINI AI EXECUTION</span>
                      </span>
                    )}

                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(currentRun.timestamp).toLocaleDateString()} {new Date(currentRun.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white">{currentRun.name}</h3>
                  <p className="text-xs text-slate-400">
                    {runAgents.length} Agents evaluated on {runTasks.length} Benchmark tasks • Total execution: {(currentRun.totalExecutionTimeMs / 1000).toFixed(2)}s
                  </p>
                </div>
              </div>

              {/* Agent Performance Summary Cards for this Run */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {currentRun.summaries.map(summary => {
                  const agent = agents.find(a => a.id === summary.agentId);
                  return (
                    <div
                      key={summary.agentId}
                      className={`arena-card rounded-xl p-4 border transition-all ${
                        summary.rank === 1 ? 'border-electric-blue/50 bg-electric-blue/5' : 'border-arena-700/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                          summary.rank === 1 ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40' : 'bg-arena-800 text-slate-400'
                        }`}>
                          Rank #{summary.rank}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">{agent?.framework}</span>
                      </div>

                      <h4 className="text-sm font-bold text-white truncate">{agent?.name}</h4>
                      <p className="text-[11px] text-slate-400 font-mono mb-3 truncate">{agent?.model}</p>

                      <div className="grid grid-cols-2 gap-2 text-center text-xs py-2 px-2.5 rounded-lg bg-arena-950/70 border border-arena-800">
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase">Avg Score</div>
                          <div className="font-mono font-bold text-emerald-400">{summary.avgScore}%</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase">Pass Rate</div>
                          <div className="font-mono font-bold text-electric-blue">{summary.passRate}%</div>
                        </div>
                        <div className="pt-1.5 border-t border-arena-800">
                          <div className="text-[10px] text-slate-400 uppercase">Avg Latency</div>
                          <div className="font-mono text-slate-200">{summary.avgLatencyMs} ms</div>
                        </div>
                        <div className="pt-1.5 border-t border-arena-800">
                          <div className="text-[10px] text-slate-400 uppercase">
                            {currentRun.isDemoRun ? 'Est Cost' : 'Cost (Tokens)'}
                          </div>
                          <div className="font-mono text-slate-200">
                            {summary.totalCostUsd ? `$${summary.totalCostUsd.toFixed(4)}` : '$0.0000'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Head-to-Head Comparison Matrix Grid */}
              <div className="arena-card rounded-2xl p-6 border border-arena-700/60 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-electric-blue" />
                      <span>Task-by-Task Comparison Matrix</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Detailed outcomes, measured latencies, and step traces per agent
                    </p>
                  </div>

                  {/* Status filter */}
                  <div className="flex items-center gap-1 bg-arena-950 p-1 rounded-xl border border-arena-750">
                    {['all', 'pass', 'partial', 'fail'].map(s => (
                      <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium uppercase transition-all ${
                          statusFilter === s 
                            ? 'bg-electric-blue text-white shadow-sm' 
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-arena-750">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-arena-900 border-b border-arena-750 text-slate-400 uppercase tracking-wider text-[10px] font-mono">
                      <tr>
                        <th className="py-3 px-4 min-w-[220px]">Benchmark Task</th>
                        {runAgents.map(a => (
                          <th key={a.id} className="py-3 px-4 min-w-[200px]">
                            <div className="font-bold text-white truncate">{a.name}</div>
                            <div className="text-slate-400 font-mono text-[9px]">{a.model}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-arena-800 bg-arena-950/40">
                      {runTasks.map(task => {
                        return (
                          <tr key={task.id} className="hover:bg-arena-850/40 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-white truncate max-w-[240px]">{task.title}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-mono uppercase text-electric-blue">{task.category}</span>
                                <span className="text-slate-500">•</span>
                                <span className="text-[10px] font-mono uppercase text-amber-400">{task.difficulty}</span>
                              </div>
                            </td>

                            {runAgents.map(agent => {
                              const res = currentRun.results.find(r => r.taskId === task.id && r.agentId === agent.id);
                              if (!res) {
                                return (
                                  <td key={agent.id} className="py-3.5 px-4 text-slate-500 italic">
                                    Not evaluated
                                  </td>
                                );
                              }

                              if (statusFilter !== 'all' && res.status !== statusFilter) {
                                return (
                                  <td key={agent.id} className="py-3.5 px-4 text-slate-600 italic">
                                    Hidden by filter
                                  </td>
                                );
                              }

                              let statusBadge = (
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                  PASS ({res.score}%)
                                </span>
                              );
                              if (res.status === 'partial') {
                                statusBadge = (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                    PARTIAL ({res.score}%)
                                  </span>
                                );
                              } else if (res.status === 'fail') {
                                statusBadge = (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                                    FAIL ({res.score}%)
                                  </span>
                                );
                              }

                              return (
                                <td key={agent.id} className="py-3.5 px-4">
                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      {statusBadge}
                                      <span className="font-mono text-[11px] text-slate-300 font-semibold">{res.latencyMs} ms</span>
                                    </div>

                                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                                      <span>
                                        {res.totalTokens ? `${res.totalTokens} tok` : 'N/A'}
                                        {res.isSimulated && <span className="text-[9px] text-amber-400 ml-1">(sim)</span>}
                                      </span>
                                      <span>
                                        {res.estimatedCostUsd ? `$${res.estimatedCostUsd.toFixed(4)}` : 'N/A'}
                                      </span>
                                    </div>

                                    {res.errorMessage && (
                                      <div className="text-[10px] text-rose-400 font-mono truncate" title={res.errorMessage}>
                                        Error: {res.errorMessage}
                                      </div>
                                    )}

                                    <button
                                      onClick={() => setInspectingResult(res)}
                                      className="w-full mt-1 px-2.5 py-1 rounded-lg bg-arena-850 hover:bg-arena-800 text-electric-blue hover:text-white border border-arena-750 text-[11px] font-medium transition-colors flex items-center justify-center gap-1"
                                    >
                                      <Terminal className="w-3 h-3" />
                                      <span>View Output & Trace</span>
                                    </button>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="arena-card rounded-2xl p-12 text-center border border-arena-700/60 max-w-md mx-auto">
              <BarChart3 className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">No Matching Benchmark Runs</h3>
              <p className="text-xs text-slate-400 mb-4">No runs match your current search query or filter selection.</p>
              <button
                onClick={() => { setSearchQuery(''); setModeFilter('all'); setAgentFilter('all'); }}
                className="px-4 py-2 rounded-xl bg-arena-800 text-xs font-semibold text-slate-200"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Trace Inspector Modal */}
      {inspectingResult && (() => {
        const agent = agents.find(a => a.id === inspectingResult.agentId);
        const task = tasks.find(t => t.id === inspectingResult.taskId);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="arena-card max-w-3xl w-full rounded-2xl border border-arena-600/70 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
              {/* Header */}
              <div className="p-5 border-b border-arena-750 flex items-center justify-between bg-arena-900">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-arena-800 text-electric-blue font-bold">
                      {agent?.name}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-arena-800 text-slate-300">
                      Task: {task?.title}
                    </span>
                    {inspectingResult.isSimulated ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        SIMULATED TRACE
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        REAL GEMINI OUTPUT
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-white">Execution Trace & Evaluator Verdict</h3>
                </div>
                <button
                  onClick={() => setInspectingResult(null)}
                  className="p-1 rounded-lg hover:bg-arena-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Score & Verdict Banner */}
                <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  inspectingResult.status === 'pass' 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                    : inspectingResult.status === 'partial' 
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' 
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}>
                  <div>
                    <div className="text-xs uppercase font-mono font-bold tracking-wider">
                      Verdict: {inspectingResult.evaluationVerdict} ({inspectingResult.score}%)
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {inspectingResult.evaluatorFeedback}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                    <div>
                      <div className="text-slate-400 text-[10px]">Latency</div>
                      <div className="font-bold text-white">{inspectingResult.latencyMs} ms</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[10px]">Tokens (In/Out)</div>
                      <div className="font-bold text-white">
                        {inspectingResult.promptTokens || inspectingResult.completionTokens 
                          ? `${inspectingResult.promptTokens} / ${inspectingResult.completionTokens}`
                          : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[10px]">Est. Cost</div>
                      <div className="font-bold text-white">
                        {inspectingResult.estimatedCostUsd ? `$${inspectingResult.estimatedCostUsd.toFixed(6)}` : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step Trace Timeline */}
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-electric-blue" />
                    <span>Agent Step-by-Step Reasoning Trace</span>
                  </h4>
                  <div className="space-y-2">
                    {inspectingResult.stepsTrace.map((step) => {
                      let typeBadge = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
                      if (step.type === 'action') typeBadge = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
                      if (step.type === 'observation') typeBadge = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
                      if (step.type === 'reflection') typeBadge = 'bg-purple-500/10 text-purple-400 border-purple-500/30';
                      if (step.type === 'final_answer') typeBadge = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';

                      return (
                        <div key={step.stepNumber} className="p-3 rounded-xl bg-arena-950 border border-arena-800 space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-400">Step {step.stepNumber}</span>
                              <span className={`px-2 py-0.5 rounded border uppercase ${typeBadge}`}>
                                {step.actionName ? `${step.type}: ${step.actionName}` : step.type}
                              </span>
                            </div>
                            <span className="text-slate-500">{step.durationMs}ms</span>
                          </div>
                          <p className="font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                            {step.content}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Agent Final Output vs Ground Truth */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Agent Generated Output
                    </label>
                    <pre className="p-3 rounded-xl bg-arena-950 font-mono text-xs text-slate-200 border border-arena-800 whitespace-pre-wrap leading-relaxed max-h-52 overflow-y-auto">
                      {inspectingResult.generatedOutput}
                    </pre>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Ground Truth Reference
                    </label>
                    <pre className="p-3 rounded-xl bg-arena-950 font-mono text-xs text-emerald-400 border border-emerald-950/60 whitespace-pre-wrap leading-relaxed max-h-52 overflow-y-auto">
                      {task?.groundTruth}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-arena-750 flex items-center justify-between bg-arena-900/60">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-electric-blue" />
                  <span>
                    {inspectingResult.isSimulated 
                      ? 'Deterministic simulated execution output.' 
                      : 'Live Gemini output evaluated by deterministic rubric.'}
                  </span>
                </div>
                <button
                  onClick={() => setInspectingResult(null)}
                  className="px-4 py-2 rounded-xl bg-arena-800 hover:bg-arena-750 text-xs font-semibold text-slate-300"
                >
                  Close Trace
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Delete Run Confirmation Modal */}
      {runToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="arena-card max-w-md w-full rounded-2xl p-6 border border-rose-500/40 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-white">Delete Benchmark Run?</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Are you sure you want to delete <strong className="text-white font-mono">"{runToDelete.name}"</strong>? This will permanently remove its task traces and update the dynamic leaderboard.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                onClick={() => setRunToDelete(null)}
                className="px-4 py-2 rounded-xl bg-arena-800 hover:bg-arena-750 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/20"
              >
                Delete Run
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
