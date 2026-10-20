import fs from 'node:fs/promises';
import type { LiveState } from '../types';
import { LIVE_FILE } from './paths';

/** A "running" live file that has not been updated for this long belongs to a run that died. */
const STALE_AFTER_MS = 20_000;

/** Reads test-results/live.json written by the framework's live reporter. */
export async function readLive(): Promise<LiveState | null> {
  try {
    const parsed = JSON.parse(await fs.readFile(LIVE_FILE, 'utf8')) as Omit<LiveState, 'active'>;
    const fresh = Date.now() - new Date(parsed.updatedAt).getTime() < STALE_AFTER_MS;
    return { ...parsed, active: parsed.status === 'running' && fresh };
  } catch {
    // Missing, or caught mid-write; the next poll will read it.
    return null;
  }
}
