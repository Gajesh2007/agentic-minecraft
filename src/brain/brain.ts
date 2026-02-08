import { generateText, hasToolCall, stepCountIs } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { AppConfig } from '../config.js';
import { EventBus } from '../events/event-bus.js';
import { SurvivalEvents } from '../events/event-types.js';
import { BotConnection } from '../bot/connection.js';
import { TaskExecutor } from '../task/executor.js';
import { InterruptManager } from '../interrupt/manager.js';
import { AgentMemory } from '../store/agent-memory.js';
import { BudgetTracker } from '../budget/tracker.js';
import { ThoughtStream } from '../stream/thought-stream.js';
import { buildPrompt } from './prompt-builder.js';
import { buildBrainTools } from './tools.js';
import type { Interrupt } from '../interrupt/types.js';
import { URGENT_INTERRUPTS } from '../interrupt/types.js';
import type { Task, TaskResult } from '../task/types.js';

export class Brain {
  private running = false;
  private abortController: AbortController | null = null;
  private pendingInterrupt: Interrupt | null = null;
  private lastTaskResult: TaskResult | null = null;
  private thoughtCount = 0;

  constructor(
    private readonly config: AppConfig,
    private readonly events: EventBus<SurvivalEvents>,
    private readonly bot: BotConnection,
    private readonly executor: TaskExecutor,
    private readonly interrupts: InterruptManager,
    private readonly memory: AgentMemory,
    private readonly budget: BudgetTracker,
    private readonly thoughtStream: ThoughtStream,
  ) {
    this.interrupts.onInterrupt(interrupt => {
      this.pendingInterrupt = interrupt;
      if (URGENT_INTERRUPTS.has(interrupt.type)) {
        this.executor.cancel();
      }
    });
  }

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    this.interrupts.start();
    this.events.publish('brain.start', {});

    while (this.running) {
      try {
        await this.thinkOnce();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.events.publish('brain.error', { message });
        await new Promise(r => setTimeout(r, 5000));
      }

      if (this.running && !this.pendingInterrupt) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }

  stop(): void {
    this.running = false;
    this.abortController?.abort();
    this.interrupts.stop();
    this.executor.cancel();
    this.events.publish('brain.stop', {});
  }

  isRunning(): boolean {
    return this.running;
  }

