import { JsonStore } from './json-store.js';
import type { Vec3i } from '../types/geometry.js';

export type AgentMemoryData = {
  learnings: string[];
  preferences: Record<string, string>;
  notes: string[];
  shelterLocation: Vec3i | null;
  knownResources: Record<string, Vec3i[]>;
  deathLocations: Vec3i[];
};

export class AgentMemory {
  private readonly store: JsonStore<AgentMemoryData>;

  constructor(path: string) {
    this.store = new JsonStore<AgentMemoryData>(path, {
      learnings: [],
      preferences: {},
      notes: [],
      shelterLocation: null,
      knownResources: {},
      deathLocations: [],
    });
  }

  async init(): Promise<void> {
    await this.store.init();
  }

  read(): AgentMemoryData {
    return this.store.get();
  }

  addLearning(learning: string): void {
    this.store.set(s => ({ ...s, learnings: [...s.learnings, learning] }));
  }

  addNote(note: string): void {
    this.store.set(s => ({ ...s, notes: [...s.notes, note] }));
  }

  setPreference(key: string, value: string): void {
    this.store.set(s => ({ ...s, preferences: { ...s.preferences, [key]: value } }));
  }

  setShelterLocation(pos: Vec3i): void {
    this.store.set(s => ({ ...s, shelterLocation: pos }));
  }

  addDeathLocation(pos: Vec3i): void {
    this.store.set(s => ({ ...s, deathLocations: [...s.deathLocations, pos] }));
  }

  addResourceLocation(resource: string, pos: Vec3i): void {
    this.store.set(s => ({
      ...s,
      knownResources: {
        ...s.knownResources,
        [resource]: [...(s.knownResources[resource] ?? []), pos].slice(-10),
      },
    }));
  }

  getSummary(): string | null {
    const d = this.store.get();
    const parts: string[] = [];
    if (d.learnings.length > 0) parts.push('Learnings:\n' + d.learnings.map(l => `- ${l}`).join('\n'));
    if (d.shelterLocation) parts.push(`Shelter: ${d.shelterLocation.x}, ${d.shelterLocation.y}, ${d.shelterLocation.z}`);
    if (d.notes.length > 0) parts.push('Notes:\n' + d.notes.slice(-5).map(n => `- ${n}`).join('\n'));
    if (Object.keys(d.preferences).length > 0) parts.push('Preferences:\n' + Object.entries(d.preferences).map(([k, v]) => `- ${k}: ${v}`).join('\n'));
    return parts.length > 0 ? parts.join('\n') : null;
  }
}
