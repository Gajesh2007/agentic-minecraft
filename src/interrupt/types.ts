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

export const URGENT_INTERRUPTS: Set<InterruptType> = new Set([
  'damage_taken',
  'health_low',
  'hostile_nearby',
  'death',
]);
