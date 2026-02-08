import { AgentRuntime } from '../runtime/agent-runtime.js';
import { BBox } from '../types/geometry.js';
import { computeCountsAndHash, computeHeightmapGrid, computeRleStateIds } from './region-analysis.js';

export async function inspectRegion(
  agent: AgentRuntime,
  bbox: BBox,
  mode: 'blocks' | 'diff' | 'heightmap',
  encoding: 'rle-stateId' | 'counts' | 'hash',
): Promise<unknown> {
  if (mode === 'heightmap') {
    const origin = {
      x: Math.floor((bbox.min.x + bbox.max.x) / 2),
      y: Math.floor((bbox.min.y + bbox.max.y) / 2),
      z: Math.floor((bbox.min.z + bbox.max.z) / 2),
    };
    const radius = Math.max(bbox.max.x - bbox.min.x, bbox.max.z - bbox.min.z) / 2;
    const heightmap = await computeHeightmapGrid(agent, origin, Math.ceil(radius), 33);
    return {
      origin,
      radius,
      grid: 33,
      heightmap: heightmap.heights,
      topBlocks: heightmap.topBlocks,
    };
  }
  if (encoding === 'rle-stateId') {
    return computeRleStateIds(agent, bbox);
  }
  if (encoding === 'hash') {
    const { hash } = await computeCountsAndHash(agent, bbox);
    return { hash };
  }
  return computeCountsAndHash(agent, bbox);
}

export async function localSiteSummary(
  agent: AgentRuntime,
  origin: { x: number; y: number; z: number },
  radius: number,
  grid: number,
): Promise<unknown> {
  const heightmap = await computeHeightmapGrid(agent, origin, radius, grid);
  const waterMask = heightmap.topBlocks.map(row =>
    row.map(name => (name && name.includes('water') ? 1 : 0)),
  );
  const treeMask = heightmap.topBlocks.map(row =>
    row.map(name => (name && (name.includes('log') || name.includes('leaves')) ? 1 : 0)),
  );
  return {
    origin,
    radius,
    grid,
    heightmap: heightmap.heights,
    topBlocks: heightmap.topBlocks,
    waterMask,
    treeMask,
  };
}

