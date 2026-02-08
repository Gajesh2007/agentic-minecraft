import { generateText, hasToolCall, stepCountIs, tool } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { dirname, join } from 'node:path';
import { AppConfig } from '../config.js';
import { EventBus } from '../events/event-bus.js';
import { AppEvents } from '../events/event-types.js';
import { BotRunner } from '../bot-runner.js';
import { JsonStore } from '../store/json-store.js';
import { blueprintOpSchema, vec3Schema } from '../lib/schemas.js';
import { buildPromptPack } from './prompt-pack.js';

type SupervisorState = {
  mode: SupervisorMode;
  nextObjective: string | null;
};

// Shared schema fragments
const bboxInputSchema = z.object({
  min: z.object({ x: z.number().int(), y: z.number().int(), z: z.number().int() }),
  max: z.object({ x: z.number().int(), y: z.number().int(), z: z.number().int() }),
});

const budgetsSchema = z.object({
  maxSeconds: z.number().int().min(1).max(3600),
  maxCommands: z.number().int().min(1).max(50000),
  maxChangedBlocksUpperBound: z.number().int().min(1).max(5000000),
});

export type SupervisorMode = 'explore' | 'build' | 'refine' | 'plan';

// Mode transition logic: given what just happened, pick the next mode
const MODE_TRANSITIONS: Record<SupervisorMode, SupervisorMode> = {
  explore: 'build',
  build: 'refine',
  refine: 'build',
  plan: 'build',
};

export class Supervisor {
  private running = false;
  private mode: SupervisorMode = 'explore';
  private autoTransition = true;
  private nextObjective: string | null = null;
  private consecutiveFailures = 0;
  private abortController: AbortController | null = null;
  private readonly stateStore: JsonStore<SupervisorState>;

  constructor(
    private readonly config: AppConfig,
    private readonly events: EventBus<AppEvents>,
    private readonly botRunner: BotRunner,
  ) {
    this.stateStore = new JsonStore<SupervisorState>(
      join(dirname(config.EVENTS_JSONL_PATH), 'supervisor-state.json'),
      { mode: 'explore', nextObjective: null },
    );
  }

  async init(): Promise<void> {
    await this.stateStore.init();
    const saved = this.stateStore.get();
    this.mode = saved.mode;
    this.nextObjective = saved.nextObjective;
  }

  private persistState(): void {
    this.stateStore.set(() => ({ mode: this.mode, nextObjective: this.nextObjective }));
  }

  isRunning(): boolean {
    return this.running;
  }

  setMode(mode: SupervisorMode): void {
    this.mode = mode;
    this.autoTransition = false;
    this.persistState();
    this.events.publish('supervisor.step', { summary: `mode set to ${mode} (auto-transition disabled)` });
  }

  getMode(): SupervisorMode {
    return this.mode;
  }

  setAutoTransition(enabled: boolean): void {
    this.autoTransition = enabled;
  }

  setObjective(objective: string): void {
    this.nextObjective = objective;
    this.persistState();
    this.events.publish('supervisor.step', { summary: `objective set: ${objective}` });
  }

  getObjective(): string | null {
    return this.nextObjective;
  }

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    this.consecutiveFailures = 0;
    this.events.publish('supervisor.start', { autostart: this.config.SUPERVISOR_AUTOSTART });

    if (!this.config.AI_GATEWAY_API_KEY) {
      this.stop('AI_GATEWAY_API_KEY is not set');
      return;
    }

