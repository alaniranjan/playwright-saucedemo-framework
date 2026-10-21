import fs from 'node:fs/promises';
import { BlobNotFoundError, BlobPreconditionFailedError, del, head, list, put } from '@vercel/blob';

/**
 * Cloud mode: the dashboard runs on Vercel and tests run on GitHub Actions, which publishes results to Vercel Blob.
 * It needs a Blob token and one of those two hosts (or DASHBOARD_MODE=cloud); on your own machine the dashboard
 * always works on the local framework folder, even if `vercel env pull` put a token in .env.local.
 */
export const CLOUD =
  Boolean(process.env.BLOB_READ_WRITE_TOKEN) &&
  (process.env.VERCEL === '1' || process.env.GITHUB_ACTIONS === 'true' || process.env.DASHBOARD_MODE === 'cloud');

/** Blob paths: the JSON documents the dashboard reads, and one folder per run for its media and Allure report. */
export const BLOB_PATHS = {
  store: 'data/store.json',
  framework: 'data/framework.json',
  latest: 'data/latest.json',
  /** Where the running workflow's live preview can be reached (scripts/live-tunnel.ts). */
  liveTunnel: 'data/live-tunnel.json',
  runFolder: (runId: string) => `runs/${runId}/`,
} as const;

export interface JsonDocument<T> {
  data: T;
  etag: string;
}

/**
 * Reads a JSON blob as it is now; null if missing. `get(..., { useCache: false })` only bypasses the CDN for private
 * blobs, so a public read could return the previous version (and ETag) for up to a minute and every `ifMatch` write
 * would fail. Instead the current ETag comes from `head` (no CDN), and the ETag in the URL makes each version its own
 * cache entry.
 */
export async function readJson<T>(pathname: string): Promise<JsonDocument<T> | null> {
  let meta;
  try {
    meta = await head(pathname);
  } catch (error) {
    if (error instanceof BlobNotFoundError) return null;
    throw error;
  }
  const url = new URL(meta.url);
  url.searchParams.set('v', meta.etag.replaceAll('"', ''));
  const response = await fetch(url, { cache: 'no-store' });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Could not read ${pathname} (HTTP ${response.status})`);
  return { data: (await response.json()) as T, etag: meta.etag };
}

/** Writes a JSON blob. With `ifMatch`, fails with BlobPreconditionFailedError if someone else wrote it first. */
export async function writeJson(pathname: string, data: unknown, ifMatch?: string): Promise<void> {
  await put(pathname, JSON.stringify(data), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
    ...(ifMatch ? { ifMatch } : {}),
  });
}

export function isConflict(error: unknown): boolean {
  return error instanceof BlobPreconditionFailedError;
}

/**
 * Uploads a local file under `folder` and returns its public URL. A random suffix keeps the URL unguessable;
 * files never change once uploaded, so the CDN may cache them for good.
 */
export async function uploadFile(folder: string, name: string, file: string, contentType: string): Promise<string> {
  const blob = await put(`${folder}${name}`, await fs.readFile(file), {
    access: 'public',
    contentType,
    addRandomSuffix: true,
  });
  return blob.url;
}

/** Deletes every blob whose pathname starts with `prefix`. */
export async function deletePrefix(prefix: string): Promise<void> {
  let cursor: string | undefined;
  do {
    const page = await list({ prefix, limit: 1000, ...(cursor ? { cursor } : {}) });
    if (page.blobs.length > 0) await del(page.blobs.map((blob) => blob.url));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
}

/** Run IDs that have a folder under runs/. */
export async function listRunFolders(): Promise<string[]> {
  const ids: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: 'runs/', mode: 'folded', limit: 1000, ...(cursor ? { cursor } : {}) });
    ids.push(...page.folders.map((folder) => folder.replace(/^runs\//, '').replace(/\/$/, '')));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return ids;
}

export async function deleteUrls(urls: readonly string[]): Promise<void> {
  if (urls.length > 0) await del([...urls]);
}

/** Caches an async value per server instance for `ttlMs`, so frequent polling doesn't hit storage every time. */
export function cached<T>(
  ttlMs: number,
  load: () => Promise<T>,
): { get: () => Promise<T>; set: (value: T) => void; clear: () => void } {
  let entry: { at: number; value: Promise<T> } | null = null;
  return {
    get() {
      if (!entry || Date.now() - entry.at > ttlMs) {
        const value = load();
        entry = { at: Date.now(), value };
        // A failed load is not kept.
        value.catch(() => {
          if (entry?.value === value) entry = null;
        });
      }
      return entry.value;
    },
    set(value) {
      entry = { at: Date.now(), value: Promise.resolve(value) };
    },
    clear() {
      entry = null;
    },
  };
}
