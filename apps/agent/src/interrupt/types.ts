export type InterruptType =
  | 'damage_taken'
  | 'health_low'
  | 'hunger_critical'
  | 'hostile_nearby'
  | 'player_nearby'
  | 'task_complete'
  | 'task_failed'
  | 'death'
  | 'night_falling'
  | 'chat_received'
  | 'periodic_checkin';

export type Interrupt = {
  type: InterruptType;
  ts: string;
  data: Record<string, unknown>;
};

// Only truly critical interrupts cancel the current task
// damage_taken is NOT urgent — let the bot finish what it's doing
// health_low IS urgent — need to react when actually dying
export const URGENT_INTERRUPTS: Set<InterruptType> = new Set([
  'health_low',
  'death',
]);
