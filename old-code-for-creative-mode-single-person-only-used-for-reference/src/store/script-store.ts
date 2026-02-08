import { JsonStore } from './json-store.js';
import { ConstructionScript } from '../types/blueprint.js';

type ScriptStoreData = {
  scripts: ConstructionScript[];
};

export class ScriptStore {
  private readonly store: JsonStore<ScriptStoreData>;

  constructor(path: string) {
    this.store = new JsonStore<ScriptStoreData>(path, { scripts: [] });
  }

  async init(): Promise<void> {
    await this.store.init();
  }

  get(scriptId: string): ConstructionScript | undefined {
    return this.store.get().scripts.find(script => script.scriptId === scriptId);
  }

  save(script: ConstructionScript): ConstructionScript {
    const scripts = [...this.store.get().scripts, script];
    this.store.set(state => ({ ...state, scripts }));
    return script;
  }
}

