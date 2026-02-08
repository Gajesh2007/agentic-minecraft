import WebSocket from 'ws';

export type AgentThought = {
  agentName: string;
  thoughtNumber: number;
  reasoning: string;
  task: any;
  cost: number;
  budgetRemaining: number;
  trigger: string;
  ts: string;
};

export type AgentEvent = {
  seq: number;
  ts: string;
  type: string;
  data: any;
};

export class ThoughtAggregator {
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private thoughts: AgentThought[] = [];
  private events: AgentEvent[] = [];
  private listeners: Array<(thought: AgentThought) => void> = [];
  private eventListeners: Array<(event: AgentEvent) => void> = [];
  private sseAbort: AbortController | null = null;

  constructor(
    private readonly thoughtStreamUrl: string,
    private readonly sseUrl: string,
    private readonly maxHistory = 100,
  ) {}

  start(): void {
    this.connectThoughtStream();
    this.connectSSE();
  }

  stop(): void {
    if (this.ws) { this.ws.close(); this.ws = null; }
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
    if (this.sseAbort) { this.sseAbort.abort(); this.sseAbort = null; }
  }

  onThought(handler: (thought: AgentThought) => void): void {
    this.listeners.push(handler);
  }

  onEvent(handler: (event: AgentEvent) => void): void {
    this.eventListeners.push(handler);
  }

  getRecentThoughts(limit = 20): AgentThought[] {
    return this.thoughts.slice(-limit);
  }

  getRecentEvents(limit = 50): AgentEvent[] {
    return this.events.slice(-limit);
  }

  getLatestThought(): AgentThought | null {
    return this.thoughts[this.thoughts.length - 1] ?? null;
  }

  private connectThoughtStream(): void {
    try {
      this.ws = new WebSocket(this.thoughtStreamUrl);

      this.ws.on('message', (data) => {
        try {
          const thought = JSON.parse(data.toString()) as AgentThought;
          this.thoughts.push(thought);
          if (this.thoughts.length > this.maxHistory) this.thoughts.shift();
          for (const listener of this.listeners) listener(thought);
        } catch { /* malformed message */ }
      });

      this.ws.on('open', () => {
        console.log(`[spectator] Connected to thought stream: ${this.thoughtStreamUrl}`);
      });

      this.ws.on('close', () => {
        console.log('[spectator] Thought stream disconnected, reconnecting in 5s...');
        this.scheduleReconnect();
      });

      this.ws.on('error', () => {
        // Error will trigger close event
      });
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connectThoughtStream();
    }, 5000);
  }

  private async connectSSE(): Promise<void> {
    this.sseAbort = new AbortController();
    const { signal } = this.sseAbort;

    const connect = async () => {
      while (!signal.aborted) {
        try {
          const response = await fetch(this.sseUrl, { signal });
          if (!response.body) { await sleep(5000); continue; }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (!signal.aborted) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const event = JSON.parse(line.slice(6)) as AgentEvent;
                  this.events.push(event);
                  if (this.events.length > this.maxHistory * 2) {
                    this.events = this.events.slice(-this.maxHistory);
                  }
                  for (const listener of this.eventListeners) listener(event);
                } catch { /* malformed event */ }
              }
            }
          }
        } catch (err: any) {
          if (signal.aborted) return;
          console.log('[spectator] SSE disconnected, reconnecting in 5s...');
          await sleep(5000);
        }
      }
    };

    void connect();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}
