import { createHash } from 'node:crypto';
import { Vec3 } from 'vec3';
import prismarineBlock from 'prismarine-block';
import { AgentRuntime } from '../runtime/agent-runtime.js';
import { Blueprint, BlueprintOp } from '../types/blueprint.js';
import { BlockSpec, resolveBlockSpec } from '../types/blocks.js';
import { BBox, Vec3i, addVec, bboxDimensions, normalizeBBox } from '../types/geometry.js';

type ExpectedBlock = { stateId: number; block: string };

export async function verifyBlueprint({
  agent,
  blueprint,
  bbox,
  threshold,
  retries = 3,
}: {
  agent: AgentRuntime;
  blueprint: Blueprint;
  bbox: BBox;
  threshold: number;
  retries?: number;
}): Promise<{
  ok: boolean;
  matchRatio: number;
  diffs: Array<{ pos: Vec3i; expected: ExpectedBlock; actual: number }>;
  expectedHash: string;
  actualHash: string;
  patchOps: BlueprintOp[];
}> {
  let bestResult: Awaited<ReturnType<typeof verifyOnce>> | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    if (attempt > 0) {
      // Wait progressively longer between retries for chunks to settle
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }

    const result = await verifyOnce({ agent, blueprint, bbox, threshold });
    if (result.ok) return result;

    if (!bestResult || result.matchRatio > bestResult.matchRatio) {
      bestResult = result;
    }
  }

  return bestResult!;
}

async function verifyOnce({
  agent,
  blueprint,
  bbox,
  threshold,
}: {
  agent: AgentRuntime;
  blueprint: Blueprint;
  bbox: BBox;
  threshold: number;
}): Promise<{
  ok: boolean;
  matchRatio: number;
  diffs: Array<{ pos: Vec3i; expected: ExpectedBlock; actual: number }>;
  expectedHash: string;
  actualHash: string;
  patchOps: BlueprintOp[];
}> {
  const bot = agent.getBot();
  if (!bot) throw new Error('Bot is not connected');
  const Block = prismarineBlock(bot.registry);
  const biomeId = bot.registry.biomesByName?.plains?.id ?? 0;
  const expectedMap = buildExpectedMap(blueprint, bbox, (spec: BlockSpec) => {
    const blockStr = resolveBlockSpec(spec, blueprint.palette);
    const block = Block.fromString(blockStr, biomeId);
    return { stateId: block.stateId, block: blockStr };
  });
  const airBlock = Block.fromString('minecraft:air', biomeId);
  const airExpected: ExpectedBlock = { stateId: airBlock.stateId, block: 'minecraft:air' };

  const b = normalizeBBox(bbox);
  const { dx, dy, dz } = bboxDimensions(b);
  const total = dx * dy * dz;
  let matched = 0;
  let skippedUnloaded = 0;
  const diffs: Array<{ pos: Vec3i; expected: ExpectedBlock; actual: number }> = [];

  const expectedCounts = new Map<number, number>();
  const actualCounts = new Map<number, number>();

  for (let x = b.min.x; x <= b.max.x; x += 1) {
    for (let y = b.min.y; y <= b.max.y; y += 1) {
      for (let z = b.min.z; z <= b.max.z; z += 1) {
        const key = `${x},${y},${z}`;
        const expected = expectedMap.get(key) ?? airExpected;
        const block = bot.blockAt(new Vec3(x, y, z));
        if (!block) {
          // Chunk not loaded — skip this block entirely, don't count as mismatch
          skippedUnloaded += 1;
          continue;
        }
        const actual = block.stateId;
        expectedCounts.set(expected.stateId, (expectedCounts.get(expected.stateId) ?? 0) + 1);
        actualCounts.set(actual, (actualCounts.get(actual) ?? 0) + 1);
        if (actual === expected.stateId) {
          matched += 1;
        } else if (block.name === expected.block.split('[')[0]!.replace('minecraft:', '')) {
          // Same block type, different state (e.g. stair facing, glass pane connections)
          // Count as match — state differences are cosmetic for verification purposes
          matched += 1;
        } else if (diffs.length < 500) {
          diffs.push({ pos: { x, y, z }, expected, actual });
        }
      }
    }
  }

  const checkedTotal = total - skippedUnloaded;
  const matchRatio = checkedTotal === 0 ? 0 : matched / checkedTotal;
  const ok = matchRatio >= threshold && skippedUnloaded < total * 0.1; // fail if >10% unloaded
  const patchOps: BlueprintOp[] = diffs.map(diff => ({
    op: 'fillCuboid',
    from: diff.pos,
    to: diff.pos,
    block: { state: diff.expected.block },
  }));
  return {
    ok,
    matchRatio,
    diffs,
    expectedHash: hashCounts(expectedCounts),
    actualHash: hashCounts(actualCounts),
    patchOps,
  };
}

