import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

export class JsonRepository<T extends object> {
  private writeQueue: Promise<void> = Promise.resolve();

  public constructor(private readonly filePath: string, private readonly seed: T) {}

  public async read(): Promise<T> {
    try {
      return JSON.parse(await readFile(this.filePath, 'utf8')) as T;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      await this.write(this.seed);
      return structuredClone(this.seed);
    }
  }

  public async update(mutator: (current: T) => T): Promise<T> {
    const current = await this.read();
    const next = mutator(current);
    await this.write(next);
    return next;
  }

  public async write(value: T): Promise<void> {
    const operation = this.writeQueue.then(async () => {
      await mkdir(path.dirname(this.filePath), { recursive: true });
      const temporaryPath = `${this.filePath}.tmp`;
      await writeFile(temporaryPath, JSON.stringify(value, null, 2), 'utf8');
      await rename(temporaryPath, this.filePath);
    });
    this.writeQueue = operation.catch(() => undefined);
    await operation;
  }
}
