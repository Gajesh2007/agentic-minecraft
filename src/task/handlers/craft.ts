import pkg from 'mineflayer-pathfinder';
const { goals } = pkg;
import type { CraftTask, TaskResult } from '../types.js';

export async function executeCraft(
  bot: any,
  task: CraftTask,
  signal: AbortSignal,
): Promise<TaskResult> {
  const item = bot.registry.itemsByName[task.recipe];
  if (!item) {
    return { status: 'failed', task, error: `Unknown item: ${task.recipe}`, duration: 0 };
  }

  // Try crafting without a table first (2x2 grid)
  let recipes = bot.recipesFor(item.id, null, 1, null);

  if (recipes.length > 0) {
    try {
      await bot.craft(recipes[0]!, task.count, null);
      return { status: 'completed', task, itemsCrafted: task.count, duration: 0 };
    } catch (err: any) {
      return { status: 'failed', task, error: `Craft failed: ${err.message}`, duration: 0 };
    }
  }

  // Need a crafting table — find one nearby
  const tableBlockType = bot.registry.blocksByName.crafting_table;
  if (!tableBlockType) {
    return { status: 'failed', task, error: 'No crafting_table in registry', duration: 0 };
  }

  const tableBlock = bot.findBlock({
    matching: tableBlockType.id,
    maxDistance: 32,
  });

  if (!tableBlock) {
    return { status: 'failed', task, error: 'No crafting table found nearby. Craft or place one first.', duration: 0 };
  }

  // Walk to the crafting table
  try {
    const goal = new goals.GoalNear(tableBlock.position.x, tableBlock.position.y, tableBlock.position.z, 3);
    await bot.pathfinder.goto(goal);
  } catch {
    return { status: 'failed', task, error: 'Could not reach crafting table', duration: 0 };
  }

  if (signal.aborted) return { status: 'interrupted', task, duration: 0 };

  // Try recipes with the crafting table
  recipes = bot.recipesFor(item.id, null, 1, tableBlock);
  if (recipes.length === 0) {
    return { status: 'failed', task, error: `No recipe for ${task.recipe} (missing ingredients?)`, duration: 0 };
  }

  try {
    await bot.craft(recipes[0]!, task.count, tableBlock);
    return { status: 'completed', task, itemsCrafted: task.count, duration: 0 };
  } catch (err: any) {
    return { status: 'failed', task, error: `Craft failed: ${err.message}`, duration: 0 };
  }
}
