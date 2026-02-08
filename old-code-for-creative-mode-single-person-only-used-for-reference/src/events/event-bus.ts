import { EventEmitter } from 'node:events';
import { EventEnvelope } from './event-types.js';

type Listener<T> = (event: T) => void;

export class EventBus<TEvent extends EventEnvelope> {
  private readonly emitter = new EventEmitter();
  private seq = 0;

  publish<TType extends TEvent['type']>(
    type: TType,
    data: Extract<TEvent, { type: TType }>['data'],
  ): Extract<TEvent, { type: TType }> {
    const event = {
      seq: ++this.seq,
      ts: new Date().toISOString(),
      type,
      data,
    } as unknown as Extract<TEvent, { type: TType }>;

    this.emitter.emit('event', event);
    this.emitter.emit(type, event);
    return event;
  }

  onAny(listener: Listener<TEvent>): () => void {
    this.emitter.on('event', listener);
    return () => this.emitter.off('event', listener);
  }

  onType<TType extends TEvent['type']>(
    type: TType,
    listener: Listener<Extract<TEvent, { type: TType }>>,
  ): () => void {
    this.emitter.on(type, listener as Listener<TEvent>);
    return () => this.emitter.off(type, listener as Listener<TEvent>);
  }

  getNextSeq(): number {
    return this.seq + 1;
  }
}

