import pkg from 'mineflayer-pathfinder';
const { goals } = pkg;
import type { StashTask, RetrieveTask, TaskResult } from '../types.js';

export async function executeStash(
  bot: any,
  task: StashTask,
  signal: AbortSignal,
): Promise<TaskResult> {
  try {
    const goal = new goals.GoalGetToBlock(task.chest.x, task.chest.y, task.chest.z);
    await bot.pathfinder.goto(goal);
  } catch {
    return { status: 'failed', task, error: 'Could not reach chest', duration: 0 };
  }

  if (signal.aborted) return { status: 'interrupted', task, duration: 0 };

  const chestBlock = bot.blockAt(new (await import('vec3')).Vec3(task.chest.x, task.chest.y, task.chest.z));
  if (!chestBlock) return { status: 'failed', task, error: 'No block at chest position', duration: 0 };

  try {
    const chest = await bot.openContainer(chestBlock);
    for (const itemName of task.items) {
      if (signal.aborted) break;
      const item = bot.inventory.items().find((i: any) => i.name === itemName);
      if (item) {
        await chest.deposit(item.type, null, item.count);
      }
    }
    chest.close();
    return { status: signal.aborted ? 'interrupted' : 'completed', task, duration: 0 };
  } catch (err: any) {
    return { status: 'failed', task, error: `Stash failed: ${err.message}`, duration: 0 };
  }
}

export async function executeRetrieve(
  bot: any,
  task: RetrieveTask,
  signal: AbortSignal,
): Promise<TaskResult> {
  try {
    const goal = new goals.GoalGetToBlock(task.chest.x, task.chest.y, task.chest.z);
    await bot.pathfinder.goto(goal);
  } catch {
    return { status: 'failed', task, error: 'Could not reach chest', duration: 0 };
  }

  if (signal.aborted) return { status: 'interrupted', task, duration: 0 };

  const chestBlock = bot.blockAt(new (await import('vec3')).Vec3(task.chest.x, task.chest.y, task.chest.z));
  if (!chestBlock) return { status: 'failed', task, error: 'No block at chest position', duration: 0 };

  try {
    const chest = await bot.openContainer(chestBlock);
    for (const itemName of task.items) {
      if (signal.aborted) break;
      const item = chest.containerItems().find((i: any) => i.name === itemName);
      if (item) {
        await chest.withdraw(item.type, null, item.count);
      }
    }
    chest.close();
    return { status: signal.aborted ? 'interrupted' : 'completed', task, duration: 0 };
  } catch (err: any) {
    return { status: 'failed', task, error: `Retrieve failed: ${err.message}`, duration: 0 };
  }
}
