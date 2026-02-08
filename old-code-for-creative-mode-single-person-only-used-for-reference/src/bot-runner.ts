import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { AppConfig } from './config.js';
import { EventBus } from './events/event-bus.js';
import { AppEvents } from './events/event-types.js';
import { AgentRuntime } from './runtime/agent-runtime.js';
import { ControlState } from './state/control-state.js';
import { BlueprintStore } from './store/blueprint-store.js';
import { ScriptStore } from './store/script-store.js';
import { JobStore } from './store/job-store.js';
import { JobQueue } from './store/job-queue.js';
import { EpisodeStore, EpisodeRecord } from './store/episode-store.js';
import { WorldIndex, StructureRecord, StructureType } from './store/world-index.js';
import { compileBlueprint } from './builder/compiler.js';
import { executeScript, ExecutionReport } from './builder/executor.js';
import { inspectRegion, localSiteSummary } from './perception/perception.js';
import { verifyBlueprint } from './verify/verifier.js';
import { captureViewerScreenshot } from './render/browser-renderer.js';
import { computeViewpoint, radiansToDegrees, ViewPreset } from './render/viewpoints.js';
import { critiqueStructure, CriticFeedback, CriticContext } from './critic/aesthetic-critic.js';
import { getStylePack, STYLE_PACKS, StylePack } from './styles/style-packs.js';
import { generateCityPlan, CityPlan, DistrictLayoutOptions, findAvailablePlot, generateRoadOps, generateHouseBlueprint, generateTowerBlueprint, Plot } from './planner/city-planner.js';
import { JsonStore } from './store/json-store.js';
import { makeId } from './lib/ids.js';
import { BBox, Vec3i, addVec, bboxUnion, normalizeBBox, bboxDimensions } from './types/geometry.js';
import { TemplateStore, StructureTemplate } from './builder/template-store.js';
import { generateCloneCommands } from './builder/clone-ops.js';
import { scanStructure } from './builder/structure-scanner.js';
import { AgentMemory, AgentMemoryData } from './store/agent-memory.js';
import { Blueprint, BlueprintOp, Budgets, ConstructionScript, JobRecord } from './types/blueprint.js';
import { CreateBlueprintInput, ReviseBlueprintInput } from './lib/schemas.js';

export class BotRunner {
  private readonly control: ControlState;
  private readonly blueprints: BlueprintStore;
  private readonly scripts: ScriptStore;
  private readonly jobs: JobStore;
  private readonly jobQueue: JobQueue;
  private readonly episodes: EpisodeStore;
  private readonly worldIndex: WorldIndex;
  private readonly assetsDir: string;
  private readonly cityPlanStore: JsonStore<{ plan: CityPlan | null }>;
  private readonly templateStore: TemplateStore;
  private readonly agentMemory: AgentMemory;

  constructor(
    private readonly config: AppConfig,
    private readonly events: EventBus<AppEvents>,
    private readonly agent: AgentRuntime,
  ) {
    this.control = new ControlState(join(dirname(config.EVENTS_JSONL_PATH), 'control.json'));
    this.blueprints = new BlueprintStore(join(dirname(config.EVENTS_JSONL_PATH), 'blueprints.json'));
    this.scripts = new ScriptStore(join(dirname(config.EVENTS_JSONL_PATH), 'scripts.json'));
    this.jobs = new JobStore(join(dirname(config.EVENTS_JSONL_PATH), 'jobs.json'));
    this.jobQueue = new JobQueue();
    this.episodes = new EpisodeStore(join(dirname(config.EVENTS_JSONL_PATH), 'episodes.json'));
    this.worldIndex = new WorldIndex(join(dirname(config.EVENTS_JSONL_PATH), 'world-index.json'));
    this.cityPlanStore = new JsonStore(join(dirname(config.EVENTS_JSONL_PATH), 'city-plan.json'), { plan: null });
    this.templateStore = new TemplateStore(join(dirname(config.EVENTS_JSONL_PATH), 'templates.json'));
    this.agentMemory = new AgentMemory(join(dirname(config.EVENTS_JSONL_PATH), 'agent-memory.json'));
    this.assetsDir = config.ASSETS_DIR;
  }

