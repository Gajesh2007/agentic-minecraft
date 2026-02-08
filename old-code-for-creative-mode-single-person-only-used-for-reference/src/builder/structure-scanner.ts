import { Vec3 } from 'vec3';
import { AgentRuntime } from '../runtime/agent-runtime.js';
import { BBox, bboxDimensions } from '../types/geometry.js';
import { makeId } from '../lib/ids.js';
import { StructureTemplate } from './template-store.js';

export async function scanStructure(
  agent: AgentRuntime,
  bbox: BBox,
  name: string,
  options?: { blueprintId?: string; tags?: string[] },
): Promise<StructureTemplate> {
  await agent.ensureLoaded(bbox, 'forceload', 30000);

  const bot = agent.getBot();
  if (!bot) throw new Error('Bot is not connected');

  const dims = bboxDimensions(bbox);
  let blockCount = 0;

  for (let x = bbox.min.x; x <= bbox.max.x; x++) {
    for (let y = bbox.min.y; y <= bbox.max.y; y++) {
      for (let z = bbox.min.z; z <= bbox.max.z; z++) {
        const block = bot.blockAt(new Vec3(x, y, z));
        if (block && block.name !== 'air' && block.name !== 'cave_air' && block.name !== 'void_air') {
          blockCount++;
        }
      }
    }
  }

  return {
    templateId: makeId('tmpl'),
    name,
    sourceBbox: bbox,
    dimensions: dims,
    blockCount,
    createdAt: new Date().toISOString(),
    blueprintId: options?.blueprintId,
    tags: options?.tags,
  };
}
