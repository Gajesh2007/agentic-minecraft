import { Vec3 } from 'vec3';
import pkg from 'mineflayer-pathfinder';
const { goals } = pkg;
import type { BuildTask, PlaceBlockTask, TaskResult } from '../types.js';

export async function executeBuild(
  bot: any,
  task: BuildTask,
  signal: AbortSignal,
): Promise<TaskResult> {
  let placed = 0;
  const origin = task.relative
    ? { x: Math.floor(bot.entity.position.x), y: Math.floor(bot.entity.position.y), z: Math.floor(bot.entity.position.z) }
    : { x: 0, y: 0, z: 0 };

  for (const entry of task.blocks) {
    if (signal.aborted) return { status: 'interrupted', task, blocksPlaced: placed, duration: 0 };

    const worldPos = {
      x: origin.x + entry.pos.x,
      y: origin.y + entry.pos.y,
      z: origin.z + entry.pos.z,
    };

    const result = await executePlaceBlock(bot, {
      task: 'placeBlock',
      position: worldPos,
      block: entry.block,
    }, signal);

    if (result.status === 'completed') placed++;
  }

  return { status: signal.aborted ? 'interrupted' : 'completed', task, blocksPlaced: placed, duration: 0 };
}

export async function executePlaceBlock(
  bot: any,
  task: PlaceBlockTask,
  signal: AbortSignal,
): Promise<TaskResult> {
  // Find the item in inventory
  const item = bot.inventory.items().find((i: any) => i.name === task.block);
  if (!item) {
    return { status: 'failed', task, error: `No ${task.block} in inventory`, duration: 0 };
  }

  try {
    // Equip the block
    await bot.equip(item, 'hand');

    // Find a reference block to place against
    const targetPos = new Vec3(task.position.x, task.position.y, task.position.z);

    // Try placing against the block below
    const below = bot.blockAt(targetPos.offset(0, -1, 0));
    if (below && below.name !== 'air') {
      // Get close enough to place
      const goal = new goals.GoalNear(task.position.x, task.position.y, task.position.z, 4);
      try { await bot.pathfinder.goto(goal); } catch { /* best effort */ }

      await bot.placeBlock(below, new Vec3(0, 1, 0));
      return { status: 'completed', task, blocksPlaced: 1, duration: 0 };
    }

    // Try other faces
    const faces = [
      { offset: new Vec3(0, 1, 0), face: new Vec3(0, -1, 0) },
      { offset: new Vec3(-1, 0, 0), face: new Vec3(1, 0, 0) },
      { offset: new Vec3(1, 0, 0), face: new Vec3(-1, 0, 0) },
      { offset: new Vec3(0, 0, -1), face: new Vec3(0, 0, 1) },
      { offset: new Vec3(0, 0, 1), face: new Vec3(0, 0, -1) },
    ];

    for (const { offset, face } of faces) {
      const ref = bot.blockAt(targetPos.plus(offset));
      if (ref && ref.name !== 'air') {
        const goal = new goals.GoalNear(task.position.x, task.position.y, task.position.z, 4);
        try { await bot.pathfinder.goto(goal); } catch { /* best effort */ }
        await bot.placeBlock(ref, face);
        return { status: 'completed', task, blocksPlaced: 1, duration: 0 };
      }
    }

    return { status: 'failed', task, error: 'No adjacent block to place against', duration: 0 };
  } catch (err: any) {
    return { status: 'failed', task, error: `Place failed: ${err.message}`, duration: 0 };
  }
}
