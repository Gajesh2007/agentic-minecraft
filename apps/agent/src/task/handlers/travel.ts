import pkg from 'mineflayer-pathfinder';
const { goals } = pkg;
import type { TravelTask, TaskResult } from '@agentic-survival/shared';

export async function executeTravel(
  bot: any,
  task: TravelTask,
  signal: AbortSignal,
): Promise<TaskResult> {
  const range = task.range ?? 2;

  try {
    const goal = new goals.GoalNear(task.destination.x, task.destination.y, task.destination.z, range);
    bot.pathfinder.setGoal(goal);

    return new Promise<TaskResult>(resolve => {
      const timeout = setTimeout(() => {
        bot.pathfinder.stop();
        resolve({ status: 'completed', task, duration: 0 });
      }, 60000);

      const onAbort = () => {
        clearTimeout(timeout);
        bot.pathfinder.stop();
        resolve({ status: 'interrupted', task, duration: 0 });
      };
      signal.addEventListener('abort', onAbort, { once: true });

      bot.once('goal_reached', () => {
        clearTimeout(timeout);
        signal.removeEventListener('abort', onAbort);
        resolve({ status: 'completed', task, duration: 0 });
      });

      bot.once('path_update', (result: any) => {
        if (result.status === 'noPath') {
          clearTimeout(timeout);
          signal.removeEventListener('abort', onAbort);
          resolve({ status: 'failed', task, error: 'No path found', duration: 0 });
        }
      });
    });
  } catch (err: any) {
    return { status: 'failed', task, error: `Travel failed: ${err.message}`, duration: 0 };
  }
}
