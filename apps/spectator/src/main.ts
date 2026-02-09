import { loadConfig } from './config.js';
import { SpectatorBot } from './camera/spectator-bot.js';
import { ThoughtAggregator } from './thought-aggregator.js';
import { buildServer } from './api/server.js';

const MAX_RECONNECT_DELAY = 60_000;
const BASE_RECONNECT_DELAY = 2_000;
let shuttingDown = false;
let reconnecting = false;

async function main() {
  const config = loadConfig();
  const camera = new SpectatorBot(config);
  const thoughts = new ThoughtAggregator(config.AGENT_THOUGHT_WS, config.AGENT_SSE_URL);

  console.log(`[spectator] Camera: ${config.SPECTATOR_USERNAME} → ${config.MC_HOST}:${config.MC_PORT}`);
  console.log(`[spectator] Thought stream: ${config.AGENT_THOUGHT_WS}`);
  console.log(`[spectator] Agent SSE: ${config.AGENT_SSE_URL}`);

  async function connectWithRetry(): Promise<void> {
    let attempts = 0;
    while (!shuttingDown) {
      try {
        await camera.connect();
        attempts = 0;
        console.log(`[spectator] Connected to ${config.MC_HOST}:${config.MC_PORT}`);
        return;
      } catch (err) {
        attempts++;
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[spectator] Connect failed (attempt ${attempts}): ${msg}`);
        const delay = Math.min(BASE_RECONNECT_DELAY * 2 ** (attempts - 1), MAX_RECONNECT_DELAY);
        console.log(`[spectator] Retry in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  camera.onDisconnect = (reason) => {
    if (shuttingDown || reconnecting) return;
    reconnecting = true;
    // Use longer delay if kicked for throttling
    const throttled = reason && reason.toLowerCase().includes('throttl');
    const delay = throttled ? 15_000 : BASE_RECONNECT_DELAY;
    console.log(`[spectator] Disconnected${throttled ? ' (throttled)' : ''}, reconnecting in ${delay / 1000}s...`);
    setTimeout(async () => {
      try {
        await connectWithRetry();
        if (config.FOLLOW_TARGET && !shuttingDown) camera.follow(config.FOLLOW_TARGET);
      } catch {}
      reconnecting = false;
    }, delay);
  };

  // Log thoughts to console as they arrive
  thoughts.onThought(thought => {
    console.log(`[thought] #${thought.thoughtNumber} ${thought.agentName}: ${thought.trigger} → ${typeof thought.task === 'object' ? thought.task?.task : thought.task} ($${thought.budgetRemaining.toFixed(2)})`);
  });

  // Log key events
  thoughts.onEvent(event => {
    if (['brain.thought', 'task.start', 'task.complete', 'task.error', 'bot.death', 'interrupt.fired'].includes(event.type)) {
      console.log(`[event] ${event.type}: ${JSON.stringify(event.data).slice(0, 150)}`);
    }
  });

  // Start thought aggregation (connects to agent's WebSocket + SSE)
  thoughts.start();

  // Connect camera to MC server
  await connectWithRetry();
  console.log(`[spectator] Bot spawned. Gamemode: ${camera.getStatus().gameMode ?? 'pending'}`);

  // Auto-follow if configured
  if (config.FOLLOW_TARGET) {
    setTimeout(() => {
      console.log(`[spectator] Auto-following: ${config.FOLLOW_TARGET}`);
      camera.follow(config.FOLLOW_TARGET!);
    }, 2000);
  }

  const server = await buildServer(camera, thoughts);
  await server.listen({ port: config.SPECTATOR_PORT, host: config.SPECTATOR_HOST });
  console.log(`[spectator] API: http://${config.SPECTATOR_HOST}:${config.SPECTATOR_PORT}`);
  console.log(`[spectator] Endpoints:`);
  console.log(`  GET  /v1/status          — camera + agent status`);
  console.log(`  GET  /v1/players         — online players`);
  console.log(`  GET  /v1/thoughts        — recent agent thoughts`);
  console.log(`  GET  /v1/events          — recent agent events`);
  console.log(`  GET  /v1/stream          — live SSE (thoughts + events + camera)`);
  console.log(`  POST /v1/camera/follow   — { target: "survivor" }`);
  console.log(`  POST /v1/camera/mode     — { mode: "follow|firstPerson|overhead|free" }`);
  console.log(`  POST /v1/camera/target   — { target: "survivor" | null }`);
  console.log(`  POST /v1/camera/teleport — { x, y, z, yaw?, pitch? }`);
  console.log(`  POST /v1/camera/settings — { distance?, height? }`);

  async function shutdown(signal: string) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`\n[spectator] Shutdown (${signal})...`);
    thoughts.stop();
    try { await camera.disconnect(`shutdown: ${signal}`); } catch {}
    try { await server.close(); } catch {}
    process.exit(0);
  }

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('uncaughtException', err => { console.error('[spectator] uncaughtException:', err); });
  process.on('unhandledRejection', reason => { console.error('[spectator] unhandledRejection:', reason); });
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
