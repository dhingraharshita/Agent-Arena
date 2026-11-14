import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Code2, 
  Layers, 
  Cpu, 
  CheckCircle2, 
  HelpCircle, 
  FileCode, 
  Copy, 
  Check, 
  Terminal, 
  Compass,
  ArrowRight
} from 'lucide-react';
import { DOCUMENTATION_SECTIONS } from '../../data/documentationData';
import { useArena } from '../../context/ArenaContext';

export const DocumentationView: React.FC = () => {
  const { setActiveTab } = useArena();
  const [activeSectionId, setActiveSectionId] = useState<string>(DOCUMENTATION_SECTIONS[0].id);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const currentSection = DOCUMENTATION_SECTIONS.find(s => s.id === activeSectionId) || DOCUMENTATION_SECTIONS[0];

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredSections = DOCUMENTATION_SECTIONS.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="arena-card rounded-2xl p-6 border border-arena-700/60 bg-gradient-to-r from-arena-900 via-arena-850 to-arena-900">
        <div className="flex items-center gap-2.5 text-electric-blue text-xs font-semibold mb-2">
          <BookOpen className="w-4 h-4" />
          <span>Platform Knowledge Base & Reference</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          How AgentArena Works
        </h2>
        <p className="mt-1 text-xs text-slate-300 max-w-2xl leading-relaxed">
          Learn how to evaluate multi-step agent trajectories, integrate custom autonomous runners via webhook API, and interpret cognitive benchmark metrics.
        </p>
      </div>

      {/* Main Doc Layout: Sidebar Nav + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Column */}
        <div className="space-y-3">
          {/* Search Docs */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-arena-900 border border-arena-750 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-electric-blue"
            />
          </div>

          <div className="arena-card rounded-xl p-2 border border-arena-700/60 space-y-1">
            <div className="px-3 py-2 text-[10px] font-mono uppercase text-slate-400 font-semibold">
              Documentation Guides
            </div>
            {filteredSections.map(sec => (
              <button
                key={sec.id}
                onClick={() => setActiveSectionId(sec.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  activeSectionId === sec.id
                    ? 'bg-electric-blue/15 text-white border border-electric-blue/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-arena-850'
                }`}
              >
                {sec.title}
              </button>
            ))}
          </div>

          {/* Quick Sandbox Note */}
          <div className="p-4 rounded-xl bg-arena-950 border border-arena-800 text-xs text-slate-400 space-y-2">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-electric-cyan" />
              <span>Developer Quickstart</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Ready to test custom code? Configure webhooks in Settings or use our interactive trial runner.
            </p>
            <button
              onClick={() => setActiveTab('settings')}
              className="text-electric-blue hover:text-electric-cyan text-[11px] font-semibold flex items-center gap-1"
            >
              <span>Go to Settings</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Content Column */}
        <div className="lg:col-span-3 arena-card rounded-2xl p-6 sm:p-8 border border-arena-700/60 space-y-6">
          <div className="pb-4 border-b border-arena-750">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-arena-800 text-electric-blue uppercase">
              {currentSection.category}
            </span>
            <h3 className="text-xl font-bold text-white mt-2">{currentSection.title}</h3>
          </div>

          {/* Section Body */}
          <div className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-4 whitespace-pre-wrap font-sans">
            {currentSection.content}
          </div>

          {/* Code Snippet if present */}
          {currentSection.codeSnippet && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono text-[11px]">Integration Webhook Template</span>
                <button
                  onClick={() => handleCopyCode(currentSection.codeSnippet!)}
                  className="px-2.5 py-1 rounded-lg bg-arena-850 hover:bg-arena-800 text-slate-300 text-xs flex items-center gap-1.5 border border-arena-750 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-arena-950 font-mono text-xs text-electric-cyan border border-arena-800 overflow-x-auto leading-relaxed">
                {currentSection.codeSnippet}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
