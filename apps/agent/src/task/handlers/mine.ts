import { Vec3 } from 'vec3';
import pkg from 'mineflayer-pathfinder';
const { goals } = pkg;
import type { MineTask, TaskResult } from '@agentic-survival/shared';

export async function executeMine(
  bot: any,
  task: MineTask,
  signal: AbortSignal,
): Promise<TaskResult> {
  const blockType = bot.registry.blocksByName[task.target];
  if (!blockType) {
    return { status: 'failed', task, error: `Unknown block: ${task.target}`, duration: 0 };
  }

  let mined = 0;
  let failedAttempts = 0;
  const maxAttempts = 8;

  while (mined < task.quantity && !signal.aborted && failedAttempts < maxAttempts) {
    const block = bot.findBlock({
      matching: blockType.id,
      maxDistance: 64,
      point: bot.entity.position,
    });

    if (!block) {
      return {
        status: mined > 0 ? 'completed' : 'failed',
        task,
        blocksMined: mined,
        error: mined === 0 ? `No ${task.target} found within 64 blocks` : undefined,
        duration: 0,
      };
    }

    const dist = Math.round(block.position.distanceTo(bot.entity.position));
    console.log(`    [mine] Found ${task.target} at ${block.position.x},${block.position.y},${block.position.z} (${dist}m away)`);

    // Use GoalLookAtBlock so the pathfinder routes to a position where the bot
    // has line-of-sight and reach — not just 3D proximity (fixes underground blocks).
    try {
      const goal = new goals.GoalLookAtBlock(block.position, bot.world, { reach: 4.5 });
      await bot.pathfinder.goto(goal);
    } catch {
      console.log(`    [mine] Pathfinding failed for ${task.target} at ${block.position}`);
      failedAttempts++;
      // Skip this specific block on next iteration by trying to find an alternative
      await bot.waitForTicks(5);
      continue;
    }

    if (signal.aborted) return { status: 'interrupted', task, blocksMined: mined, duration: 0 };

    // Re-check the block (it might have changed while pathing)
    const currentBlock = bot.blockAt(block.position);
    if (!currentBlock || currentBlock.type !== blockType.id) {
      failedAttempts++;
      continue;
    }

    // Dig
    try {
      if (bot.canDigBlock(currentBlock)) {
        await bot.dig(currentBlock);
        mined++;
        failedAttempts = 0;
        console.log(`    [mine] Mined ${task.target} (${mined}/${task.quantity})`);
        await bot.waitForTicks(4);
      } else {
        console.log(`    [mine] Cannot dig ${task.target} at ${block.position} (out of reach or obstructed)`);
        failedAttempts++;
        await bot.waitForTicks(5);
      }
    } catch (err: any) {
      console.log(`    [mine] Dig failed: ${err.message}`);
      failedAttempts++;
    }
  }

  return {
    status: signal.aborted ? 'interrupted' : (mined > 0 ? 'completed' : 'failed'),
    task,
    blocksMined: mined,
    error: mined === 0 ? `Could not mine ${task.target} after ${failedAttempts} attempts` : undefined,
    duration: 0,
  };
}
