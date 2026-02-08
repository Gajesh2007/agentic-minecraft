import { Vec3 } from 'vec3';
import pkg from 'mineflayer-pathfinder';
const { goals } = pkg;
import type { MineTask, TaskResult } from '../types.js';

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
  while (mined < task.quantity && !signal.aborted) {
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
        error: mined === 0 ? `No ${task.target} found nearby` : undefined,
        duration: 0,
      };
    }

    // Pathfind to within reach of the block
    try {
      const goal = new goals.GoalGetToBlock(block.position.x, block.position.y, block.position.z);
      await bot.pathfinder.goto(goal);
    } catch {
      return { status: mined > 0 ? 'completed' : 'failed', task, blocksMined: mined, error: 'Pathfinding failed', duration: 0 };
    }

    if (signal.aborted) return { status: 'interrupted', task, blocksMined: mined, duration: 0 };

    // Dig the block
    try {
      if (bot.canDigBlock(block)) {
        await bot.dig(block);
        mined++;
        // Brief wait for drops
        await bot.waitForTicks(4);
      }
    } catch {
      // Block may have been mined by someone else or changed
    }
  }

  return {
    status: signal.aborted ? 'interrupted' : 'completed',
    task,
    blocksMined: mined,
    duration: 0,
  };
}
