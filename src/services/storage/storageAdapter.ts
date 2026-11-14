import { Agent, BenchmarkTask, BenchmarkRun, ArenaSettings } from '../../types/index.ts';

export interface StorageExportBundle {
  version: string;
  schemaVersion: number;
  exportedAt: string;
  agents: Agent[];
  tasks: BenchmarkTask[];
  runs: BenchmarkRun[];
  settings: ArenaSettings;
}

export interface ImportValidationResult {
  success: boolean;
  importedRuns: number;
  importedAgents: number;
  importedTasks: number;
  skippedDuplicates: number;
  errors: string[];
}

/**
 * Storage Repository Interface.
 * Designed so IndexedDB, LocalStorage, or a cloud provider (e.g. Supabase)
 * can be plugged in interchangeably.
 */
export interface ArenaStorageRepository {
  init(): Promise<void>;
  
  // Runs
  getAllRuns(): Promise<BenchmarkRun[]>;
  getRunById(id: string): Promise<BenchmarkRun | null>;
  saveRun(run: BenchmarkRun): Promise<void>;
  deleteRun(id: string): Promise<void>;
  clearAllRuns(): Promise<void>;

  // Agents
  getAllAgents(): Promise<Agent[]>;
  saveAgent(agent: Agent): Promise<void>;
  deleteAgent(id: string): Promise<void>;

  // Tasks
  getAllTasks(): Promise<BenchmarkTask[]>;
  saveTask(task: BenchmarkTask): Promise<void>;
  deleteTask(id: string): Promise<void>;

  // Settings
  getSettings(): Promise<ArenaSettings | null>;
  saveSettings(settings: ArenaSettings): Promise<void>;

  // Export / Import / Reset
  exportData(): Promise<StorageExportBundle>;
  importData(bundle: any): Promise<ImportValidationResult>;
  resetToDefaults(): Promise<void>;
}