  async init(): Promise<void> {
    await this.control.init();
    await this.blueprints.init();
    await this.scripts.init();
    await this.jobs.init();
    await this.episodes.init();
    await this.worldIndex.init();
    await this.cityPlanStore.init();
    await this.templateStore.init();
    await this.agentMemory.init();
    await mkdir(this.assetsDir, { recursive: true });
  }

  getStatus() {
    return {
      bot: this.agent.getSnapshot(),
      budgets: this.control.getBudgets(),
      buildZone: this.control.getBuildZone(),
      allowlist: this.control.getAllowlist(),
    };
  }

  setBudgets(budgets: Budgets): Budgets {
    return this.control.setBudgets(budgets);
  }

  setBuildZone(buildZone: BBox | null): BBox | null {
    return this.control.setBuildZone(buildZone);
  }

  setAllowlist(allowed: string[], mode: 'replace' | 'add' | 'remove' | 'clear'): string[] {
    return this.control.updateAllowlist(allowed, mode);
  }

  async ensureLoaded(bbox: BBox, strategy: 'forceload' | 'teleport-sweep', timeoutMs: number) {
    return this.agent.ensureLoaded(bbox, strategy, timeoutMs);
  }

  async getLocalSiteSummary(origin: { x: number; y: number; z: number }, radius: number, grid: number) {
    const bbox = normalizeBBox({
      min: { x: origin.x - radius, y: 0, z: origin.z - radius },
      max: { x: origin.x + radius, y: 255, z: origin.z + radius },
    });
    await this.agent.ensureLoaded(bbox, 'forceload', 20000);
    return localSiteSummary(this.agent, origin, radius, grid);
  }

  async inspectRegion(bbox: BBox, mode: 'blocks' | 'diff' | 'heightmap', encoding: 'rle-stateId' | 'counts' | 'hash') {
    await this.agent.ensureLoaded(bbox, 'forceload', 20000);
    return inspectRegion(this.agent, bbox, mode, encoding);
  }

  async teleport(position: { x: number; y: number; z: number }, yaw?: number, pitch?: number) {
    await this.agent.teleport(position, yaw, pitch);
    return { ok: true };
  }

  async walkTo(position: { x: number; y: number; z: number }, range?: number) {
    return this.agent.walkTo(position, range);
  }

  async lookAt(position: { x: number; y: number; z: number }) {
    await this.agent.lookAt(position);
    return { ok: true };
  }

  async setViewpoint(targetBbox: BBox, preset: ViewPreset, distance: number) {
    const view = computeViewpoint(targetBbox, preset, distance);
    await this.agent.teleport(view.position, radiansToDegrees(view.yaw), radiansToDegrees(view.pitch));
    return view;
  }

  createBlueprint(input: CreateBlueprintInput): Blueprint {
    // Cast ops - Zod schema validates structure, but z.lazy() loses type inference
    const blueprint = this.blueprints.create(input as Omit<Blueprint, 'blueprintId' | 'parentId' | 'expected'>);
    this.events.publish('blueprint.created', { blueprintId: blueprint.blueprintId, parentId: null });
    return blueprint;
  }

  reviseBlueprint(blueprintId: string, patchOps: ReviseBlueprintInput['patchOps']): Blueprint {
    // Cast ops - Zod schema validates structure, but z.lazy() loses type inference
    const blueprint = this.blueprints.revise(blueprintId, patchOps as BlueprintOp[]);
    this.events.publish('blueprint.created', { blueprintId: blueprint.blueprintId, parentId: blueprint.parentId });
    return blueprint;
  }

  getBlueprint(blueprintId: string): Blueprint {
    const bp = this.blueprints.get(blueprintId);
    if (!bp) throw new Error('UNKNOWN_BLUEPRINT');
    return bp;
  }

