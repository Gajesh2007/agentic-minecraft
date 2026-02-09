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
  MC_USERNAME: z.string().min(1).default('survivor'),
  MC_AUTH: z.enum(['offline', 'microsoft']).default('offline'),
  MC_PASSWORD: z.string().optional(),

  AGENT_NAME: z.string().min(1).default('Survivor'),
  BRAIN_AUTOSTART: booleanFromString.default(true),
  BRAIN_MODEL: z.string().min(1).default('claude-opus-4-6'),
  BRAIN_PROVIDER: z.enum(['anthropic', 'gateway']).default('anthropic'),
  ANTHROPIC_API_KEY: z.string().optional(),
  AI_GATEWAY_API_KEY: z.string().optional(),
  // Comma-separated list of providers to route through (e.g. "azure,openai")
  GATEWAY_ONLY_PROVIDERS: z.string().optional(),

  BUDGET_INITIAL: z.coerce.number().min(0).default(500),
  THOUGHT_STREAM_PORT: z.coerce.number().int().min(1).max(65535).default(8081),

  // Force gamemode on spawn (requires op). Set to 'survival' for Phase 1.
  FORCE_GAMEMODE: z.string().optional(),

  DATA_DIR: z.string().min(1).default('.data'),
  EVENTS_JSONL_PATH: z.string().min(1).default('.data/events.jsonl'),
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
