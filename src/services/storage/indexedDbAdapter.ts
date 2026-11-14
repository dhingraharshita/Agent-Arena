import { Agent, BenchmarkTask, BenchmarkRun, ArenaSettings } from '../../types/index.ts';
import { STARTER_AGENTS } from '../../data/starterAgents.ts';
import { BENCHMARK_TASKS } from '../../data/benchmarkTasks.ts';
import { INITIAL_MOCK_RUNS } from '../../data/mockRuns.ts';
import { 
  ArenaStorageRepository, 
  StorageExportBundle, 
  ImportValidationResult 
} from './storageAdapter.ts';
import { validateAndSanitizeImport } from './schemaValidator.ts';

const DB_NAME = 'agentarena_db';
const DB_VERSION = 1;

export class IndexedDbStorageRepository implements ArenaStorageRepository {
  private db: IDBDatabase | null = null;
  private isFallbackToLocalStorage = false;

  public async init(): Promise<void> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      console.warn('IndexedDB not supported in this environment. Falling back to localStorage.');
      this.isFallbackToLocalStorage = true;
      this.initLocalStorageDefaults();
      return;
    }

    try {
      this.db = await this.openDatabase();
      await this.seedInitialDataIfEmpty();
    } catch (err) {
      console.warn('Failed to initialize IndexedDB. Falling back to localStorage:', err);
      this.isFallbackToLocalStorage = true;
      this.initLocalStorageDefaults();
    }
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store 1: Runs
        if (!db.objectStoreNames.contains('runs')) {
          const runStore = db.createObjectStore('runs', { keyPath: 'id' });
          runStore.createIndex('timestamp', 'timestamp', { unique: false });
          runStore.createIndex('executionMode', 'executionMode', { unique: false });
        }

        // Store 2: Agents
        if (!db.objectStoreNames.contains('agents')) {
          db.createObjectStore('agents', { keyPath: 'id' });
        }

        // Store 3: Tasks
        if (!db.objectStoreNames.contains('tasks')) {
          const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
          taskStore.createIndex('category', 'category', { unique: false });
        }

        // Store 4: Settings
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async seedInitialDataIfEmpty(): Promise<void> {
    const agents = await this.getAllAgents();
    if (agents.length === 0) {
      for (const agent of STARTER_AGENTS) {
        await this.saveAgent(agent);
      }
    }

    const tasks = await this.getAllTasks();
    if (tasks.length === 0) {
      for (const task of BENCHMARK_TASKS) {
        await this.saveTask(task);
      }
    }

    const runs = await this.getAllRuns();
    if (runs.length === 0) {
      for (const run of INITIAL_MOCK_RUNS) {
        await this.saveRun(run);
      }
    }
  }

  private initLocalStorageDefaults(): void {
    if (!localStorage.getItem('agentarena_agents')) {
      localStorage.setItem('agentarena_agents', JSON.stringify(STARTER_AGENTS));
    }
    if (!localStorage.getItem('agentarena_tasks')) {
      localStorage.setItem('agentarena_tasks', JSON.stringify(BENCHMARK_TASKS));
    }
    if (!localStorage.getItem('agentarena_runs')) {
      localStorage.setItem('agentarena_runs', JSON.stringify(INITIAL_MOCK_RUNS));
    }
  }

  // Generic store transaction helpers
  private executeTx<T>(
    storeName: string, 
    mode: IDBTransactionMode, 
    callback: (store: IDBObjectStore) => IDBRequest<T>
  ): Promise<T> {
    if (!this.db || this.isFallbackToLocalStorage) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      const request = callback(store);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // ================= RUNS =================
  public async getAllRuns(): Promise<BenchmarkRun[]> {
    if (this.isFallbackToLocalStorage) {
      const saved = localStorage.getItem('agentarena_runs');
      return saved ? JSON.parse(saved) : [];
    }

    try {
      const runs = await this.executeTx<BenchmarkRun[]>('runs', 'readonly', (store) => store.getAll());
      // Sort descending by timestamp (newest first)
      return runs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch {
      const saved = localStorage.getItem('agentarena_runs');
      return saved ? JSON.parse(saved) : [];
    }
  }

  public async getRunById(id: string): Promise<BenchmarkRun | null> {
    if (this.isFallbackToLocalStorage) {
      const runs = await this.getAllRuns();
      return runs.find(r => r.id === id) || null;
    }

    try {
      const run = await this.executeTx<BenchmarkRun>('runs', 'readonly', (store) => store.get(id));
      return run || null;
    } catch {
      const runs = await this.getAllRuns();
      return runs.find(r => r.id === id) || null;
    }
  }

  public async saveRun(run: BenchmarkRun): Promise<void> {
    // Also sync to localStorage as immediate backup
    try {
      const allRuns = await this.getAllRuns();
      const updated = [run, ...allRuns.filter(r => r.id !== run.id)];
      localStorage.setItem('agentarena_runs', JSON.stringify(updated));
    } catch {}

    if (this.isFallbackToLocalStorage) return;

    try {
      await this.executeTx('runs', 'readwrite', (store) => store.put(run));
    } catch (err) {
      console.warn('IndexedDB saveRun failed:', err);
    }
  }

  public async deleteRun(id: string): Promise<void> {
    try {
      const allRuns = await this.getAllRuns();
      const filtered = allRuns.filter(r => r.id !== id);
      localStorage.setItem('agentarena_runs', JSON.stringify(filtered));
    } catch {}

    if (this.isFallbackToLocalStorage) return;

    try {
      await this.executeTx('runs', 'readwrite', (store) => store.delete(id));
    } catch (err) {
      console.warn('IndexedDB deleteRun failed:', err);
    }
  }

  public async clearAllRuns(): Promise<void> {
    localStorage.removeItem('agentarena_runs');
    if (this.isFallbackToLocalStorage) return;

    try {
      await this.executeTx('runs', 'readwrite', (store) => store.clear());
    } catch (err) {
      console.warn('IndexedDB clearAllRuns failed:', err);
    }
  }

  // ================= AGENTS =================
  public async getAllAgents(): Promise<Agent[]> {
    if (this.isFallbackToLocalStorage) {
      const saved = localStorage.getItem('agentarena_agents');
      return saved ? JSON.parse(saved) : STARTER_AGENTS;
    }

    try {
      const agents = await this.executeTx<Agent[]>('agents', 'readonly', (store) => store.getAll());
      return agents.length > 0 ? agents : STARTER_AGENTS;
    } catch {
      const saved = localStorage.getItem('agentarena_agents');
      return saved ? JSON.parse(saved) : STARTER_AGENTS;
    }
  }

  public async saveAgent(agent: Agent): Promise<void> {
    try {
      const allAgents = await this.getAllAgents();
      const updated = [agent, ...allAgents.filter(a => a.id !== agent.id)];
      localStorage.setItem('agentarena_agents', JSON.stringify(updated));
    } catch {}

    if (this.isFallbackToLocalStorage) return;

    try {
      await this.executeTx('agents', 'readwrite', (store) => store.put(agent));
    } catch (err) {
      console.warn('IndexedDB saveAgent failed:', err);
    }
  }

  public async deleteAgent(id: string): Promise<void> {
    try {
      const allAgents = await this.getAllAgents();
      const filtered = allAgents.filter(a => a.id !== id);
      localStorage.setItem('agentarena_agents', JSON.stringify(filtered));
    } catch {}

    if (this.isFallbackToLocalStorage) return;

    try {
      await this.executeTx('agents', 'readwrite', (store) => store.delete(id));
    } catch (err) {
      console.warn('IndexedDB deleteAgent failed:', err);
    }
  }

  // ================= TASKS =================
  public async getAllTasks(): Promise<BenchmarkTask[]> {
    if (this.isFallbackToLocalStorage) {
      const saved = localStorage.getItem('agentarena_tasks');
      return saved ? JSON.parse(saved) : BENCHMARK_TASKS;
    }

    try {
      const tasks = await this.executeTx<BenchmarkTask[]>('tasks', 'readonly', (store) => store.getAll());
      return tasks.length > 0 ? tasks : BENCHMARK_TASKS;
    } catch {
      const saved = localStorage.getItem('agentarena_tasks');
      return saved ? JSON.parse(saved) : BENCHMARK_TASKS;
    }
  }

  public async saveTask(task: BenchmarkTask): Promise<void> {
    try {
      const allTasks = await this.getAllTasks();
      const updated = [task, ...allTasks.filter(t => t.id !== task.id)];
      localStorage.setItem('agentarena_tasks', JSON.stringify(updated));
    } catch {}

    if (this.isFallbackToLocalStorage) return;

    try {
      await this.executeTx('tasks', 'readwrite', (store) => store.put(task));
    } catch (err) {
      console.warn('IndexedDB saveTask failed:', err);
    }
  }

  public async deleteTask(id: string): Promise<void> {
    try {
      const allTasks = await this.getAllTasks();
      const filtered = allTasks.filter(t => t.id !== id);
      localStorage.setItem('agentarena_tasks', JSON.stringify(filtered));
    } catch {}

    if (this.isFallbackToLocalStorage) return;

    try {
      await this.executeTx('tasks', 'readwrite', (store) => store.delete(id));
    } catch (err) {
      console.warn('IndexedDB deleteTask failed:', err);
    }
  }

  // ================= SETTINGS =================
  public async getSettings(): Promise<ArenaSettings | null> {
    if (this.isFallbackToLocalStorage) {
      const saved = localStorage.getItem('agentarena_settings');
      return saved ? JSON.parse(saved) : null;
    }

    try {
      const settings = await this.executeTx<any>('settings', 'readonly', (store) => store.get('current'));
      return settings ? settings.data : null;
    } catch {
      const saved = localStorage.getItem('agentarena_settings');
      return saved ? JSON.parse(saved) : null;
    }
  }

  public async saveSettings(settings: ArenaSettings): Promise<void> {
    try {
      localStorage.setItem('agentarena_settings', JSON.stringify(settings));
    } catch {}

    if (this.isFallbackToLocalStorage) return;

    try {
      await this.executeTx('settings', 'readwrite', (store) => store.put({ id: 'current', data: settings }));
    } catch (err) {
      console.warn('IndexedDB saveSettings failed:', err);
    }
  }

  // ================= EXPORT / IMPORT / RESET =================
  public async exportData(): Promise<StorageExportBundle> {
    const [runs, agents, tasks, settings] = await Promise.all([
      this.getAllRuns(),
      this.getAllAgents(),
      this.getAllTasks(),
      this.getSettings()
    ]);

    return {
      version: '3.0.0',
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      runs,
      agents,
      tasks,
      settings: settings || ({} as ArenaSettings)
    };
  }

  public async importData(rawJson: any): Promise<ImportValidationResult> {
    const [currentRuns, currentAgents, currentTasks] = await Promise.all([
      this.getAllRuns(),
      this.getAllAgents(),
      this.getAllTasks()
    ]);

    const validation = validateAndSanitizeImport(rawJson, currentRuns, currentAgents, currentTasks);

    if (!validation.isValid) {
      return {
        success: false,
        importedRuns: 0,
        importedAgents: 0,
        importedTasks: 0,
        skippedDuplicates: 0,
        errors: validation.errors
      };
    }

    const { runsToAdd, agentsToAdd, tasksToAdd, settingsToApply, skippedRuns } = validation.sanitizedBundle;

    // Persist new agents
    for (const agent of agentsToAdd) {
      await this.saveAgent(agent);
    }

    // Persist new tasks
    for (const task of tasksToAdd) {
      await this.saveTask(task);
    }

    // Persist new runs
    for (const run of runsToAdd) {
      await this.saveRun(run);
    }

    // Apply settings if present
    if (settingsToApply) {
      await this.saveSettings(settingsToApply);
    }

    return {
      success: true,
      importedRuns: runsToAdd.length,
      importedAgents: agentsToAdd.length,
      importedTasks: tasksToAdd.length,
      skippedDuplicates: skippedRuns,
      errors: []
    };
  }

  public async resetToDefaults(): Promise<void> {
    // Clear storage
    localStorage.removeItem('agentarena_agents');
    localStorage.removeItem('agentarena_tasks');
    localStorage.removeItem('agentarena_runs');
    localStorage.removeItem('agentarena_settings');

    if (!this.isFallbackToLocalStorage && this.db) {
      try {
        await Promise.all([
          this.executeTx('runs', 'readwrite', (s) => s.clear()),
          this.executeTx('agents', 'readwrite', (s) => s.clear()),
          this.executeTx('tasks', 'readwrite', (s) => s.clear()),
          this.executeTx('settings', 'readwrite', (s) => s.clear())
        ]);
      } catch (err) {
        console.warn('Error clearing IndexedDB on reset:', err);
      }
    }

    // Seed defaults
    for (const agent of STARTER_AGENTS) {
      await this.saveAgent(agent);
    }
    for (const task of BENCHMARK_TASKS) {
      await this.saveTask(task);
    }
    for (const run of INITIAL_MOCK_RUNS) {
      await this.saveRun(run);
    }
  }
}

// Singleton storage repository instance
export const storageService = new IndexedDbStorageRepository();