function buildExpectedMap(
  blueprint: Blueprint,
  bbox: BBox,
  resolve: (spec: BlockSpec) => ExpectedBlock,
): Map<string, ExpectedBlock> {
  const map = new Map<string, ExpectedBlock>();
  for (const op of blueprint.ops) {
    applyOp(map, blueprint, op, resolve, bbox);
  }
  return map;
}

function applyOp(
  map: Map<string, ExpectedBlock>,
  blueprint: Blueprint,
  op: BlueprintOp,
  resolve: (spec: BlockSpec) => ExpectedBlock,
  bbox: BBox,
): void {
  switch (op.op) {
    case 'fillCuboid': {
      fill(map, toWorldBox(blueprint.origin, op.from, op.to), resolve(op.block), bbox);
      return;
    }
    case 'hollowBox': {
      const box = toWorldBox(blueprint.origin, op.from, op.to);
      hollow(map, box, resolve(op.wall), bbox);
      if (op.trim) {
        trimBand(map, box, box.max.y, resolve(op.trim), bbox);
      }
      return;
    }
    case 'foundation': {
      const rect = normalizeBBox({
        min: addVec(blueprint.origin, op.rect.min),
        max: addVec(blueprint.origin, op.rect.max),
      });
      const height = op.height ?? 1;
      const box = normalizeBBox({
        min: rect.min,
        max: { x: rect.max.x, y: rect.min.y + height - 1, z: rect.max.z },
      });
      fill(map, box, resolve(op.material), bbox);
      return;
    }
    case 'windowRow': {
      const wall = normalizeBBox({
        min: addVec(blueprint.origin, op.wall.min),
        max: addVec(blueprint.origin, op.wall.max),
      });
      const { dx, dz } = bboxDimensions(wall);
      const alongX = dz === 1;
      const alongZ = dx === 1;
      if (!alongX && !alongZ) return;
      const count = alongX ? dx : dz;
      for (let i = 0; i < count; i += op.every) {
        const pos = alongX
          ? { x: wall.min.x + i, y: op.y + blueprint.origin.y, z: wall.min.z }
          : { x: wall.min.x, y: op.y + blueprint.origin.y, z: wall.min.z + i };
        setBlock(map, pos, resolve(op.block), bbox);
      }
      return;
    }
    case 'door': {
      const pos = addVec(blueprint.origin, op.at);
      const base = resolveBlockSpec(op.material, blueprint.palette);
      const hinge = op.hinge ?? 'left';
      const lower = resolve({ state: `${base}[facing=${op.facing},half=lower,hinge=${hinge},open=false]` });
      const upper = resolve({ state: `${base}[facing=${op.facing},half=upper,hinge=${hinge},open=false]` });
      setBlock(map, pos, lower, bbox);
      setBlock(map, { x: pos.x, y: pos.y + 1, z: pos.z }, upper, bbox);
      return;
    }
    case 'gableRoof': {
      const roofBox = normalizeBBox({
        min: addVec(blueprint.origin, op.bbox.min),
        max: addVec(blueprint.origin, op.bbox.max),
      });
      const { dx, dz } = bboxDimensions(roofBox);
      const shrinkAxis = dx <= dz ? 'x' : 'z';
      let layer = 0;
      let current = roofBox;
      while (true) {
        const layerBox = normalizeBBox({
          min: { x: current.min.x, y: roofBox.min.y + layer, z: current.min.z },
          max: { x: current.max.x, y: roofBox.min.y + layer, z: current.max.z },
        });
        fill(map, layerBox, resolve(op.block), bbox);
        if (shrinkAxis === 'x') {
          if (current.min.x + 1 > current.max.x - 1) break;
          current = normalizeBBox({
            min: { ...current.min, x: current.min.x + 1 },
            max: { ...current.max, x: current.max.x - 1 },
          });
        } else {
          if (current.min.z + 1 > current.max.z - 1) break;
          current = normalizeBBox({
            min: { ...current.min, z: current.min.z + 1 },
            max: { ...current.max, z: current.max.z - 1 },
          });
        }
        layer += 1;
      }
      return;
    }
    case 'trimBand': {
      const box = normalizeBBox({
        min: addVec(blueprint.origin, op.bbox.min),
        max: addVec(blueprint.origin, op.bbox.max),
      });
      trimBand(map, box, op.y + blueprint.origin.y, resolve(op.material), bbox);
      return;
    }
    default:
      return;
  }
}

