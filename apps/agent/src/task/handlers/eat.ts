import type { EatTask, TaskResult } from '@agentic-survival/shared';

const FOOD_ITEMS = [
  'cooked_beef', 'cooked_porkchop', 'cooked_chicken', 'cooked_mutton', 'cooked_rabbit',
  'cooked_salmon', 'cooked_cod', 'golden_apple', 'enchanted_golden_apple',
  'bread', 'baked_potato', 'pumpkin_pie', 'golden_carrot', 'apple',
  'melon_slice', 'sweet_berries', 'carrot', 'potato',
  'beef', 'porkchop', 'chicken', 'mutton', 'rabbit',
  'rotten_flesh',
];

export async function executeEat(
  bot: any,
  task: EatTask,
  signal: AbortSignal,
): Promise<TaskResult> {
  const items = bot.inventory.items();

  let food;
  if (task.item) {
    food = items.find((i: any) => i.name === task.item);
    if (!food) {
      return { status: 'failed', task, error: `No ${task.item} in inventory`, duration: 0 };
    }
  } else {
    // Find best food available
    for (const name of FOOD_ITEMS) {
      food = items.find((i: any) => i.name === name);
      if (food) break;
    }
    if (!food) {
      return { status: 'failed', task, error: 'No food in inventory', duration: 0 };
    }
  }

  try {
    await bot.equip(food, 'hand');
    await bot.consume();
    return { status: 'completed', task, duration: 0 };
  } catch (err: any) {
    return { status: 'failed', task, error: `Eat failed: ${err.message}`, duration: 0 };
  }
}
