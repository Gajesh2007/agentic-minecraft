export type IsoTimestamp = string;

export type EventEnvelope<TType extends string = string, TData = unknown> = {
  seq: number;
  ts: IsoTimestamp;
  type: TType;
  data: TData;
};

export type BotStateSnapshot = {
  connected: boolean;
  ready: boolean;
  username?: string;
  version?: string;
  position?: { x: number; y: number; z: number };
  dimension?: string;
  gamemode?: string;
  minY?: number;
  height?: number;
};

export type AppEvents =
  | EventEnvelope<'app.start', { pid: number }>
  | EventEnvelope<'app.error', { message: string; stack?: string }>
  | EventEnvelope<'bot.connect', { host: string; port: number; username: string }>
  | EventEnvelope<'bot.login', { username: string; version: string }>
  | EventEnvelope<'bot.spawn', { position: { x: number; y: number; z: number } }>
  | EventEnvelope<'bot.end', { reason: string }>
  | EventEnvelope<'bot.kicked', { reason: unknown; loggedIn: boolean }>
  | EventEnvelope<'bot.error', { message: string; stack?: string }>
  | EventEnvelope<'viewer.start', { port: number; firstPerson: boolean }>
  | EventEnvelope<'supervisor.start', { autostart: boolean }>
  | EventEnvelope<'supervisor.stop', { reason: string }>
  | EventEnvelope<'supervisor.step', { summary: string }>
  | EventEnvelope<'status.snapshot', { snapshot: BotStateSnapshot }>
  | EventEnvelope<'job.created', { jobId: string; type: string }>
  | EventEnvelope<'job.updated', { jobId: string; status: string }>
  | EventEnvelope<'job.progress', { jobId: string; message: string }>
  | EventEnvelope<'build.command', { command: string }>
  | EventEnvelope<'world.diff', { jobId: string; bbox: unknown; before: unknown; after: unknown }>
  | EventEnvelope<'blueprint.created', { blueprintId: string; parentId: string | null }>
  | EventEnvelope<'script.compiled', { scriptId: string; blueprintId: string; commands: number; estimatedBlocks: number }>
  | EventEnvelope<'verify.result', { blueprintId: string; ok: boolean; matchRatio: number }>
  | EventEnvelope<'render.done', { jobId: string; imageIds: string[] }>
  | EventEnvelope<'episode.start', { episodeId: string; objective: string | null; mode: string }>
  | EventEnvelope<'episode.finish', { episodeId: string; status: string; summary: string }>
  | EventEnvelope<'city.plan.created', { name: string; plotCount: number; roadCount: number }>
  | EventEnvelope<'structure.registered', { structureId: string; type: string; name: string }>
  | EventEnvelope<'log.note', { text: string; tags?: string[] }>;

