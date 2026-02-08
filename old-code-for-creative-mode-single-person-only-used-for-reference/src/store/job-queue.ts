import { AbortError, throwIfAborted } from '../lib/async.js';

type JobTask<Result> = {
  jobId: string;
  run: (signal: AbortSignal) => Promise<Result>;
  onDone: (result: Result) => void;
  onError: (error: Error) => void;
};

export class JobQueue {
  private running = false;
  private queue: JobTask<unknown>[] = [];
  private active?: { jobId: string; controller: AbortController };

  enqueue<Result>(task: JobTask<Result>): void {
    this.queue.push(task as JobTask<unknown>);
    void this.process();
  }

  cancel(jobId: string): boolean {
    if (this.active?.jobId === jobId) {
      this.active.controller.abort();
      return true;
    }
    const before = this.queue.length;
    this.queue = this.queue.filter(task => task.jobId !== jobId);
    return this.queue.length !== before;
  }

  private async process(): Promise<void> {
    if (this.running) return;
    this.running = true;
    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (!task) continue;
      const controller = new AbortController();
      this.active = { jobId: task.jobId, controller };
      try {
        throwIfAborted(controller.signal);
        const result = await task.run(controller.signal);
        task.onDone(result);
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error(typeof err === 'string' ? err : 'Job failed');
        if (error instanceof AbortError) {
          task.onError(new Error('cancelled'));
        } else {
          task.onError(error);
        }
      } finally {
        this.active = undefined;
      }
    }
    this.running = false;
  }
}

