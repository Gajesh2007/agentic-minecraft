import { BotConnection } from '../bot/connection.js';
import { EventBus } from '../events/event-bus.js';
import { SurvivalEvents } from '../events/event-types.js';
import type { Task, TaskResult } from './types.js';
import { executeMine } from './handlers/mine.js';
import { executeCraft } from './handlers/craft.js';
import { executeSmelt } from './handlers/smelt.js';
import { executeEat } from './handlers/eat.js';
import { executeTravel } from './handlers/travel.js';
import { executeBuild, executePlaceBlock } from './handlers/build.js';
import { executeAttack } from './handlers/attack.js';
import { executeSleep } from './handlers/sleep.js';
import { executeEquip } from './handlers/equip.js';
import { executeStash, executeRetrieve } from './handlers/stash.js';

export class TaskExecutor {
  private currentTask: Task | null = null;
  private abortController: AbortController | null = null;

  constructor(
    private readonly bot: BotConnection,
    private readonly events: EventBus<SurvivalEvents>,
  ) {}

  async execute(task: Task): Promise<TaskResult> {
    this.currentTask = task;
    this.abortController = new AbortController();
    const start = Date.now();

    try {
      const detail = summarizeTask(task);
      this.events.publish('task.start', { task: task.task, detail });
      console.log(`  [task] START: ${detail}`);
      const result = await this.dispatch(task, this.abortController.signal);
      const duration = Date.now() - start;
      const finalResult = { ...result, duration };
      this.events.publish('task.complete', { task: task.task, duration, status: finalResult.status });
      console.log(`  [task] ${finalResult.status.toUpperCase()}: ${detail} (${(duration / 1000).toFixed(1)}s)${finalResult.error ? ` — ${finalResult.error}` : ''}`);
      return finalResult;
    } catch (err) {
      const duration = Date.now() - start;
      const error = err instanceof Error ? err.message : String(err);
      this.events.publish('task.error', { task: task.task, error });
      return { status: 'failed', task, error, duration };
    } finally {
      this.currentTask = null;
      this.abortController = null;
    }
  }

  cancel(): void {
    this.abortController?.abort();
  }

  isRunning(): boolean {
    return this.currentTask !== null;
  }

  getCurrentTask(): Task | null {
    return this.currentTask;
  }

  private async dispatch(task: Task, signal: AbortSignal): Promise<TaskResult> {
    const mfBot = this.bot.getBot();

    switch (task.task) {
      case 'mine': return executeMine(mfBot, task, signal);
      case 'craft': return executeCraft(mfBot, task, signal);
      case 'smelt': return executeSmelt(mfBot, task, signal);
      case 'eat': return executeEat(mfBot, task, signal);
      case 'travel': return executeTravel(mfBot, task, signal);
      case 'build': return executeBuild(mfBot, task, signal);
      case 'attack': return executeAttack(mfBot, task, signal);
      case 'sleep': return executeSleep(mfBot, task, signal);
      case 'equip': return executeEquip(mfBot, task, signal);
      case 'stash': return executeStash(mfBot, task, signal);
      case 'retrieve': return executeRetrieve(mfBot, task, signal);
      case 'placeBlock': return executePlaceBlock(mfBot, task, signal);
      case 'flee': {
        const dx = mfBot.entity.position.x - task.from.x;
        const dz = mfBot.entity.position.z - task.from.z;
        const dist = Math.sqrt(dx * dx + dz * dz) || 1;
        const nx = dx / dist;
        const nz = dz / dist;
        const fleeTarget = {
          x: Math.floor(mfBot.entity.position.x + nx * task.distance),
          y: Math.floor(mfBot.entity.position.y),
          z: Math.floor(mfBot.entity.position.z + nz * task.distance),
        };
        return executeTravel(mfBot, { task: 'travel', destination: fleeTarget, sprint: true }, signal);
      }
      case 'wait': {
        return new Promise<TaskResult>(resolve => {
          const timeout = setTimeout(
            () => resolve({ status: 'completed', task, duration: task.seconds * 1000 }),
            task.seconds * 1000,
          );
          signal.addEventListener('abort', () => {
            clearTimeout(timeout);
            resolve({ status: 'interrupted', task, duration: 0 });
          }, { once: true });
        });
      }
      case 'sequence': {
        for (let i = 0; i < task.steps.length; i++) {
          const step = task.steps[i]!;
          if (signal.aborted) return { status: 'interrupted', task, duration: 0 };
          const detail = summarizeTask(step);
          console.log(`  [task] SEQ ${i + 1}/${task.steps.length}: ${detail}`);
          this.events.publish('task.start', { task: step.task, detail });
          const result = await this.dispatch(step, signal);
          console.log(`  [task] SEQ ${i + 1}/${task.steps.length}: ${result.status}${result.error ? ` — ${result.error}` : ''}`);
          if (result.status === 'failed') {
            console.log(`  [task] SEQ ABORTED at step ${i + 1}: ${result.error}`);
            return { ...result, task };
          }
        }
        return { status: 'completed', task, duration: 0 };
      }
      case 'repeat': {
        const iterations = task.count <= 0 ? Infinity : task.count;
        for (let i = 0; i < iterations; i++) {
          if (signal.aborted) return { status: 'interrupted', task, duration: 0 };
          const result = await this.dispatch(task.inner, signal);
          if (result.status === 'failed') return { ...result, task };
        }
        return { status: 'completed', task, duration: 0 };
      }
    }
  }
}

function summarizeTask(task: Task): string {
  switch (task.task) {
    case 'mine': return `mine ${task.quantity} ${task.target}`;
    case 'craft': return `craft ${task.count} ${task.recipe}`;
    case 'smelt': return `smelt ${task.count} ${task.input}`;
    case 'eat': return `eat ${task.item ?? 'best available'}`;
    case 'travel': return `travel to ${task.destination.x},${task.destination.y},${task.destination.z}`;
    case 'build': return `build ${task.blocks.length} blocks`;
    case 'attack': return `attack ${task.target}`;
    case 'sleep': return 'sleep in bed';
    case 'equip': return `equip ${task.item} to ${task.slot}`;
    case 'stash': return `stash ${task.items.join(', ')}`;
    case 'retrieve': return `retrieve ${task.items.join(', ')}`;
    case 'wait': return `wait ${task.seconds}s`;
    case 'flee': return `flee ${task.distance} blocks`;
    case 'placeBlock': return `place ${task.block}`;
    case 'sequence': return `sequence of ${task.steps.length} tasks`;
    case 'repeat': return `repeat ${task.count}x`;
  }
}
