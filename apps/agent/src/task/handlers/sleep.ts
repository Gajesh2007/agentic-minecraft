import type { SleepTask, TaskResult } from '@agentic-survival/shared';

export async function executeSleep(
  bot: any,
  task: SleepTask,
  signal: AbortSignal,
): Promise<TaskResult> {
  // Find a nearby bed
  const bedTypes = ['white_bed', 'red_bed', 'blue_bed', 'green_bed', 'yellow_bed',
    'black_bed', 'brown_bed', 'cyan_bed', 'gray_bed', 'light_blue_bed',
    'light_gray_bed', 'lime_bed', 'magenta_bed', 'orange_bed', 'pink_bed', 'purple_bed'];

  const bedIds = bedTypes
    .map(name => bot.registry.blocksByName[name]?.id)
    .filter((id: any): id is number => id != null);

  const bedBlock = bot.findBlock({
    matching: bedIds,
    maxDistance: 32,
  });

  if (!bedBlock) {
    return { status: 'failed', task, error: 'No bed found nearby', duration: 0 };
  }

  try {
    await bot.sleep(bedBlock);

    // Wait until we wake up
    return new Promise<TaskResult>(resolve => {
      const onWake = () => resolve({ status: 'completed', task, duration: 0 });
      const onAbort = () => {
        try { bot.wake(); } catch { /* already awake */ }
        resolve({ status: 'interrupted', task, duration: 0 });
      };

      bot.once('wake', onWake);
      signal.addEventListener('abort', onAbort, { once: true });

      // Safety timeout — 15 minutes max
      setTimeout(() => {
        bot.removeListener('wake', onWake);
        try { bot.wake(); } catch { /* already awake */ }
        resolve({ status: 'completed', task, duration: 0 });
      }, 15 * 60 * 1000);
    });
  } catch (err: any) {
    return { status: 'failed', task, error: `Sleep failed: ${err.message}`, duration: 0 };
  }
}