    while (this.running) {
      try {
        await this.runEpisodeOnce();
        this.consecutiveFailures = 0;
      } catch (err) {
        this.consecutiveFailures += 1;
        const message = err instanceof Error ? err.message : String(err);
        this.events.publish('supervisor.step', { summary: `episode error: ${message}` });

        // Exponential backoff on consecutive failures
        if (this.consecutiveFailures >= 5) {
          this.events.publish('supervisor.step', { summary: `${this.consecutiveFailures} consecutive failures, pausing for 30s` });
          await new Promise(resolve => setTimeout(resolve, 30000));
        }
      }

      // Brief pause between episodes
      if (this.running) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  stop(reason = 'stopped'): void {
    if (!this.running) return;
    this.running = false;
    // Abort the active generateText call immediately
    if (this.abortController) {
      this.abortController.abort(reason);
      this.abortController = null;
    }
    this.events.publish('supervisor.stop', { reason });
  }

  private buildTools() {
    // === Core Tools (Phase 1) ===
    const coreTools = {
      status: tool({
        description: 'Get current bot status: position, budgets, build zone, allowlist',
        inputSchema: z.object({}),
        execute: async () => this.botRunner.getStatus(),
      }),

      createBlueprint: tool({
        description: 'Create a blueprint from ops. Use style-aware ops for consistency.',
        inputSchema: z.object({
          name: z.string().min(1).max(100),
          origin: vec3Schema,
          style: z.object({ family: z.string().optional(), tags: z.array(z.string()).optional() }).optional(),
          palette: z.record(z.string(), z.string()).optional(),
          ops: z.array(blueprintOpSchema).min(1),
        }),
        execute: async input => this.botRunner.createBlueprint(input as any),
      }),

      buildFromBlueprint: tool({
        description: 'Convenience: compile, execute, and verify a blueprint in one step. Returns job ID.',
        inputSchema: z.object({
          blueprintId: z.string(),
          budgets: budgetsSchema.optional(),
          verifyThreshold: z.number().min(0).max(1).optional(),
        }),
        execute: async input => {
          const budgets = input.budgets ?? this.botRunner.getStatus().budgets;
          return this.botRunner.buildFromBlueprint(input.blueprintId, budgets, {
            verifyThreshold: input.verifyThreshold,
          });
        },
      }),

      compileBlueprint: tool({
        description: 'Compile a blueprint into a construction script',
        inputSchema: z.object({ blueprintId: z.string(), maxCommandLength: z.number().int().optional() }),
        execute: async input => this.botRunner.compileBlueprint(input.blueprintId, input.maxCommandLength ?? 220),
      }),

      executeScript: tool({
        description: 'Execute a construction script',
        inputSchema: z.object({
          scriptId: z.string(),
          budgets: budgetsSchema.optional(),
        }),
        execute: async input => {
          const budgets = input.budgets ?? this.botRunner.getStatus().budgets;
          return this.botRunner.executeScript(input.scriptId, budgets);
        },
      }),

      jobStatus: tool({
        description: 'Get job status by id',
        inputSchema: z.object({ jobId: z.string() }),
        execute: async input => this.botRunner.getJob(input.jobId),
      }),

      verifyStructure: tool({
        description: 'Verify built structure against blueprint',
        inputSchema: z.object({
          blueprintId: z.string(),
          bbox: bboxInputSchema,
          threshold: z.number().min(0).max(1).optional(),
        }),
        execute: async input =>
          this.botRunner.verifyStructure(input.blueprintId, input.bbox, input.threshold ?? 0.98),
      }),

      renderAngles: tool({
        description: 'Render milestone screenshots for a bbox from different angles',
        inputSchema: z.object({
          targetBbox: bboxInputSchema,
          presets: z.array(z.enum(['front', 'corner45', 'topdown', 'interior'])).min(1),
        }),
        execute: async input =>
          this.botRunner.renderAngles(input.targetBbox, input.presets, { width: 768, height: 768 }, 8),
      }),

      teleport: tool({
        description: 'Instantly teleport the bot. Use for long distances or camera positioning. For nearby movement, prefer walkTo.',
        inputSchema: z.object({
          position: vec3Schema,
          yaw: z.number().optional(),
          pitch: z.number().optional(),
        }),
        execute: async input => this.botRunner.teleport(input.position, input.yaw, input.pitch),
      }),

      walkTo: tool({
        description: 'Walk the bot to a position using pathfinding. The bot physically moves through the world. Use this for exploring, surveying, and approaching build sites (within ~50 blocks).',
        inputSchema: z.object({
          position: vec3Schema,
          range: z.number().int().min(1).max(10).optional(),
        }),
        execute: async input => this.botRunner.walkTo(input.position, input.range ?? 2),
      }),

      lookAt: tool({
        description: 'Make the bot look at a position (turns head/body without moving)',
        inputSchema: z.object({ position: vec3Schema }),
        execute: async input => this.botRunner.lookAt(input.position),
      }),

      ensureLoaded: tool({
        description: 'Ensure chunks are loaded in a bbox before building/inspecting',
        inputSchema: z.object({
          bbox: bboxInputSchema,
          strategy: z.enum(['forceload', 'teleport-sweep']).optional(),
          timeoutMs: z.number().int().optional(),
        }),
        execute: async input =>
          this.botRunner.ensureLoaded(input.bbox, input.strategy ?? 'teleport-sweep', input.timeoutMs ?? 20000),
      }),

      inspectRegion: tool({
        description: 'Inspect blocks in a region',
        inputSchema: z.object({
          bbox: bboxInputSchema,
          mode: z.enum(['blocks', 'diff', 'heightmap']).optional(),
          encoding: z.enum(['rle-stateId', 'counts', 'hash']).optional(),
        }),
        execute: async input =>
          this.botRunner.inspectRegion(input.bbox, input.mode ?? 'blocks', input.encoding ?? 'hash'),
      }),

      localSiteSummary: tool({
        description: 'Get site summary around an origin point',
        inputSchema: z.object({
          origin: vec3Schema,
          radius: z.number().int().min(1).max(64),
          grid: z.number().int().min(1).max(16).optional(),
        }),
        execute: async input => this.botRunner.getLocalSiteSummary(input.origin, input.radius, input.grid ?? 4),
      }),
    };

    // === Aesthetic Tools (Phase 1-3) ===
    const aestheticTools = {
      critiqueStructure: tool({
        description: 'Get AI aesthetic feedback on a built structure with screenshots',
        inputSchema: z.object({
          blueprintId: z.string(),
          bbox: bboxInputSchema,
          presets: z.array(z.enum(['front', 'corner45', 'topdown', 'interior'])).optional(),
          styleFamily: z.string().optional(),
        }),
        execute: async input => {
          const stylePack = input.styleFamily ? this.botRunner.getStylePack(input.styleFamily) : undefined;
          return this.botRunner.critiqueStructure(
            input.blueprintId,
            input.bbox,
            input.presets ?? ['front', 'corner45'],
            stylePack,
          );
        },
      }),

      beautyLoop: tool({
        description: 'Auto-iterate: render → critic → patch → verify until score threshold reached',
        inputSchema: z.object({
          blueprintId: z.string(),
          bbox: bboxInputSchema,
          maxIterations: z.number().int().min(1).max(10).optional(),
          scoreThreshold: z.number().min(1).max(10).optional(),
          budgets: budgetsSchema.optional(),
          styleFamily: z.string().optional(),
        }),
        execute: async input => {
          const stylePack = input.styleFamily ? this.botRunner.getStylePack(input.styleFamily) : undefined;
          const budgets = input.budgets ?? this.botRunner.getStatus().budgets;
          return this.botRunner.beautyLoop(input.blueprintId, input.bbox, {
            maxIterations: input.maxIterations,
            scoreThreshold: input.scoreThreshold,
            budgets,
            stylePack,
          });
        },
      }),

      getStylePacks: tool({
        description: 'Get available style packs (modern, medieval, japanese, etc.)',
        inputSchema: z.object({}),
        execute: async () => {
          const packs = this.botRunner.getStylePacks();
          return Object.entries(packs).map(([key, pack]) => ({
            family: key,
            name: pack.name,
            description: pack.description,
            tags: pack.tags,
            roofStyle: pack.roofStyle,
          }));
        },
      }),

      getStylePack: tool({
        description: 'Get details of a specific style pack',
        inputSchema: z.object({ family: z.string() }),
        execute: async input => this.botRunner.getStylePack(input.family),
      }),
    };

    // === World Index Tools (Phase 4) ===
    const worldIndexTools = {
      addStructure: tool({
        description: 'Register a built structure in the world index',
        inputSchema: z.object({
          type: z.enum(['house', 'tower', 'road', 'bridge', 'garden', 'plaza', 'wall', 'gate', 'landmark', 'district', 'other']),
          name: z.string().min(1),
          bbox: bboxInputSchema,
          anchor: vec3Schema,
          palette: z.record(z.string(), z.string()).optional(),
          styleTags: z.array(z.string()).optional(),
          blueprintId: z.string().optional(),
          parentStructureId: z.string().optional(),
          checksum: z.string().optional(),
        }),
        execute: async input => this.botRunner.addStructure(input as any),
      }),

      getStructure: tool({
        description: 'Get a structure by ID',
        inputSchema: z.object({ structureId: z.string() }),
        execute: async input => this.botRunner.getStructure(input.structureId),
      }),

      listStructures: tool({
        description: 'List structures with optional filters',
        inputSchema: z.object({
          type: z.enum(['house', 'tower', 'road', 'bridge', 'garden', 'plaza', 'wall', 'gate', 'landmark', 'district', 'other']).optional(),
          withinBbox: bboxInputSchema.optional(),
          parentId: z.string().optional(),
        }),
        execute: async input => this.botRunner.listStructures(input),
      }),

      findStructuresNear: tool({
        description: 'Find structures near a point',
        inputSchema: z.object({
          point: vec3Schema,
          radius: z.number().int().min(1).max(256),
        }),
        execute: async input => this.botRunner.findStructuresNear(input.point, input.radius),
      }),

      getWorldSummary: tool({
        description: 'Get summary of the world around a point',
        inputSchema: z.object({
          center: vec3Schema,
          radius: z.number().int().min(16).max(256),
        }),
        execute: async input => this.botRunner.getWorldSummary(input.center, input.radius),
      }),

      checkZoning: tool({
        description: 'Check if a proposed build location passes zoning rules',
        inputSchema: z.object({
          proposedBbox: bboxInputSchema,
          type: z.enum(['house', 'tower', 'road', 'bridge', 'garden', 'plaza', 'wall', 'gate', 'landmark', 'district', 'other']),
        }),
        execute: async input => this.botRunner.checkZoning(input.proposedBbox, input.type),
      }),
    };

    // === City Planning Tools (Phase 4) ===
    const cityPlanningTools = {
      createCityPlan: tool({
        description: 'Create a city plan with roads and plots',
        inputSchema: z.object({
          name: z.string().min(1),
          bounds: bboxInputSchema,
          districts: z.array(z.object({
            name: z.string(),
            style: z.string(),
            bounds: bboxInputSchema,
            density: z.enum(['low', 'medium', 'high']),
            plotTypes: z.array(z.enum(['residential', 'commercial', 'landmark', 'park', 'infrastructure'])),
          })),
        }),
        execute: async input => this.botRunner.createCityPlan(input.name, input.bounds, input.districts as any),
      }),

      getActiveCityPlan: tool({
        description: 'Get the currently active city plan',
        inputSchema: z.object({}),
        execute: async () => this.botRunner.getActiveCityPlan(),
      }),

      findAvailablePlot: tool({
        description: 'Find an available plot in the active city plan',
        inputSchema: z.object({
          type: z.enum(['residential', 'commercial', 'landmark', 'park', 'infrastructure']).optional(),
          size: z.enum(['small', 'medium', 'large']).optional(),
          districtId: z.string().optional(),
        }),
        execute: async input => this.botRunner.findAvailablePlot(input),
      }),

      generateBuildingForPlot: tool({
        description: 'Generate a building blueprint for a plot using a style',
        inputSchema: z.object({
          plotId: z.string(),
          styleFamily: z.string(),
        }),
        execute: async input => {
          const plan = this.botRunner.getActiveCityPlan();
          if (!plan) throw new Error('No active city plan');
          const plot = plan.plots.find(p => p.plotId === input.plotId);
          if (!plot) throw new Error('Plot not found');
          return this.botRunner.generateBuildingForPlot(plot, input.styleFamily);
        },
      }),

      buildRoads: tool({
        description: 'Build all roads in the active city plan',
        inputSchema: z.object({
          styleFamily: z.string(),
          budgets: budgetsSchema.optional(),
        }),
        execute: async input => {
          const budgets = input.budgets ?? this.botRunner.getStatus().budgets;
          return this.botRunner.buildRoads(input.styleFamily, budgets);
        },
      }),
    };

    // === Block Registry Tools ===
    const registryTools = {
      searchBlocks: tool({
        description: 'Search the full Minecraft block registry (~789 blocks). Returns matching blocks with exact names for blueprints.',
        inputSchema: z.object({
          query: z.string().min(1).max(100).describe('Search term, e.g. "deepslate", "copper", "cherry"'),
        }),
        execute: async input => this.botRunner.searchBlocks(input.query),
      }),

      getBlockCategories: tool({
        description: 'List all block categories and their counts (building, stairs, slabs, doors, light, nature, etc.)',
        inputSchema: z.object({}),
        execute: async () => this.botRunner.getBlockCategories(),
      }),
    };

    // === Raw Command Tools ===
    const rawCommandTools = {
      execCommand: tool({
        description: 'Execute any raw Minecraft command. Bot must be opped. Use for /fill, /clone, /setblock, /weather, /time, /gamerule, /summon, /particle, etc.',
        inputSchema: z.object({
          command: z.string().min(2).max(1000),
        }),
        execute: async input => this.botRunner.execRawCommand(input.command),
      }),

      execCommandBatch: tool({
        description: 'Execute multiple raw Minecraft commands in rapid succession (20 per tick). Much faster than calling execCommand repeatedly.',
        inputSchema: z.object({
          commands: z.array(z.string().min(2).max(1000)).min(1).max(500),
        }),
        execute: async input => this.botRunner.execRawCommandBatch(input.commands),
      }),
    };

    // === Procedural Generation Tools ===
    const proceduralTools = {
      generateHouse: tool({
        description: 'Procedurally generate a house blueprint at a given origin using a style pack. Zero LLM inference — instant blueprint. Returns blueprint ready to build with buildFromBlueprint.',
        inputSchema: z.object({
          origin: vec3Schema,
          width: z.number().int().min(4).max(30),
          height: z.number().int().min(3).max(20),
          depth: z.number().int().min(4).max(30),
          styleFamily: z.string(),
          facing: z.enum(['north', 'south', 'east', 'west']).optional(),
        }),
        execute: async input => this.botRunner.generateStandaloneHouse(input),
      }),

      generateTower: tool({
        description: 'Procedurally generate a tower blueprint at a given center. Zero LLM inference — instant blueprint.',
        inputSchema: z.object({
          center: vec3Schema,
          height: z.number().int().min(10).max(50),
          styleFamily: z.string(),
        }),
        execute: async input => this.botRunner.generateStandaloneTower(input),
      }),
    };

    // === Template & Clone Tools ===
    const templateTools = {
      scanTemplate: tool({
        description: 'Scan an existing build region into a reusable template. Source blocks stay in the world — cloning copies from there. Use after building a verified structure.',
        inputSchema: z.object({
          bbox: bboxInputSchema,
          name: z.string().min(1).max(100),
          blueprintId: z.string().optional(),
          tags: z.array(z.string()).optional(),
        }),
        execute: async input => this.botRunner.scanAndSaveTemplate(input.bbox, input.name, input.blueprintId, input.tags),
      }),

      cloneTemplate: tool({
        description: 'Clone a saved template to a new location using /clone. Massively faster than rebuilding — copies all blocks in 1-3 commands instead of hundreds.',
        inputSchema: z.object({
          templateId: z.string(),
          destination: vec3Schema,
        }),
        execute: async input => this.botRunner.cloneTemplate(input.templateId, input.destination),
      }),

      listTemplates: tool({
        description: 'List all saved structure templates available for cloning',
        inputSchema: z.object({}),
        execute: async () => this.botRunner.listTemplates(),
      }),
    };

    // === Memory & Self-Improvement Tools ===
    const memoryTools = {
      readMemory: tool({
        description: 'Read your persistent memory — learnings, preferences, and notes you wrote in past episodes. Call this at the start of episodes to remember what you learned.',
        inputSchema: z.object({}),
        execute: async () => this.botRunner.readMemory(),
      }),

      addLearning: tool({
        description: 'Record something you learned from experience. This persists across episodes forever. Use for patterns like "spiral staircases fail verification" or "cherry + deepslate looks great together".',
        inputSchema: z.object({
          learning: z.string().min(1).max(500),
        }),
        execute: async input => this.botRunner.addLearning(input.learning),
      }),

      removeLearning: tool({
        description: 'Remove a learning by index if it turned out to be wrong.',
        inputSchema: z.object({ index: z.number().int().min(0) }),
        execute: async input => this.botRunner.removeLearning(input.index),
      }),

      setPreference: tool({
        description: 'Set a persistent preference. Use for things like "favorite_wall_block": "minecraft:cherry_planks" or "default_style": "japanese".',
        inputSchema: z.object({
          key: z.string().min(1).max(100),
          value: z.string().min(1).max(500),
        }),
        execute: async input => this.botRunner.setPreference(input.key, input.value),
      }),

      writeNote: tool({
        description: 'Write a note to yourself for future episodes. Use for plans, ideas, TODOs, observations about the world.',
        inputSchema: z.object({
          note: z.string().min(1).max(500),
        }),
        execute: async input => this.botRunner.addMemoryNote(input.note),
      }),

      readEpisodeHistory: tool({
        description: 'Read past episode summaries. Use to understand what you have already done and what was planned next.',
        inputSchema: z.object({
          limit: z.number().int().min(1).max(50).optional(),
        }),
        execute: async input => {
          const episodes = this.botRunner.getRecentEpisodes(input.limit ?? 10);
          return episodes.map(ep => ({
            id: ep.episodeId,
            status: ep.status,
            objective: ep.objective,
            summary: ep.summary,
            duration: ep.endedAt
              ? Math.round((new Date(ep.endedAt).getTime() - new Date(ep.startedAt).getTime()) / 1000)
              : null,
          }));
        },
      }),
    };

    // === Control Tools ===
    const controlTools = {
      done: tool({
        description: 'Finish the episode with a structured result. Always call this when done.',
        inputSchema: z.object({
          summary: z.string().min(1).max(500),
          nextObjective: z.string().min(1).max(200),
          success: z.boolean().optional(),
          suggestMode: z.enum(['explore', 'build', 'refine', 'plan']).optional(),
        }),
      }),

      logNote: tool({
        description: 'Log a note to the event stream for debugging',
        inputSchema: z.object({
          text: z.string(),
          tags: z.array(z.string()).optional(),
        }),
        execute: async input => this.botRunner.logNote(input.text, input.tags),
      }),
    };

    return {
      ...coreTools,
      ...aestheticTools,
      ...worldIndexTools,
      ...cityPlanningTools,
      ...registryTools,
      ...rawCommandTools,
      ...proceduralTools,
      ...templateTools,
      ...memoryTools,
      ...controlTools,
    };
  }

  private async runEpisodeOnce(): Promise<void> {
    // Build dynamic prompt pack — lean context, everything else is pull-based via tools
    const promptPack = buildPromptPack({
      mode: this.mode,
      botRunner: this.botRunner,
      nextObjective: this.nextObjective,
    });

    const episode = this.botRunner.startEpisode(this.nextObjective ?? `${this.mode} episode`);
    this.events.publish('episode.start', { episodeId: episode.episodeId, objective: episode.objective, mode: this.mode });

    const tools = this.buildTools();

    type ToolName = keyof typeof tools;
    const modeActiveTools: Record<SupervisorMode, ToolName[]> = {
      explore: ['status', 'localSiteSummary', 'inspectRegion', 'getWorldSummary', 'findStructuresNear', 'walkTo', 'lookAt', 'teleport', 'ensureLoaded', 'searchBlocks', 'getBlockCategories', 'execCommand', 'readMemory', 'addLearning', 'removeLearning', 'setPreference', 'writeNote', 'readEpisodeHistory', 'logNote', 'done'],
      build: ['status', 'createBlueprint', 'buildFromBlueprint', 'compileBlueprint', 'executeScript', 'jobStatus', 'verifyStructure', 'addStructure', 'getStylePacks', 'getStylePack', 'ensureLoaded', 'renderAngles', 'walkTo', 'lookAt', 'teleport', 'localSiteSummary', 'checkZoning', 'searchBlocks', 'getBlockCategories', 'execCommand', 'execCommandBatch', 'generateHouse', 'generateTower', 'scanTemplate', 'cloneTemplate', 'listTemplates', 'readMemory', 'addLearning', 'removeLearning', 'setPreference', 'writeNote', 'readEpisodeHistory', 'logNote', 'done'],
      refine: ['status', 'critiqueStructure', 'beautyLoop', 'renderAngles', 'getStylePacks', 'getStylePack', 'listStructures', 'findStructuresNear', 'walkTo', 'lookAt', 'searchBlocks', 'execCommand', 'execCommandBatch', 'scanTemplate', 'cloneTemplate', 'listTemplates', 'readMemory', 'addLearning', 'setPreference', 'writeNote', 'readEpisodeHistory', 'logNote', 'done'],
      plan: ['status', 'createCityPlan', 'getActiveCityPlan', 'findAvailablePlot', 'generateBuildingForPlot', 'buildRoads', 'checkZoning', 'getWorldSummary', 'listStructures', 'getStylePacks', 'localSiteSummary', 'walkTo', 'lookAt', 'teleport', 'ensureLoaded', 'searchBlocks', 'getBlockCategories', 'execCommand', 'execCommandBatch', 'generateHouse', 'generateTower', 'scanTemplate', 'cloneTemplate', 'listTemplates', 'readMemory', 'addLearning', 'setPreference', 'writeNote', 'readEpisodeHistory', 'logNote', 'done'],
    };

    let stepIdx = 0;
    this.abortController = new AbortController();
    const { signal } = this.abortController;

    // Select model: Anthropic direct (with prompt caching) or gateway
    const useAnthropic = this.config.SUPERVISOR_PROVIDER === 'anthropic' && this.config.ANTHROPIC_API_KEY;
    const model = useAnthropic
      ? anthropic(this.config.SUPERVISOR_MODEL)
      : gateway(this.config.AI_MODEL);

    try {
      const result = await generateText({
        model,
        abortSignal: signal,
        system: promptPack.system,
        prompt: promptPack.userMessage,
        tools,
        toolChoice: 'required',
        stopWhen: [hasToolCall('done'), stepCountIs(150)],
        providerOptions: {
          ...(useAnthropic
            ? { anthropic: { cacheControl: { type: 'ephemeral' } } }
            : { openai: { reasoningEffort: this.config.AI_REASONING_EFFORT } }
          ),
        },
        prepareStep: ({ stepNumber, messages }) => {
          if (stepNumber >= 145) {
            return {
              toolChoice: { type: 'tool' as const, toolName: 'done' as const },
              activeTools: ['done'] as ToolName[],
            };
          }

          // Anthropic cache control: mark the last message with cache breakpoint
          // so the entire conversation prefix is cached (tools + system + prior messages)
          if (useAnthropic && messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg) {
              return {
                activeTools: modeActiveTools[this.mode],
                messages: messages.map((msg, i) =>
                  i === messages.length - 1
                    ? { ...msg, providerOptions: { anthropic: { cacheControl: { type: 'ephemeral' } } } }
                    : msg,
                ),
              };
            }
          }

          return {
            activeTools: modeActiveTools[this.mode],
          };
        },
        onStepFinish: step => {
          stepIdx += 1;
          const toolNames = step.toolCalls.map(t => t.toolName).join(',');
          this.events.publish('supervisor.step', {
            summary: `step ${stepIdx}: ${toolNames} (${step.finishReason})`,
          });
        },
      });

      // Check staticToolCalls first, then fall back to scanning all steps
      const doneCall = result.staticToolCalls.find(c => c.toolName === 'done')
        ?? result.steps.flatMap(s => s.toolCalls).find(c => c.toolName === 'done');
      if (doneCall) {
        const input = (doneCall as { input: Record<string, unknown> }).input as {
          summary: string;
          nextObjective: string;
          success?: boolean;
          suggestMode?: SupervisorMode;
        };
        const status = input.success === false ? 'failed' : 'completed';

        this.events.publish('supervisor.step', {
          summary: `done: ${input.summary} | next: ${input.nextObjective}`,
        });
        this.botRunner.finishEpisode(episode.episodeId, input.summary, status);
        this.events.publish('episode.finish', { episodeId: episode.episodeId, status, summary: input.summary });

        // Carry forward next objective
        this.nextObjective = input.nextObjective;

        // Auto-transition mode if enabled
        if (this.autoTransition) {
          if (input.suggestMode) {
            this.mode = input.suggestMode;
            this.events.publish('supervisor.step', { summary: `auto-transition to ${this.mode} (agent suggested)` });
          } else if (status === 'completed') {
            this.mode = MODE_TRANSITIONS[this.mode];
            this.events.publish('supervisor.step', { summary: `auto-transition to ${this.mode}` });
          }
        }

        this.persistState();
      } else {
        this.events.publish('supervisor.step', { summary: 'episode finished without done()' });
        this.botRunner.finishEpisode(episode.episodeId, 'episode finished without done()', 'failed');
        this.events.publish('episode.finish', { episodeId: episode.episodeId, status: 'failed', summary: 'no done() call' });
      }
    } catch (err) {
      const isAbort = err instanceof Error && (err.name === 'AbortError' || signal.aborted);
      const summary = isAbort ? 'stopped by user' : 'episode error';
      this.botRunner.finishEpisode(episode.episodeId, summary, 'failed');
      this.events.publish('episode.finish', { episodeId: episode.episodeId, status: 'failed', summary });
      if (!isAbort) throw err;
    } finally {
      this.abortController = null;
    }
  }
}
