import { Vec3 } from 'vec3';
import pkg from 'mineflayer-pathfinder';
const { goals } = pkg;
import type { BuildTask, PlaceBlockTask, TaskResult } from '@agentic-survival/shared';

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
  // If position is 0,0,0 use a spot next to the bot (means "place here")
  const pos = (task.position.x === 0 && task.position.y === 0 && task.position.z === 0)
    ? { x: Math.floor(bot.entity.position.x) + 1, y: Math.floor(bot.entity.position.y), z: Math.floor(bot.entity.position.z) }
    : task.position;

  const targetPos = new Vec3(pos.x, pos.y, pos.z);

  // Pathfind close to target — use adjusted pos, not original task.position
  const goal = new goals.GoalNear(pos.x, pos.y, pos.z, 3);
  try { await bot.pathfinder.goto(goal); } catch { /* best effort */ }

  // Find the item fresh from inventory (don't use stale references)
  const item = bot.inventory.items().find((i: any) => i.name === task.block);
  if (!item) {
    const available = bot.inventory.items().map((i: any) => i.name).join(', ');
    console.log(`    [placeBlock] No ${task.block} in inventory. Have: ${available}`);
    return { status: 'failed', task, error: `No ${task.block} in inventory`, duration: 0 };
  }

  try {
    // Equip using item type ID (more reliable than item object reference)
    await bot.equip(item.type, 'hand');
    await bot.waitForTicks(3);

    // Verify we're actually holding the item
    if (!bot.heldItem) {
      return { status: 'failed', task, error: 'Failed to equip item — heldItem is null after equip', duration: 0 };
    }

    console.log(`    [placeBlock] Placing ${task.block} at ${pos.x},${pos.y},${pos.z} (holding: ${bot.heldItem.name})`);

    // Try placing against adjacent blocks, in priority order
    const faces = [
      { offset: new Vec3(0, -1, 0), face: new Vec3(0, 1, 0) },   // on top of block below
      { offset: new Vec3(0, 1, 0), face: new Vec3(0, -1, 0) },    // under block above
      { offset: new Vec3(-1, 0, 0), face: new Vec3(1, 0, 0) },    // east of block to west
      { offset: new Vec3(1, 0, 0), face: new Vec3(-1, 0, 0) },    // west of block to east
      { offset: new Vec3(0, 0, -1), face: new Vec3(0, 0, 1) },    // south of block to north
      { offset: new Vec3(0, 0, 1), face: new Vec3(0, 0, -1) },    // north of block to south
    ];

    for (const { offset, face } of faces) {
      const ref = bot.blockAt(targetPos.plus(offset));
      if (ref && ref.name !== 'air' && ref.name !== 'cave_air') {
        // Re-equip before each attempt (pathfinder or other actions may change held item)
        await bot.equip(item.type, 'hand');
        await bot.waitForTicks(2);
        await bot.placeBlock(ref, face);
        console.log(`    [placeBlock] Placed ${task.block} successfully`);
        return { status: 'completed', task, blocksPlaced: 1, duration: 0 };
      }
    }

    // Fallback: search downward for solid ground and place on top of it
    console.log(`    [placeBlock] No adjacent block at target. Searching downward for ground...`);
    for (let dy = 0; dy < 10; dy++) {
      const groundPos = targetPos.offset(0, -(dy + 1), 0);
      const ground = bot.blockAt(groundPos);
      if (ground && ground.name !== 'air' && ground.name !== 'cave_air' && ground.name !== 'water') {
        // Place on top of this ground block
        const placeGoal = new goals.GoalNear(groundPos.x, groundPos.y + 1, groundPos.z, 3);
        try { await bot.pathfinder.goto(placeGoal); } catch { /* best effort */ }
        await bot.equip(item.type, 'hand');
        await bot.waitForTicks(2);
        await bot.placeBlock(ground, new Vec3(0, 1, 0));
        console.log(`    [placeBlock] Placed ${task.block} on ground at Y=${groundPos.y + 1}`);
        return { status: 'completed', task, blocksPlaced: 1, duration: 0 };
      }
    }

    return { status: 'failed', task, error: 'No solid ground found within 10 blocks below target position', duration: 0 };
  } catch (err: any) {
    return { status: 'failed', task, error: `Place failed: ${err.message}`, duration: 0 };
  }
}
