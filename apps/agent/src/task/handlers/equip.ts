import type { EquipTask, TaskResult } from '@agentic-survival/shared';

export async function executeEquip(
  bot: any,
  task: EquipTask,
  _signal: AbortSignal,
): Promise<TaskResult> {
  const item = bot.inventory.items().find((i: any) => i.name === task.item);
  if (!item) {
    return { status: 'failed', task, error: `No ${task.item} in inventory`, duration: 0 };
  }

  try {
    await bot.equip(item, task.slot);
    return { status: 'completed', task, duration: 0 };
  } catch (err: any) {
    return { status: 'failed', task, error: `Equip failed: ${err.message}`, duration: 0 };
  }
}
