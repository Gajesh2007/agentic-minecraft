import { JsonStore } from './json-store.js';
import { Blueprint, BlueprintOp } from '../types/blueprint.js';
import { makeId } from '../lib/ids.js';

type BlueprintStoreData = {
  blueprints: Blueprint[];
};

export class BlueprintStore {
  private readonly store: JsonStore<BlueprintStoreData>;

  constructor(path: string) {
    this.store = new JsonStore<BlueprintStoreData>(path, { blueprints: [] });
  }

  async init(): Promise<void> {
    await this.store.init();
  }

  get(blueprintId: string): Blueprint | undefined {
    return this.store.get().blueprints.find(bp => bp.blueprintId === blueprintId);
  }

  list(): Blueprint[] {
    return this.store.get().blueprints;
  }

  create(input: Omit<Blueprint, 'blueprintId' | 'parentId' | 'expected'>): Blueprint {
    const blueprint: Blueprint = {
      ...input,
      blueprintId: makeId('bp'),
      parentId: null,
      expected: undefined,
    };

    this.store.set(state => ({ ...state, blueprints: [...state.blueprints, blueprint] }));
    return blueprint;
  }

  revise(blueprintId: string, patchOps: BlueprintOp[]): Blueprint {
    const parent = this.get(blueprintId);
    if (!parent) throw new Error(`Unknown blueprint ${blueprintId}`);
    const revised: Blueprint = {
      ...parent,
      blueprintId: makeId('bp'),
      parentId: parent.blueprintId,
      ops: [...parent.ops, ...patchOps],
      expected: undefined,
    };
    this.store.set(state => ({ ...state, blueprints: [...state.blueprints, revised] }));
    return revised;
  }

  updateExpected(blueprintId: string, expected: Blueprint['expected']): Blueprint {
    const blueprints = this.store.get().blueprints.map(bp =>
      bp.blueprintId === blueprintId ? { ...bp, expected } : bp,
    );
    this.store.set(state => ({ ...state, blueprints }));
    const updated = blueprints.find(bp => bp.blueprintId === blueprintId);
    if (!updated) throw new Error(`Unknown blueprint ${blueprintId}`);
    return updated;
  }
}

