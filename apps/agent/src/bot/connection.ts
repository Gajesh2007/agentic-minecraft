import mineflayer from 'mineflayer';
import pkg from 'mineflayer-pathfinder';
const { pathfinder, Movements, goals } = pkg;
import * as autoEat from 'mineflayer-auto-eat';
import { Vec3 } from 'vec3';
import { AppConfig } from '../config.js';
import { EventBus } from '@agentic-survival/shared';
import { SurvivalEvents } from '../events.js';

type MineflayerBot = ReturnType<typeof mineflayer.createBot>;

export type BotSnapshot = {
  connected: boolean;
  ready: boolean;
  username?: string;
  version?: string;
  position?: { x: number; y: number; z: number };
  health?: number;
  food?: number;
  foodSaturation?: number;
  experience?: { level: number; points: number; progress: number };
  gamemode?: string;
  dimension?: string;
  isDay?: boolean;
  timeOfDay?: number;
  isRaining?: boolean;
};

export class BotConnection {
  private bot: MineflayerBot | null = null;

  constructor(
    private readonly config: AppConfig,
    private readonly events: EventBus<SurvivalEvents>,
  ) {}

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
    });

    this.bot.loadPlugin(pathfinder);
    this.bot.loadPlugin((autoEat as any).loader ?? (autoEat as any).plugin ?? autoEat);

    this.bot.on('spawn', () => {
      const p = this.bot?.entity?.position;
      if (p) {
        this.events.publish('bot.spawn', { position: { x: p.x, y: p.y, z: p.z } });
      } else {
        this.events.publish('bot.spawn', { position: { x: 0, y: 0, z: 0 } });
      }

      // Force gamemode if configured (requires op)
      if (this.config.FORCE_GAMEMODE && this.bot) {
        this.bot.chat(`/gamemode ${this.config.FORCE_GAMEMODE}`);
      }

      if (this.bot) {
        const movements = new Movements(this.bot);
        movements.allowSprinting = true;
        movements.canDig = true;
        movements.allow1by1towers = true;
        (this.bot as any).pathfinder.setMovements(movements);

        // Configure auto-eat
        try {
          const ae = (this.bot as any).autoEat;
          if (ae) {
            ae.options = {
              priority: 'foodPoints',
              startAt: 14,
              bannedFood: [],
            };
            ae.enable();
          }
        } catch { /* auto-eat may not be available */ }
      }
    });

    this.bot.on('end', reason => {
      this.events.publish('bot.end', { reason });
      this.bot = null;
    });

    this.bot.on('kicked', (reason, loggedIn) => {
      this.events.publish('bot.kicked', { reason, loggedIn });
    });

    this.bot.on('error', err => {
      this.events.publish('bot.error', { message: err.message, stack: err.stack });
    });

    this.bot.on('death', () => {
      const p = this.bot?.entity?.position;
      this.events.publish('bot.death', {
        position: p ? { x: p.x, y: p.y, z: p.z } : { x: 0, y: 0, z: 0 },
      });
    });
  }

  async disconnect(reason = 'disconnect'): Promise<void> {
    const bot = this.bot;
    if (!bot) return;
    this.bot = null;
    bot.end(reason);
  }

  isConnected(): boolean {
    return this.bot !== null;
  }

  getBot(): MineflayerBot {
    if (!this.bot) throw new Error('Bot is not connected');
    return this.bot;
  }

  getBotOrNull(): MineflayerBot | null {
    return this.bot;
  }

  getSnapshot(): BotSnapshot {
    const bot = this.bot;
    if (!bot) return { connected: false, ready: false };

    const pos = bot.entity?.position;
    return {
      connected: true,
      ready: Boolean(bot.entity),
      username: bot.username,
      version: bot.version,
      position: pos ? { x: pos.x, y: pos.y, z: pos.z } : undefined,
      health: bot.health,
      food: bot.food,
      foodSaturation: bot.foodSaturation,
      experience: bot.experience
        ? { level: bot.experience.level, points: bot.experience.points, progress: bot.experience.progress }
        : undefined,
      gamemode: (bot.game?.gameMode as string | undefined) ?? undefined,
      dimension: (bot.game?.dimension as string | undefined) ?? undefined,
      isDay: bot.time?.isDay,
      timeOfDay: bot.time?.timeOfDay,
      isRaining: bot.isRaining,
    };
  }

  async walkTo(
    position: { x: number; y: number; z: number },
    range = 2,
  ): Promise<{ arrived: boolean; position: { x: number; y: number; z: number } }> {
    const bot = this.getBot();
    const pf = (bot as any).pathfinder;
    const goal = new goals.GoalNear(position.x, position.y, position.z, range);

    return new Promise(resolve => {
      const timeout = setTimeout(() => {
        pf.stop();
        const p = bot.entity.position;
        resolve({ arrived: false, position: { x: p.x, y: p.y, z: p.z } });
      }, 30000);

      pf.goto(goal)
        .then(() => {
          clearTimeout(timeout);
          const p = bot.entity.position;
          resolve({ arrived: true, position: { x: p.x, y: p.y, z: p.z } });
        })
        .catch(() => {
          clearTimeout(timeout);
          const p = bot.entity.position;
          resolve({ arrived: false, position: { x: p.x, y: p.y, z: p.z } });
        });
    });
  }
}

export { goals, Movements };
