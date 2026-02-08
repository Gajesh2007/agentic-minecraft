import { Vec3 } from 'vec3';
import pkg from 'mineflayer-pathfinder';
const { goals } = pkg;
import type { MineTask, TaskResult } from '../types.js';

const PATHFIND_TIMEOUT = 15000; // 15 seconds max to reach a block

async function pathfindWithTimeout(bot: any, goal: any, timeout: number): Promise<boolean> {
  return new Promise<boolean>(resolve => {
    const timer = setTimeout(() => {
      bot.pathfinder.stop();
      resolve(false);
    }, timeout);

    bot.pathfinder.goto(goal)
      .then(() => {
        clearTimeout(timer);
        resolve(true);
      })
      .catch(() => {
        clearTimeout(timer);
        resolve(false);
      });
  });
}

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

  while (mined < task.quantity && !signal.aborted && failedAttempts < 3) {
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

    console.log(`    [mine] Found ${task.target} at ${block.position.x},${block.position.y},${block.position.z} (${Math.round(block.position.distanceTo(bot.entity.position))}m away)`);

    // Pathfind to within 4 blocks of the target
    const goal = new goals.GoalNear(block.position.x, block.position.y, block.position.z, 4);
    const reached = await pathfindWithTimeout(bot, goal, PATHFIND_TIMEOUT);

    if (!reached) {
      console.log(`    [mine] Pathfinding failed/timed out for ${task.target}`);
      failedAttempts++;
      continue;
    }

    if (signal.aborted) return { status: 'interrupted', task, blocksMined: mined, duration: 0 };

    // Re-find the block (it might have changed while pathfinding)
    const currentBlock = bot.blockAt(block.position);
    if (!currentBlock || currentBlock.type !== blockType.id) {
      failedAttempts++;
      continue;
    }

    // Dig the block
    try {
      if (bot.canDigBlock(currentBlock)) {
        await bot.dig(currentBlock);
        mined++;
        failedAttempts = 0;
        console.log(`    [mine] Mined ${task.target} (${mined}/${task.quantity})`);
        await bot.waitForTicks(4);
      } else {
        failedAttempts++;
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
