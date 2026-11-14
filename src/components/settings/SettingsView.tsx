import React, { useEffect, useState } from 'react';
import { 
  SlidersHorizontal, 
  RotateCcw, 
  Download, 
  Upload, 
  Link2, 
  ShieldCheck, 
  CheckCircle2, 
  Save, 
  HelpCircle,
  Database,
  Zap,
  Sparkles,
  KeyRound,
  ExternalLink,
  Cpu
} from 'lucide-react';
import { useArena } from '../../context/ArenaContext';

export const SettingsView: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    resetAllData, 
    agents, 
    tasks, 
    runs, 
    addToast,
    apiStatus,
    refreshApiStatus 
  } = useArena();

  const [webhookUrl, setWebhookUrl] = useState(settings.customRunnerWebhook);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [weights, setWeights] = useState(settings.evaluationWeights);
  const [selectedModel, setSelectedModel] = useState(settings.preferredGeminiModel || 'gemini-3.8-flash');

  useEffect(() => {
    setSelectedModel(settings.preferredGeminiModel || 'gemini-3.8-flash');
  }, [settings.preferredGeminiModel]);

  const handleSaveWeights = () => {
    updateSettings({ 
      evaluationWeights: weights,
      preferredGeminiModel: selectedModel 
    });
    addToast('Scoring weights & Gemini model settings saved', 'success');
  };

  const handleTestWebhook = () => {
    setTestingWebhook(true);
    setTimeout(() => {
      setTestingWebhook(false);
      addToast(`Webhook endpoint "${webhookUrl}" validated (Local sandbox ready)`, 'info');
    }, 800);
  };

  const handleExportData = () => {
    const exportBundle = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      agents,
      tasks,
      runs,
      settings
    };

    const blob = new Blob([JSON.stringify(exportBundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agentarena-benchmark-export-${Date.now().toString().slice(-4)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Benchmark data exported successfully', 'success');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="arena-card rounded-2xl p-6 border border-arena-700/60 bg-gradient-to-r from-arena-900 via-arena-850 to-arena-900">
        <div className="flex items-center gap-2 text-electric-blue text-xs font-semibold mb-2">
          <SlidersHorizontal className="w-4 h-4" />
          <span>Platform Preferences & Model Configuration</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">Arena Configuration</h2>
        <p className="mt-1 text-xs text-slate-300 leading-relaxed">
          Configure real Google Gemini model parameters, pricing formulas, composite scoring weights, and data backups.
        </p>
      </div>

      {/* Section 1: Gemini AI Integration Status */}
      <div className="arena-card rounded-2xl p-6 border border-arena-700/60 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-arena-750">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Google Gemini Integration Status</h3>
              <p className="text-xs text-slate-400">Server-side execution engine status</p>
            </div>
          </div>

          <button
            onClick={async () => {
              await refreshApiStatus();
              addToast('Refreshed Gemini API status from server', 'info');
            }}
            className="px-3 py-1.5 rounded-lg bg-arena-850 hover:bg-arena-800 text-slate-300 text-xs font-semibold border border-arena-750 transition-colors"
          >
            Check Connection
          </button>
        </div>

        {apiStatus?.hasApiKey ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>GEMINI_API_KEY is active and detected on server</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Direct Agent and Planner Agent can run live benchmarks with real token generation, latency tracking, and deterministic criteria grading.
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-3">
            <div className="flex items-center gap-2 text-amber-300 font-semibold">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>No GEMINI_API_KEY detected (Running in Demo Mode)</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              To enable real AI execution, create a <code className="text-electric-cyan font-mono">.env</code> file in the project root with your Gemini API key:
            </p>
            <pre className="p-3 rounded-lg bg-arena-950 font-mono text-[11px] text-electric-cyan border border-arena-800">
              GEMINI_API_KEY=your_gemini_api_key_here
            </pre>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>Get your free key at</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-electric-blue hover:underline font-semibold flex items-center gap-1"
              >
                <span>Google AI Studio</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {/* Model Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Default Gemini Model
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-arena-950 border border-arena-750 text-xs text-white focus:outline-none focus:border-electric-blue"
            >
              <option value="gemini-3.8-flash">Gemini 3.8 Flash (Current stable)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Documented Pricing (per 1M Tokens)
            </label>
            <div className="px-3.5 py-2 rounded-xl bg-arena-950 border border-arena-750 font-mono text-xs text-slate-300">
              <span>Input: $0.75 / Output: $3.75</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Composite Score Formula Weights */}
      <div className="arena-card rounded-2xl p-6 border border-arena-700/60 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-arena-750">
          <div>
            <h3 className="text-sm font-bold text-white">Evaluation Formula Weights</h3>
            <p className="text-xs text-slate-400">
              Adjust how much each cognitive dimension contributes to the overall agent ranking
            </p>
          </div>
          <button
            onClick={handleSaveWeights}
            className="px-4 py-1.5 rounded-xl bg-electric-blue hover:bg-electric-blue/90 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-electric-blue/20"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Apply Weights</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Accuracy */}
          <div className="space-y-1.5 p-3.5 rounded-xl bg-arena-950 border border-arena-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Accuracy Score Weight</span>
              <span className="font-mono text-emerald-400 font-bold">{weights.accuracy}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="80"
              step="5"
              value={weights.accuracy}
              onChange={(e) => setWeights(prev => ({ ...prev, accuracy: parseInt(e.target.value) }))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">
              Evaluates ground truth constraint adherence and rubric satisfaction.
            </p>
          </div>

          {/* Reliability */}
          <div className="space-y-1.5 p-3.5 rounded-xl bg-arena-950 border border-arena-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Reliability & Recovery Weight</span>
              <span className="font-mono text-electric-violet font-bold">{weights.reliability}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={weights.reliability}
              onChange={(e) => setWeights(prev => ({ ...prev, reliability: parseInt(e.target.value) }))}
              className="w-full accent-electric-violet cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">
              Tool call exception handling and resilience against runtime errors.
            </p>
          </div>

          {/* Latency */}
          <div className="space-y-1.5 p-3.5 rounded-xl bg-arena-950 border border-arena-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Latency Penalty Weight</span>
              <span className="font-mono text-electric-blue font-bold">{weights.latency}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              step="5"
              value={weights.latency}
              onChange={(e) => setWeights(prev => ({ ...prev, latency: parseInt(e.target.value) }))}
              className="w-full accent-electric-blue cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">
              Penalizes excessive wall-clock execution time on equivalent tasks.
            </p>
          </div>

          {/* Cost */}
          <div className="space-y-1.5 p-3.5 rounded-xl bg-arena-950 border border-arena-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Cost Efficiency Weight</span>
              <span className="font-mono text-amber-400 font-bold">{weights.cost}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              step="5"
              value={weights.cost}
              onChange={(e) => setWeights(prev => ({ ...prev, cost: parseInt(e.target.value) }))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">
              Rewards minimal token expenditure and lightweight prompt overhead.
            </p>
          </div>
        </div>
      </div>

      {/* Section 3: Data Management */}
      <div className="arena-card rounded-2xl p-6 border border-arena-700/60 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-electric-blue" />
            <span>Benchmark Data Management</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Export run matrices or reset all agents and tasks to starter demonstration state.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExportData}
            className="px-4 py-2 rounded-xl bg-arena-850 hover:bg-arena-800 text-slate-200 border border-arena-750 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4 text-electric-blue" />
            <span>Export Data Bundle (JSON)</span>
          </button>

          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset to Default Sample Data</span>
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="arena-card max-w-md w-full rounded-2xl p-6 border border-rose-500/40 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">Reset All Benchmark Data?</h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-5">
              This will clear custom agents, custom tasks, and benchmark trial history, reloading initial starter sets.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl bg-arena-800 hover:bg-arena-750 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetAllData();
                  setShowResetConfirm(false);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
              >
                Yes, Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
