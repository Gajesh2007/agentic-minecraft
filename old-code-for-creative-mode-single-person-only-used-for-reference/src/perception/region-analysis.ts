import { createHash } from 'node:crypto';
import { Vec3 } from 'vec3';
import { AgentRuntime } from '../runtime/agent-runtime.js';
import { BBox, Vec3i, bboxDimensions, normalizeBBox } from '../types/geometry.js';

export async function computeCountsAndHash(agent: AgentRuntime, box: BBox): Promise<{ counts?: Record<string, number>; hash: string }> {
  const bot = agent.getBot();
  if (!bot) throw new Error('Bot is not connected');
  const counts = new Map<number, number>();
  const b = normalizeBBox(box);
  for (let x = b.min.x; x <= b.max.x; x += 1) {
    for (let y = b.min.y; y <= b.max.y; y += 1) {
      for (let z = b.min.z; z <= b.max.z; z += 1) {
        const stateId = await bot.world.getBlockStateId(new Vec3(x, y, z));
        counts.set(stateId, (counts.get(stateId) ?? 0) + 1);
      }
    }
  }
  const hash = hashCounts(counts);
  const outputCounts: Record<string, number> = {};
  for (const [stateId, count] of counts.entries()) {
    outputCounts[String(stateId)] = count;
  }
  return { counts: outputCounts, hash };
}

export async function computeRleStateIds(agent: AgentRuntime, box: BBox): Promise<{ dims: { dx: number; dy: number; dz: number }; rle: Array<[number, number]> }> {
  const bot = agent.getBot();
  if (!bot) throw new Error('Bot is not connected');
  const b = normalizeBBox(box);
  const { dx, dy, dz } = bboxDimensions(b);
  const rle: Array<[number, number]> = [];
  let last: number | null = null;
  let count = 0;
  for (let x = b.min.x; x <= b.max.x; x += 1) {
    for (let y = b.min.y; y <= b.max.y; y += 1) {
      for (let z = b.min.z; z <= b.max.z; z += 1) {
        const stateId = await bot.world.getBlockStateId(new Vec3(x, y, z));
        if (last === null) {
          last = stateId;
          count = 1;
        } else if (stateId === last) {
          count += 1;
        } else {
          rle.push([last, count]);
          last = stateId;
          count = 1;
        }
      }
    }
  }
  if (last !== null) rle.push([last, count]);
  return { dims: { dx, dy, dz }, rle };
}

export async function computeHeightmapGrid(
  agent: AgentRuntime,
  origin: Vec3i,
  radius: number,
  grid: number,
): Promise<{ heights: number[][]; topBlocks: (string | null)[][]; minY: number; maxY: number }> {
  const bot = agent.getBot();
  if (!bot) throw new Error('Bot is not connected');
  const game = bot.game as unknown as { minY?: number; height?: number } | undefined;
  const minY = game?.minY ?? -64;
  const maxY = minY + (game?.height ?? 384) - 1;
  const effectiveGrid = Math.max(3, grid);
  const half = Math.floor(effectiveGrid / 2);
  const step = Math.max(1, Math.floor((radius * 2) / (effectiveGrid - 1)));
  const heights: number[][] = [];
  const topBlocks: (string | null)[][] = [];
  for (let gx = -half; gx <= half; gx += 1) {
    const row: number[] = [];
    const rowBlocks: (string | null)[] = [];
    for (let gz = -half; gz <= half; gz += 1) {
      const x = origin.x + gx * step;
      const z = origin.z + gz * step;
      let found = minY;
      let foundBlock: string | null = null;
      for (let y = maxY; y >= minY; y -= 1) {
        const stateId = await bot.world.getBlockStateId(new Vec3(x, y, z));
        if (!isAirStateId(bot, stateId)) {
          found = y;
          foundBlock = bot.registry.blocks?.[stateId]?.name ?? null;
          break;
        }
      }
      row.push(found);
      rowBlocks.push(foundBlock);
    }
    heights.push(row);
    topBlocks.push(rowBlocks);
  }
  return { heights, topBlocks, minY, maxY };
}

function isAirStateId(bot: NonNullable<ReturnType<AgentRuntime['getBot']>>, stateId: number): boolean {
  const air = bot.registry.blocksByName?.air?.defaultState;
  const caveAir = bot.registry.blocksByName?.cave_air?.defaultState;
  const voidAir = bot.registry.blocksByName?.void_air?.defaultState;
  return stateId === air || stateId === caveAir || stateId === voidAir || stateId === 0;
}

function hashCounts(counts: Map<number, number>): string {
  const hash = createHash('sha256');
  const entries = [...counts.entries()].sort((a, b) => a[0] - b[0]);
  for (const [stateId, count] of entries) {
    hash.update(`${stateId}:${count};`);
  }
  return `sha256:${hash.digest('hex')}`;
}

