import { JsonStore } from './json-store.js';
import { JobRecord, JobStatus } from '../types/blueprint.js';
import { makeId } from '../lib/ids.js';

type JobStoreData = {
  jobs: JobRecord[];
  idempotency: Record<string, string>;
};

export class JobStore {
  private readonly store: JsonStore<JobStoreData>;

  constructor(path: string) {
    this.store = new JsonStore<JobStoreData>(path, { jobs: [], idempotency: {} });
  }

  async init(): Promise<void> {
    await this.store.init();
  }

  get(jobId: string): JobRecord | undefined {
    return this.store.get().jobs.find(job => job.jobId === jobId);
  }

  list(): JobRecord[] {
    return this.store.get().jobs;
  }

  getByIdempotency(idempotencyKey: string): JobRecord | undefined {
    const jobId = this.store.get().idempotency[idempotencyKey];
    return jobId ? this.get(jobId) : undefined;
  }

  create(type: string, idempotencyKey?: string): JobRecord {
    const job: JobRecord = {
      jobId: makeId('job'),
      type,
      status: 'queued',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      result: null,
      error: null,
    };
    this.store.set(state => {
      const idempotency = { ...state.idempotency };
      if (idempotencyKey) idempotency[idempotencyKey] = job.jobId;
      return { ...state, jobs: [...state.jobs, job], idempotency };
    });
    return job;
  }

  update(jobId: string, patch: Partial<JobRecord>): JobRecord {
    const jobs = this.store.get().jobs.map(job =>
      job.jobId === jobId
        ? { ...job, ...patch, updatedAt: new Date().toISOString() }
        : job,
    );
    this.store.set(state => ({ ...state, jobs }));
    const updated = jobs.find(job => job.jobId === jobId);
    if (!updated) throw new Error(`Unknown job ${jobId}`);
    return updated;
  }

  setStatus(jobId: string, status: JobStatus, result?: unknown, error?: string): JobRecord {
    return this.update(jobId, {
      status,
      result: result ?? null,
      error: error ? { message: error } : null,
    });
  }
}

