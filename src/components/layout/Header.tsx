import React, { useState } from 'react';
import { 
  Menu, 
  Play, 
  Plus, 
  HelpCircle, 
  ShieldCheck, 
  ExternalLink, 
  CheckCircle2, 
  Sliders,
  Sparkles,
  KeyRound,
  AlertTriangle
} from 'lucide-react';
import { useArena } from '../../context/ArenaContext';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenCreateAgent: () => void;
  onOpenCreateTask: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onToggleSidebar, 
  onOpenCreateAgent,
  onOpenCreateTask 
}) => {
  const { activeTab, setActiveTab, apiStatus, refreshApiStatus } = useArena();
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);

  const getTabTitle = () => {
    switch (activeTab) {
      case 'overview':
        return { title: 'Dashboard Overview', subtitle: 'Benchmark metrics, comparative analytics, and agent health.' };
      case 'agent-lab':
        return { title: 'Agent Lab', subtitle: 'Inspect, configure, and manage autonomous agent architectures.' };
      case 'benchmark-tasks':
        return { title: 'Benchmark Task Suites', subtitle: 'Standardized evaluation challenges across reasoning, math, and code.' };
      case 'run-benchmark':
        return { title: 'Run Benchmark Matrix', subtitle: 'Launch head-to-head multi-agent test trials with Gemini or Demo runner.' };
      case 'results':
        return { title: 'Benchmark Results & Traces', subtitle: 'Deep-dive into step-by-step reasoning traces and scorecards.' };
      case 'leaderboard':
        return { title: 'Arena Leaderboard', subtitle: 'Empirical agent rankings with ELO and category score breakdowns.' };
      case 'documentation':
        return { title: 'Platform Documentation', subtitle: 'Agent evaluation philosophy, scoring mathematics, and SDK docs.' };
      case 'settings':
        return { title: 'Arena Configuration', subtitle: 'Scoring formula weights, runner speed, and integration endpoints.' };
      default:
        return { title: 'AgentArena', subtitle: 'AI Agent Benchmarking Platform' };
    }
  };

  const { title, subtitle } = getTabTitle();

  return (
    <>
      <header className="sticky top-0 z-30 bg-arena-950/80 backdrop-blur-md border-b border-arena-700/60 px-4 sm:px-6 py-3.5">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Mobile hamburger & breadcrumbs */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-lg bg-arena-850 hover:bg-arena-800 text-slate-400 hover:text-white lg:hidden border border-arena-700/60"
              aria-label="Toggle Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                {title}
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Right: Actions, Gemini Status & Demo Badge */}
          <div className="flex items-center gap-2.5">
            {/* Real Gemini API Indicator */}
            {apiStatus?.hasApiKey ? (
              <button
                onClick={() => setShowSetupModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
                title="Google Gemini API is configured and ready"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline font-mono">Gemini Active</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </button>
            ) : (
              <button
                onClick={() => setShowSetupModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
                title="Gemini API Key not set - Click to configure"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline font-mono">Demo Mode (Set Key)</span>
                <span className="sm:hidden font-mono">Demo</span>
              </button>
            )}

            {/* Quick Actions */}
            <button
              onClick={onOpenCreateAgent}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-arena-850 hover:bg-arena-800 text-slate-200 border border-arena-700/80 hover:border-slate-600 transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-electric-blue" />
              <span>New Agent</span>
            </button>

            <button
              onClick={() => setActiveTab('run-benchmark')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-electric-blue to-electric-indigo hover:from-electric-blue/90 hover:to-electric-indigo/90 text-white shadow-md shadow-electric-blue/20 hover:shadow-electric-blue/30 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Benchmark</span>
            </button>
          </div>
        </div>
      </header>

      {/* Gemini Setup / Status Modal */}
      {showSetupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="arena-card max-w-lg w-full rounded-2xl p-6 border border-arena-600/70 shadow-2xl relative space-y-4">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                apiStatus?.hasApiKey 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              }`}>
                {apiStatus?.hasApiKey ? <Sparkles className="w-6 h-6" /> : <KeyRound className="w-6 h-6" />}
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-white">
                  {apiStatus?.hasApiKey ? 'Gemini API Engine: Connected' : 'Configure Gemini API Key'}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Model: {apiStatus?.model || 'gemini-3.8-flash'} • Server Endpoint
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
              {apiStatus?.hasApiKey ? (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-1.5">
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Server-side GEMINI_API_KEY is active and ready</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    You can execute real benchmarks on the Direct Agent and Planner Agent. Token usage and latencies will be measured directly.
                  </p>
                </div>
              ) : (
                <>
                  <p>
                    AgentArena runs in **Demo Simulation Mode** when no API key is provided. To execute real AI model calls, set the key in a `.env` file on the server.
                  </p>

                  <div className="p-3.5 rounded-xl bg-arena-950 border border-arena-800 space-y-2 font-mono text-[11px]">
                    <div className="text-slate-400"># In project root, create a file named .env:</div>
                    <div className="text-electric-cyan font-bold">GEMINI_API_KEY=AIzaSy...your_key_here</div>
                    <div className="text-slate-400"># (Optional) Choose model:</div>
                    <div className="text-electric-blue">GEMINI_MODEL=gemini-3.8-flash</div>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span>Need an API key?</span>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      className="text-electric-blue hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>Get a key at Google AI Studio</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </>
              )}
            </div>

            <div className="pt-3 border-t border-arena-750 flex items-center justify-between">
              <button
                onClick={async () => {
                  await refreshApiStatus();
                }}
                className="px-3.5 py-1.5 rounded-lg bg-arena-850 hover:bg-arena-800 text-xs font-semibold text-slate-300 transition-colors"
              >
                Re-check API Key
              </button>

              <button
                onClick={() => setShowSetupModal(false)}
                className="px-4 py-2 rounded-xl bg-electric-blue hover:bg-electric-blue/90 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