  compileBlueprint(blueprintId: string, maxCommandLength: number): ConstructionScript {
    const blueprint = this.getBlueprint(blueprintId);
    const script = compileBlueprint(blueprint, { maxCommandLength });
    this.scripts.save(script);
    const scriptBox = script.steps.length > 0 ? script.steps.map(step => step.bbox).reduce(bboxUnion) : null;
    if (scriptBox) {
      this.blueprints.updateExpected(blueprintId, { bbox: scriptBox });
    }
    this.events.publish('script.compiled', {
      scriptId: script.scriptId,
      blueprintId,
      commands: script.steps.length,
      estimatedBlocks: script.estimated.changedBlocksUpperBound,
    });
    return script;
  }

  executeScript(scriptId: string, budgets: Budgets, idempotencyKey?: string, recordDiffs?: { mode: 'per-step' | 'per-bbox'; encoding: 'counts+hash' | 'hash' }): JobRecord {
    const existing = idempotencyKey ? this.jobs.getByIdempotency(idempotencyKey) : undefined;
    if (existing) return existing;
    const script = this.scripts.get(scriptId);
    if (!script) throw new Error('UNKNOWN_SCRIPT');
    const job = this.jobs.create('build.execute', idempotencyKey);
    this.events.publish('job.created', { jobId: job.jobId, type: job.type });

    this.jobQueue.enqueue({
      jobId: job.jobId,
      run: async signal => {
        this.jobs.setStatus(job.jobId, 'running');
        this.events.publish('job.updated', { jobId: job.jobId, status: 'running' });
        const scriptBox = script.steps.length > 0 ? script.steps.map(step => step.bbox).reduce(bboxUnion) : null;
        if (scriptBox) {
          await this.agent.ensureLoaded(scriptBox, 'forceload', 30000);
        }
        const report = await executeScript({
          script,
          agent: this.agent,
          control: this.control,
          events: this.events,
          budgets,
          recordDiffs,
          signal,
        });
        if (report.diffs) {
          for (const diff of report.diffs) {
            this.events.publish('world.diff', { jobId: job.jobId, bbox: diff.bbox, before: diff.before, after: diff.after });
          }
        }
        return report;
      },
      onDone: result => {
        this.jobs.setStatus(job.jobId, 'succeeded', result);
        this.events.publish('job.updated', { jobId: job.jobId, status: 'succeeded' });
      },
      onError: err => {
        const status = err.message === 'cancelled' ? 'cancelled' : 'failed';
        this.jobs.setStatus(job.jobId, status, null, err.message);
        this.events.publish('job.updated', { jobId: job.jobId, status });
      },
    });

    return job;
  }

  async verifyStructure(blueprintId: string, bbox: BBox, threshold: number) {
    const blueprint = this.getBlueprint(blueprintId);
    await this.agent.ensureLoaded(bbox, 'forceload', 20000);
    const result = await verifyBlueprint({ agent: this.agent, blueprint, bbox, threshold });
    this.events.publish('verify.result', { blueprintId, ok: result.ok, matchRatio: result.matchRatio });
    let repairBlueprint: Blueprint | null = null;
    if (!result.ok && result.patchOps.length > 0) {
      repairBlueprint = this.reviseBlueprint(blueprintId, result.patchOps);
    }
    return {
      ok: result.ok,
      matchRatio: result.matchRatio,
      diffs: result.diffs,
      checksums: { expected: result.expectedHash, actual: result.actualHash },
      repairBlueprintId: repairBlueprint?.blueprintId ?? null,
    };
  }

