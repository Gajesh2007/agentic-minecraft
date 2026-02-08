import { z } from 'zod';

const booleanFromString = z
  .union([z.literal('true'), z.literal('false')])
  .transform(v => v === 'true');

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(8080),
  HOST: z.string().default('0.0.0.0'),

  MC_HOST: z.string().min(1).default('127.0.0.1'),
  MC_PORT: z.coerce.number().int().min(1).max(65535).default(25565),
  MC_VERSION: z.string().min(1).default('1.21.4'),
  MC_USERNAME: z.string().min(1).default('clawcraft'),
  MC_AUTH: z.enum(['offline', 'microsoft']).default('offline'),
  MC_PASSWORD: z.string().optional(),

  VIEWER_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  VIEWER_FIRST_PERSON: booleanFromString.default(false),
  VIEWER_VIEW_DISTANCE_CHUNKS: z.coerce.number().int().min(1).max(32).default(8),

  SUPERVISOR_AUTOSTART: booleanFromString.default(false),
  AI_GATEWAY_API_KEY: z.string().optional(),
  AI_MODEL: z.string().min(1).default('openai/gpt-5.2'),
  AI_REASONING_EFFORT: z.enum(['low', 'medium', 'high']).default('high'),
  DEFAULT_OBJECTIVE: z.string().optional(),

  // Anthropic direct provider for supervisor (prompt caching)
  ANTHROPIC_API_KEY: z.string().optional(),
  SUPERVISOR_MODEL: z.string().min(1).default('claude-sonnet-4-5-20250929'),
  SUPERVISOR_PROVIDER: z.enum(['anthropic', 'gateway']).default('anthropic'),

  EVENTS_JSONL_PATH: z.string().min(1).default('.data/events.jsonl'),
  ASSETS_DIR: z.string().min(1).default('.data/assets'),
});

export type AppConfig = Readonly<z.infer<typeof envSchema>>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map(i => `${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment:\n${message}`);
  }
  return Object.freeze(parsed.data);
}

