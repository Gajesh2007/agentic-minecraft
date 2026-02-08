import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import httpProxy from '@fastify/http-proxy';
import { createReadStream } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import { AppConfig } from '../config.js';
import { EventBus } from '../events/event-bus.js';
import { AppEvents } from '../events/event-types.js';
import { JsonlEventStore } from '../events/jsonl-event-store.js';
import { AgentRuntime } from '../runtime/agent-runtime.js';
import { Supervisor } from '../supervisor/supervisor.js';
import { BotRunner } from '../bot-runner.js';
import {
  compileBlueprintSchema,
  createBlueprintSchema,
  ensureLoadedSchema,
  executeScriptSchema,
  inspectRegionSchema,
  localSiteSummarySchema,
  logNoteSchema,
  renderAnglesSchema,
  reviseBlueprintSchema,
  setAllowlistSchema,
  setBuildZoneSchema,
  setBudgetsSchema,
  setViewpointSchema,
  teleportSchema,
  verifyStructureSchema,
} from '../lib/schemas.js';

export type AppContext = {
  config: AppConfig;
  events: EventBus<AppEvents>;
  eventStore: JsonlEventStore<AppEvents>;
  agent: AgentRuntime;
  supervisor: Supervisor;
  botRunner: BotRunner;
};

export async function buildServer(ctx: AppContext) {
  const app = Fastify({
    logger: {
      level: 'info',
    },
  });

  app.setErrorHandler((error, _request, reply) => {
    const message = error instanceof Error ? error.message : String(error);
    if (message.startsWith('INVALID_ARGUMENT:')) {
      return reply.code(400).send({
        error: { code: 'INVALID_ARGUMENT', message: message.replace('INVALID_ARGUMENT:', '') },
      });
    }
    if (message.startsWith('OUTSIDE_BUILD_ZONE')) {
      return reply.code(400).send({ error: { code: 'OUTSIDE_BUILD_ZONE', message } });
    }
    if (message.startsWith('BLOCK_NOT_ALLOWED')) {
      return reply.code(400).send({ error: { code: 'BLOCK_NOT_ALLOWED', message } });
    }
    if (message.startsWith('BUDGET_EXCEEDED')) {
      return reply.code(400).send({ error: { code: 'BUDGET_EXCEEDED', message } });
    }
    if (message.startsWith('CHUNKS_NOT_LOADED')) {
      return reply.code(409).send({ error: { code: 'CHUNKS_NOT_LOADED', message } });
    }
    if (message.startsWith('UNKNOWN_BLUEPRINT') || message.startsWith('UNKNOWN_SCRIPT')) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message } });
    }
    if (message.startsWith('Bot is not connected') || message.startsWith('Bot is not ready')) {
      return reply.code(409).send({ error: { code: 'BOT_NOT_READY', message } });
    }
    reply.code(500).send({ error: { code: 'INTERNAL', message } });
  });

  await app.register(cors, { origin: true });

  const publicDir = resolve(process.cwd(), 'public');
  await app.register(fastifyStatic, { root: publicDir });
  const assetsDir = resolve(process.cwd(), ctx.config.ASSETS_DIR);
  await app.register(fastifyStatic, { root: assetsDir, prefix: '/assets/', decorateReply: false });

  // Proxy the prismarine-viewer through /viewer/ so everything works on a single port
  await app.register(httpProxy, {
    upstream: `http://127.0.0.1:${ctx.config.VIEWER_PORT}`,
    prefix: '/viewer',
    websocket: true,
  });

  app.get('/v1/health', async () => ({ ok: true }));

  app.get('/v1/status', async () => {
    const status = ctx.botRunner.getStatus();
    return {
      connected: status.bot.connected,
      ready: status.bot.ready,
      bot: status.bot,
      paused: ctx.agent.isPaused(),
      budgets: status.budgets,
      buildZone: status.buildZone,
      allowlist: status.allowlist,
      supervisor: { running: ctx.supervisor.isRunning() },
      viewer: {
        port: ctx.config.VIEWER_PORT,
        firstPerson: ctx.config.VIEWER_FIRST_PERSON,
        viewDistanceChunks: ctx.config.VIEWER_VIEW_DISTANCE_CHUNKS,
      },
    };
  });

  app.post('/v1/agent/connect', async () => {
    await ctx.agent.connect();
    return { ok: true };
  });

  app.post('/v1/agent/disconnect', async () => {
    await ctx.agent.disconnect();
    return { ok: true };
  });

  app.post('/v1/control/pause', async () => {
    ctx.agent.pause();
    return { ok: true };
  });

  app.post('/v1/control/resume', async () => {
    ctx.agent.resume();
    return { ok: true };
  });

  app.post('/v1/control/emergency-stop', async () => {
    ctx.agent.pause();
    const cancelled = ctx.botRunner.cancelAllJobs();
    return { ok: true, cancelled };
  });

  app.post('/v1/control/set-budgets', async (req, reply) => {
    const parsed = parseBody(setBudgetsSchema, req.body);
    const budgets = ctx.botRunner.setBudgets(parsed.budgets);
    return reply.send({ budgets });
  });

  app.post('/v1/control/set-build-zone', async (req, reply) => {
    const parsed = parseBody(setBuildZoneSchema, req.body);
    const buildZone = ctx.botRunner.setBuildZone(parsed.buildZone);
    return reply.send({ buildZone });
  });

  app.post('/v1/control/set-block-allowlist', async (req, reply) => {
    const parsed = parseBody(setAllowlistSchema, req.body);
    const allowlist = ctx.botRunner.setAllowlist(parsed.allowed, parsed.mode);
    return reply.send({ allowlist });
  });

  app.post('/v1/world/ensure-loaded', async (req, reply) => {
    const parsed = parseBody(ensureLoadedSchema, req.body);
    const result = await ctx.botRunner.ensureLoaded(parsed.bbox, parsed.strategy, parsed.timeoutMs);
    return reply.send({ ok: true, loadedChunks: result.loadedChunks });
  });

  app.post('/v1/perception/local-site-summary', async (req, reply) => {
    const parsed = parseBody(localSiteSummarySchema, req.body);
    const summary = await ctx.botRunner.getLocalSiteSummary(parsed.origin, parsed.radius, parsed.grid);
    return reply.send(summary);
  });

  app.post('/v1/perception/inspect-region', async (req, reply) => {
    const parsed = parseBody(inspectRegionSchema, req.body);
    const result = await ctx.botRunner.inspectRegion(parsed.bbox, parsed.mode, parsed.encoding);
    return reply.send(result);
  });

  app.post('/v1/nav/teleport', async (req, reply) => {
    const parsed = parseBody(teleportSchema, req.body);
    await ctx.botRunner.teleport(parsed.position, parsed.yaw, parsed.pitch);
    return reply.send({ ok: true });
  });

  app.post('/v1/nav/set-viewpoint', async (req, reply) => {
    const parsed = parseBody(setViewpointSchema, req.body);
    const view = await ctx.botRunner.setViewpoint(parsed.targetBbox, parsed.preset, parsed.distance);
    return reply.send(view);
  });

  app.post('/v1/blueprints/create', async (req, reply) => {
    const parsed = parseBody(createBlueprintSchema, req.body);
    const blueprint = ctx.botRunner.createBlueprint(parsed);
    return reply.send({ blueprintId: blueprint.blueprintId });
  });

  app.post('/v1/blueprints/revise', async (req, reply) => {
    const parsed = parseBody(reviseBlueprintSchema, req.body);
    const blueprint = ctx.botRunner.reviseBlueprint(parsed.blueprintId, parsed.patchOps);
    return reply.send({ blueprintId: blueprint.blueprintId });
  });

  app.get('/v1/blueprints/:blueprintId', async (req, reply) => {
    const { blueprintId } = req.params as { blueprintId: string };
    const blueprint = ctx.botRunner.getBlueprint(blueprintId);
    return reply.send(blueprint);
  });

  app.post('/v1/build/compile', async (req, reply) => {
    const parsed = parseBody(compileBlueprintSchema, req.body);
    const script = ctx.botRunner.compileBlueprint(parsed.blueprintId, parsed.compiler.maxCommandLength);
    return reply.send(script);
  });

  app.post('/v1/build/execute', async (req, reply) => {
    const parsed = parseBody(executeScriptSchema, req.body);
    const budgets = parsed.budgets ?? ctx.botRunner.getStatus().budgets;
    const job = ctx.botRunner.executeScript(parsed.scriptId, budgets, parsed.idempotencyKey, parsed.recordDiffs);
    return reply.send({ jobId: job.jobId });
  });

  app.get('/v1/jobs/:jobId', async (req, reply) => {
    const { jobId } = req.params as { jobId: string };
    const job = ctx.botRunner.getJob(jobId);
    if (!job) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Unknown job' } });
    return reply.send(job);
  });

  app.post('/v1/jobs/:jobId/cancel', async (req, reply) => {
    const { jobId } = req.params as { jobId: string };
    const cancelled = ctx.botRunner.cancelJob(jobId);
    return reply.send({ ok: cancelled });
  });

  app.post('/v1/verify/structure', async (req, reply) => {
    const parsed = parseBody(verifyStructureSchema, req.body);
    if (parsed.residency) {
      await ctx.botRunner.ensureLoaded(parsed.bbox, parsed.residency.strategy, parsed.residency.timeoutMs);
    }
    const result = await ctx.botRunner.verifyStructure(parsed.blueprintId, parsed.bbox, parsed.match.threshold);
    return reply.send(result);
  });

  app.post('/v1/render/angles', async (req, reply) => {
    const parsed = parseBody(renderAnglesSchema, req.body);
    if (parsed.residency) {
      await ctx.botRunner.ensureLoaded(parsed.targetBbox, parsed.residency.strategy, parsed.residency.timeoutMs);
    }
    const job = ctx.botRunner.renderAngles(
      parsed.targetBbox,
      parsed.presets,
      parsed.resolution,
      parsed.viewDistanceChunks,
    );
    return reply.send({ jobId: job.jobId });
  });

  app.post('/v1/log/note', async (req, reply) => {
    const parsed = parseBody(logNoteSchema, req.body);
    return reply.send(ctx.botRunner.logNote(parsed.text, parsed.tags));
  });

  app.get('/v1/episodes', async (req, reply) => {
    const query = req.query as { limit?: string };
    const limit = query.limit ? Number(query.limit) : 50;
    const episodes = ctx.botRunner.getRecentEpisodes(Number.isFinite(limit) ? limit : 50);
    return reply.send({ episodes });
  });

  app.get('/v1/episodes/:episodeId', async (req, reply) => {
    const { episodeId } = req.params as { episodeId: string };
    const episode = ctx.botRunner.getEpisode(episodeId);
    if (!episode) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Unknown episode' } });
    return reply.send(episode);
  });

  app.post('/v1/supervisor/start', async () => {
    if (ctx.supervisor.isRunning()) return { ok: true };
    void ctx.supervisor.start();
    return { ok: true };
  });

  app.post('/v1/supervisor/stop', async () => {
    ctx.supervisor.stop('manual stop');
    return { ok: true };
  });

  app.post('/v1/supervisor/set-mode', async (req, reply) => {
    const parsed = parseBody(z.object({ mode: z.enum(['explore', 'build', 'refine', 'plan']) }), req.body);
    ctx.supervisor.setMode(parsed.mode);
    return reply.send({ ok: true, mode: parsed.mode });
  });

  app.get('/v1/supervisor/mode', async () => {
    return { mode: ctx.supervisor.getMode() };
  });

  app.post('/v1/supervisor/set-objective', async (req, reply) => {
    const parsed = parseBody(z.object({ objective: z.string().min(1).max(500) }), req.body);
    ctx.supervisor.setObjective(parsed.objective);
    return reply.send({ ok: true, objective: parsed.objective });
  });

  app.get('/v1/supervisor/objective', async () => {
    return { objective: ctx.supervisor.getObjective() };
  });

  // === Raw Commands ===

  app.post('/v1/command/exec', async (req, reply) => {
    const parsed = parseBody(z.object({ command: z.string().min(2).max(1000) }), req.body);
    const result = await ctx.botRunner.execRawCommand(parsed.command);
    return reply.send(result);
  });

  app.post('/v1/command/batch', async (req, reply) => {
    const parsed = parseBody(
      z.object({ commands: z.array(z.string().min(2).max(1000)).min(1).max(500) }),
      req.body,
    );
    const result = await ctx.botRunner.execRawCommandBatch(parsed.commands);
    return reply.send(result);
  });

  // === Templates ===

  app.get('/v1/templates', async () => {
    return ctx.botRunner.listTemplates();
  });

  app.post('/v1/templates/scan', async (req, reply) => {
    const parsed = parseBody(
      z.object({
        bbox: z.object({
          min: z.object({ x: z.coerce.number().int(), y: z.coerce.number().int(), z: z.coerce.number().int() }),
          max: z.object({ x: z.coerce.number().int(), y: z.coerce.number().int(), z: z.coerce.number().int() }),
        }),
        name: z.string().min(1).max(100),
        blueprintId: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }),
      req.body,
    );
    const template = await ctx.botRunner.scanAndSaveTemplate(parsed.bbox, parsed.name, parsed.blueprintId, parsed.tags);
    return reply.send(template);
  });

  app.post('/v1/templates/clone', async (req, reply) => {
    const parsed = parseBody(
      z.object({
        templateId: z.string().min(1),
        destination: z.object({ x: z.coerce.number().int(), y: z.coerce.number().int(), z: z.coerce.number().int() }),
      }),
      req.body,
    );
    const result = await ctx.botRunner.cloneTemplate(parsed.templateId, parsed.destination);
    return reply.send(result);
  });

  // === Block Registry ===

  app.get('/v1/blocks/categories', async () => {
    return ctx.botRunner.getBlockCategories();
  });

  app.get('/v1/blocks/search', async (req) => {
    const query = (req.query as { q?: string })?.q ?? '';
    if (!query) return [];
    return ctx.botRunner.searchBlocks(query);
  });

  // === Phase 1: Convenience Routes ===

  app.post('/v1/build/from-blueprint', async (req, reply) => {
    const parsed = parseBody(
      z.object({
        blueprintId: z.string().min(1),
        budgets: z
          .object({
            maxSeconds: z.coerce.number().int().min(1).max(600),
            maxCommands: z.coerce.number().int().min(1).max(10000),
            maxChangedBlocksUpperBound: z.coerce.number().int().min(1).max(1000000),
          })
          .optional(),
        verifyThreshold: z.coerce.number().min(0).max(1).optional(),
      }),
      req.body,
    );
    const budgets = parsed.budgets ?? ctx.botRunner.getStatus().budgets;
    const job = ctx.botRunner.buildFromBlueprint(parsed.blueprintId, budgets, {
      verifyThreshold: parsed.verifyThreshold,
    });
    return reply.send({ jobId: job.jobId });
  });

  // === Phase 1-3: Aesthetic Routes ===

  app.post('/v1/critique/structure', async (req, reply) => {
    const parsed = parseBody(
      z.object({
        blueprintId: z.string().min(1),
        bbox: z.object({
          min: z.object({ x: z.coerce.number().int(), y: z.coerce.number().int(), z: z.coerce.number().int() }),
          max: z.object({ x: z.coerce.number().int(), y: z.coerce.number().int(), z: z.coerce.number().int() }),
        }),
        presets: z.array(z.enum(['front', 'corner45', 'topdown', 'interior'])).optional(),
        styleFamily: z.string().optional(),
      }),
      req.body,
    );
    const stylePack = parsed.styleFamily ? ctx.botRunner.getStylePack(parsed.styleFamily) : undefined;
    const result = await ctx.botRunner.critiqueStructure(
      parsed.blueprintId,
      parsed.bbox,
      parsed.presets ?? ['front', 'corner45'],
      stylePack,
    );
    return reply.send(result);
  });

  app.post('/v1/beauty/loop', async (req, reply) => {
    const parsed = parseBody(
      z.object({
        blueprintId: z.string().min(1),
        bbox: z.object({
          min: z.object({ x: z.coerce.number().int(), y: z.coerce.number().int(), z: z.coerce.number().int() }),
          max: z.object({ x: z.coerce.number().int(), y: z.coerce.number().int(), z: z.coerce.number().int() }),
        }),
        maxIterations: z.coerce.number().int().min(1).max(10).optional(),
        scoreThreshold: z.coerce.number().min(1).max(10).optional(),
        budgets: z
          .object({
            maxSeconds: z.coerce.number().int().min(1).max(600),
            maxCommands: z.coerce.number().int().min(1).max(10000),
            maxChangedBlocksUpperBound: z.coerce.number().int().min(1).max(1000000),
          })
          .optional(),
        styleFamily: z.string().optional(),
      }),
      req.body,
    );
    const stylePack = parsed.styleFamily ? ctx.botRunner.getStylePack(parsed.styleFamily) : undefined;
    const budgets = parsed.budgets ?? ctx.botRunner.getStatus().budgets;
    const job = ctx.botRunner.beautyLoop(parsed.blueprintId, parsed.bbox, {
      maxIterations: parsed.maxIterations,
      scoreThreshold: parsed.scoreThreshold,
      budgets,
      stylePack,
    });
    return reply.send({ jobId: job.jobId });
  });

  // === Phase 3: Style Packs ===

  app.get('/v1/styles', async () => {
    const packs = ctx.botRunner.getStylePacks();
    return {
      stylePacks: Object.entries(packs).map(([key, pack]) => ({
        family: key,
        name: pack.name,
        description: pack.description,
        tags: pack.tags,
        roofStyle: pack.roofStyle,
      })),
    };
  });

  app.get('/v1/styles/:family', async (req, reply) => {
    const { family } = req.params as { family: string };
    const pack = ctx.botRunner.getStylePack(family);
    if (!pack) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Unknown style family' } });
    return reply.send(pack);
  });

  // === Phase 4: World Index Routes ===

  app.post('/v1/world/structures', async (req, reply) => {
    const parsed = parseBody(
      z.object({
        type: z.enum(['house', 'tower', 'road', 'bridge', 'garden', 'plaza', 'wall', 'gate', 'landmark', 'district', 'other']),
        name: z.string().min(1),
        bbox: z.object({
          min: z.object({ x: z.coerce.number().int(), y: z.coerce.number().int(), z: z.coerce.number().int() }),
          max: z.object({ x: z.coerce.number().int(), y: z.coerce.number().int(), z: z.coerce.number().int() }),
        }),
        anchor: z.object({ x: z.coerce.number().int(), y: z.coerce.number().int(), z: z.coerce.number().int() }),
        palette: z.record(z.string(), z.string()).optional(),
        styleTags: z.array(z.string()).optional(),
        blueprintId: z.string().optional(),
        parentStructureId: z.string().optional(),
        checksum: z.string().optional(),
      }),
      req.body,
    );
    const structure = ctx.botRunner.addStructure(parsed);
    return reply.send(structure);
  });

  app.get('/v1/world/structures', async (req, reply) => {
    const query = req.query as { type?: string; parentId?: string };
    const filter: { type?: any; parentId?: string } = {};
    if (query.type) filter.type = query.type;
    if (query.parentId) filter.parentId = query.parentId;
    const structures = ctx.botRunner.listStructures(Object.keys(filter).length > 0 ? filter : undefined);
    return reply.send({ structures });
  });

  app.get('/v1/world/structures/:structureId', async (req, reply) => {
    const { structureId } = req.params as { structureId: string };
    const structure = ctx.botRunner.getStructure(structureId);
    if (!structure) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Unknown structure' } });
    return reply.send(structure);
  });

  app.post('/v1/world/structures/near', async (req, reply) => {
    const parsed = parseBody(
      z.object({
        point: z.object({ x: z.coerce.number().int(), y: z.coerce.number().int(), z: z.coerce.number().int() }),
        radius: z.coerce.number().int().min(1).max(256),
      }),
      req.body,
    );
    const structures = ctx.botRunner.findStructuresNear(parsed.point, parsed.radius);
    return reply.send({ structures });
  });

  app.post('/v1/world/summary', async (req, reply) => {
    const parsed = parseBody(
      z.object({
        center: z.object({ x: z.coerce.number().int(), y: z.coerce.number().int(), z: z.coerce.number().int() }),
        radius: z.coerce.number().int().min(16).max(256),
      }),
      req.body,
    );
    const summary = ctx.botRunner.getWorldSummary(parsed.center, parsed.radius);
    return reply.send(summary);
  });

  app.post('/v1/world/check-zoning', async (req, reply) => {
    const parsed = parseBody(
      z.object({
        proposedBbox: z.object({
          min: z.object({ x: z.coerce.number().int(), y: z.coerce.number().int(), z: z.coerce.number().int() }),
          max: z.object({ x: z.coerce.number().int(), y: z.coerce.number().int(), z: z.coerce.number().int() }),
        }),
        type: z.enum(['house', 'tower', 'road', 'bridge', 'garden', 'plaza', 'wall', 'gate', 'landmark', 'district', 'other']),
      }),
      req.body,
    );
    const result = ctx.botRunner.checkZoning(parsed.proposedBbox, parsed.type);
    return reply.send(result);
  });

  // === Phase 4: City Planning Routes ===

  app.post('/v1/city/plan', async (req, reply) => {
    const parsed = parseBody(
      z.object({
        name: z.string().min(1),
        bounds: z.object({
          min: z.object({ x: z.coerce.number().int(), y: z.coerce.number().int(), z: z.coerce.number().int() }),
          max: z.object({ x: z.coerce.number().int(), y: z.coerce.number().int(), z: z.coerce.number().int() }),
        }),
        districts: z.array(
          z.object({
            name: z.string().min(1),
            style: z.string().min(1),
            bounds: z.object({
              min: z.object({ x: z.coerce.number().int(), y: z.coerce.number().int(), z: z.coerce.number().int() }),
              max: z.object({ x: z.coerce.number().int(), y: z.coerce.number().int(), z: z.coerce.number().int() }),
            }),
            density: z.enum(['low', 'medium', 'high']),
            plotTypes: z.array(z.enum(['residential', 'commercial', 'landmark', 'park', 'infrastructure'])),
          }),
        ),
      }),
      req.body,
    );
    const plan = ctx.botRunner.createCityPlan(parsed.name, parsed.bounds, parsed.districts);
    return reply.send(plan);
  });

  app.get('/v1/city/plan', async (_, reply) => {
    const plan = ctx.botRunner.getActiveCityPlan();
    if (!plan) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'No active city plan' } });
    return reply.send(plan);
  });

  app.post('/v1/city/find-plot', async (req, reply) => {
    const parsed = parseBody(
      z.object({
        type: z.enum(['residential', 'commercial', 'landmark', 'park', 'infrastructure']).optional(),
        size: z.enum(['small', 'medium', 'large']).optional(),
        districtId: z.string().optional(),
      }),
      req.body,
    );
    const plot = ctx.botRunner.findAvailablePlot(parsed);
    if (!plot) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'No available plot' } });
    return reply.send(plot);
  });

  app.post('/v1/city/generate-building', async (req, reply) => {
    const parsed = parseBody(
      z.object({
        plotId: z.string().min(1),
        styleFamily: z.string().min(1),
      }),
      req.body,
    );
    const plan = ctx.botRunner.getActiveCityPlan();
    if (!plan) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'No active city plan' } });
    const plot = plan.plots.find(p => p.plotId === parsed.plotId);
    if (!plot) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Unknown plot' } });
    const blueprint = ctx.botRunner.generateBuildingForPlot(plot, parsed.styleFamily);
    return reply.send({ blueprintId: blueprint.blueprintId });
  });

  app.post('/v1/city/build-roads', async (req, reply) => {
    const parsed = parseBody(
      z.object({
        styleFamily: z.string().min(1),
        budgets: z
          .object({
            maxSeconds: z.coerce.number().int().min(1).max(600),
            maxCommands: z.coerce.number().int().min(1).max(10000),
            maxChangedBlocksUpperBound: z.coerce.number().int().min(1).max(1000000),
          })
          .optional(),
      }),
      req.body,
    );
    const budgets = parsed.budgets ?? ctx.botRunner.getStatus().budgets;
    const job = ctx.botRunner.buildRoads(parsed.styleFamily, budgets);
    if (!job) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'No active city plan' } });
    return reply.send({ jobId: job.jobId });
  });

  app.get('/v1/events/stream', async (req, reply) => {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    });

    const send = (event: AppEvents) => {
      reply.raw.write(`event: ${event.type}\n`);
      reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    const unsubscribe = ctx.events.onAny(send);

    const heartbeat = setInterval(() => {
      reply.raw.write(`event: heartbeat\n`);
      reply.raw.write(`data: {"ts":"${new Date().toISOString()}"}\n\n`);
    }, 15000);

    req.raw.on('close', () => {
      clearInterval(heartbeat);
      unsubscribe();
    });
  });

  app.get('/v1/events/log', async (_, reply) => {
    // For now, stream the JSONL file as-is for viewing/debugging.
    // The dashboard can also consume SSE for live events.
    reply.type('text/plain');
    return reply.send(createReadStream(ctx.config.EVENTS_JSONL_PATH));
  });

  app.get('/v1/events', async (req, reply) => {
    const query = req.query as { sinceSeq?: string; limit?: string };
    const sinceSeq = query.sinceSeq ? Number(query.sinceSeq) : 0;
    const limit = query.limit ? Number(query.limit) : 500;
    const events = await ctx.eventStore.readSince(Number.isFinite(sinceSeq) ? sinceSeq : 0, Number.isFinite(limit) ? limit : 500);
    return reply.send({ events });
  });

  return app;
}

function parseBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; ');
    throw new Error(`INVALID_ARGUMENT:${message}`);
  }
  return parsed.data;
}