  private async thinkOnce(): Promise<void> {
    if (!this.budget.canAfford()) {
      this.events.publish('brain.zombie', { budget: this.budget.remaining() });
      await this.zombieBehavior();
      return;
    }

    const interrupt = this.pendingInterrupt;
    this.pendingInterrupt = null;

    const lastSummary = this.lastTaskResult
      ? `${this.lastTaskResult.task.task}: ${this.lastTaskResult.status}${this.lastTaskResult.error ? ` (${this.lastTaskResult.error})` : ''} [${this.lastTaskResult.duration}ms]`
      : null;

    const promptPack = buildPrompt({
      bot: this.bot,
      interrupt,
      lastTaskSummary: lastSummary,
      memorySummary: this.memory.getSummary(),
      budgetRemaining: this.budget.remaining(),
    });

    const tools = buildBrainTools(this.bot, this.memory);
    this.abortController = new AbortController();
    this.thoughtCount++;

    const result = await this.budget.track(() =>
      generateText({
        model: anthropic(this.config.BRAIN_MODEL),
        abortSignal: this.abortController!.signal,
        system: promptPack.system,
        prompt: promptPack.userMessage,
        tools,
        toolChoice: 'required',
        stopWhen: [hasToolCall('executeTask'), hasToolCall('done'), stepCountIs(50)],
        providerOptions: {
          anthropic: { cacheControl: { type: 'ephemeral' } },
        },
        prepareStep: ({ stepNumber, messages }) => {
          // Safety net: force executeTask after step 45 so the brain always concludes
          if (stepNumber >= 45) {
            return {
              toolChoice: { type: 'tool' as const, toolName: 'executeTask' as const },
            };
          }
          // Cache last message for Anthropic prompt caching
          if (messages.length > 0) {
            return {
              messages: messages.map((msg, i) =>
                i === messages.length - 1
                  ? { ...msg, providerOptions: { anthropic: { cacheControl: { type: 'ephemeral' } } } }
                  : msg,
              ),
            };
          }
          return {};
        },
      }),
    );

    const allToolCalls = result.steps.flatMap(s => s.toolCalls);

    // Handle executeTask — AI SDK v6 uses .input for tool call arguments
    const taskCall = allToolCalls.find(c => c.toolName === 'executeTask');
    if (taskCall) {
      const input = (taskCall as any).input as { task: Task | string } | undefined;
      let task: Task | undefined;

      // The LLM sometimes returns the task as a JSON string instead of an object
      const rawTask = input?.task;
      if (typeof rawTask === 'string') {
        try {
          task = JSON.parse(rawTask) as Task;
        } catch {
          console.log(`[brain] WARNING: executeTask task is a string but not valid JSON:`, rawTask.slice(0, 200));
          this.lastTaskResult = { status: 'failed', task: { task: 'wait', seconds: 5 } as Task, error: 'Malformed task string from brain', duration: 0 };
          return;
        }
      } else {
        task = rawTask as Task | undefined;
      }

      if (!task || !task.task) {
        console.log(`[brain] WARNING: executeTask called but task is malformed:`, JSON.stringify(input)?.slice(0, 300));
        this.lastTaskResult = { status: 'failed', task: { task: 'wait', seconds: 5 } as Task, error: 'Malformed task from brain', duration: 0 };
        return;
      }

      const reasoning = result.text || '';

      this.thoughtStream.emit({
        agentName: this.config.AGENT_NAME,
        thoughtNumber: this.thoughtCount,
        reasoning,
        task,
        cost: this.budget.lastCost(),
        budgetRemaining: this.budget.remaining(),
        trigger: interrupt?.type ?? (lastSummary ? 'task_complete' : 'initial'),
      });

      this.events.publish('brain.thought', {
        reasoning: reasoning.slice(0, 300),
        task: task.task,
        trigger: interrupt?.type ?? 'task_complete',
        cost: this.budget.lastCost(),
      });

      console.log(`\n[brain #${this.thoughtCount}] ${interrupt?.type ?? 'task_complete'} → ${task.task}`);
      console.log(`  reasoning: ${reasoning.slice(0, 200)}`);
      console.log(`  budget: $${this.budget.remaining().toFixed(2)} (-$${this.budget.lastCost().toFixed(4)})`);

      this.lastTaskResult = await this.executor.execute(task);
      return;
    }

    // Handle done
    const doneCall = allToolCalls.find(c => c.toolName === 'done');
    if (doneCall) {
      const input = (doneCall as any).input as { summary: string; learning?: string; note?: string };
      if (input.learning) this.memory.addLearning(input.learning);
      if (input.note) this.memory.addNote(input.note);
      console.log(`\n[brain #${this.thoughtCount}] done: ${input.summary}`);

      this.events.publish('brain.thought', {
        reasoning: input.summary,
        task: 'done',
        trigger: 'self',
        cost: this.budget.lastCost(),
      });

      // Wait before next thought cycle — longer after done since there's nothing urgent
      await new Promise(r => setTimeout(r, 30000));
    }
  }

  private async zombieBehavior(): Promise<void> {
    const mfBot = this.bot.getBotOrNull();
    if (!mfBot) {
      await new Promise(r => setTimeout(r, 10000));
      return;
    }

    // Eat if hungry
    if (mfBot.food < 18) {
      const food = mfBot.inventory.items().find((i: any) =>
        i.name.includes('cooked') || i.name.includes('bread') || i.name.includes('apple'),
      );
      if (food) {
        try {
          await mfBot.equip(food, 'hand');
          await mfBot.consume();
        } catch { /* best effort */ }
      }
    }

    // Flee from nearby hostiles
    const hostile = mfBot.nearestEntity((e: any) =>
      e.type === 'mob' && e.kind === 'Hostile mobs' &&
      e.position.distanceTo(mfBot.entity.position) < 8,
    );
    if (hostile) {
      const dx = mfBot.entity.position.x - hostile.position.x;
      const dz = mfBot.entity.position.z - hostile.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz) || 1;
      mfBot.setControlState('forward', true);
      mfBot.setControlState('sprint', true);
      mfBot.lookAt(mfBot.entity.position.offset(dx / dist * 10, 0, dz / dist * 10));
      await new Promise(r => setTimeout(r, 3000));
      mfBot.clearControlStates();
    }

    await new Promise(r => setTimeout(r, 10000));
  }
}
