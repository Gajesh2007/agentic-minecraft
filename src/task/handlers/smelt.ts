import pkg from 'mineflayer-pathfinder';
const { goals } = pkg;
import type { SmeltTask, TaskResult } from '../types.js';

export async function executeSmelt(
  bot: any,
  task: SmeltTask,
  signal: AbortSignal,
): Promise<TaskResult> {
  // Find a furnace
  const furnaceBlockType = bot.registry.blocksByName.furnace;
  if (!furnaceBlockType) {
    return { status: 'failed', task, error: 'No furnace in registry', duration: 0 };
  }

  const furnaceBlock = bot.findBlock({
    matching: [furnaceBlockType.id, bot.registry.blocksByName.lit_furnace?.id].filter(Boolean),
    maxDistance: 32,
  });

  if (!furnaceBlock) {
    return { status: 'failed', task, error: 'No furnace found nearby. Craft and place one first.', duration: 0 };
  }

  // Walk to the furnace
  try {
    const goal = new goals.GoalGetToBlock(furnaceBlock.position.x, furnaceBlock.position.y, furnaceBlock.position.z);
    await bot.pathfinder.goto(goal);
  } catch {
    return { status: 'failed', task, error: 'Could not reach furnace', duration: 0 };
  }

  if (signal.aborted) return { status: 'interrupted', task, duration: 0 };

  // Open the furnace
  const furnace = await bot.openFurnace(furnaceBlock);

  try {
    // Find input item in inventory
    const inputItem = bot.registry.itemsByName[task.input];
    const fuelItem = bot.registry.itemsByName[task.fuel];
    if (!inputItem) return { status: 'failed', task, error: `Unknown input: ${task.input}`, duration: 0 };
    if (!fuelItem) return { status: 'failed', task, error: `Unknown fuel: ${task.fuel}`, duration: 0 };

    // Load fuel
    await furnace.putFuel(fuelItem.id, null, Math.ceil(task.count / 8) + 1);
    // Load input
    await furnace.putInput(inputItem.id, null, task.count);

    // Wait for smelting to complete (poll progress)
    let attempts = 0;
    const maxAttempts = task.count * 20; // ~10s per item at 2 checks/s
    while (attempts < maxAttempts && !signal.aborted) {
      await bot.waitForTicks(10);
      attempts++;
      const output = furnace.outputItem();
      if (output && output.count >= task.count) break;
      const input = furnace.inputItem();
      if (!input || input.count === 0) break;
    }

    // Take output
    await furnace.takeOutput();
    furnace.close();

    return { status: signal.aborted ? 'interrupted' : 'completed', task, duration: 0 };
  } catch (err: any) {
    furnace.close();
    return { status: 'failed', task, error: `Smelt failed: ${err.message}`, duration: 0 };
  }
}
