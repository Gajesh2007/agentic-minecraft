import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export class JsonStore<T extends object> {
  private data: T;
  private writeChain: Promise<void> = Promise.resolve();

  constructor(
    private readonly path: string,
    private readonly defaults: T,
  ) {
    this.data = defaults;
  }

  async init(): Promise<void> {
    await mkdir(dirname(this.path), { recursive: true });
    try {
      const raw = await readFile(this.path, 'utf8');
      this.data = JSON.parse(raw) as T;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!message.includes('ENOENT')) {
        throw err;
      }
      await this.flush();
    }
  }

  get(): T {
    return this.data;
  }

  set(updater: (current: T) => T): T {
    this.data = updater(this.data);
    void this.flush();
    return this.data;
  }

  private async flush(): Promise<void> {
    const payload = JSON.stringify(this.data, null, 2) + '\n';
    this.writeChain = this.writeChain.then(async () => {
      const tmp = `${this.path}.tmp`;
      await writeFile(tmp, payload, 'utf8');
      await rename(tmp, this.path);
    });
    await this.writeChain;
  }
}

