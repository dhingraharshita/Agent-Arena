import React, { useState, useEffect } from 'react';
import { X, Bot, Sparkles, Wrench, Check } from 'lucide-react';
import { Agent, AgentFramework } from '../../types';

interface AgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (agentData: any) => void;
  initialAgent?: Agent | null;
}

const AVAILABLE_TOOLS = [
  { id: 'web_search', name: 'Web Search', desc: 'Real-time search engine query' },
  { id: 'calculator', name: 'Calculator', desc: 'Arithmetic calculation solver' },
  { id: 'python_repl', name: 'Python REPL', desc: 'Execute sandboxed Python code' },
  { id: 'step_planner', name: 'Step Planner', desc: 'Hierarchical milestone decomposition' },
  { id: 'validator', name: 'Rule Validator', desc: 'Verify criteria against constraints' },
  { id: 'symbolic_solver', name: 'Symbolic Solver', desc: 'Formal algebraic equation checks' },
  { id: 'json_validator', name: 'JSON Schema Validator', desc: 'Strict schema parse verification' },
];

export const AgentModal: React.FC<AgentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialAgent
}) => {
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [model, setModel] = useState('GPT-4o');
  const [framework, setFramework] = useState<AgentFramework>('CrewAI');
  const [temperature, setTemperature] = useState(0.2);
  const [maxSteps, setMaxSteps] = useState(8);
  const [memoryType, setMemoryType] = useState<'stateless' | 'buffer' | 'summary' | 'vector'>('summary');
  const [tools, setTools] = useState<string[]>(['step_planner', 'calculator']);
  const [systemPrompt, setSystemPrompt] = useState('');

  useEffect(() => {
    if (initialAgent) {
      setName(initialAgent.name);
      setTagline(initialAgent.tagline || initialAgent.description);
      setModel(initialAgent.model);
      setFramework(initialAgent.framework);
      setTemperature(initialAgent.temperature);
      setMaxSteps(initialAgent.maxSteps);
      setMemoryType(initialAgent.memoryType);
      setTools(initialAgent.tools);
      setSystemPrompt(initialAgent.systemPrompt);
    } else {
      setName('');
      setTagline('');
      setModel('Claude 3.5 Sonnet');
      setFramework('CrewAI');
      setTemperature(0.2);
      setMaxSteps(8);
      setMemoryType('summary');
      setTools(['step_planner', 'calculator']);
      setSystemPrompt(`You are an autonomous problem-solving agent.\nAnalyze the task instructions, verify intermediate constraints, and output a validated answer.`);
    }
  }, [initialAgent, isOpen]);

  if (!isOpen) return null;

  const toggleTool = (toolId: string) => {
    setTools(prev => 
      prev.includes(toolId) ? prev.filter(t => t !== toolId) : [...prev, toolId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      ...(initialAgent || {}),
      name,
      tagline,
      description: tagline,
      model,
      framework,
      temperature,
      maxSteps,
      memoryType,
      tools,
      systemPrompt,
      status: initialAgent?.status || 'active',
      version: initialAgent?.version || '1.0.0',
      avatarColor: initialAgent?.avatarColor || 'from-blue-500 to-indigo-600'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="arena-card max-w-2xl w-full rounded-2xl border border-arena-600/70 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-arena-750 flex items-center justify-between bg-arena-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-electric-blue/20 text-electric-blue flex items-center justify-center border border-electric-blue/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {initialAgent ? 'Edit Agent Architecture' : 'Register New Agent Architecture'}
              </h3>
              <p className="text-xs text-slate-400">Configure parameters, tool capabilities, and system directives</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-arena-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Agent Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Hierarchical Planner Agent"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-arena-950 border border-arena-750 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-electric-blue"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Base Foundation Model
              </label>
              <input
                type="text"
                placeholder="e.g. GPT-4o / Claude 3.5 Sonnet"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-arena-950 border border-arena-750 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-electric-blue"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Tagline / Role Summary
            </label>
            <input
              type="text"
              placeholder="e.g. Decomposes multi-stage goals with deterministic backtracking"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-arena-950 border border-arena-750 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-electric-blue"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Agent Framework
              </label>
              <select
                value={framework}
                onChange={(e) => setFramework(e.target.value as AgentFramework)}
                className="w-full px-3.5 py-2 rounded-xl bg-arena-950 border border-arena-750 text-xs text-white focus:outline-none focus:border-electric-blue"
              >
                <option value="LangChain">LangChain</option>
                <option value="AutoGen">AutoGen</option>
                <option value="CrewAI">CrewAI</option>
                <option value="LlamaIndex">LlamaIndex</option>
                <option value="ReAct Native">ReAct Native</option>
                <option value="Custom">Custom Framework</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Memory Architecture
              </label>
              <select
                value={memoryType}
                onChange={(e) => setMemoryType(e.target.value as any)}
                className="w-full px-3.5 py-2 rounded-xl bg-arena-950 border border-arena-750 text-xs text-white focus:outline-none focus:border-electric-blue"
              >
                <option value="stateless">Stateless (Direct)</option>
                <option value="buffer">Window Buffer</option>
                <option value="summary">Recursive Summary</option>
                <option value="vector">Vector Episodic</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Temperature: <span className="font-mono text-electric-blue">{temperature}</span>
                </label>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-electric-blue cursor-pointer"
              />
            </div>
          </div>

          {/* Tools Selection */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-electric-blue" />
              <span>Assigned Capabilities & Tools</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {AVAILABLE_TOOLS.map(tool => {
                const isSelected = tools.includes(tool.id);
                return (
                  <div
                    key={tool.id}
                    onClick={() => toggleTool(tool.id)}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-2.5 ${
                      isSelected 
                        ? 'bg-electric-blue/10 border-electric-blue/40 text-white' 
                        : 'bg-arena-950 border-arena-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border ${
                      isSelected ? 'bg-electric-blue border-electric-blue text-white' : 'border-slate-600'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div>
                      <div className="text-xs font-semibold">{tool.name}</div>
                      <div className="text-[10px] text-slate-400">{tool.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* System Prompt */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              System Directive / Cognitive Instructions
            </label>
            <textarea
              rows={4}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Provide system directive for the agent..."
              className="w-full p-3 rounded-xl bg-arena-950 border border-arena-750 font-mono text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-electric-blue leading-relaxed"
            />
          </div>

          <div className="pt-4 border-t border-arena-750 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-arena-800 hover:bg-arena-750 text-xs font-semibold text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-electric-blue to-electric-indigo hover:from-electric-blue/90 hover:to-electric-indigo/90 text-white text-xs font-semibold shadow-md shadow-electric-blue/20"
            >
              {initialAgent ? 'Update Agent' : 'Create Agent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
