import { BotConnection } from '../bot/connection.js';
import { EventBus } from '../events/event-bus.js';
import { SurvivalEvents } from '../events/event-types.js';
import type { Interrupt, InterruptType } from './types.js';

type InterruptHandler = (interrupt: Interrupt) => void;

export class InterruptManager {
  private handlers: InterruptHandler[] = [];
  private periodicTimer: ReturnType<typeof setInterval> | null = null;
  private hostileCheckTimer: ReturnType<typeof setInterval> | null = null;
  private started = false;
  private lastHostileAlert = 0;
  private lastNightAlert = 0;

  constructor(
    private readonly bot: BotConnection,
    private readonly events: EventBus<SurvivalEvents>,
  ) {}

  start(): void {
    if (this.started) return;
    this.started = true;

    const mfBot = this.bot.getBot();

    // Health monitoring (debounced — only fire once per 15s)
    let lastHealthLowAlert = 0;
    let lastHungerAlert = 0;
    mfBot.on('health', () => {
      const now = Date.now();
      if (mfBot.health <= 6 && now - lastHealthLowAlert > 15000) {
        lastHealthLowAlert = now;
        this.fire('health_low', { health: mfBot.health, food: mfBot.food });
      }
      if (mfBot.food <= 6 && now - lastHungerAlert > 30000) {
        lastHungerAlert = now;
        this.fire('hunger_critical', { food: mfBot.food });
      }
    });

    // Damage detection (debounced — only fire once per 10s)
    let lastHealth = mfBot.health;
    let lastDamageAlert = 0;
    mfBot.on('health', () => {
      const now = Date.now();
      if (mfBot.health < lastHealth && now - lastDamageAlert > 10000) {
        lastDamageAlert = now;
        this.fire('damage_taken', {
          health: mfBot.health,
          damage: lastHealth - mfBot.health,
        });
      }
      lastHealth = mfBot.health;
    });

    // Death
    mfBot.on('death', () => {
      this.fire('death', {});
    });

    // Chat
    mfBot.on('chat', (username: string, message: string) => {
      if (username === mfBot.username) return;
      this.fire('chat_received', { username, message });
    });

    // Hostile mob proximity check (every 3 seconds, debounced)
    this.hostileCheckTimer = setInterval(() => {
      if (!this.bot.isConnected()) return;
      const now = Date.now();
      if (now - this.lastHostileAlert < 10000) return; // debounce 10s

      const hostile = mfBot.nearestEntity((e: any) =>
        e.type === 'mob' &&
        e.kind === 'Hostile mobs' &&
        e.position.distanceTo(mfBot.entity.position) < 8,
      );
      if (hostile) {
        this.lastHostileAlert = now;
        this.fire('hostile_nearby', {
          name: hostile.displayName ?? hostile.name,
          distance: Math.round(hostile.position.distanceTo(mfBot.entity.position) * 10) / 10,
          position: { x: hostile.position.x, y: hostile.position.y, z: hostile.position.z },
        });
      }
    }, 3000);

    // Night detection
    mfBot.on('time', () => {
      const now = Date.now();
      if (now - this.lastNightAlert < 60000) return; // debounce 60s
      const timeOfDay = mfBot.time.timeOfDay;
      if (timeOfDay >= 11500 && timeOfDay < 12500) {
        this.lastNightAlert = now;
        this.fire('night_falling', { timeOfDay });
      }
    });

    // Periodic checkin (5 minutes)
    this.periodicTimer = setInterval(() => {
      this.fire('periodic_checkin', {});
    }, 5 * 60 * 1000);
  }

  stop(): void {
    if (!this.started) return;
    this.started = false;
    if (this.periodicTimer) clearInterval(this.periodicTimer);
    if (this.hostileCheckTimer) clearInterval(this.hostileCheckTimer);
    this.periodicTimer = null;
    this.hostileCheckTimer = null;
    this.handlers = [];
  }

  onInterrupt(handler: InterruptHandler): void {
    this.handlers.push(handler);
  }

  private fire(type: InterruptType, data: Record<string, unknown>): void {
    const interrupt: Interrupt = { type, ts: new Date().toISOString(), data };
    this.events.publish('interrupt.fired', { type, data });
    for (const handler of this.handlers) {
      handler(interrupt);
    }
  }
}
