import { BBox, Vec3i } from './geometry.js';
import { BlockSpec, Palette } from './blocks.js';

export type { Palette } from './blocks.js';

export type StyleSpec = Readonly<{
  family?: string;
  tags?: string[];
}>;

export type BlueprintOp =
  // Geometry primitives
  | { op: 'fillCuboid'; from: Vec3i; to: Vec3i; block: BlockSpec }
  | { op: 'hollowBox'; from: Vec3i; to: Vec3i; wall: BlockSpec; trim?: BlockSpec }
  | { op: 'replace'; from: Vec3i; to: Vec3i; fromBlock: BlockSpec; toBlock: BlockSpec }
  | { op: 'repeat'; innerOp: BlueprintOp; dx: number; dy: number; dz: number; count: number }
  | { op: 'mirror'; innerOp: BlueprintOp; axis: 'x' | 'z'; center: number }
  // Architecture
  | { op: 'foundation'; rect: BBox; material: BlockSpec; height?: number }
  | { op: 'pillarLine'; start: Vec3i; end: Vec3i; material: BlockSpec; spacing: number }
  | { op: 'beam'; start: Vec3i; end: Vec3i; material: BlockSpec }
  | { op: 'windowRow'; wall: BBox; y: number; every: number; block: BlockSpec }
  | { op: 'door'; at: Vec3i; facing: 'north' | 'south' | 'east' | 'west'; material: BlockSpec; hinge?: 'left' | 'right' }
  | { op: 'staircase'; from: Vec3i; to: Vec3i; material: BlockSpec; style: 'straight' | 'spiral' }
  // Roofs
  | { op: 'gableRoof'; bbox: BBox; overhang?: number; block: BlockSpec }
  | { op: 'hipRoof'; bbox: BBox; overhang?: number; block: BlockSpec }
  | { op: 'flatRoof'; bbox: BBox; trim?: BlockSpec; block: BlockSpec }
  // Detailing
  | { op: 'trimBand'; bbox: BBox; y: number; material: BlockSpec }
  | { op: 'overhang'; bbox: BBox; depth: number; material: BlockSpec }
  | { op: 'balcony'; bbox: BBox; railMaterial: BlockSpec; floorMaterial?: BlockSpec }
  | { op: 'arch'; opening: BBox; material: BlockSpec }
  // Road/path
  | { op: 'road'; path: Vec3i[]; width: number; material: BlockSpec; edgeMaterial?: BlockSpec }
  | { op: 'lamppost'; at: Vec3i; height: number; material: BlockSpec; lightBlock: BlockSpec };

export type Blueprint = Readonly<{
  blueprintId: string;
  parentId: string | null;
  name: string;
  origin: Vec3i;
  style?: StyleSpec;
  palette?: Palette;
  ops: BlueprintOp[];
  expected?: { bbox: BBox; checksum?: string };
}>;

export type ConstructionStep = Readonly<{
  kind: 'command';
  command: string;
  bbox: BBox;
  estimatedChangedBlocksUpperBound: number;
  blocksUsed: string[];
}>;

export type ConstructionScript = Readonly<{
  scriptId: string;
  blueprintId: string;
  steps: ConstructionStep[];
  estimated: { changedBlocksUpperBound: number; commands: number };
}>;

export type Budgets = Readonly<{
  maxSeconds: number;
  maxCommands: number;
  maxChangedBlocksUpperBound: number;
}>;

export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';

export type JobRecord<Result = unknown> = Readonly<{
  jobId: string;
  type: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  result: Result | null;
  error: { message: string } | null;
}>;