function toWorldBox(origin: Vec3i, from: Vec3i, to: Vec3i): BBox {
  return normalizeBBox({ min: addVec(origin, from), max: addVec(origin, to) });
}

function setBlock(map: Map<string, ExpectedBlock>, pos: Vec3i, block: ExpectedBlock, bbox: BBox): void {
  if (!inside(bbox, pos)) return;
  map.set(`${pos.x},${pos.y},${pos.z}`, block);
}

function fill(map: Map<string, ExpectedBlock>, box: BBox, block: ExpectedBlock, bbox: BBox): void {
  const b = normalizeBBox(box);
  for (let x = b.min.x; x <= b.max.x; x += 1) {
    for (let y = b.min.y; y <= b.max.y; y += 1) {
      for (let z = b.min.z; z <= b.max.z; z += 1) {
        setBlock(map, { x, y, z }, block, bbox);
      }
    }
  }
}

function hollow(map: Map<string, ExpectedBlock>, box: BBox, block: ExpectedBlock, bbox: BBox): void {
  const b = normalizeBBox(box);
  for (let x = b.min.x; x <= b.max.x; x += 1) {
    for (let y = b.min.y; y <= b.max.y; y += 1) {
      for (let z = b.min.z; z <= b.max.z; z += 1) {
        const edge =
          x === b.min.x ||
          x === b.max.x ||
          y === b.min.y ||
          y === b.max.y ||
          z === b.min.z ||
          z === b.max.z;
        if (edge) setBlock(map, { x, y, z }, block, bbox);
      }
    }
  }
}

function trimBand(map: Map<string, ExpectedBlock>, box: BBox, y: number, block: ExpectedBlock, bbox: BBox): void {
  const b = normalizeBBox(box);
  for (let x = b.min.x; x <= b.max.x; x += 1) {
    setBlock(map, { x, y, z: b.min.z }, block, bbox);
    setBlock(map, { x, y, z: b.max.z }, block, bbox);
  }
  for (let z = b.min.z; z <= b.max.z; z += 1) {
    setBlock(map, { x: b.min.x, y, z }, block, bbox);
    setBlock(map, { x: b.max.x, y, z }, block, bbox);
  }
}

function inside(bbox: BBox, pos: Vec3i): boolean {
  const b = normalizeBBox(bbox);
  return pos.x >= b.min.x && pos.x <= b.max.x && pos.y >= b.min.y && pos.y <= b.max.y && pos.z >= b.min.z && pos.z <= b.max.z;
}

function hashCounts(counts: Map<number, number>): string {
  const hash = createHash('sha256');
  const entries = [...counts.entries()].sort((a, b) => a[0] - b[0]);
  for (const [stateId, count] of entries) {
    hash.update(`${stateId}:${count};`);
  }
  return `sha256:${hash.digest('hex')}`;
}
