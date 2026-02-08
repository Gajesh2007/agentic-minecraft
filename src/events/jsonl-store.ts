import { mkdir, appendFile, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { EventEnvelope } from './event-types.js';

export class JsonlEventStore<TEvent extends EventEnvelope> {
  constructor(private readonly path: string) {}

  async init(): Promise<void> {
    await mkdir(dirname(this.path), { recursive: true });
  }

  async append(event: TEvent): Promise<void> {
    const line = JSON.stringify(event) + '\n';
    await appendFile(this.path, line, { encoding: 'utf8' });
  }

  async readSince(seq: number, limit = 500): Promise<TEvent[]> {
    try {
      const raw = await readFile(this.path, 'utf8');
      const lines = raw.trim().split('\n');
      const events: TEvent[] = [];
      for (const line of lines) {
        if (!line) continue;
        const event = JSON.parse(line) as TEvent;
        if (event.seq > seq) {
          events.push(event);
          if (events.length >= limit) break;
        }
      }
      return events;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('ENOENT')) return [];
      throw err;
    }
  }
}

