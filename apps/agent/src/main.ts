import { join } from 'node:path';
import { loadConfig } from './config.js';
import { EventBus } from '@agentic-survival/shared';
import { JsonlEventStore } from '@agentic-survival/shared';
import type { SurvivalEvents } from './events.js';
import { BotConnection } from './bot/connection.js';
import { TaskExecutor } from './task/executor.js';
import { InterruptManager } from './interrupt/manager.js';
import { Brain } from './brain/brain.js';
import { BudgetTracker } from './budget/tracker.js';
import { ThoughtStream } from './stream/thought-stream.js';
import { AgentMemory } from '@agentic-survival/shared';
import { buildServer } from './api/server.js';

const MAX_RECONNECT_DELAY = 60_000;
const BASE_RECONNECT_DELAY = 2_000;
let shuttingDown = false;
let reconnecting = false;

/** Wait for spawn, but bail if the bot disconnects or timeout hits. */
function waitForSpawn(bot: BotConnection, timeoutMs: number): Promise<boolean> {
  return new Promise(resolve => {
    const mfBot = bot.getBotOrNull();
    if (!mfBot) return resolve(false);
    if (mfBot.entity) return resolve(true);

    let settled = false;
    const settle = (val: boolean) => { if (!settled) { settled = true; cleanup(); resolve(val); } };

    const timer = setTimeout(() => settle(false), timeoutMs);
    const onSpawn = () => settle(true);
    const onEnd = () => settle(false);

    mfBot.once('spawn', onSpawn);
    mfBot.once('end', onEnd);

    function cleanup() {
      clearTimeout(timer);
      mfBot!.removeListener('spawn', onSpawn);
      mfBot!.removeListener('end', onEnd);
    }
  });
}

async function main() {
  const config = loadConfig();
  const events = new EventBus<SurvivalEvents>();
  const eventStore = new JsonlEventStore<SurvivalEvents>(config.EVENTS_JSONL_PATH);
  await eventStore.init();
  events.onAny(event => { void eventStore.append(event).catch(console.error); });
  events.publish('app.start', { pid: process.pid });
  console.log(`[agentic-survival] Agent: ${config.AGENT_NAME} | Model: ${config.BRAIN_MODEL}`);

  const bot = new BotConnection(config, events);
  const memory = new AgentMemory(join(config.DATA_DIR, 'agent-memory.json'));
  await memory.init();
  const budget = new BudgetTracker(config, events);
  const thoughtStream = new ThoughtStream(config.THOUGHT_STREAM_PORT);
  const interruptManager = new InterruptManager(bot, events);
  const executor = new TaskExecutor(bot, events);
  const brain = new Brain(config, events, bot, executor, interruptManager, memory, budget, thoughtStream);

  /** Connect and wait for spawn. Retries both connect and spawn with backoff. */
  async function connectAndSpawn(): Promise<void> {
    let attempts = 0;
    while (!shuttingDown) {
      try {
        await bot.connect();
        console.log(`[agentic-survival] Connected to ${config.MC_HOST}:${config.MC_PORT}`);
        const spawned = await waitForSpawn(bot, 30_000);
        if (spawned) return;
        // Spawn failed (disconnect or timeout) — tear down and retry
        console.log('[agentic-survival] Spawn failed, disconnecting...');
        try { await bot.disconnect('spawn_failed'); } catch {}
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        events.publish('app.error', { message: `connect failed (attempt ${attempts + 1}): ${msg}` });
      }
      attempts++;
      const delay = Math.min(BASE_RECONNECT_DELAY * 2 ** Math.min(attempts - 1, 5), MAX_RECONNECT_DELAY);
      console.log(`[agentic-survival] Retry in ${(delay / 1000).toFixed(0)}s...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }

  events.onType('bot.end', () => {
    if (shuttingDown || reconnecting) return;
    reconnecting = true;
    console.log('[agentic-survival] Disconnected, reconnecting...');
    brain.stop();
    setTimeout(async () => {
      try {
        await connectAndSpawn();
        if (!shuttingDown) {
          console.log(`[agentic-survival] Bot re-spawned.`);
          if (config.BRAIN_AUTOSTART) void brain.start();
        }
      } catch {}
      reconnecting = false;
    }, BASE_RECONNECT_DELAY);
  });

  // Suppress bot.end reconnect handler during initial startup
  reconnecting = true;
  await connectAndSpawn();
  reconnecting = false;
  console.log(`[agentic-survival] Bot spawned. Budget: $${config.BUDGET_INITIAL}`);

  if (config.BRAIN_AUTOSTART) { console.log('[agentic-survival] Brain autostarting...'); void brain.start(); }

  const server = await buildServer({ config, events, bot, brain, budget });
  await server.listen({ port: config.PORT, host: config.HOST });
  console.log(`[agentic-survival] API: http://${config.HOST}:${config.PORT}`);
  console.log(`[agentic-survival] Thought stream: ws://localhost:${config.THOUGHT_STREAM_PORT}`);
  console.log(`[agentic-survival] Events SSE: http://${config.HOST}:${config.PORT}/v1/events/stream`);

  async function shutdown(signal: string) {
    if (shuttingDown) return; shuttingDown = true;
    console.log(`\n[agentic-survival] Shutdown (${signal})...`);
    brain.stop();
    try { await bot.disconnect(`shutdown: ${signal}`); } catch {}
    try { thoughtStream.close(); } catch {}
    try { await server.close(); } catch {}
    process.exit(0);
  }
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('uncaughtException', err => { events.publish('app.error', { message: `uncaughtException: ${err.message}`, stack: err.stack }); console.error('uncaughtException:', err); });
  process.on('unhandledRejection', reason => { const msg = reason instanceof Error ? reason.message : String(reason); events.publish('app.error', { message: `unhandledRejection: ${msg}` }); console.error('unhandledRejection:', reason); });
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
