import Fastify from 'fastify';
import cors from '@fastify/cors';
import { z } from 'zod';
import type { SpectatorBot, CameraMode } from '../camera/spectator-bot.js';
import type { ThoughtAggregator } from '../thought-aggregator.js';
import { captureScreenshot } from '../screenshot.js';

const cameraModeSchema = z.enum(['follow', 'firstPerson', 'overhead', 'free']);

export async function buildServer(camera: SpectatorBot, thoughts: ThoughtAggregator) {
  const app = Fastify({ logger: { level: 'warn' } });
  await app.register(cors, { origin: true });

  app.get('/v1/health', async () => ({ ok: true }));

  // Combined status: camera + latest thought + budget
  app.get('/v1/status', async () => {
    const cameraStatus = camera.getStatus();
    const latestThought = thoughts.getLatestThought();
    return {
      camera: cameraStatus,
      agent: latestThought ? {
        name: latestThought.agentName,
        lastThought: latestThought.reasoning?.slice(0, 200) || latestThought.trigger,
        task: typeof latestThought.task === 'object' ? latestThought.task?.task : latestThought.task,
        budget: latestThought.budgetRemaining,
        thoughtNumber: latestThought.thoughtNumber,
        ts: latestThought.ts,
      } : null,
      players: camera.getPlayers(),
    };
  });

  app.get('/v1/players', async () => ({ players: camera.getPlayers() }));

  // Agent thoughts history
  app.get('/v1/thoughts', async (req) => {
    const limit = Number((req.query as any)?.limit) || 20;
    return { thoughts: thoughts.getRecentThoughts(limit) };
  });

  // Agent events history
  app.get('/v1/events', async (req) => {
    const limit = Number((req.query as any)?.limit) || 50;
    return { events: thoughts.getRecentEvents(limit) };
  });

  // Live SSE stream of thoughts + events combined
  app.get('/v1/stream', async (req, reply) => {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    const onThought = (thought: any) => {
      reply.raw.write(`event: thought\ndata: ${JSON.stringify(thought)}\n\n`);
    };

    const onEvent = (event: any) => {
      reply.raw.write(`event: agent\ndata: ${JSON.stringify(event)}\n\n`);
    };

    // Send camera status every 2 seconds
    const statusInterval = setInterval(() => {
      const status = camera.getStatus();
      reply.raw.write(`event: camera\ndata: ${JSON.stringify(status)}\n\n`);
    }, 2000);

    thoughts.onThought(onThought);
    thoughts.onEvent(onEvent);

    req.raw.on('close', () => {
      clearInterval(statusInterval);
      // Note: listeners aren't removed (ThoughtAggregator would need a removeListener method)
      // This is fine for Phase 1 with small number of connections
    });
  });

  // Screenshot — captures the 3D viewer as a JPEG image
  app.get('/v1/screenshot', async (req, reply) => {
    const width = Number((req.query as any)?.width) || 800;
    const height = Number((req.query as any)?.height) || 600;
    const viewerPort = camera.getViewerPort();
    if (!viewerPort) {
      return reply.status(503).send({ error: 'Viewer not started yet' });
    }
    try {
      const buffer = await captureScreenshot(`http://localhost:${viewerPort}`, width, height);
      reply.header('Content-Type', 'image/jpeg');
      reply.header('Cache-Control', 'no-cache');
      return reply.send(buffer);
    } catch (err: any) {
      return reply.status(500).send({ error: `Screenshot failed: ${err.message}` });
    }
  });

  // Screenshot as base64 JSON — for LLM vision tools
  app.get('/v1/screenshot/base64', async (req, reply) => {
    const width = Number((req.query as any)?.width) || 800;
    const height = Number((req.query as any)?.height) || 600;
    const viewerPort = camera.getViewerPort();
    if (!viewerPort) {
      return reply.status(503).send({ error: 'Viewer not started yet' });
    }
    try {
      const buffer = await captureScreenshot(`http://localhost:${viewerPort}`, width, height);
      return { image: `data:image/jpeg;base64,${buffer.toString('base64')}`, width, height };
    } catch (err: any) {
      return reply.status(500).send({ error: `Screenshot failed: ${err.message}` });
    }
  });

  // Camera controls
  app.post<{ Body: { target: string } }>('/v1/camera/follow', async (req, reply) => {
    const result = z.object({ target: z.string().min(1) }).safeParse(req.body);
    if (!result.success) return reply.status(400).send({ error: result.error.issues });
    camera.follow(result.data.target);
    return { ok: true, target: result.data.target, mode: 'follow' };
  });

  app.post<{ Body: { mode: string } }>('/v1/camera/mode', async (req, reply) => {
    const result = z.object({ mode: cameraModeSchema }).safeParse(req.body);
    if (!result.success) return reply.status(400).send({ error: result.error.issues });
    camera.setMode(result.data.mode as CameraMode);
    return { ok: true, mode: result.data.mode };
  });

  app.post<{ Body: { target: string | null } }>('/v1/camera/target', async (req, reply) => {
    const result = z.object({ target: z.string().min(1).nullable() }).safeParse(req.body);
    if (!result.success) return reply.status(400).send({ error: result.error.issues });
    camera.setTarget(result.data.target);
    return { ok: true, target: result.data.target };
  });

  app.post<{ Body: { x: number; y: number; z: number; yaw?: number; pitch?: number } }>(
    '/v1/camera/teleport',
    async (req, reply) => {
      const result = z.object({ x: z.number(), y: z.number(), z: z.number(), yaw: z.number().optional(), pitch: z.number().optional() }).safeParse(req.body);
      if (!result.success) return reply.status(400).send({ error: result.error.issues });
      const d = result.data;
      camera.teleportTo(d.x, d.y, d.z, d.yaw, d.pitch);
      return { ok: true };
    },
  );

  app.post<{ Body: { distance?: number; height?: number } }>('/v1/camera/settings', async (req, reply) => {
    const result = z.object({ distance: z.number().min(1).max(64).optional(), height: z.number().min(0).max(32).optional() }).safeParse(req.body);
    if (!result.success) return reply.status(400).send({ error: result.error.issues });
    if (result.data.distance !== undefined) camera.setFollowDistance(result.data.distance);
    if (result.data.height !== undefined) camera.setFollowHeight(result.data.height);
    const status = camera.getStatus();
    return { ok: true, distance: status.followDistance, height: status.followHeight };
  });

  return app;
}
