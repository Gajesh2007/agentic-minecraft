import { WebSocketServer, WebSocket } from 'ws';
import type { Task } from '@agentic-survival/shared';

export type ThoughtPayload = {
  agentName: string;
  thoughtNumber: number;
  reasoning: string;
  task: Task;
  cost: number;
  budgetRemaining: number;
  trigger: string;
  ts: string;
};

export class ThoughtStream {
  private wss: WebSocketServer;
  private clients = new Set<WebSocket>();

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    this.wss.on('connection', ws => {
      this.clients.add(ws);
      ws.on('close', () => this.clients.delete(ws));
    });
  }

  emit(thought: Omit<ThoughtPayload, 'ts'>): void {
    const payload = JSON.stringify({ ...thought, ts: new Date().toISOString() });
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  close(): void {
    for (const client of this.clients) {
      client.close();
    }
    this.wss.close();
  }
}
