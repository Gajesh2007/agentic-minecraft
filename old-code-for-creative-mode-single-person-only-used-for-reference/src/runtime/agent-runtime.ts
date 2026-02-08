import mineflayer from 'mineflayer';
import pkg from 'mineflayer-pathfinder';
const { pathfinder, Movements, goals } = pkg;
import { mineflayer as startViewer } from 'prismarine-viewer';
import { Vec3 } from 'vec3';
import { AppConfig } from '../config.js';
import { EventBus } from '../events/event-bus.js';
import { AppEvents, BotStateSnapshot } from '../events/event-types.js';
import { BBox } from '../types/geometry.js';
import { BlockCatalog } from '../registry/block-catalog.js';

type MineflayerBot = ReturnType<typeof mineflayer.createBot>;

export class AgentRuntime {
  private bot: MineflayerBot | null = null;
  private viewerStarted = false;
  private paused = false;
  private blockCatalog: BlockCatalog | null = null;

  constructor(
    private readonly config: AppConfig,
    private readonly events: EventBus<AppEvents>,
  ) {}

  isPaused(): boolean {
    return this.paused;
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
  }

  async connect(): Promise<void> {
    if (this.bot) return;

    const { MC_HOST, MC_PORT, MC_VERSION, MC_USERNAME, MC_AUTH, MC_PASSWORD } = this.config;

    this.events.publish('bot.connect', {
      host: MC_HOST,
      port: MC_PORT,
      username: MC_USERNAME,
    });

    this.bot = mineflayer.createBot({
      host: MC_HOST,
      port: MC_PORT,
      version: MC_VERSION,
      username: MC_USERNAME,
      auth: MC_AUTH,
      ...(MC_PASSWORD ? { password: MC_PASSWORD } : {}),
    });

    this.bot.on('login', () => {
      const version = this.bot?.version ?? 'unknown';
      const username = this.bot?._client?.username ?? MC_USERNAME;
      this.events.publish('bot.login', { username, version });
      this.emitStatusSnapshot();
    });

    this.bot.loadPlugin(pathfinder);

    this.bot.on('spawn', () => {
      const p = this.bot?.entity?.position;
      if (p) {
        this.events.publish('bot.spawn', { position: { x: p.x, y: p.y, z: p.z } });
      } else {
        this.events.publish('bot.spawn', { position: { x: 0, y: 0, z: 0 } });
      }

      // Configure pathfinder movements
      if (this.bot) {
        const movements = new Movements(this.bot);
        movements.allowSprinting = true;
        movements.canDig = true;
        movements.allow1by1towers = true;
        (this.bot as any).pathfinder.setMovements(movements);
      }

      this.emitStatusSnapshot();
      this.startViewerIfNeeded();
    });

    this.bot.on('end', reason => {
      this.events.publish('bot.end', { reason });
      this.bot = null;
      this.blockCatalog = null;
      this.emitStatusSnapshot();
    });

    this.bot.on('kicked', (reason, loggedIn) => {
      this.events.publish('bot.kicked', { reason, loggedIn });
      this.emitStatusSnapshot();
    });

    this.bot.on('error', err => {
      this.events.publish('bot.error', { message: err.message, stack: err.stack });
      this.emitStatusSnapshot();
    });
  }

  async disconnect(reason = 'disconnect'): Promise<void> {
    const bot = this.bot;
    if (!bot) return;
    this.bot = null;
    // Note: don't reset viewerStarted — the HTTP server stays alive across reconnects
    bot.end(reason);
  }

  isConnected(): boolean {
    return this.bot !== null;
  }

  async reconnect(): Promise<void> {
    if (this.bot) {
      await this.disconnect('reconnecting');
    }
    await this.connect();
  }

  getBot(): MineflayerBot | null {
    return this.bot;
  }

  getSnapshot(): BotStateSnapshot {
    const bot = this.bot;
    if (!bot) {
      return { connected: false, ready: false };
    }

    const position = bot.entity?.position
      ? { x: bot.entity.position.x, y: bot.entity.position.y, z: bot.entity.position.z }
      : undefined;

    const gamemode = (bot.game?.gameMode as string | undefined) ?? undefined;
    const dimension = (bot.game?.dimension as string | undefined) ?? undefined;

    const game = bot.game as unknown as { minY?: number; height?: number } | undefined;
    return {
      connected: true,
      ready: Boolean(bot.entity),
      username: bot.username,
      version: bot.version,
      position,
      dimension,
      gamemode,
      minY: game?.minY,
      height: game?.height,
    };
  }

