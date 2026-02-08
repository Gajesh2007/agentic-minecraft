import type { AttackTask, TaskResult } from '../types.js';

export async function executeAttack(
  bot: any,
  task: AttackTask,
  signal: AbortSignal,
): Promise<TaskResult> {
  const retreatHealth = task.retreatOnLowHealth ?? 6;

  const findTarget = () => {
    if (task.target === 'nearest_hostile') {
      return bot.nearestEntity((e: any) =>
        e.type === 'mob' &&
        e.kind === 'Hostile mobs' &&
        e.position.distanceTo(bot.entity.position) < 16,
      );
    }
    return bot.nearestEntity((e: any) =>
      (e.displayName?.toLowerCase() === task.target.toLowerCase() ||
       e.name?.toLowerCase() === task.target.toLowerCase()) &&
      e.position.distanceTo(bot.entity.position) < 16,
    );
  };

  const entity = findTarget();
  if (!entity) {
    return { status: 'failed', task, error: `No ${task.target} found nearby`, duration: 0 };
  }

  // Simple combat: approach and attack in a loop
  return new Promise<TaskResult>(resolve => {
    let resolved = false;
    const done = (result: TaskResult) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeout);
      clearInterval(attackLoop);
      resolve(result);
    };

    const timeout = setTimeout(() => {
      done({ status: 'completed', task, duration: 0 });
    }, 30000);

    const onAbort = () => done({ status: 'interrupted', task, duration: 0 });
    signal.addEventListener('abort', onAbort, { once: true });

    const attackLoop = setInterval(() => {
      if (signal.aborted) return done({ status: 'interrupted', task, duration: 0 });

      // Check health — retreat if low
      if (bot.health <= retreatHealth) {
        return done({ status: 'completed', task, duration: 0 });
      }

      // Check if target is still alive and in range
      if (!entity.isValid) {
        return done({ status: 'completed', task, duration: 0 });
      }

      const dist = entity.position.distanceTo(bot.entity.position);
      if (dist > 32) {
        return done({ status: 'completed', task, error: 'Target too far away', duration: 0 });
      }

      // Move toward and attack
      if (dist < 3.5) {
        bot.attack(entity);
      } else {
        bot.lookAt(entity.position.offset(0, entity.height ?? 1, 0));
        bot.setControlState('forward', true);
        bot.setControlState('sprint', dist > 6);
      }
    }, 600); // Attack cooldown ~600ms for swords
  });
}
