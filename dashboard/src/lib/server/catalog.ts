import { execFile } from 'node:child_process';
import { featureFromFile, labelFromScript } from '../naming';
import type { Catalog, CatalogTest, ProjectInfo, RecordingSize, SpecFile, SuiteDefinition } from '../types';
import { readFrameworkPackage } from './framework';
import { CATALOG_REPORTER, FRAMEWORK_DIR } from './paths';

interface ListedCatalog {
  playwrightVersion: string;
  workers: number;
  recordingSizes?: RecordingSize[];
  defaultRecordingSize?: string;
  projects: ProjectInfo[];
  tests: CatalogTest[];
}

const CACHE_TTL_MS = 60_000;
let cache: { at: number; value: Promise<ListedCatalog | null> } | null = null;

function listTests(): Promise<ListedCatalog | null> {
  return new Promise((resolve) => {
    execFile(
      process.platform === 'win32' ? 'npx.cmd' : 'npx',
      ['playwright', 'test', '--list', `--reporter=${CATALOG_REPORTER}`],
      {
        cwd: FRAMEWORK_DIR,
        // BROWSERS=all DEVICES=all lists every browser and device the framework supports. Listing must not clear allure-results
        // (playwright.config.ts does that at the start of real runs).
        env: { ...process.env, BROWSERS: 'all', DEVICES: 'all', KEEP_ALLURE_RESULTS: 'true', FORCE_COLOR: '0' },
        maxBuffer: 20 * 1024 * 1024,
        shell: process.platform === 'win32',
        timeout: 60_000,
      },
      (error, stdout) => {
        if (error) return resolve(null);
        try {
          resolve(JSON.parse(stdout) as ListedCatalog);
        } catch {
          resolve(null);
        }
      },
    );
  });
}

function getListedCatalog(): Promise<ListedCatalog | null> {
  if (!cache || Date.now() - cache.at > CACHE_TTL_MS) {
    const value = listTests();
    cache = { at: Date.now(), value };
    // Don't keep a failed listing for a whole minute.
    void value.then((result) => {
      if (!result && cache?.value === value) cache = null;
    });
  }
  return cache.value;
}

/** Forces the next catalog read to list tests again (e.g. after a run touched the spec files). */
export function invalidateCatalog(): void {
  cache = null;
}

/**
 * A script counts as a runnable suite when it is `playwright test` optionally followed by a single
 * `--grep <pattern>`. Scripts with other flags (--headed, --debug, --ui, --project) are modes, not suites.
 */
export function parseSuiteScript(command: string): { grep: string | null } | null {
  const tokens = command.trim().split(/\s+/);
  if (tokens[0] !== 'playwright' || tokens[1] !== 'test') return null;
  const rest = tokens.slice(2);
  if (rest.length === 0) return { grep: null };
  if (rest.length === 2 && (rest[0] === '--grep' || rest[0] === '-g')) {
    return { grep: rest[1]!.replace(/^['"]|['"]$/g, '') };
  }
  return null;
}

/** Arguments after `playwright test`, used to match a run back to the script that started it. */
export function scriptArgs(command: string): string[] {
  return command.trim().split(/\s+/).slice(2);
}

function matchesGrep(test: CatalogTest, grep: string | null): boolean {
  if (!grep) return true;
  try {
    return new RegExp(grep).test(`${test.project} ${test.file} ${test.describe} ${test.title} ${test.tags.join(' ')}`);
  } catch {
    return false;
  }
}

/** Suites (from package.json), spec files, projects and counts (from `playwright test --list`). */
export async function getCatalog(): Promise<Catalog | null> {
  const [pkg, listedAll] = await Promise.all([readFrameworkPackage(), getListedCatalog()]);
  if (!listedAll) return null;
  // Tests are listed once per browser; suites and files count each test once.
  const seen = new Set<string>();
  const uniqueTests = listedAll.tests.filter((test) => {
    const key = `${test.file}:${test.line}:${test.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const listed = { ...listedAll, tests: uniqueTests };

  const suites: SuiteDefinition[] = Object.entries(pkg.scripts)
    .filter(([script]) => script === 'test' || script.startsWith('test:'))
    .flatMap(([script, command]) => {
      const parsed = parseSuiteScript(command);
      if (!parsed) return [];
      return [
        {
          script,
          label: labelFromScript(script),
          command,
          grep: parsed.grep,
          count: listed.tests.filter((test) => matchesGrep(test, parsed.grep)).length,
        },
      ];
    })
    // "All tests" first, then the rest by name.
    .sort((a, b) => (a.script === 'test' ? -1 : b.script === 'test' ? 1 : a.label.localeCompare(b.label)));

  const fileMap = new Map<string, SpecFile>();
  for (const test of listed.tests) {
    const entry = fileMap.get(test.file) ?? { file: test.file, feature: featureFromFile(test.file), tests: [] };
    entry.tests.push(test);
    fileMap.set(test.file, entry);
  }

  return {
    suites,
    files: [...fileMap.values()].sort((a, b) => a.file.localeCompare(b.file)),
    projects: listed.projects,
    recordingSizes: listed.recordingSizes ?? [],
    defaultRecordingSize: listed.defaultRecordingSize ?? '',
    workers: listed.workers,
    playwrightVersion: listed.playwrightVersion,
    total: listed.tests.length,
  };
}
