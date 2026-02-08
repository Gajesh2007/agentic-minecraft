import { JsonStore } from './json-store.js';
import { makeId } from '../lib/ids.js';

export type EpisodeRecord = {
  episodeId: string;
  startedAt: string;
  endedAt: string | null;
  objective: string | null;
  summary: string | null;
  status: 'running' | 'completed' | 'failed';
};

type EpisodeStoreData = {
  episodes: EpisodeRecord[];
};

export class EpisodeStore {
  private readonly store: JsonStore<EpisodeStoreData>;

  constructor(path: string) {
    this.store = new JsonStore<EpisodeStoreData>(path, { episodes: [] });
  }

  async init(): Promise<void> {
    await this.store.init();
  }

  start(objective: string | null): EpisodeRecord {
    const episode: EpisodeRecord = {
      episodeId: makeId('ep'),
      startedAt: new Date().toISOString(),
      endedAt: null,
      objective,
      summary: null,
      status: 'running',
    };
    this.store.set(state => ({ ...state, episodes: [...state.episodes, episode] }));
    return episode;
  }

  finish(episodeId: string, summary: string, status: 'completed' | 'failed'): EpisodeRecord {
    const episodes = this.store.get().episodes.map(ep =>
      ep.episodeId === episodeId
        ? { ...ep, endedAt: new Date().toISOString(), summary, status }
        : ep,
    );
    this.store.set(state => ({ ...state, episodes }));
    const updated = episodes.find(ep => ep.episodeId === episodeId);
    if (!updated) throw new Error(`Unknown episode ${episodeId}`);
    return updated;
  }

  get(episodeId: string): EpisodeRecord | undefined {
    return this.store.get().episodes.find(ep => ep.episodeId === episodeId);
  }

  list(): EpisodeRecord[] {
    return [...this.store.get().episodes];
  }

  getRecent(n: number): EpisodeRecord[] {
    const all = this.store.get().episodes;
    return all.slice(Math.max(0, all.length - n));
  }

  getLastCompleted(): EpisodeRecord | undefined {
    const all = this.store.get().episodes;
    for (let i = all.length - 1; i >= 0; i--) {
      if (all[i]!.status === 'completed') return all[i];
    }
    return undefined;
  }

  /** Mark any orphaned "running" episodes as failed on startup */
  cleanupOrphaned(): number {
    let cleaned = 0;
    const episodes = this.store.get().episodes.map(ep => {
      if (ep.status === 'running') {
        cleaned += 1;
        return { ...ep, endedAt: new Date().toISOString(), summary: 'interrupted by process restart', status: 'failed' as const };
      }
      return ep;
    });
    if (cleaned > 0) {
      this.store.set(state => ({ ...state, episodes }));
    }
    return cleaned;
  }
}

