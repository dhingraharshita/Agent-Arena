import React, { useState } from 'react';
import { ArenaProvider, useArena } from './context/ArenaContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ToastContainer } from './components/layout/ToastContainer';
import { OverviewView } from './components/overview/OverviewView';
import { AgentLabView } from './components/agentLab/AgentLabView';
import { BenchmarkTasksView } from './components/tasks/BenchmarkTasksView';
import { RunBenchmarkView } from './components/runBenchmark/RunBenchmarkView';
import { ResultsView } from './components/results/ResultsView';
import { LeaderboardView } from './components/leaderboard/LeaderboardView';
import { DocumentationView } from './components/documentation/DocumentationView';
import { SettingsView } from './components/settings/SettingsView';
import { AgentModal } from './components/agentLab/AgentModal';
import { CreateTaskModal } from './components/tasks/CreateTaskModal';
import { Agent } from './types';

const MainDashboard: React.FC = () => {
  const { activeTab, addAgent, updateAgent, addTask } = useArena();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Agent modal state
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  // Task modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const handleOpenCreateAgent = () => {
    setEditingAgent(null);
    setIsAgentModalOpen(true);
  };

  const handleEditAgent = (agent: Agent) => {
    setEditingAgent(agent);
    setIsAgentModalOpen(true);
  };

  const handleSaveAgent = (agentData: any) => {
    if (editingAgent) {
      updateAgent(agentData);
    } else {
      addAgent(agentData);
    }
  };

  return (
    <div className="min-h-screen bg-arena-950 text-slate-100 flex flex-col antialiased">
      {/* Sidebar Navigation */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
      />

      {/* Main Content Area (Offset by Sidebar on Desktop) */}
      <div className="lg:pl-64 flex-1 flex flex-col min-w-0">
        <Header 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenCreateAgent={handleOpenCreateAgent}
          onOpenCreateTask={() => setIsTaskModalOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'overview' && (
            <OverviewView onOpenCreateAgent={handleOpenCreateAgent} />
          )}
          {activeTab === 'agent-lab' && (
            <AgentLabView 
              onOpenCreateAgent={handleOpenCreateAgent}
              onEditAgent={handleEditAgent}
            />
          )}
          {activeTab === 'benchmark-tasks' && (
            <BenchmarkTasksView 
              onOpenCreateTask={() => setIsTaskModalOpen(true)}
            />
          )}
          {activeTab === 'run-benchmark' && (
            <RunBenchmarkView />
          )}
          {activeTab === 'results' && (
            <ResultsView />
          )}
          {activeTab === 'leaderboard' && (
            <LeaderboardView />
          )}
          {activeTab === 'documentation' && (
            <DocumentationView />
          )}
          {activeTab === 'settings' && (
            <SettingsView />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <AgentModal
        isOpen={isAgentModalOpen}
        onClose={() => setIsAgentModalOpen(false)}
        onSave={handleSaveAgent}
        initialAgent={editingAgent}
      />

      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={addTask}
      />

      {/* Floating Toasts */}
      <ToastContainer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ArenaProvider>
      <MainDashboard />
    </ArenaProvider>
  );
};

export default App;
