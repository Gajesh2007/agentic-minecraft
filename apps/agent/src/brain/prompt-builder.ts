import { BotConnection } from '../bot/connection.js';
import type { Interrupt } from '../interrupt/types.js';
import { SYSTEM_PROMPT } from './system-prompt.js';

export type PromptPack = {
  system: string;
  userMessage: string;
};

export function buildPrompt(opts: {
  bot: BotConnection;
  interrupt: Interrupt | null;
  lastTaskSummary: string | null;
  memorySummary: string | null;
  budgetRemaining: number;
}): PromptPack {
  const { bot, interrupt, lastTaskSummary, memorySummary, budgetRemaining } = opts;
  const snapshot = bot.getSnapshot();
  const mfBot = bot.getBotOrNull();

  const parts: string[] = [];

  // Current state
  const pos = snapshot.position;
  const posStr = pos ? `${pos.x.toFixed(0)}, ${pos.y.toFixed(0)}, ${pos.z.toFixed(0)}` : 'unknown';
  parts.push(`## Status
- Position: ${posStr}
- Health: ${snapshot.health ?? '?'}/20 | Hunger: ${snapshot.food ?? '?'}/20
- Time: ${snapshot.isDay ? 'Day' : 'Night'} (tick ${snapshot.timeOfDay ?? '?'})
- Budget remaining: $${budgetRemaining.toFixed(2)}
- Gamemode: ${snapshot.gamemode ?? 'unknown'}`);

  // Inventory summary
  if (mfBot) {
    const items = mfBot.inventory.items();
    if (items.length > 0) {
      const inv = items.map((i: any) => `${i.name} x${i.count}`).join(', ');
      parts.push(`## Inventory\n${inv}`);
    } else {
      parts.push('## Inventory\nEmpty');
    }

    // Equipment
    const armor = [
      mfBot.inventory.slots[5]?.name,
      mfBot.inventory.slots[6]?.name,
      mfBot.inventory.slots[7]?.name,
      mfBot.inventory.slots[8]?.name,
    ].filter(Boolean);
    const held = mfBot.heldItem?.name;
    if (armor.length > 0 || held) {
      const equipStr = [
        held ? `Hand: ${held}` : null,
        armor.length > 0 ? `Armor: ${armor.join(', ')}` : null,
      ].filter(Boolean).join(' | ');
      parts.push(`## Equipment\n${equipStr}`);
    }
  }

  // What triggered this thought
  if (interrupt) {
    parts.push(`## Interrupt: ${interrupt.type}\n${JSON.stringify(interrupt.data)}`);
  } else if (lastTaskSummary) {
    parts.push(`## Last Task Result\n${lastTaskSummary}`);
  } else {
    parts.push('## Trigger\nFirst thought after spawn. Survey your situation and plan.');
  }

  // Memory
  if (memorySummary) {
    parts.push(`## Your Memory\n${memorySummary}`);
  }

  // Action guidance
  parts.push(`## What To Do
Your status and inventory are shown above. Use perception tools (getNearbyBlocks, getNearbyEntities, getRecipes) to understand your situation. Then call executeTask with your plan. Use sequence tasks for multi-step plans.
Remember: you MUST call either executeTask or done before your turn ends.`);

  return {
    system: SYSTEM_PROMPT,
    userMessage: parts.join('\n\n'),
  };
}