  renderAngles(
    targetBbox: BBox,
    presets: ViewPreset[],
    resolution: { width: number; height: number },
    viewDistanceChunks: number,
  ): JobRecord {
    const job = this.jobs.create('render.angles');
    this.events.publish('job.created', { jobId: job.jobId, type: job.type });

    this.jobQueue.enqueue({
      jobId: job.jobId,
      run: async signal => {
        this.jobs.setStatus(job.jobId, 'running');
        this.events.publish('job.updated', { jobId: job.jobId, status: 'running' });
        await this.agent.ensureLoaded(targetBbox, 'forceload', 30000);
        const imageIds: string[] = [];
        for (const preset of presets) {
          if (signal.aborted) throw new Error('cancelled');
          const view = computeViewpoint(targetBbox, preset, 40);
          await this.agent.teleport(view.position, radiansToDegrees(view.yaw), radiansToDegrees(view.pitch));
          const buffer = await captureViewerScreenshot({
            url: `http://127.0.0.1:${this.config.VIEWER_PORT}/`,
            width: resolution.width,
            height: resolution.height,
          });
          const imageId = makeId('img');
          const filename = `${imageId}.jpg`;
          await writeFile(join(this.assetsDir, filename), buffer);
          imageIds.push(imageId);
          this.events.publish('job.progress', { jobId: job.jobId, message: `rendered ${preset}` });
        }
        return {
          imageIds,
          urls: imageIds.map(id => `/assets/${id}.jpg`),
        };
      },
      onDone: result => {
        this.jobs.setStatus(job.jobId, 'succeeded', result);
        this.events.publish('job.updated', { jobId: job.jobId, status: 'succeeded' });
        this.events.publish('render.done', { jobId: job.jobId, imageIds: result.imageIds });
      },
      onError: err => {
        const status = err.message === 'cancelled' ? 'cancelled' : 'failed';
        this.jobs.setStatus(job.jobId, status, null, err.message);
        this.events.publish('job.updated', { jobId: job.jobId, status });
      },
    });

    return job;
  }

  getJob(jobId: string): JobRecord | undefined {
    return this.jobs.get(jobId);
  }

  cancelJob(jobId: string): boolean {
    const cancelled = this.jobQueue.cancel(jobId);
    if (cancelled) {
      this.jobs.setStatus(jobId, 'cancelled', null, 'cancelled');
      this.events.publish('job.updated', { jobId, status: 'cancelled' });
    }
    return cancelled;
  }

  cancelAllJobs(): number {
    let cancelled = 0;
    for (const job of this.jobs.list()) {
      if (job.status === 'queued' || job.status === 'running') {
        if (this.cancelJob(job.jobId)) cancelled += 1;
      }
    }
    return cancelled;
  }

  logNote(text: string, tags?: string[]) {
    this.events.publish('log.note', { text, tags });
    return { ok: true };
  }

  startEpisode(objective: string | null): EpisodeRecord {
    return this.episodes.start(objective);
  }

  finishEpisode(episodeId: string, summary: string, status: 'completed' | 'failed'): EpisodeRecord {
    return this.episodes.finish(episodeId, summary, status);
  }

  getEpisode(episodeId: string): EpisodeRecord | undefined {
    return this.episodes.get(episodeId);
  }

  listEpisodes(): EpisodeRecord[] {
    return this.episodes.list();
  }

  getRecentEpisodes(n: number): EpisodeRecord[] {
    return this.episodes.getRecent(n);
  }

  getLastCompletedEpisode(): EpisodeRecord | undefined {
    return this.episodes.getLastCompleted();
  }

  cleanupOrphanedEpisodes(): number {
    return this.episodes.cleanupOrphaned();
  }

  // === Phase 1: Convenience Methods ===

