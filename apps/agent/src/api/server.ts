import Fastify from 'fastify';
import cors from '@fastify/cors';
import { AppConfig } from '../config.js';
import { EventBus } from '@agentic-survival/shared';
import { SurvivalEvents } from '../events.js';
import { BotConnection } from '../bot/connection.js';
import { Brain } from '../brain/brain.js';
import { BudgetTracker } from '../budget/tracker.js';

export type AppContext = {
  config: AppConfig;
  events: EventBus<SurvivalEvents>;
  bot: BotConnection;
  brain: Brain;
  budget: BudgetTracker;
};

export async function buildServer(ctx: AppContext) {
  const app = Fastify({ logger: { level: 'warn' } });
  await app.register(cors, { origin: true });

  app.get('/v1/health', async () => ({ ok: true }));

  app.get('/v1/status', async () => ({
    bot: ctx.bot.getSnapshot(),
    brain: { running: ctx.brain.isRunning() },
    budget: ctx.budget.getStats(),
  }));

  app.post('/v1/brain/start', async () => {
    if (ctx.brain.isRunning()) return { ok: true, message: 'already running' };
    void ctx.brain.start();
    return { ok: true };
  });

  app.post('/v1/brain/stop', async () => {
    ctx.brain.stop();
    return { ok: true };
  });

  // SSE event stream
  app.get('/v1/events/stream', async (req, reply) => {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    const unsub = ctx.events.onAny(event => {
      reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
    });

    req.raw.on('close', () => {
      unsub();
    });
  });

  return app;
}