  getWorldInfo(): { minY: number; height: number } | null {
    const bot = this.bot;
    if (!bot) return null;
    const game = bot.game as unknown as { minY?: number; height?: number } | undefined;
    const minY = game?.minY ?? -64;
    const height = game?.height ?? 384;
    return { minY, height };
  }

  async teleport(position: { x: number; y: number; z: number }, yaw?: number, pitch?: number): Promise<void> {
    const bot = this.bot;
    if (!bot) throw new Error('Bot is not connected');
    if (this.paused) throw new Error('Agent is paused');

    const x = Math.round(position.x * 100) / 100;
    const y = Math.round(position.y * 100) / 100;
    const z = Math.round(position.z * 100) / 100;

    const cmd =
      yaw == null || pitch == null
        ? `/tp @s ${x} ${y} ${z}`
        : `/tp @s ${x} ${y} ${z} ${Math.round(yaw * 100) / 100} ${Math.round(pitch * 100) / 100}`;

    bot.chat(cmd);

    // Wait for server to confirm the position change
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        bot.removeListener('forcedMove', onMove);
        resolve();
      }, 2000);
      const onMove = () => {
        clearTimeout(timeout);
        bot.removeListener('forcedMove', onMove);
        resolve();
      };
      bot.on('forcedMove', onMove);
    });
  }

  async walkTo(position: { x: number; y: number; z: number }, range = 2): Promise<{ arrived: boolean; position: { x: number; y: number; z: number } }> {
    const bot = this.bot;
    if (!bot) throw new Error('Bot is not connected');
    if (this.paused) throw new Error('Agent is paused');

    const pf = (bot as any).pathfinder;
    const goal = new goals.GoalNear(position.x, position.y, position.z, range);

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        pf.stop();
        const p = bot.entity.position;
        resolve({ arrived: false, position: { x: p.x, y: p.y, z: p.z } });
      }, 30000); // 30s max walk time

      pf.goto(goal).then(() => {
        clearTimeout(timeout);
        const p = bot.entity.position;
        resolve({ arrived: true, position: { x: p.x, y: p.y, z: p.z } });
      }).catch(() => {
        clearTimeout(timeout);
        const p = bot.entity.position;
        resolve({ arrived: false, position: { x: p.x, y: p.y, z: p.z } });
      });
    });
  }

  async lookAt(position: { x: number; y: number; z: number }): Promise<void> {
    const bot = this.bot;
    if (!bot) throw new Error('Bot is not connected');
    await bot.lookAt(new Vec3(position.x, position.y, position.z));
  }

  async waitForChunksToLoad(): Promise<void> {
    const bot = this.bot;
    if (!bot) throw new Error('Bot is not connected');
    await bot.waitForChunksToLoad();
  }

  async execCommand(command: string, waitTicks = 0): Promise<void> {
    const bot = this.bot;
    if (!bot) throw new Error('Bot is not connected');
    if (this.paused) throw new Error('Agent is paused');
    bot.chat(command);
    if (waitTicks > 0) {
      await bot.waitForTicks(waitTicks);
    }
  }

  async execCommandBatch(
    commands: string[],
    options?: { batchSize?: number; ticksBetween?: number },
  ): Promise<{ executed: number; elapsed: number }> {
    const bot = this.bot;
    if (!bot) throw new Error('Bot is not connected');
    if (this.paused) throw new Error('Agent is paused');

    const batchSize = options?.batchSize ?? 20;
    const ticksBetween = options?.ticksBetween ?? 1;
    const start = Date.now();
    let executed = 0;

    for (let i = 0; i < commands.length; i += batchSize) {
      if (this.paused) throw new Error('Agent is paused');
      const batch = commands.slice(i, i + batchSize);
      for (const cmd of batch) {
        bot.chat(cmd);
        executed++;
      }
      if (i + batchSize < commands.length && ticksBetween > 0) {
        await bot.waitForTicks(ticksBetween);
      }
    }

    return { executed, elapsed: Date.now() - start };
  }

  async ensureLoaded(
    bbox: BBox,
    strategy: 'forceload' | 'teleport-sweep' = 'teleport-sweep',
    timeoutMs = 20000,
  ): Promise<{ loadedChunks: number }> {
    const bot = this.bot;
    if (!bot) throw new Error('Bot is not connected');
    if (!bot.entity) throw new Error('Bot is not ready');
    const minChunkX = Math.floor(bbox.min.x / 16);
    const maxChunkX = Math.floor(bbox.max.x / 16);
    const minChunkZ = Math.floor(bbox.min.z / 16);
    const maxChunkZ = Math.floor(bbox.max.z / 16);
    const needed = new Set<string>();
    for (let cx = minChunkX; cx <= maxChunkX; cx += 1) {
      for (let cz = minChunkZ; cz <= maxChunkZ; cz += 1) {
        const corner = new Vec3(cx * 16, 0, cz * 16);
        const worldAny = bot.world as unknown as { getLoadedColumnAt?: (pos: Vec3) => unknown };
        const loaded = worldAny.getLoadedColumnAt ? Boolean(worldAny.getLoadedColumnAt(corner)) : false;
        if (!loaded) needed.add(`${cx},${cz}`);
      }
    }

    if (needed.size === 0) return { loadedChunks: 0 };

    if (strategy === 'forceload') {
      const minX = minChunkX * 16;
      const minZ = minChunkZ * 16;
      const maxX = maxChunkX * 16 + 15;
      const maxZ = maxChunkZ * 16 + 15;
      await this.execCommand(`/forceload add ${minX} ${minZ} ${maxX} ${maxZ}`);
      await bot.waitForChunksToLoad();
      return { loadedChunks: needed.size };
    }

    const start = Date.now();
    const pending = new Set(needed);
    const onLoad = (corner: Vec3) => {
      const cx = Math.floor(corner.x / 16);
      const cz = Math.floor(corner.z / 16);
      pending.delete(`${cx},${cz}`);
    };
    bot.world.on('chunkColumnLoad', onLoad);
    try {
      for (const key of needed) {
        if (pending.size === 0) break;
        const parts = key.split(',');
        const cx = Number(parts[0]);
        const cz = Number(parts[1]);
        if (!Number.isFinite(cx) || !Number.isFinite(cz)) continue;
        const target = new Vec3(cx * 16 + 8, bot.entity.position.y, cz * 16 + 8);
        await this.teleport({ x: target.x, y: target.y, z: target.z });
        await bot.waitForTicks(4);
        await bot.waitForChunksToLoad();
        if (Date.now() - start > timeoutMs) break;
      }
      const remaining = [...pending];
      if (remaining.length > 0) {
        throw new Error('CHUNKS_NOT_LOADED');
      }
      return { loadedChunks: needed.size };
    } finally {
      bot.world.off('chunkColumnLoad', onLoad);
    }
  }

  blockAt(pos: { x: number; y: number; z: number }, extraInfos = false) {
    const bot = this.bot;
    if (!bot) throw new Error('Bot is not connected');
    return bot.blockAt(new Vec3(pos.x, pos.y, pos.z), extraInfos);
  }

  getBlockCatalog(): BlockCatalog | null {
    if (!this.bot) return null;
    if (!this.blockCatalog) {
      this.blockCatalog = new BlockCatalog(this.bot);
    }
    return this.blockCatalog;
  }

  private startViewerIfNeeded(): void {
    if (this.viewerStarted) return;
    if (!this.bot) return;

    this.viewerStarted = true;

    startViewer(this.bot, {
      port: this.config.VIEWER_PORT,
      firstPerson: this.config.VIEWER_FIRST_PERSON,
      viewDistance: this.config.VIEWER_VIEW_DISTANCE_CHUNKS,
    });

    this.events.publish('viewer.start', {
      port: this.config.VIEWER_PORT,
      firstPerson: this.config.VIEWER_FIRST_PERSON,
    });
  }

  private emitStatusSnapshot(): void {
    this.events.publish('status.snapshot', { snapshot: this.getSnapshot() });
  }
}

