import { loadConfig } from './config.js';
import { EventBus } from './events/event-bus.js';
import { AppEvents } from './events/event-types.js';
import { JsonlEventStore } from './events/jsonl-event-store.js';
import { buildServer } from './api/server.js';
import { AgentRuntime } from './runtime/agent-runtime.js';
import { Supervisor } from './supervisor/supervisor.js';
import { BotRunner } from './bot-runner.js';

const MAX_RECONNECT_DELAY = 60_000;
const BASE_RECONNECT_DELAY = 2_000;

async function main() {
  const config = loadConfig();

  const events = new EventBus<AppEvents>();
  const eventStore = new JsonlEventStore<AppEvents>(config.EVENTS_JSONL_PATH);
  await eventStore.init();

  events.onAny(event => {
    void eventStore.append(event).catch(err => {
      console.error('eventStore.append failed', err);
    });
  });

  events.publish('app.start', { pid: process.pid });

  const agent = new AgentRuntime(config, events);
  const botRunner = new BotRunner(config, events, agent);
  await botRunner.init();

  // Clean up orphaned episodes from previous crash/restart
  const orphaned = botRunner.cleanupOrphanedEpisodes();
  if (orphaned > 0) {
    events.publish('log.note', { text: `cleaned up ${orphaned} orphaned episode(s) from previous run`, tags: ['startup'] });
  }

  const supervisor = new Supervisor(config, events, botRunner);
  await supervisor.init();

  // --- Reconnection with exponential backoff ---
  let reconnectAttempts = 0;
  let reconnecting = false;
  let shuttingDown = false;

  async function connectWithRetry(): Promise<void> {
    while (!shuttingDown) {
      try {
        await agent.connect();
        reconnectAttempts = 0;
        return;
      } catch (err) {
        reconnectAttempts += 1;
        const message = err instanceof Error ? err.message : String(err);
        events.publish('app.error', { message: `connect failed (attempt ${reconnectAttempts}): ${message}` });
        const delay = Math.min(BASE_RECONNECT_DELAY * 2 ** (reconnectAttempts - 1), MAX_RECONNECT_DELAY);
        events.publish('log.note', { text: `retrying connection in ${delay}ms`, tags: ['reconnect'] });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Listen for bot disconnects and auto-reconnect
  events.onType('bot.end', () => {
    if (shuttingDown || reconnecting) return;
    reconnecting = true;
    events.publish('log.note', { text: 'bot disconnected, scheduling reconnect', tags: ['reconnect'] });
    setTimeout(async () => {
      try {
        await connectWithRetry();
      } catch {
        // connectWithRetry only exits on shuttingDown
      }
      reconnecting = false;
    }, BASE_RECONNECT_DELAY);
  });

  events.onType('bot.kicked', () => {
    if (shuttingDown || reconnecting) return;
    reconnecting = true;
    events.publish('log.note', { text: 'bot kicked, scheduling reconnect', tags: ['reconnect'] });
    setTimeout(async () => {
      try {
        await connectWithRetry();
      } catch {
        // connectWithRetry only exits on shuttingDown
      }
      reconnecting = false;
    }, 5_000); // longer delay after kick
  });

  // Initial connection
  await connectWithRetry();

  if (config.SUPERVISOR_AUTOSTART) {
    if (config.DEFAULT_OBJECTIVE && !supervisor.getObjective()) {
      supervisor.setObjective(config.DEFAULT_OBJECTIVE);
    }
    void supervisor.start();
  }

  const server = await buildServer({ config, events, eventStore, agent, supervisor, botRunner });
  await server.listen({ port: config.PORT, host: config.HOST });

  // --- Graceful shutdown ---
  async function shutdown(signal: string) {
    if (shuttingDown) return;
    shuttingDown = true;
    events.publish('log.note', { text: `shutdown requested (${signal})`, tags: ['lifecycle'] });

    supervisor.stop(`shutdown: ${signal}`);
    botRunner.cancelAllJobs();

    try {
      await agent.disconnect(`shutdown: ${signal}`);
    } catch { /* best effort */ }

    try {
      await server.close();
    } catch { /* best effort */ }

    process.exit(0);
  }

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  process.on('uncaughtException', err => {
    events.publish('app.error', { message: `uncaughtException: ${err.message}`, stack: err.stack });
    console.error('uncaughtException:', err);
  });

  process.on('unhandledRejection', reason => {
    const message = reason instanceof Error ? reason.message : String(reason);
    const stack = reason instanceof Error ? reason.stack : undefined;
    events.publish('app.error', { message: `unhandledRejection: ${message}`, stack });
    console.error('unhandledRejection:', reason);
  });
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