  /**
   * buildFromBlueprint - One-shot: compile + execute + verify
   */
  buildFromBlueprint(
    blueprintId: string,
    budgets: Budgets,
    options?: {
      maxCommandLength?: number;
      verifyThreshold?: number;
      recordDiffs?: { mode: 'per-step' | 'per-bbox'; encoding: 'counts+hash' | 'hash' };
    },
  ): JobRecord {
    const job = this.jobs.create('build.fromBlueprint');
    this.events.publish('job.created', { jobId: job.jobId, type: job.type });

    this.jobQueue.enqueue({
      jobId: job.jobId,
      run: async signal => {
        this.jobs.setStatus(job.jobId, 'running');
        this.events.publish('job.updated', { jobId: job.jobId, status: 'running' });

        // 1. Compile
        const maxCommandLength = options?.maxCommandLength ?? 256;
        const script = this.compileBlueprint(blueprintId, maxCommandLength);
        this.events.publish('job.progress', { jobId: job.jobId, message: 'compiled' });

        // 2. Ensure area loaded + move bot to watch
        const scriptBox = script.steps.length > 0 ? script.steps.map(s => s.bbox).reduce(bboxUnion) : null;
        if (scriptBox) {
          await this.agent.ensureLoaded(scriptBox, 'forceload', 30000);
          // Teleport bot to a viewpoint so the viewer can watch the build
          const view = computeViewpoint(scriptBox, 'corner45', 30);
          await this.agent.teleport(view.position, radiansToDegrees(view.yaw), radiansToDegrees(view.pitch));
        }

        // 3. Execute
        const report = await executeScript({
          script,
          agent: this.agent,
          control: this.control,
          events: this.events,
          budgets,
          recordDiffs: options?.recordDiffs,
          signal,
        });
        this.events.publish('job.progress', { jobId: job.jobId, message: `executed ${report.commandsExecuted} commands` });

        // 3b. Force viewer refresh: teleport to build, wait for chunk data to arrive
        if (scriptBox) {
          const view = computeViewpoint(scriptBox, 'corner45', 30);
          // Teleport to the build viewpoint so client loads fresh chunks with new blocks
          await this.agent.teleport(view.position, radiansToDegrees(view.yaw), radiansToDegrees(view.pitch));
          await this.agent.waitForChunksToLoad();
          // Wait for block update packets to arrive from server
          await new Promise(resolve => setTimeout(resolve, 2000));
          this.events.publish('job.progress', { jobId: job.jobId, message: 'viewer refreshed' });
        }

        // 4. Verify
        const blueprint = this.getBlueprint(blueprintId);
        const bbox = scriptBox ?? blueprint.expected?.bbox;
        if (!bbox) {
          return { script, report, verification: null };
        }

        const verifyResult = await verifyBlueprint({
          agent: this.agent,
          blueprint,
          bbox,
          threshold: options?.verifyThreshold ?? 0.95,
        });
        this.events.publish('verify.result', { blueprintId, ok: verifyResult.ok, matchRatio: verifyResult.matchRatio });

        return { script, report, verification: verifyResult };
      },
      onDone: result => {
        this.jobs.setStatus(job.jobId, 'succeeded', result);
        this.events.publish('job.updated', { jobId: job.jobId, status: 'succeeded' });
      },
      onError: err => {
        const status = err.message === 'cancelled' ? 'cancelled' : 'failed';
        this.jobs.setStatus(job.jobId, status, null, err.message);
        this.events.publish('job.updated', { jobId: job.jobId, status });
      },
    });

    return job;
  }

  /**
   * critiqueStructure - Render screenshots and get AI aesthetic feedback
   */
  async critiqueStructure(
    blueprintId: string,
    bbox: BBox,
    presets: ViewPreset[] = ['front', 'corner45'],
    stylePack?: StylePack,
  ): Promise<{ feedback: CriticFeedback; imageUrls: string[] }> {
    // Render screenshots first
    const renderJob = this.renderAngles(bbox, presets, { width: 800, height: 600 }, 8);
    
    // Wait for render to complete
    let attempts = 0;
    while (attempts < 60) {
      await new Promise(r => setTimeout(r, 1000));
      const status = this.getJob(renderJob.jobId);
      if (status?.status === 'succeeded') break;
      if (status?.status === 'failed' || status?.status === 'cancelled') {
        throw new Error(`Render job failed: ${status.error?.message}`);
      }
      attempts++;
    }

    const completed = this.getJob(renderJob.jobId);
    if (!completed || completed.status !== 'succeeded') {
      throw new Error('Render job timed out');
    }

    const result = completed.result as { imageIds: string[]; urls: string[] };
    const imagePaths = result.imageIds.map(id => join(this.assetsDir, `${id}.jpg`));

    const blueprint = this.getBlueprint(blueprintId);
    const context: CriticContext = {
      stylePack,
      structureName: blueprint.name,
      structureType: blueprint.style?.tags?.[0],
      bbox,
    };

    const feedback = await critiqueStructure(imagePaths, context, this.config.AI_MODEL);
    return { feedback, imageUrls: result.urls };
  }

