import { JsonStore } from '../store/json-store.js';
import { BBox } from '../types/geometry.js';

export type StructureTemplate = Readonly<{
  templateId: string;
  name: string;
  sourceBbox: BBox;
  dimensions: { dx: number; dy: number; dz: number };
  blockCount: number;
  createdAt: string;
  blueprintId?: string;
  tags?: string[];
}>;

type TemplateStoreData = { templates: StructureTemplate[] };

export class TemplateStore {
  private readonly store: JsonStore<TemplateStoreData>;

  constructor(path: string) {
    this.store = new JsonStore<TemplateStoreData>(path, { templates: [] });
  }

  async init(): Promise<void> {
    await this.store.init();
  }

  save(template: StructureTemplate): StructureTemplate {
    this.store.set(data => ({
      templates: [...data.templates, template],
    }));
    return template;
  }

  get(templateId: string): StructureTemplate | undefined {
    return this.store.get().templates.find(t => t.templateId === templateId);
  }

  list(): StructureTemplate[] {
    return this.store.get().templates;
  }

  delete(templateId: string): boolean {
    const before = this.store.get().templates.length;
    this.store.set(data => ({
      templates: data.templates.filter(t => t.templateId !== templateId),
    }));
    return this.store.get().templates.length < before;
  }
}
