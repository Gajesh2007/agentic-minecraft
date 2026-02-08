import pkg from 'mineflayer-pathfinder';
const { goals } = pkg;
import type { CraftTask, TaskResult } from '@agentic-survival/shared';

/** Wrap bot.craft with a timeout to prevent infinite hangs if crafting table window never opens */
async function craftWithTimeout(bot: any, recipe: any, iterations: number, table: any, timeoutMs = 30000): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Craft timed out — crafting table may be out of reach')), timeoutMs);
    bot.craft(recipe, iterations, table)
      .then(() => { clearTimeout(timer); resolve(); })
      .catch((err: any) => { clearTimeout(timer); reject(err); });
  });
}

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
      const outputPerCraft = recipes[0]!.result?.count ?? 1;
      const iterations = Math.ceil(task.count / outputPerCraft);
      console.log(`    [craft] ${task.count} ${task.recipe} (${iterations} iters × ${outputPerCraft} each, no table)`);
      await craftWithTimeout(bot, recipes[0]!, iterations, null);
      await bot.waitForTicks(4);
      const crafted = bot.inventory.items().find((i: any) => i.name === task.recipe);
      console.log(`    [craft] Done. Have ${crafted?.count ?? 0} ${task.recipe} in inventory`);
      return { status: 'completed', task, itemsCrafted: task.count, duration: 0 };
    } catch (err: any) {
      return { status: 'failed', task, error: `Craft failed: ${err.message}`, duration: 0 };
    }
  }

  // Need a crafting table — find one nearby
  const tableBlockType = bot.registry.blocksByName.crafting_table;
  if (!tableBlockType) {
    return { status: 'failed', task, error: 'No crafting_table block in registry', duration: 0 };
  }

  let tableBlock = bot.findBlock({ matching: tableBlockType.id, maxDistance: 32 });

  if (!tableBlock) {
    return { status: 'failed', task, error: 'No crafting table nearby — craft and place one first', duration: 0 };
  }

  // Walk to the crafting table
  try {
    const goal = new goals.GoalNear(tableBlock.position.x, tableBlock.position.y, tableBlock.position.z, 3);
    await bot.pathfinder.goto(goal);
  } catch {
    return { status: 'failed', task, error: 'Could not reach crafting table', duration: 0 };
  }

  if (signal.aborted) return { status: 'interrupted', task, duration: 0 };

  // Re-find the table block (it may have been refreshed after pathfinding)
  tableBlock = bot.findBlock({ matching: tableBlockType.id, maxDistance: 6 });
  if (!tableBlock) {
    return { status: 'failed', task, error: 'Crafting table disappeared after walking to it', duration: 0 };
  }

  // Check recipes with the actual table block
  recipes = bot.recipesFor(item.id, null, 1, tableBlock);
  if (recipes.length === 0) {
    return { status: 'failed', task, error: `No recipe for ${task.recipe} (missing ingredients?)`, duration: 0 };
  }

  try {
    const outputPerCraft = recipes[0]!.result?.count ?? 1;
    const iterations = Math.ceil(task.count / outputPerCraft);
    console.log(`    [craft] ${task.count} ${task.recipe} (${iterations} iters × ${outputPerCraft} each, with table)`);
    await craftWithTimeout(bot, recipes[0]!, iterations, tableBlock);
    await bot.waitForTicks(4);
    const crafted = bot.inventory.items().find((i: any) => i.name === task.recipe);
    console.log(`    [craft] Done. Have ${crafted?.count ?? 0} ${task.recipe} in inventory`);
    return { status: 'completed', task, itemsCrafted: task.count, duration: 0 };
  } catch (err: any) {
    return { status: 'failed', task, error: `Craft failed: ${err.message}`, duration: 0 };
  }
}
