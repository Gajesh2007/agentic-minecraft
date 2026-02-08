export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class AbortError extends Error {
  constructor(message = 'Aborted') {
    super(message);
    this.name = 'AbortError';
  }
}

export function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) throw new AbortError(signal.reason ? String(signal.reason) : 'Aborted');
}

