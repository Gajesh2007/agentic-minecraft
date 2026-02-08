import { tool } from 'ai';
import { z } from 'zod';
import { BotConnection } from '../bot/connection.js';
import { AgentMemory } from '../store/agent-memory.js';

const vec3Schema = z.object({
  x: z.number().int(),
  y: z.number().int(),
  z: z.number().int(),
});

const bboxSchema = z.object({
  min: vec3Schema,
  max: vec3Schema,
});

// Task schema as a JSON string — recursive schemas break many providers.
// The brain outputs a JSON string, we parse it in the brain loop.
// The description tells the LLM the exact format.

export function buildBrainTools(bot: BotConnection, memory: AgentMemory) {
  return {
    getStatus: tool({
      description: 'Get health, hunger, position, time of day, weather, experience, gamemode.',
      inputSchema: z.object({}),
      execute: async () => {
        const mfBot = bot.getBot();
        return {
          health: mfBot.health,
          food: mfBot.food,
          foodSaturation: mfBot.foodSaturation,
          position: {
            x: Math.floor(mfBot.entity.position.x),
            y: Math.floor(mfBot.entity.position.y),
            z: Math.floor(mfBot.entity.position.z),
          },
          isDay: mfBot.time.isDay,
          timeOfDay: mfBot.time.timeOfDay,
          isRaining: mfBot.isRaining,
          experience: {
            level: mfBot.experience.level,
            points: mfBot.experience.points,
          },
          gameMode: mfBot.game.gameMode,
        };
      },
    }),

    getInventory: tool({
      description: 'Get full inventory with item names, counts, and equipped armor.',
      inputSchema: z.object({}),
      execute: async () => {
        const mfBot = bot.getBot();
        return {
          items: mfBot.inventory.items().map((i: any) => ({ name: i.name, count: i.count })),
          armor: {
            head: mfBot.inventory.slots[5]?.name ?? null,
            torso: mfBot.inventory.slots[6]?.name ?? null,
            legs: mfBot.inventory.slots[7]?.name ?? null,
            feet: mfBot.inventory.slots[8]?.name ?? null,
          },
          heldItem: mfBot.heldItem?.name ?? null,
        };
      },
    }),

    getNearbyEntities: tool({
      description: 'Get entities nearby: mobs, players, animals, items. Includes distance and type.',
      inputSchema: z.object({ radius: z.number().int().min(1).max(64).optional() }),
      execute: async input => {
        const mfBot = bot.getBot();
        const radius = input.radius ?? 32;
        return Object.values(mfBot.entities)
          .filter((e: any) => e !== mfBot.entity && e.position.distanceTo(mfBot.entity.position) < radius)
          .map((e: any) => ({
            name: e.displayName ?? e.name ?? 'unknown',
            type: e.type,
            kind: e.kind,
            distance: Math.round(e.position.distanceTo(mfBot.entity.position) * 10) / 10,
            position: { x: Math.floor(e.position.x), y: Math.floor(e.position.y), z: Math.floor(e.position.z) },
          }))
          .sort((a: any, b: any) => a.distance - b.distance)
          .slice(0, 20);
      },
    }),

    getNearbyBlocks: tool({
      description: 'Find blocks of a specific type nearby. Use for locating resources, trees, water.',
      inputSchema: z.object({
        block: z.string().describe('Block name e.g. "oak_log", "iron_ore", "crafting_table"'),
        maxDistance: z.number().int().min(1).max(128).optional(),
        count: z.number().int().min(1).max(20).optional(),
      }),
      execute: async input => {
        const mfBot = bot.getBot();
        const blockType = mfBot.registry.blocksByName[input.block];
        if (!blockType) return { error: `Unknown block: ${input.block}`, blocks: [] };
        const positions = mfBot.findBlocks({
          matching: blockType.id,
          maxDistance: input.maxDistance ?? 64,
          count: input.count ?? 10,
        });
        return {
          blocks: positions.map((pos: any) => ({
            position: { x: pos.x, y: pos.y, z: pos.z },
            distance: Math.round(pos.distanceTo(mfBot.entity.position) * 10) / 10,
          })),
        };
      },
    }),

    getRecipes: tool({
      description: 'Check available recipes for an item and whether you have ingredients.',
      inputSchema: z.object({ item: z.string() }),
      execute: async input => {
        const mfBot = bot.getBot();
        const itemType = mfBot.registry.itemsByName[input.item];
        if (!itemType) return { error: `Unknown item: ${input.item}`, canCraft: false };
        const noTable = mfBot.recipesFor(itemType.id, null, 1, null);
        const withTable = mfBot.recipesFor(itemType.id, null, 1, true);
        return {
          canCraftInInventory: noTable.length > 0,
          canCraftWithTable: withTable.length > 0,
          requiresTable: noTable.length === 0 && withTable.length > 0,
        };
      },
    }),

    readMemory: tool({
      description: 'Read your persistent memory: learnings, preferences, notes, shelter location.',
      inputSchema: z.object({}),
      execute: async () => memory.read(),
    }),

    addLearning: tool({
      description: 'Record something you learned. Persists forever. Use for survival tips, dangerous areas, crafting discoveries.',
      inputSchema: z.object({ learning: z.string().min(1).max(500) }),
      execute: async input => { memory.addLearning(input.learning); return { ok: true }; },
    }),

    writeNote: tool({
      description: 'Write a note to yourself. Plans, TODOs, observations.',
      inputSchema: z.object({ note: z.string().min(1).max(500) }),
      execute: async input => { memory.addNote(input.note); return { ok: true }; },
    }),

    setShelterLocation: tool({
      description: 'Remember where your shelter/base is.',
      inputSchema: z.object({ position: vec3Schema }),
      execute: async input => { memory.setShelterLocation(input.position); return { ok: true }; },
    }),

    executeTask: tool({
      description: `Execute a survival task. Output the task as a JSON string. Runs mechanically with zero inference cost.
Available task types:
  {"task":"mine","target":"oak_log","quantity":5}
  {"task":"craft","recipe":"oak_planks","count":4}
  {"task":"smelt","input":"raw_iron","fuel":"coal","count":8}
  {"task":"eat"} or {"task":"eat","item":"cooked_beef"}
  {"task":"travel","destination":{"x":10,"y":64,"z":-20}}
  {"task":"build","blocks":[{"pos":{"x":0,"y":0,"z":0},"block":"cobblestone"}],"relative":true}
  {"task":"attack","target":"nearest_hostile"}
  {"task":"sleep"}
  {"task":"equip","item":"stone_sword","slot":"hand"}
  {"task":"wait","seconds":60}
  {"task":"flee","from":{"x":10,"y":64,"z":-20},"distance":20}
  {"task":"placeBlock","position":{"x":10,"y":64,"z":-20},"block":"crafting_table"}
  {"task":"sequence","steps":[...array of tasks...]}
  {"task":"repeat","inner":{...task...},"count":3}`,
      inputSchema: z.object({ task: z.string().describe('JSON string of the task object') }),
      // No execute — this is a stop tool
    }),

    done: tool({
      description: 'End this thinking session. Optionally record a learning or note.',
      inputSchema: z.object({
        summary: z.string().min(1).max(200),
        learning: z.string().optional(),
        note: z.string().optional(),
      }),
      // No execute — this is a stop tool
    }),
  };
}
