import { JsonStore } from './json-store.js';
import { makeId } from '../lib/ids.js';
import { BBox, Vec3i, bboxContainsBox, bboxUnion, normalizeBBox } from '../types/geometry.js';

export type StructureType =
  | 'house'
  | 'tower'
  | 'road'
  | 'bridge'
  | 'garden'
  | 'plaza'
  | 'wall'
  | 'gate'
  | 'landmark'
  | 'district'
  | 'other';

export type StructureRecord = Readonly<{
  structureId: string;
  type: StructureType;
  name: string;
  bbox: BBox;
  anchor: Vec3i; // entrance or center point
  palette?: Record<string, string>;
  styleTags?: string[];
  blueprintId: string | null;
  parentStructureId: string | null; // for hierarchical grouping (e.g., house in district)
  checksum?: string;
  createdAt: string;
  updatedAt: string;
}>;

export type ZoningRule = Readonly<{
  ruleId: string;
  type: 'spacing' | 'alignment' | 'height-limit' | 'style-constraint';
  bbox?: BBox; // area where rule applies
  params: Record<string, unknown>;
}>;

export type DistrictRecord = Readonly<{
  districtId: string;
  name: string;
  bbox: BBox;
  style: { family: string; tags: string[] };
  zoningRules: ZoningRule[];
  structureIds: string[];
  createdAt: string;
}>;

type WorldIndexData = {
  structures: StructureRecord[];
  districts: DistrictRecord[];
  zoningRules: ZoningRule[];
};

export class WorldIndex {
  private store: JsonStore<WorldIndexData>;

  constructor(filePath: string) {
    this.store = new JsonStore<WorldIndexData>(filePath, {
      structures: [],
      districts: [],
      zoningRules: [],
    });
  }

  async init(): Promise<void> {
    await this.store.init();
  }

  private getData(): WorldIndexData {
    return this.store.get();
  }

  private update(updater: (data: WorldIndexData) => WorldIndexData): WorldIndexData {
    return this.store.set(updater);
  }

  // Structure management
  addStructure(input: {
    type: StructureType;
    name: string;
    bbox: BBox;
    anchor: Vec3i;
    palette?: Record<string, string>;
    styleTags?: string[];
    blueprintId?: string;
    parentStructureId?: string;
    checksum?: string;
  }): StructureRecord {
    const now = new Date().toISOString();
    const structure: StructureRecord = {
      structureId: makeId('struct'),
      type: input.type,
      name: input.name,
      bbox: normalizeBBox(input.bbox),
      anchor: input.anchor,
      palette: input.palette,
      styleTags: input.styleTags,
      blueprintId: input.blueprintId ?? null,
      parentStructureId: input.parentStructureId ?? null,
      checksum: input.checksum,
      createdAt: now,
      updatedAt: now,
    };
    this.update(data => ({
      ...data,
      structures: [...data.structures, structure],
    }));
    return structure;
  }

  getStructure(structureId: string): StructureRecord | undefined {
    return this.getData().structures.find(s => s.structureId === structureId);
  }

  updateStructure(
    structureId: string,
    updates: Partial<Pick<StructureRecord, 'name' | 'checksum' | 'styleTags'>>,
  ): StructureRecord | undefined {
    let updated: StructureRecord | undefined;
    this.update(data => {
      const idx = data.structures.findIndex(s => s.structureId === structureId);
      if (idx === -1) return data;
      const existing = data.structures[idx]!;
      updated = {
        ...existing,
        name: updates.name ?? existing.name,
        checksum: updates.checksum ?? existing.checksum,
        styleTags: updates.styleTags ?? existing.styleTags,
        updatedAt: new Date().toISOString(),
      };
      const newStructures = [...data.structures];
      newStructures[idx] = updated;
      return { ...data, structures: newStructures };
    });
    return updated;
  }

  removeStructure(structureId: string): boolean {
    let removed = false;
    this.update(data => {
      const idx = data.structures.findIndex(s => s.structureId === structureId);
      if (idx === -1) return data;
      removed = true;
      const newStructures = data.structures.filter(s => s.structureId !== structureId);
      const newDistricts = data.districts.map(d => ({
        ...d,
        structureIds: d.structureIds.filter(id => id !== structureId),
      }));
      return { ...data, structures: newStructures, districts: newDistricts };
    });
    return removed;
  }

  // Query structures
  listStructures(filter?: { type?: StructureType; withinBbox?: BBox; parentId?: string }): StructureRecord[] {
    let results = this.getData().structures;
    if (filter?.type) {
      results = results.filter(s => s.type === filter.type);
    }
    if (filter?.withinBbox) {
      const box = normalizeBBox(filter.withinBbox);
      results = results.filter(s => bboxContainsBox(box, s.bbox) || this.bboxOverlaps(box, s.bbox));
    }
    if (filter?.parentId !== undefined) {
      results = results.filter(s => s.parentStructureId === filter.parentId);
    }
    return results;
  }

  findStructuresNear(point: Vec3i, radius: number): StructureRecord[] {
    return this.getData().structures.filter(s => {
      const centerX = (s.bbox.min.x + s.bbox.max.x) / 2;
      const centerZ = (s.bbox.min.z + s.bbox.max.z) / 2;
      const dist = Math.sqrt((point.x - centerX) ** 2 + (point.z - centerZ) ** 2);
      return dist <= radius;
    });
  }

  findStructureAt(point: Vec3i): StructureRecord | undefined {
    return this.getData().structures.find(
      s =>
        point.x >= s.bbox.min.x &&
        point.x <= s.bbox.max.x &&
        point.y >= s.bbox.min.y &&
        point.y <= s.bbox.max.y &&
        point.z >= s.bbox.min.z &&
        point.z <= s.bbox.max.z,
    );
  }

