import mineflayer from 'mineflayer';
import { mineflayer as startViewer } from 'prismarine-viewer';
import type { SpectatorConfig } from '../config.js';

export type CameraMode = 'follow' | 'firstPerson' | 'overhead' | 'free';

export type CameraStatus = {
  connected: boolean;
  gameMode: string | null;
  mode: CameraMode;
  target: string | null;
  position: { x: number; y: number; z: number } | null;
  targetPosition: { x: number; y: number; z: number } | null;
  followDistance: number;
  followHeight: number;
};

type MfBot = ReturnType<typeof mineflayer.createBot>;

export class SpectatorBot {
  private bot: MfBot | null = null;
  private mode: CameraMode = 'free';
  private target: string | null = null;
  private followTimer: ReturnType<typeof setInterval> | null = null;
  private followDistance: number;
  private followHeight: number;
  private updateInterval: number;
  private lastTpPos = { x: NaN, y: NaN, z: NaN };
  private viewerStarted = false;

  /** Called when the bot disconnects (for reconnection logic in main.ts). */
  onDisconnect: ((reason?: string) => void) | null = null;
  private lastKickReason: string | null = null;

  constructor(private readonly config: SpectatorConfig) {
    this.followDistance = config.FOLLOW_DISTANCE;
    this.followHeight = config.FOLLOW_HEIGHT;
    this.updateInterval = config.UPDATE_INTERVAL_MS;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.bot = mineflayer.createBot({
        host: this.config.MC_HOST,
        port: this.config.MC_PORT,
        version: this.config.MC_VERSION,
        username: this.config.SPECTATOR_USERNAME,
        auth: this.config.MC_AUTH as any,
        ...(this.config.MC_PASSWORD ? { password: this.config.MC_PASSWORD } : {}),
      });

      const onSpawn = () => {
        cleanup();
        this.bot!.chat('/gamemode spectator');
        this.startViewer();
        resolve();
      };

      const onError = (err: Error) => {
        cleanup();
        reject(err);
      };

      const cleanup = () => {
        this.bot?.removeListener('spawn', onSpawn);
        this.bot?.removeListener('error', onError);
      };

      this.bot.once('spawn', onSpawn);
      this.bot.once('error', onError);

      this.bot.on('end', () => {
        this.stopFollowLoop();
        const kickReason = this.lastKickReason;
        this.lastKickReason = null;
        this.bot = null;
        this.onDisconnect?.(kickReason ?? undefined);
      });

      this.bot.on('kicked', (reason: string) => {
        console.error(`[spectator] Kicked: ${reason}`);
        this.lastKickReason = reason;
      });

      this.bot.on('error', (err: Error) => {
        console.error(`[spectator] Bot error: ${err.message}`);
      });
    });
  }

  async disconnect(reason = 'disconnect'): Promise<void> {
    this.stopFollowLoop();
    const bot = this.bot;
    if (!bot) return;
    this.bot = null;
    bot.end(reason);
  }

  /** Start following a player in third-person chase-cam mode. */
  follow(playerName: string): void {
    this.target = playerName;
    this.mode = 'follow';
    this.lastTpPos = { x: NaN, y: NaN, z: NaN };
    this.ensureNearTarget();
    this.startFollowLoop();
    console.log(`[spectator] Following ${playerName} (distance=${this.followDistance}, height=${this.followHeight})`);
  }

  setMode(mode: CameraMode): void {
    this.mode = mode;
    this.stopFollowLoop();
    this.lastTpPos = { x: NaN, y: NaN, z: NaN };
    if (mode !== 'free') {
      this.ensureNearTarget();
      this.startFollowLoop();
    }
    console.log(`[spectator] Mode: ${mode}`);
  }

  setTarget(playerName: string | null): void {
    this.target = playerName;
    this.lastTpPos = { x: NaN, y: NaN, z: NaN };
    if (playerName && this.mode !== 'free') {
      this.ensureNearTarget();
    }
    console.log(`[spectator] Target: ${playerName ?? 'none'}`);
  }

  teleportTo(x: number, y: number, z: number, yaw?: number, pitch?: number): void {
    this.mode = 'free';
    this.stopFollowLoop();
    this.tp(x, y, z, yaw ?? 0, pitch ?? 0);
    console.log(`[spectator] Teleported to ${x.toFixed(1)}, ${y.toFixed(1)}, ${z.toFixed(1)}`);
  }

  setFollowDistance(distance: number): void {
    this.followDistance = Math.max(1, Math.min(64, distance));
  }

  setFollowHeight(height: number): void {
    this.followHeight = Math.max(0, Math.min(32, height));
  }

  isConnected(): boolean {
    return this.bot !== null;
  }

  getPlayers(): string[] {
    if (!this.bot) return [];
    return Object.keys(this.bot.players);
  }

  getStatus(): CameraStatus {
    const bot = this.bot;
    const pos = bot?.entity?.position;
    const targetEntity = this.getTargetEntity();
    const tpos = targetEntity?.position;
    return {
      connected: bot !== null,
      gameMode: (bot?.game?.gameMode as string) ?? null,
      mode: this.mode,
      target: this.target,
      position: pos
        ? { x: Math.floor(pos.x), y: Math.floor(pos.y), z: Math.floor(pos.z) }
        : null,
      targetPosition: tpos
        ? { x: Math.floor(tpos.x), y: Math.floor(tpos.y), z: Math.floor(tpos.z) }
        : null,
      followDistance: this.followDistance,
      followHeight: this.followHeight,
    };
  }

  /** Start the prismarine-viewer web renderer. */
  private startViewer(): void {
    if (this.viewerStarted || !this.bot) return;
    this.viewerStarted = true;
    try {
      startViewer(this.bot, {
        port: this.config.VIEWER_PORT,
        firstPerson: this.config.VIEWER_FIRST_PERSON,
        viewDistance: this.config.VIEWER_VIEW_DISTANCE,
      });
      console.log(`[spectator] 3D viewer: http://localhost:${this.config.VIEWER_PORT}`);
    } catch (err: any) {
      console.error(`[spectator] Viewer failed to start: ${err.message}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private startFollowLoop(): void {
    this.stopFollowLoop();
    this.followTimer = setInterval(() => this.updateCamera(), this.updateInterval);
  }

  private stopFollowLoop(): void {
    if (this.followTimer) {
      clearInterval(this.followTimer);
      this.followTimer = null;
    }
  }

  private getTargetEntity() {
    if (!this.bot || !this.target) return null;
    return this.bot.players[this.target]?.entity ?? null;
  }

  /** If the target is online but out of entity-tracking range, tp to them. */
  private ensureNearTarget(): void {
    if (!this.bot || !this.target) return;
    const player = this.bot.players[this.target];
    if (player && !player.entity) {
      this.bot.chat(`/tp @s ${this.target}`);
    }
  }

  private updateCamera(): void {
    const entity = this.getTargetEntity();
    if (!entity) {
      this.ensureNearTarget();
      return;
    }

    const tp = entity.position;

    switch (this.mode) {
      case 'follow': {
        // Camera behind and above the target based on their facing direction.
        // mineflayer yaw: 0 = south (+Z), increases CCW.
        // Look direction: (sin(yaw), cos(yaw)).  Behind = negate.
        const yaw = entity.yaw;
        const camX = tp.x - Math.sin(yaw) * this.followDistance;
        const camZ = tp.z - Math.cos(yaw) * this.followDistance;
        const camY = tp.y + this.followHeight;

        if (this.movedEnough(camX, camY, camZ, 0.25)) {
          const look = lookAtAngles(camX, camY, camZ, tp.x, tp.y + 1.6, tp.z);
          this.tp(camX, camY, camZ, look.yaw, look.pitch);
        }
        break;
      }

      case 'firstPerson': {
        // Match agent's exact position and look direction.
        const yawDeg = -entity.yaw * (180 / Math.PI);
        const pitchDeg = entity.pitch * (180 / Math.PI);
        this.tp(tp.x, tp.y, tp.z, yawDeg, pitchDeg);
        break;
      }

      case 'overhead': {
        // Bird's eye view 20 blocks above, looking straight down.
        const camY = tp.y + 20;
        if (this.movedEnough(tp.x, camY, tp.z, 1)) {
          const look = lookAtAngles(tp.x, camY, tp.z, tp.x, tp.y, tp.z);
          this.tp(tp.x, camY, tp.z, look.yaw, look.pitch);
        }
        break;
      }

      // 'free' — do nothing
    }
  }

  /** Returns true if the new position is far enough from the last tp to warrant a command. */
  private movedEnough(x: number, y: number, z: number, threshold: number): boolean {
    const dx = x - this.lastTpPos.x;
    const dy = y - this.lastTpPos.y;
    const dz = z - this.lastTpPos.z;
    return isNaN(this.lastTpPos.x) || dx * dx + dy * dy + dz * dz >= threshold;
  }

  private tp(x: number, y: number, z: number, yaw: number, pitch: number): void {
    if (!this.bot) return;
    this.bot.chat(`/tp @s ${x.toFixed(2)} ${y.toFixed(2)} ${z.toFixed(2)} ${yaw.toFixed(2)} ${pitch.toFixed(2)}`);
    this.lastTpPos = { x, y, z };
  }
}

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

/** Compute Minecraft yaw & pitch (degrees) to look from one point at another. */
function lookAtAngles(
  fromX: number, fromY: number, fromZ: number,
  toX: number, toY: number, toZ: number,
) {
  const dx = toX - fromX;
  const dz = toZ - fromZ;
  const dy = toY - fromY;
  const horizontalDist = Math.sqrt(dx * dx + dz * dz);
  return {
    // MC yaw: 0 = south, 90 = west, -90 = east
    yaw: Math.atan2(-dx, dz) * (180 / Math.PI),
    // MC pitch: positive = down, negative = up
    pitch: Math.atan2(-dy, horizontalDist) * (180 / Math.PI),
  };
}
