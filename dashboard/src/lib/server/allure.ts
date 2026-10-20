import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { ARCHIVE_DIR, FRAMEWORK_DIR, resolveInside } from './paths';

const ALLURE_RESULTS = path.join(FRAMEWORK_DIR, 'allure-results');
const ALLURE_BIN = path.join(FRAMEWORK_DIR, 'node_modules', '.bin', 'allure');
const GENERATE_TIMEOUT_MS = 180_000;

/** Each run's Allure report sits next to its media, so deleting or pruning the run removes it too. */
export function runReportDir(runId: string): string | null {
  const runDir = resolveInside(ARCHIVE_DIR, runId);
  return runDir && path.join(runDir, 'allure-report');
}

// One generation at a time; a run starting from the dashboard waits for it, since it clears allure-results/.
let queue: Promise<unknown> = Promise.resolve();

export function reportsIdle(): Promise<unknown> {
  return queue;
}

/** Builds the Allure report of the run whose results are in allure-results/; resolves to whether it was written. */
export function generateRunReport(runId: string): Promise<boolean> {
  const task = queue.then(() => generate(runId));
  queue = task.catch(() => false);
  return task;
}

function generate(runId: string): Promise<boolean> {
  const output = runReportDir(runId);
  if (!output || !existsSync(ALLURE_RESULTS) || !existsSync(ALLURE_BIN)) return Promise.resolve(false);
  return new Promise((resolve) => {
    execFile(
      ALLURE_BIN,
      ['generate', 'allure-results', '--output', output, '--clean', '--report-name', `Allure Report · ${runId}`],
      { cwd: FRAMEWORK_DIR, timeout: GENERATE_TIMEOUT_MS },
      (error) => resolve(!error && existsSync(path.join(output, 'index.html'))),
    );
  });
}

/** Deletes the Allure reports of these runs; the runs themselves stay in history. */
export async function deleteRunReports(ids: readonly string[]): Promise<void> {
  await Promise.all(
    ids.map(async (id) => {
      const dir = runReportDir(id);
      if (dir) await fs.rm(dir, { recursive: true, force: true });
    }),
  );
}
