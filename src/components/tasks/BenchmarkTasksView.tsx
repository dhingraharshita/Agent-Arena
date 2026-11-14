import React, { useState } from 'react';
import { 
  ListChecks, 
  Search, 
  Plus, 
  Tag, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  HelpCircle, 
  Code2, 
  Brain, 
  Calculator, 
  FileText, 
  Compass, 
  Eye, 
  X,
  Play
} from 'lucide-react';
import { useArena } from '../../context/ArenaContext';
import { BenchmarkTask, TaskCategory, TaskDifficulty } from '../../types';

interface BenchmarkTasksViewProps {
  onOpenCreateTask: () => void;
}

export const BenchmarkTasksView: React.FC<BenchmarkTasksViewProps> = ({ onOpenCreateTask }) => {
  const { tasks, setActiveTab } = useArena();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [inspectingTask, setInspectingTask] = useState<BenchmarkTask | null>(null);

  const categories: { id: TaskCategory | 'all'; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All Categories', icon: <ListChecks className="w-3.5 h-3.5" /> },
    { id: 'reasoning', label: 'Reasoning', icon: <Brain className="w-3.5 h-3.5 text-blue-400" /> },
    { id: 'mathematics', label: 'Mathematics', icon: <Calculator className="w-3.5 h-3.5 text-emerald-400" /> },
    { id: 'extraction', label: 'Extraction', icon: <FileText className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'research', label: 'Research', icon: <Compass className="w-3.5 h-3.5 text-purple-400" /> },
    { id: 'planning', label: 'Planning', icon: <Clock className="w-3.5 h-3.5 text-cyan-400" /> },
    { id: 'code', label: 'Code Gen', icon: <Code2 className="w-3.5 h-3.5 text-rose-400" /> },
  ];

  const difficulties: (TaskDifficulty | 'all')[] = ['all', 'easy', 'medium', 'hard', 'expert'];

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || task.category === selectedCategory;
    const matchesDiff = selectedDifficulty === 'all' || task.difficulty === selectedDifficulty;
    return matchesSearch && matchesCategory && matchesDiff;
  });

  const getDifficultyBadge = (diff: TaskDifficulty) => {
    switch (diff) {
      case 'easy':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">Easy</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/30">Medium</span>;
      case 'hard':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">Hard</span>;
      case 'expert':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/30">Expert</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex-1 flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search benchmark tasks, rubrics, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-arena-900 border border-arena-700/70 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-electric-blue transition-colors"
            />
          </div>

          {/* Difficulty filter */}
          <div className="flex items-center gap-1 bg-arena-900 p-1 rounded-xl border border-arena-750">
            {difficulties.map(d => (
              <button
                key={d}
                onClick={() => setSelectedDifficulty(d)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium uppercase transition-all ${
                  selectedDifficulty === d 
                    ? 'bg-electric-blue text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Create Task Button */}
        <button
          onClick={onOpenCreateTask}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-electric-blue to-electric-indigo hover:from-electric-blue/90 hover:to-electric-indigo/90 text-white text-xs font-semibold shadow-md shadow-electric-blue/20 flex items-center justify-center gap-2 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Task</span>
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat.id 
                ? 'bg-gradient-to-r from-electric-blue/20 to-electric-indigo/20 text-white border border-electric-blue/40 shadow-sm' 
                : 'bg-arena-900/80 text-slate-400 border border-arena-750/70 hover:text-slate-200 hover:bg-arena-850'
            }`}
          >
            {cat.icon}
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredTasks.map(task => (
          <div
            key={task.id}
            className="arena-card rounded-2xl p-5 border border-arena-700/70 flex flex-col justify-between group hover:border-electric-blue/50"
          >
            <div>
              {/* Category & Difficulty */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-arena-800 text-electric-blue uppercase border border-electric-blue/20">
                    {task.category}
                  </span>
                  {getDifficultyBadge(task.difficulty)}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{task.timeoutSeconds}s max</span>
                </div>
              </div>

              {/* Title & Description */}
              <h3 className="text-sm font-bold text-white mb-2 group-hover:text-electric-blue transition-colors">
                {task.title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4 line-clamp-2">
                {task.description}
              </p>

              {/* Input Prompt Snippet */}
              <div className="p-3 rounded-xl bg-arena-950/80 border border-arena-800 mb-4">
                <div className="text-[10px] font-mono uppercase text-slate-400 mb-1 flex items-center justify-between">
                  <span>Input Prompt Preview</span>
                  <span className="text-[9px] text-slate-400">Strict Evaluation</span>
                </div>
                <p className="font-mono text-xs text-slate-300 line-clamp-3 leading-relaxed">
                  {task.inputPrompt}
                </p>
              </div>

              {/* Evaluation Rubric Points */}
              <div className="space-y-1.5 mb-4">
                <div className="text-[10px] uppercase font-semibold text-slate-400 mb-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Evaluation Rubric ({task.evaluationCriteria.length} checkpoints)</span>
                </div>
                {task.evaluationCriteria.slice(0, 2).map((crit, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                    <span className="text-emerald-400 font-bold shrink-0">•</span>
                    <span className="line-clamp-1">{crit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer with Tags & Actions */}
            <div className="pt-3 border-t border-arena-750/70 flex items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1">
                {task.tags.map((t, i) => (
                  <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-arena-850 text-slate-400 border border-arena-800">
                    #{t}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInspectingTask(task)}
                  className="px-3 py-1.5 rounded-lg bg-arena-850 hover:bg-arena-800 text-slate-300 text-xs font-semibold border border-arena-750 flex items-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-electric-blue" />
                  <span>Inspect</span>
                </button>
                <button
                  onClick={() => setActiveTab('run-benchmark')}
                  className="px-3 py-1.5 rounded-lg bg-electric-blue/15 hover:bg-electric-blue/25 text-electric-blue text-xs font-semibold border border-electric-blue/30 flex items-center gap-1.5 transition-colors"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Run</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Task Inspection Modal */}
      {inspectingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="arena-card max-w-2xl w-full rounded-2xl border border-arena-600/70 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-arena-750 flex items-center justify-between bg-arena-900">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-arena-800 text-electric-blue uppercase">
                    {inspectingTask.category}
                  </span>
                  {getDifficultyBadge(inspectingTask.difficulty)}
                </div>
                <h3 className="text-base font-bold text-white">{inspectingTask.title}</h3>
              </div>
              <button
                onClick={() => setInspectingTask(null)}
                className="p-1 rounded-lg hover:bg-arena-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Description
                </label>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {inspectingTask.description}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Full Input Prompt
                </label>
                <pre className="p-3.5 rounded-xl bg-arena-950 font-mono text-xs text-slate-200 border border-arena-800 whitespace-pre-wrap leading-relaxed">
                  {inspectingTask.inputPrompt}
                </pre>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Ground Truth / Canonical Target
                </label>
                <pre className="p-3.5 rounded-xl bg-arena-950 font-mono text-xs text-emerald-400 border border-emerald-950/60 whitespace-pre-wrap leading-relaxed">
                  {inspectingTask.groundTruth}
                </pre>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Evaluation Checkpoints & Scoring Rubric
                </label>
                <div className="space-y-2">
                  {inspectingTask.evaluationCriteria.map((c, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-arena-950 border border-arena-800 flex items-start gap-2.5 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-arena-750 flex items-center justify-between bg-arena-900/60">
              <span className="text-xs text-slate-400">
                Timeout: <span className="font-mono text-white">{inspectingTask.timeoutSeconds} seconds</span>
              </span>
              <button
                onClick={() => {
                  setInspectingTask(null);
                  setActiveTab('run-benchmark');
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-electric-blue to-electric-indigo text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-electric-blue/20"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run In Arena</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
