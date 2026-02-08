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
  const items = bot.inventory.items();
  const item = items.find((i: any) => i.name === task.block);
  if (!item) {
    const available = items.map((i: any) => i.name).join(', ');
    console.log(`    [placeBlock] No ${task.block} in inventory. Have: ${available}`);
    return { status: 'failed', task, error: `No ${task.block} in inventory`, duration: 0 };
  }

  try {
    // Equip the block
    console.log(`    [placeBlock] Equipping ${item.name} (count: ${item.count})`);
    await bot.equip(item, 'hand');

    // If position is 0,0,0 use bot's current position (means "place here")
    const pos = (task.position.x === 0 && task.position.y === 0 && task.position.z === 0)
      ? { x: Math.floor(bot.entity.position.x) + 1, y: Math.floor(bot.entity.position.y), z: Math.floor(bot.entity.position.z) }
      : task.position;
    const targetPos = new Vec3(pos.x, pos.y, pos.z);
    const goal = new goals.GoalNear(task.position.x, task.position.y, task.position.z, 4);
    try { await bot.pathfinder.goto(goal); } catch { /* best effort */ }

    // Re-equip after walking (pathfinder may have changed held item)
    await bot.equip(item, 'hand');

    // Try placing against the block below
    const below = bot.blockAt(targetPos.offset(0, -1, 0));
    if (below && below.name !== 'air') {
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
