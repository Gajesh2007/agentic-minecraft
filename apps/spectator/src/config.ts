import { z } from 'zod';

const envSchema = z.object({
  // Shared MC server connection (same .env as agent)
  MC_HOST: z.string().min(1).default('127.0.0.1'),
  MC_PORT: z.coerce.number().int().min(1).max(65535).default(25565),
  MC_VERSION: z.string().min(1).default('1.21.4'),
  MC_AUTH: z.enum(['offline', 'microsoft']).default('offline'),
  MC_PASSWORD: z.string().optional(),

  // Spectator-specific (won't collide with agent's MC_USERNAME / PORT)
  SPECTATOR_USERNAME: z.string().min(1).default('Spectator'),
  SPECTATOR_PORT: z.coerce.number().int().min(1).max(65535).default(8082),
  SPECTATOR_HOST: z.string().default('0.0.0.0'),

  // Camera defaults
  FOLLOW_TARGET: z.string().optional(),
  FOLLOW_DISTANCE: z.coerce.number().min(1).max(64).default(8),
  FOLLOW_HEIGHT: z.coerce.number().min(0).max(32).default(4),
  UPDATE_INTERVAL_MS: z.coerce.number().int().min(50).max(2000).default(500),

  // 3D Viewer
  VIEWER_PORT: z.coerce.number().int().min(1).max(65535).default(3007),
  VIEWER_FIRST_PERSON: z.string().default('false').transform(v => v === 'true'),
  VIEWER_VIEW_DISTANCE: z.coerce.number().int().min(2).max(32).default(6),

  // Agent connection (to aggregate thoughts + events)
  AGENT_THOUGHT_WS: z.string().default('ws://localhost:8081'),
  AGENT_SSE_URL: z.string().default('http://localhost:8080/v1/events/stream'),
});

export type SpectatorConfig = Readonly<z.infer<typeof envSchema>>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): SpectatorConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map(i => `${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment:\n${message}`);
  }
  return Object.freeze(parsed.data);
}
