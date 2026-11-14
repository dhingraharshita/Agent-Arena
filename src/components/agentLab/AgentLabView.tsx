import React, { useState } from 'react';
import { 
  Bot, 
  Plus, 
  Search, 
  SlidersHorizontal, 
  Copy, 
  Trash2, 
  Edit3, 
  Play, 
  Sparkles, 
  Terminal, 
  Cpu, 
  ShieldCheck, 
  ExternalLink,
  Code2,
  Wrench,
  CheckCircle2,
  X
} from 'lucide-react';
import { useArena } from '../../context/ArenaContext';
import { Agent, AgentFramework } from '../../types';

interface AgentLabViewProps {
  onOpenCreateAgent: () => void;
  onEditAgent: (agent: Agent) => void;
}

export const AgentLabView: React.FC<AgentLabViewProps> = ({ 
  onOpenCreateAgent, 
  onEditAgent 
}) => {
  const { agents, duplicateAgent, deleteAgent, setActiveTab } = useArena();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFramework, setSelectedFramework] = useState<string>('all');
  const [viewingConfigAgent, setViewingConfigAgent] = useState<Agent | null>(null);

  const frameworks: AgentFramework[] = ['LangChain', 'AutoGen', 'CrewAI', 'LlamaIndex', 'Custom'];

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = 
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFramework = selectedFramework === 'all' || agent.framework === selectedFramework;
    return matchesSearch && matchesFramework;
  });

  return (
    <div className="space-y-6">
      {/* Top Controls: Search, Framework Filter, Create Action */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1 flex flex-wrap items-center gap-2.5">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search agents by name, model, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-arena-900 border border-arena-700/70 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-electric-blue transition-colors"
            />
          </div>

          {/* Framework Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <button
              onClick={() => setSelectedFramework('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedFramework === 'all' 
                  ? 'bg-electric-blue/20 text-electric-blue border border-electric-blue/40' 
                  : 'bg-arena-900 text-slate-400 border border-arena-700/60 hover:text-slate-200'
              }`}
            >
              All Frameworks
            </button>
            {frameworks.map(fw => (
              <button
                key={fw}
                onClick={() => setSelectedFramework(fw)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  selectedFramework === fw 
                    ? 'bg-electric-blue/20 text-electric-blue border border-electric-blue/40' 
                    : 'bg-arena-900 text-slate-400 border border-arena-700/60 hover:text-slate-200'
                }`}
              >
                {fw}
              </button>
            ))}
          </div>
        </div>

        {/* Create Agent Action */}
        <button
          onClick={onOpenCreateAgent}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-electric-blue to-electric-indigo hover:from-electric-blue/90 hover:to-electric-indigo/90 text-white text-xs font-semibold shadow-md shadow-electric-blue/20 flex items-center justify-center gap-2 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Register Agent</span>
        </button>
      </div>

      {/* Grid of Agent Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredAgents.map(agent => (
          <div
            key={agent.id}
            className="arena-card rounded-2xl p-5 border border-arena-700/70 flex flex-col justify-between group hover:border-electric-blue/50"
          >
            <div>
              {/* Header: Framework badge & Status */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-arena-800 text-electric-cyan border border-electric-cyan/30">
                  {agent.framework}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] font-medium text-slate-400 capitalize">{agent.status}</span>
                </div>
              </div>

              {/* Title & Model */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-electric-blue/20 to-electric-violet/20 border border-electric-blue/30 text-electric-blue flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-electric-blue transition-colors">
                    {agent.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    {agent.model}
                  </p>
                </div>
              </div>

              {/* Tagline / Description */}
              <p className="text-xs text-slate-300 leading-relaxed mb-4 line-clamp-2">
                {agent.tagline || agent.description}
              </p>

              {/* Key Config Highlights */}
              <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-xl bg-arena-950/60 border border-arena-800 text-center mb-4">
                <div>
                  <div className="text-[10px] uppercase text-slate-400">Temp</div>
                  <div className="text-xs font-mono font-bold text-slate-200">{agent.temperature}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-slate-400">Max Steps</div>
                  <div className="text-xs font-mono font-bold text-slate-200">{agent.maxSteps}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-slate-400">Memory</div>
                  <div className="text-xs font-mono font-bold text-slate-200 capitalize">{agent.memoryType}</div>
                </div>
              </div>

              {/* Tools list */}
              <div className="mb-4">
                <div className="text-[10px] uppercase font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                  <Wrench className="w-3 h-3 text-slate-400" />
                  <span>Configured Tools ({agent.tools.length})</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {agent.tools.length > 0 ? (
                    agent.tools.map((tool, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-arena-850 text-slate-300 border border-arena-750"
                      >
                        {tool}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">No external tools (Direct reasoning)</span>
                  )}
                </div>
              </div>
            </div>

            {/* Performance Stats & Actions */}
            <div className="pt-3 border-t border-arena-750/70">
              <div className="flex items-center justify-between text-xs mb-3">
                <div className="text-slate-400">
                  Avg Accuracy: <span className="font-mono font-bold text-emerald-400">{agent.avgAccuracy}%</span>
                </div>
                <div className="text-slate-400 font-mono text-[11px]">
                  {agent.avgLatencyMs} ms
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setViewingConfigAgent(agent)}
                    className="p-1.5 rounded-lg bg-arena-850 hover:bg-arena-800 text-slate-400 hover:text-white border border-arena-750 transition-colors"
                    title="View System Prompt & JSON Configuration"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onEditAgent(agent)}
                    className="p-1.5 rounded-lg bg-arena-850 hover:bg-arena-800 text-slate-400 hover:text-white border border-arena-750 transition-colors"
                    title="Edit Agent Configuration"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => duplicateAgent(agent.id)}
                    className="p-1.5 rounded-lg bg-arena-850 hover:bg-arena-800 text-slate-400 hover:text-white border border-arena-750 transition-colors"
                    title="Duplicate Agent"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteAgent(agent.id)}
                    className="p-1.5 rounded-lg bg-arena-850 hover:bg-arena-800 text-slate-400 hover:text-rose-400 border border-arena-750 transition-colors"
                    title="Delete Agent"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => setActiveTab('run-benchmark')}
                  className="px-2.5 py-1.5 rounded-lg bg-electric-blue/15 hover:bg-electric-blue/25 text-electric-blue border border-electric-blue/30 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Benchmark</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredAgents.length === 0 && (
        <div className="arena-card rounded-2xl p-12 text-center border border-arena-700/60 max-w-md mx-auto">
          <Bot className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h4 className="text-base font-bold text-white mb-1">No agents found</h4>
          <p className="text-xs text-slate-400 mb-4">No agents match your current search query or framework filter.</p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedFramework('all'); }}
            className="px-4 py-2 rounded-xl bg-arena-800 text-xs font-semibold text-slate-200"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* View Config / Prompt Modal */}
      {viewingConfigAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="arena-card max-w-2xl w-full rounded-2xl p-6 border border-arena-600/70 shadow-2xl relative max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-arena-750">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-electric-blue/15 text-electric-blue flex items-center justify-center border border-electric-blue/30">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{viewingConfigAgent.name}</h3>
                  <p className="text-xs text-slate-400 font-mono">Agent Configuration & System Directive</p>
                </div>
              </div>
              <button
                onClick={() => setViewingConfigAgent(null)}
                className="p-1 rounded-lg hover:bg-arena-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                  System Prompt Directive
                </label>
                <pre className="p-3.5 rounded-xl bg-arena-950 font-mono text-xs text-slate-300 border border-arena-800 whitespace-pre-wrap leading-relaxed">
                  {viewingConfigAgent.systemPrompt}
                </pre>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                  Architectural Parameters (JSON)
                </label>
                <pre className="p-3.5 rounded-xl bg-arena-950 font-mono text-xs text-electric-cyan border border-arena-800 overflow-x-auto">
                  {JSON.stringify({
                    id: viewingConfigAgent.id,
                    model: viewingConfigAgent.model,
                    framework: viewingConfigAgent.framework,
                    temperature: viewingConfigAgent.temperature,
                    maxSteps: viewingConfigAgent.maxSteps,
                    memoryType: viewingConfigAgent.memoryType,
                    tools: viewingConfigAgent.tools,
                    status: viewingConfigAgent.status,
                    version: viewingConfigAgent.version
                  }, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-3 border-t border-arena-750 flex justify-end gap-2">
              <button
                onClick={() => setViewingConfigAgent(null)}
                className="px-4 py-2 rounded-xl bg-arena-800 hover:bg-arena-750 text-xs font-semibold text-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
