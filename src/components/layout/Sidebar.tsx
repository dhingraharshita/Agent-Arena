import React from 'react';
import { 
  LayoutDashboard, 
  Bot, 
  ListChecks, 
  PlayCircle, 
  BarChart3, 
  Trophy, 
  BookOpen, 
  SlidersHorizontal,
  Sparkles,
  Zap,
  Activity,
  Layers
} from 'lucide-react';
import { useArena } from '../../context/ArenaContext';
import { ActiveTab } from '../../types';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const { activeTab, setActiveTab, agents, tasks, runs, liveRunningState } = useArena();

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string | number; glow?: boolean }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'agent-lab', label: 'Agent Lab', icon: <Bot className="w-5 h-5" />, badge: agents.length },
    { id: 'benchmark-tasks', label: 'Benchmark Tasks', icon: <ListChecks className="w-5 h-5" />, badge: tasks.length },
    { 
      id: 'run-benchmark', 
      label: 'Run Benchmark', 
      icon: <PlayCircle className="w-5 h-5" />, 
      badge: liveRunningState ? 'RUNNING' : undefined,
      glow: !!liveRunningState 
    },
    { id: 'results', label: 'Results & Traces', icon: <BarChart3 className="w-5 h-5" />, badge: runs.length },
    { id: 'leaderboard', label: 'Leaderboard', icon: <Trophy className="w-5 h-5" /> },
    { id: 'documentation', label: 'Documentation', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <SlidersHorizontal className="w-5 h-5" /> },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-arena-900/95 border-r border-arena-700/60
        flex flex-col backdrop-blur-xl transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="p-5 border-b border-arena-750/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-electric-blue via-electric-indigo to-electric-violet flex items-center justify-center shadow-lg shadow-electric-blue/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-white tracking-tight">Agent<span className="text-electric-blue">Arena</span></span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-electric-indigo/20 text-electric-violet font-semibold border border-electric-violet/30">
                  Hackathon
                </span>
              </div>
              <p className="text-xs text-slate-400">Agent Benchmarking Platform</p>
            </div>
          </div>
        </div>

        {/* Live Run Banner if active */}
        {liveRunningState && (
          <div className="mx-3 mt-3 p-3 rounded-lg bg-electric-blue/10 border border-electric-blue/30 text-xs">
            <div className="flex items-center gap-2 text-electric-blue font-semibold mb-1">
              <Activity className="w-4 h-4 animate-spin text-electric-blue" />
              <span>Benchmark Active</span>
            </div>
            <div className="w-full bg-arena-800 rounded-full h-1.5 overflow-hidden my-1.5">
              <div 
                className="bg-gradient-to-r from-electric-blue to-electric-violet h-full transition-all duration-300"
                style={{ width: `${liveRunningState.progress}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-300 truncate">{liveRunningState.currentTaskTitle}</p>
          </div>
        )}

        {/* Navigation List */}
        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Platform Navigation
          </div>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (window.innerWidth < 1024) onToggle();
                }}
                className={`
                  w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all group
                  ${isActive 
                    ? 'bg-gradient-to-r from-electric-blue/15 to-electric-violet/10 text-white border border-electric-blue/30 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-arena-800/60 border border-transparent'}
                `}
              >
                <div className="flex items-center gap-3">
                  <span className={`${isActive ? 'text-electric-blue' : 'text-slate-400 group-hover:text-slate-300'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span className={`
                    text-xs px-2 py-0.5 rounded-full font-mono font-medium
                    ${item.glow ? 'bg-electric-blue/30 text-electric-blue animate-pulse' : 
                      isActive ? 'bg-electric-blue/20 text-electric-blue' : 'bg-arena-800 text-slate-400'}
                  `}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Disclaimer & Sandbox Status */}
        <div className="p-4 border-t border-arena-750/70 bg-arena-950/40">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-slate-300">Local Sandbox Engine</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Deterministic mock evaluation active. No external API consumption.
          </p>
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Schema v2.4</span>
            <span className="font-mono text-electric-cyan">Ready</span>
          </div>
        </div>
      </aside>
    </>
  );
};
