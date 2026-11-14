import React, { useState } from 'react';
import { X, ListChecks, Plus, Trash2 } from 'lucide-react';
import { TaskCategory, TaskDifficulty } from '../../types';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: any) => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('reasoning');
  const [difficulty, setDifficulty] = useState<TaskDifficulty>('medium');
  const [description, setDescription] = useState('');
  const [inputPrompt, setInputPrompt] = useState('');
  const [groundTruth, setGroundTruth] = useState('');
  const [criteria, setCriteria] = useState<string[]>(['Verify exact mathematical precision', 'Confirm constraint satisfaction']);
  const [newCriterion, setNewCriterion] = useState('');
  const [tagsInput, setTagsInput] = useState('agentic, reasoning, constraint-check');
  const [timeoutSeconds, setTimeoutSeconds] = useState(30);

  if (!isOpen) return null;

  const addCriterion = () => {
    if (newCriterion.trim()) {
      setCriteria(prev => [...prev, newCriterion.trim()]);
      setNewCriterion('');
    }
  };

  const removeCriterion = (index: number) => {
    setCriteria(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !inputPrompt.trim()) return;

    const tags = tagsInput.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);

    onSave({
      title,
      category,
      difficulty,
      description: description.trim() || title,
      inputPrompt,
      groundTruth: groundTruth.trim() || 'Verified logical conclusion',
      evaluationCriteria: criteria.length > 0 ? criteria : ['Correct logical deduction'],
      timeoutSeconds,
      tags
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="arena-card max-w-2xl w-full rounded-2xl border border-arena-600/70 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-arena-750 flex items-center justify-between bg-arena-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-electric-violet/20 text-electric-violet flex items-center justify-center border border-electric-violet/30">
              <ListChecks className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Add Custom Benchmark Task</h3>
              <p className="text-xs text-slate-400">Define prompts, rubrics, and ground truth validation criteria</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-arena-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Task Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Byzantine Consensus Fault Isolation under Partition"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-arena-950 border border-arena-750 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-electric-blue"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="w-full px-3.5 py-2 rounded-xl bg-arena-950 border border-arena-750 text-xs text-white focus:outline-none focus:border-electric-blue"
              >
                <option value="reasoning">Reasoning</option>
                <option value="mathematics">Mathematics</option>
                <option value="extraction">Structured Extraction</option>
                <option value="research">Research & Synthesis</option>
                <option value="planning">Planning & Decomposition</option>
                <option value="code">Code Generation</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as TaskDifficulty)}
                className="w-full px-3.5 py-2 rounded-xl bg-arena-950 border border-arena-750 text-xs text-white focus:outline-none focus:border-electric-blue"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="expert">Expert</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Description & Objective
            </label>
            <input
              type="text"
              placeholder="Brief explanation of what cognitive challenge this task exercises"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-arena-950 border border-arena-750 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-electric-blue"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Task Input Prompt *
            </label>
            <textarea
              rows={4}
              required
              placeholder="Enter the full instruction or scenario prompt passed to the agent..."
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              className="w-full p-3 rounded-xl bg-arena-950 border border-arena-750 font-mono text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-electric-blue leading-relaxed"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Expected Ground Truth / Canonical Output
            </label>
            <textarea
              rows={2}
              placeholder="The verified solution or target output against which the agent will be graded..."
              value={groundTruth}
              onChange={(e) => setGroundTruth(e.target.value)}
              className="w-full p-3 rounded-xl bg-arena-950 border border-arena-750 font-mono text-xs text-emerald-400 placeholder-slate-500 focus:outline-none focus:border-electric-blue"
            />
          </div>

          {/* Criteria builder */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Evaluation Rubric Checkpoints
            </label>
            <div className="space-y-2 mb-2">
              {criteria.map((c, i) => (
                <div key={i} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-arena-950 border border-arena-800 text-xs text-slate-300">
                  <span>• {c}</span>
                  <button
                    type="button"
                    onClick={() => removeCriterion(i)}
                    className="text-slate-500 hover:text-rose-400 p-0.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add evaluation checkpoint (e.g. Correct temporal sequencing)..."
                value={newCriterion}
                onChange={(e) => setNewCriterion(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCriterion(); } }}
                className="flex-1 px-3 py-1.5 rounded-lg bg-arena-950 border border-arena-750 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-electric-blue"
              />
              <button
                type="button"
                onClick={addCriterion}
                className="px-3 py-1.5 rounded-lg bg-arena-800 hover:bg-arena-750 text-xs font-semibold text-slate-200 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Comma-separated Tags
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-arena-950 border border-arena-750 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-electric-blue"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Timeout (Seconds)
              </label>
              <input
                type="number"
                min="5"
                max="120"
                value={timeoutSeconds}
                onChange={(e) => setTimeoutSeconds(parseInt(e.target.value) || 30)}
                className="w-full px-3.5 py-2 rounded-xl bg-arena-950 border border-arena-750 text-xs text-white focus:outline-none focus:border-electric-blue"
              />
            </div>
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
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-electric-blue to-electric-indigo text-white text-xs font-semibold shadow-md shadow-electric-blue/20"
            >
              Save Benchmark Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
