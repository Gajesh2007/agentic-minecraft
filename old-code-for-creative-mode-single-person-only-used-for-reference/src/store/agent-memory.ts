import { JsonStore } from './json-store.js';

export type AgentMemoryData = {
  /** Agent's self-written learnings — things it discovered through experience */
  learnings: string[];
  /** Key-value preferences the agent sets for itself */
  preferences: Record<string, string>;
  /** Running notes the agent writes to itself for future reference */
  notes: string[];
};

export class AgentMemory {
  private readonly store: JsonStore<AgentMemoryData>;

  constructor(path: string) {
    this.store = new JsonStore<AgentMemoryData>(path, {
      learnings: [],
      preferences: {},
      notes: [],
    });
  }

  async init(): Promise<void> {
    await this.store.init();
  }

  read(): AgentMemoryData {
    return this.store.get();
  }

  addLearning(learning: string): AgentMemoryData {
    return this.store.set(state => ({
      ...state,
      learnings: [...state.learnings, learning],
    }));
  }

  removeLearning(index: number): AgentMemoryData {
    return this.store.set(state => ({
      ...state,
      learnings: state.learnings.filter((_, i) => i !== index),
    }));
  }

  setPreference(key: string, value: string): AgentMemoryData {
    return this.store.set(state => ({
      ...state,
      preferences: { ...state.preferences, [key]: value },
    }));
  }

  deletePreference(key: string): AgentMemoryData {
    return this.store.set(state => {
      const { [key]: _, ...rest } = state.preferences;
      return { ...state, preferences: rest };
    });
  }

  addNote(note: string): AgentMemoryData {
    return this.store.set(state => ({
      ...state,
      notes: [...state.notes, note],
    }));
  }

  /** Keep only the last N notes to prevent unbounded growth */
  trimNotes(keepLast: number): AgentMemoryData {
    return this.store.set(state => ({
      ...state,
      notes: state.notes.slice(-keepLast),
    }));
  }

  /** Summary string for optional prompt injection (kept small) */
  getSummary(): string | null {
    const data = this.store.get();
    if (data.learnings.length === 0 && Object.keys(data.preferences).length === 0 && data.notes.length === 0) {
      return null;
    }
    const parts: string[] = [];
    if (data.learnings.length > 0) {
      parts.push('Learnings:\n' + data.learnings.map(l => `- ${l}`).join('\n'));
    }
    if (Object.keys(data.preferences).length > 0) {
      parts.push('Preferences:\n' + Object.entries(data.preferences).map(([k, v]) => `- ${k}: ${v}`).join('\n'));
    }
    if (data.notes.length > 0) {
      const recent = data.notes.slice(-5);
      parts.push('Recent notes:\n' + recent.map(n => `- ${n}`).join('\n'));
    }
    return parts.join('\n');
  }
}