  // District management
  createDistrict(input: {
    name: string;
    bbox: BBox;
    style: { family: string; tags: string[] };
    zoningRules?: ZoningRule[];
  }): DistrictRecord {
    const district: DistrictRecord = {
      districtId: makeId('dist'),
      name: input.name,
      bbox: normalizeBBox(input.bbox),
      style: input.style,
      zoningRules: input.zoningRules ?? [],
      structureIds: [],
      createdAt: new Date().toISOString(),
    };
    this.update(data => ({
      ...data,
      districts: [...data.districts, district],
    }));
    return district;
  }

  getDistrict(districtId: string): DistrictRecord | undefined {
    return this.getData().districts.find(d => d.districtId === districtId);
  }

  listDistricts(): DistrictRecord[] {
    return [...this.getData().districts];
  }

  findDistrictAt(point: Vec3i): DistrictRecord | undefined {
    return this.getData().districts.find(
      d =>
        point.x >= d.bbox.min.x &&
        point.x <= d.bbox.max.x &&
        point.z >= d.bbox.min.z &&
        point.z <= d.bbox.max.z,
    );
  }

  addStructureToDistrict(districtId: string, structureId: string): boolean {
    let added = false;
    this.update(data => {
      const idx = data.districts.findIndex(d => d.districtId === districtId);
      if (idx === -1) return data;
      const district = data.districts[idx]!;
      if (district.structureIds.includes(structureId)) return data;
      added = true;
      const newDistricts = [...data.districts];
      newDistricts[idx] = {
        ...district,
        structureIds: [...district.structureIds, structureId],
      };
      return { ...data, districts: newDistricts };
    });
    return added;
  }

  // Zoning rules
  addZoningRule(rule: Omit<ZoningRule, 'ruleId'>): ZoningRule {
    const fullRule: ZoningRule = {
      ruleId: makeId('rule'),
      ...rule,
    };
    this.update(data => ({
      ...data,
      zoningRules: [...data.zoningRules, fullRule],
    }));
    return fullRule;
  }

  getZoningRulesFor(point: Vec3i): ZoningRule[] {
    return this.getData().zoningRules.filter(rule => {
      if (!rule.bbox) return true; // global rule
      return (
        point.x >= rule.bbox.min.x &&
        point.x <= rule.bbox.max.x &&
        point.z >= rule.bbox.min.z &&
        point.z <= rule.bbox.max.z
      );
    });
  }

  // Check if a proposed structure violates zoning
  checkZoning(proposedBbox: BBox, type: StructureType): { ok: boolean; violations: string[] } {
    const violations: string[] = [];
    const box = normalizeBBox(proposedBbox);
    const center: Vec3i = {
      x: Math.floor((box.min.x + box.max.x) / 2),
      y: Math.floor((box.min.y + box.max.y) / 2),
      z: Math.floor((box.min.z + box.max.z) / 2),
    };

    // Check global and local zoning rules
    const rules = this.getZoningRulesFor(center);
    for (const rule of rules) {
      if (rule.type === 'height-limit') {
        const maxHeight = rule.params.maxHeight as number;
        const height = box.max.y - box.min.y;
        if (height > maxHeight) {
          violations.push(`Height ${height} exceeds limit ${maxHeight}`);
        }
      }
      if (rule.type === 'spacing') {
        const minSpacing = rule.params.minSpacing as number;
        const nearby = this.findStructuresNear(center, minSpacing);
        if (nearby.length > 0) {
          violations.push(`Too close to existing structures (min spacing: ${minSpacing})`);
        }
      }
    }

    // Check overlap with existing structures
    const overlapping = this.getData().structures.filter(s => this.bboxOverlaps(box, s.bbox));
    if (overlapping.length > 0) {
      violations.push(`Overlaps with: ${overlapping.map(s => s.name).join(', ')}`);
    }

    return { ok: violations.length === 0, violations };
  }

  // Compute world bounds
  getWorldBounds(): BBox | null {
    const structures = this.getData().structures;
    if (structures.length === 0) return null;
    return structures.map(s => s.bbox).reduce(bboxUnion);
  }

  // Summary for prompts
  getSummary(
    centerPoint: Vec3i,
    radius: number,
  ): {
    structureCount: number;
    districtCount: number;
    nearbyStructures: Array<{ name: string; type: StructureType; distance: number }>;
    currentDistrict: { name: string; style: { family: string; tags: string[] } } | null;
  } {
    const nearby = this.findStructuresNear(centerPoint, radius);
    const currentDistrict = this.findDistrictAt(centerPoint);

    return {
      structureCount: this.getData().structures.length,
      districtCount: this.getData().districts.length,
      nearbyStructures: nearby.map(s => ({
        name: s.name,
        type: s.type,
        distance: Math.sqrt(
          ((s.bbox.min.x + s.bbox.max.x) / 2 - centerPoint.x) ** 2 +
            ((s.bbox.min.z + s.bbox.max.z) / 2 - centerPoint.z) ** 2,
        ),
      })),
      currentDistrict: currentDistrict ? { name: currentDistrict.name, style: currentDistrict.style } : null,
    };
  }

  private bboxOverlaps(a: BBox, b: BBox): boolean {
    return !(
      a.max.x < b.min.x ||
      b.max.x < a.min.x ||
      a.max.y < b.min.y ||
      b.max.y < a.min.y ||
      a.max.z < b.min.z ||
      b.max.z < a.min.z
    );
  }
}
