import fs from 'node:fs/promises';
import { FRAMEWORK_PACKAGE } from './paths';

export interface FrameworkPackage {
  name: string;
  version: string;
  description: string;
  scripts: Record<string, string>;
}

/** Reads the framework's package.json on every call, so edits to scripts show up without a restart. */
export async function readFrameworkPackage(): Promise<FrameworkPackage> {
  try {
    const parsed = JSON.parse(await fs.readFile(FRAMEWORK_PACKAGE, 'utf8')) as Partial<FrameworkPackage>;
    return {
      name: parsed.name ?? 'framework',
      version: parsed.version ?? '0.0.0',
      description: parsed.description ?? '',
      scripts: parsed.scripts ?? {},
    };
  } catch {
    return { name: 'framework', version: '0.0.0', description: '', scripts: {} };
  }
}
