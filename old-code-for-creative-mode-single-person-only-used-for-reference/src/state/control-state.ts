import { Budgets } from '../types/blueprint.js';
import { BBox } from '../types/geometry.js';
import { JsonStore } from '../store/json-store.js';

type ControlStateData = {
  budgets: Budgets;
  buildZone: BBox | null;
  allowlist: string[];
};

export class ControlState {
  private readonly store: JsonStore<ControlStateData>;

  constructor(path: string) {
    this.store = new JsonStore<ControlStateData>(path, {
      budgets: {
        maxSeconds: 3600,
        maxCommands: 50000,
        maxChangedBlocksUpperBound: 5000000,
      },
      buildZone: null,
      allowlist: [],
    });
  }

  async init(): Promise<void> {
    await this.store.init();
  }

  getBudgets(): Budgets {
    return this.store.get().budgets;
  }

  setBudgets(budgets: Budgets): Budgets {
    return this.store.set(state => ({ ...state, budgets })).budgets;
  }

  getBuildZone(): BBox | null {
    return this.store.get().buildZone;
  }

  setBuildZone(buildZone: BBox | null): BBox | null {
    return this.store.set(state => ({ ...state, buildZone })).buildZone;
  }

  getAllowlist(): string[] {
    return this.store.get().allowlist;
  }

  updateAllowlist(allowed: string[], mode: 'replace' | 'add' | 'remove' | 'clear'): string[] {
    return this.store.set(state => {
      const current = new Set(state.allowlist);
      if (mode === 'replace') {
        return { ...state, allowlist: Array.from(new Set(allowed)) };
      }
      if (mode === 'clear') {
        return { ...state, allowlist: [] };
      }
      if (mode === 'add') {
        for (const name of allowed) current.add(name);
      } else if (mode === 'remove') {
        for (const name of allowed) current.delete(name);
      }
      return { ...state, allowlist: Array.from(current) };
    }).allowlist;
  }
}

