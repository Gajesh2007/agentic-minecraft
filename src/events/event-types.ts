export type IsoTimestamp = string;

export type EventEnvelope<TType extends string = string, TData = unknown> = {
  seq: number;
  ts: IsoTimestamp;
  type: TType;
  data: TData;
};

export type SurvivalEvents =
  // App lifecycle
  | EventEnvelope<'app.start', { pid: number }>
  | EventEnvelope<'app.error', { message: string; stack?: string }>
  // Bot connection
  | EventEnvelope<'bot.connect', { host: string; port: number; username: string }>
  | EventEnvelope<'bot.login', { username: string; version: string }>
  | EventEnvelope<'bot.spawn', { position: { x: number; y: number; z: number } }>
  | EventEnvelope<'bot.end', { reason: string }>
  | EventEnvelope<'bot.kicked', { reason: unknown; loggedIn: boolean }>
  | EventEnvelope<'bot.error', { message: string; stack?: string }>
  | EventEnvelope<'bot.death', { position: { x: number; y: number; z: number } }>
  // Brain
  | EventEnvelope<'brain.start', Record<string, never>>
  | EventEnvelope<'brain.stop', Record<string, never>>
  | EventEnvelope<'brain.thought', { reasoning: string; task: string; trigger: string; cost: number }>
  | EventEnvelope<'brain.error', { message: string }>
  | EventEnvelope<'brain.zombie', { budget: number }>
  // Tasks
  | EventEnvelope<'task.start', { task: string; detail: string }>
  | EventEnvelope<'task.complete', { task: string; duration: number; status: string }>
  | EventEnvelope<'task.error', { task: string; error: string }>
  // Interrupts
  | EventEnvelope<'interrupt.fired', { type: string; data: unknown }>
  // Budget
  | EventEnvelope<'budget.debit', { cost: number; remaining: number; totalSpent: number; callCount: number }>
  // General
  | EventEnvelope<'log.note', { text: string; tags?: string[] }>;
