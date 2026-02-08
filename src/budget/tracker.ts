import { AppConfig } from '../config.js';
import { EventBus } from '../events/event-bus.js';
import { SurvivalEvents } from '../events/event-types.js';

export class BudgetTracker {
  private _remaining: number;
  private totalSpent = 0;
  private _lastCost = 0;
  private callCount = 0;

  constructor(
    private readonly config: AppConfig,
    private readonly events: EventBus<SurvivalEvents>,
  ) {
    this._remaining = config.BUDGET_INITIAL;
  }

  async track<T>(fn: () => Promise<T>): Promise<T> {
    const result = await fn();

    // AI SDK v6 uses totalUsage (across all steps) or usage (single step)
    const r = result as any;
    const usage = r?.totalUsage ?? r?.usage;
    if (usage) {
      // Claude Opus 4.6 pricing: $5/MTok input, $25/MTok output
      // With cache: $0.50/MTok cached input
      const inputTokens = usage.promptTokens ?? usage.inputTokens ?? 0;
      const outputTokens = usage.completionTokens ?? usage.outputTokens ?? 0;

      const inputCost = inputTokens * 0.000005;  // $5/MTok
      const outputCost = outputTokens * 0.000025; // $25/MTok
      const cost = inputCost + outputCost;

      this._lastCost = cost;
      this.totalSpent += cost;
      this._remaining -= cost;
      this.callCount++;

      this.events.publish('budget.debit', {
        cost: Math.round(cost * 10000) / 10000,
        remaining: Math.round(this._remaining * 100) / 100,
        totalSpent: Math.round(this.totalSpent * 10000) / 10000,
        callCount: this.callCount,
      });
    } else {
      // Still count the call even if we can't extract usage
      this.callCount++;
      this.events.publish('budget.debit', {
        cost: 0,
        remaining: this._remaining,
        totalSpent: this.totalSpent,
        callCount: this.callCount,
      });
    }

    return result;
  }

  canAfford(): boolean {
    return this._remaining > 0;
  }

  remaining(): number {
    return this._remaining;
  }

  lastCost(): number {
    return this._lastCost;
  }

  getStats() {
    return {
      remaining: this._remaining,
      totalSpent: this.totalSpent,
      callCount: this.callCount,
    };
  }
}