  /**
   * beautyLoop - Auto-iterate: render → critic → patch → verify until score threshold
   */
  beautyLoop(
    blueprintId: string,
    bbox: BBox,
    options: {
      maxIterations?: number;
      scoreThreshold?: number;
      budgets: Budgets;
      stylePack?: StylePack;
    },
  ): JobRecord {
    const job = this.jobs.create('beauty.loop');
    this.events.publish('job.created', { jobId: job.jobId, type: job.type });

    this.jobQueue.enqueue({
      jobId: job.jobId,
      run: async signal => {
        this.jobs.setStatus(job.jobId, 'running');
        this.events.publish('job.updated', { jobId: job.jobId, status: 'running' });

        const maxIterations = options.maxIterations ?? 3;
        const scoreThreshold = options.scoreThreshold ?? 7;
        let currentBlueprintId = blueprintId;
        let iteration = 0;
        let lastScore = 0;
        const history: Array<{ iteration: number; score: number; patchCount: number }> = [];

        while (iteration < maxIterations) {
          if (signal.aborted) throw new Error('cancelled');
          
          // 1. Critique current state
          const { feedback } = await this.critiqueStructure(currentBlueprintId, bbox, ['front', 'corner45'], options.stylePack);
          lastScore = feedback.scores.overall;
          
          this.events.publish('job.progress', { 
            jobId: job.jobId, 
            message: `iteration ${iteration + 1}: score ${lastScore.toFixed(1)}/10` 
          });

          // Check if we've reached threshold
          if (lastScore >= scoreThreshold) {
            history.push({ iteration, score: lastScore, patchCount: 0 });
            break;
          }

          // 2. Apply patches if any
          if (feedback.patchOps.length === 0) {
            history.push({ iteration, score: lastScore, patchCount: 0 });
            break;
          }

          const patchBlueprint = this.reviseBlueprint(currentBlueprintId, feedback.patchOps);
          currentBlueprintId = patchBlueprint.blueprintId;
          history.push({ iteration, score: lastScore, patchCount: feedback.patchOps.length });

          // 3. Build patches
          const script = this.compileBlueprint(currentBlueprintId, 256);
          await executeScript({
            script,
            agent: this.agent,
            control: this.control,
            events: this.events,
            budgets: options.budgets,
            signal,
          });

          iteration++;
        }

        return {
          finalBlueprintId: currentBlueprintId,
          finalScore: lastScore,
          iterations: iteration,
          history,
        };
      },
      onDone: result => {
        this.jobs.setStatus(job.jobId, 'succeeded', result);
        this.events.publish('job.updated', { jobId: job.jobId, status: 'succeeded' });
      },
      onError: err => {
        const status = err.message === 'cancelled' ? 'cancelled' : 'failed';
        this.jobs.setStatus(job.jobId, status, null, err.message);
        this.events.publish('job.updated', { jobId: job.jobId, status });
      },
    });

    return job;
  }

  // === Phase 3: Style Management ===

  getStylePacks(): Record<string, StylePack> {
    return { ...STYLE_PACKS };
  }

  getStylePack(family: string): StylePack | undefined {
    return getStylePack(family);
  }

  // === Agent Memory ===

  readMemory(): AgentMemoryData {
    return this.agentMemory.read();
  }

  getMemorySummary(): string | null {
    return this.agentMemory.getSummary();
  }

  addLearning(learning: string): AgentMemoryData {
    return this.agentMemory.addLearning(learning);
  }

