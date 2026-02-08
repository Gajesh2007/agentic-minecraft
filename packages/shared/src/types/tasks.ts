import type { Vec3i, BBox } from './geometry.js';

export type MineTask = { task: 'mine'; target: string; quantity: number; area?: BBox };
export type CraftTask = { task: 'craft'; recipe: string; count: number };
export type SmeltTask = { task: 'smelt'; input: string; fuel: string; count: number };
export type EatTask = { task: 'eat'; item?: string };
export type TravelTask = { task: 'travel'; destination: Vec3i; sprint?: boolean; range?: number };
export type BuildTask = { task: 'build'; blocks: Array<{ pos: Vec3i; block: string }>; relative?: boolean };
export type AttackTask = { task: 'attack'; target: string; retreatOnLowHealth?: number };
export type SleepTask = { task: 'sleep' };
export type EquipTask = { task: 'equip'; item: string; slot: 'hand' | 'off-hand' | 'head' | 'torso' | 'legs' | 'feet' };
export type StashTask = { task: 'stash'; items: string[]; chest: Vec3i };
export type RetrieveTask = { task: 'retrieve'; items: string[]; chest: Vec3i };
export type WaitTask = { task: 'wait'; seconds: number };
export type FleeTask = { task: 'flee'; from: Vec3i; distance: number };
export type PlaceBlockTask = { task: 'placeBlock'; position: Vec3i; block: string };
export type SequenceTask = { task: 'sequence'; steps: Task[] };
export type RepeatTask = { task: 'repeat'; inner: Task; count: number };

export type Task =
  | MineTask
  | CraftTask
  | SmeltTask
  | EatTask
  | TravelTask
  | BuildTask
  | AttackTask
  | SleepTask
  | EquipTask
  | StashTask
  | RetrieveTask
  | WaitTask
  | FleeTask
  | PlaceBlockTask
  | SequenceTask
  | RepeatTask;

export type TaskStatus = 'completed' | 'failed' | 'interrupted';

export type TaskResult = {
  status: TaskStatus;
  task: Task;
  error?: string;
  blocksMined?: number;
  itemsCrafted?: number;
  blocksPlaced?: number;
  duration: number;
};