  removeLearning(index: number): AgentMemoryData {
    return this.agentMemory.removeLearning(index);
  }

  setPreference(key: string, value: string): AgentMemoryData {
    return this.agentMemory.setPreference(key, value);
  }

  deletePreference(key: string): AgentMemoryData {
    return this.agentMemory.deletePreference(key);
  }

  addMemoryNote(note: string): AgentMemoryData {
    return this.agentMemory.addNote(note);
  }

  // === Block Registry ===

  searchBlocks(query: string) {
    const catalog = this.agent.getBlockCatalog();
    if (!catalog) throw new Error('Bot is not connected');
    return catalog.search(query);
  }

  getBlockCategories() {
    const catalog = this.agent.getBlockCatalog();
    if (!catalog) throw new Error('Bot is not connected');
    return catalog.getCategories();
  }

  // === Raw Commands ===

  async execRawCommand(command: string): Promise<{ ok: true }> {
    await this.agent.execCommand(command, 0);
    this.events.publish('build.command', { command });
    return { ok: true };
  }

  async execRawCommandBatch(commands: string[]): Promise<{ executed: number; elapsed: number }> {
    const result = await this.agent.execCommandBatch(commands);
    for (const cmd of commands) {
      this.events.publish('build.command', { command: cmd });
    }
    return result;
  }

  // === Templates & Cloning ===

  async scanAndSaveTemplate(
    bbox: BBox,
    name: string,
    blueprintId?: string,
    tags?: string[],
  ): Promise<StructureTemplate> {
    const template = await scanStructure(this.agent, bbox, name, { blueprintId, tags });
    this.templateStore.save(template);
    this.events.publish('log.note', { text: `Template saved: ${name} (${template.templateId}, ${template.blockCount} blocks)`, tags: ['template'] });
    return template;
  }

  listTemplates(): StructureTemplate[] {
    return this.templateStore.list();
  }

  getTemplate(templateId: string): StructureTemplate | undefined {
    return this.templateStore.get(templateId);
  }

  async cloneTemplate(
    templateId: string,
    destination: Vec3i,
  ): Promise<{ executed: number; elapsed: number; templateId: string }> {
    const template = this.templateStore.get(templateId);
    if (!template) throw new Error('UNKNOWN_TEMPLATE');

    // Ensure source chunks are loaded
    await this.agent.ensureLoaded(template.sourceBbox, 'forceload', 30000);

    // Ensure destination chunks are loaded
    const destBbox = normalizeBBox({
      min: destination,
      max: addVec(destination, {
        x: template.dimensions.dx - 1,
        y: template.dimensions.dy - 1,
        z: template.dimensions.dz - 1,
      }),
    });
    await this.agent.ensureLoaded(destBbox, 'forceload', 30000);

    const commands = generateCloneCommands(template, destination);
    const result = await this.agent.execCommandBatch(commands);

    for (const cmd of commands) {
      this.events.publish('build.command', { command: cmd });
    }

    return { ...result, templateId };
  }

  // === Procedural Generation ===

  generateStandaloneHouse(input: {
    origin: Vec3i;
    width: number;
    height: number;
    depth: number;
    styleFamily: string;
    facing?: 'north' | 'south' | 'east' | 'west';
  }): Blueprint {
    const stylePack = getStylePack(input.styleFamily) ?? STYLE_PACKS.modern!;
    const plot: Plot = {
      plotId: makeId('plot'),
      bbox: normalizeBBox({
        min: { x: 0, y: 0, z: 0 },
        max: { x: input.width - 1, y: input.height - 1, z: input.depth - 1 },
      }),
      type: 'residential',
      size: input.width <= 8 ? 'small' : input.width <= 12 ? 'medium' : 'large',
      facing: input.facing ?? 'south',
      reserved: false,
    };
    const ops = generateHouseBlueprint(plot, stylePack);
    return this.createBlueprint({
      name: `${stylePack.name} house`,
      origin: input.origin,
      palette: stylePack.palette,
      style: { family: input.styleFamily, tags: stylePack.tags },
      ops,
    });
  }

  generateStandaloneTower(input: {
    center: Vec3i;
    height: number;
    styleFamily: string;
  }): Blueprint {
    const stylePack = getStylePack(input.styleFamily) ?? STYLE_PACKS.modern!;
    const ops = generateTowerBlueprint({ x: 0, y: 0, z: 0 }, input.height, stylePack);
    return this.createBlueprint({
      name: `${stylePack.name} tower`,
      origin: input.center,
      palette: stylePack.palette,
      style: { family: input.styleFamily, tags: stylePack.tags },
      ops,
    });
  }

  // === Phase 4: World Index & City Planning ===

  addStructure(input: {
    type: StructureType;
    name: string;
    bbox: BBox;
    anchor: Vec3i;
    palette?: Record<string, string>;
    styleTags?: string[];
    blueprintId?: string;
    parentStructureId?: string;
    checksum?: string;
  }): StructureRecord {
    const structure = this.worldIndex.addStructure(input);
    this.events.publish('structure.registered', { structureId: structure.structureId, type: structure.type, name: structure.name });
    return structure;
  }

  getStructure(structureId: string): StructureRecord | undefined {
    return this.worldIndex.getStructure(structureId);
  }

  listStructures(filter?: { type?: StructureType; withinBbox?: BBox; parentId?: string }): StructureRecord[] {
    return this.worldIndex.listStructures(filter);
  }

  findStructuresNear(point: Vec3i, radius: number): StructureRecord[] {
    return this.worldIndex.findStructuresNear(point, radius);
  }

  getWorldSummary(center: Vec3i, radius: number) {
    return this.worldIndex.getSummary(center, radius);
  }

  checkZoning(proposedBbox: BBox, type: StructureType) {
    return this.worldIndex.checkZoning(proposedBbox, type);
  }

  // City planning
  createCityPlan(
    name: string,
    bounds: BBox,
    districts: DistrictLayoutOptions[],
  ): CityPlan {
    const plan = generateCityPlan(name, bounds, districts);
    this.cityPlanStore.set(() => ({ plan }));
    this.events.publish('city.plan.created', { name, plotCount: plan.plots.length, roadCount: plan.roads.length });
    return plan;
  }

  getActiveCityPlan(): CityPlan | null {
    return this.cityPlanStore.get().plan;
  }

  findAvailablePlot(requirements: {
    type?: 'residential' | 'commercial' | 'landmark' | 'park' | 'infrastructure';
    size?: 'small' | 'medium' | 'large';
    districtId?: string;
  }): Plot | undefined {
    const plan = this.getActiveCityPlan();
    if (!plan) return undefined;
    return findAvailablePlot(plan, requirements);
  }

  generateBuildingForPlot(
    plot: Plot,
    styleFamily: string,
  ): Blueprint {
    const stylePack = getStylePack(styleFamily) ?? STYLE_PACKS.modern!;
    const ops = generateHouseBlueprint(plot, stylePack);
    
    return this.createBlueprint({
      name: `Building at ${plot.plotId}`,
      origin: plot.bbox.min,
      palette: stylePack.palette,
      style: { family: styleFamily, tags: stylePack.tags },
      ops,
    });
  }

  buildRoads(styleFamily: string, budgets: Budgets): JobRecord | null {
    const activePlan = this.getActiveCityPlan();
    if (!activePlan) return null;
    const stylePack = getStylePack(styleFamily) ?? STYLE_PACKS.modern!;
    const roadOps = generateRoadOps(activePlan.roads, stylePack);

    const blueprint = this.createBlueprint({
      name: `${activePlan.name} roads`,
      origin: activePlan.bounds.min,
      palette: stylePack.palette,
      style: { family: styleFamily, tags: ['infrastructure', 'roads'] },
      ops: roadOps,
    });

    return this.buildFromBlueprint(blueprint.blueprintId, budgets);
  }

  // === Utility ===

  getConfig(): AppConfig {
    return this.config;
  }
}

