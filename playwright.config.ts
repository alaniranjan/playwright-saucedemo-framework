import fs from 'node:fs';
import os from 'node:os';
import dotenv from 'dotenv';
import { defineConfig, devices, type Project, type ReporterDescription } from '@playwright/test';
import { DEVICE_CATALOG, type DeviceCategory, deviceKey, osOf } from './utils/devices';
import { DEFAULT_RECORDING_RESOLUTION, RECORDING_SIZES, isRecordingResolution } from './utils/recording';

dotenv.config({ quiet: true });

const isCI = Boolean(process.env.CI);
const baseURL = process.env.BASE_URL ?? 'https://www.saucedemo.com';
const crossBrowser = process.env.CROSS_BROWSER === 'true';
const allureResultsDir = 'allure-results';

// Failed tests keep their video and full-page screenshot at the chosen size; passed tests keep none.
// The browser viewport matches it, so frames are captured at native resolution rather than upscaled.
const requestedResolution = process.env.RECORDING_RESOLUTION;
if (requestedResolution && !isRecordingResolution(requestedResolution)) {
  throw new Error(`Unknown RECORDING_RESOLUTION "${requestedResolution}". Use: ${Object.keys(RECORDING_SIZES).join(', ')}`);
}
const { width, height } = RECORDING_SIZES[isRecordingResolution(requestedResolution) ? requestedResolution : DEFAULT_RECORDING_RESOLUTION];
const recordingSize = { width, height };

// Start every run with fresh Allure results so reports never mix stale runs.
// Runs only in the main process (workers set TEST_WORKER_INDEX); set KEEP_ALLURE_RESULTS=true to accumulate.
if (!process.env.TEST_WORKER_INDEX && process.env.KEEP_ALLURE_RESULTS !== 'true') {
  fs.rmSync(allureResultsDir, { recursive: true, force: true });
}

const reporters: ReporterDescription[] = [
  [isCI ? 'dot' : 'list'],
  ['html', { outputFolder: 'playwright-report', open: 'never' }],
  // Machine-readable results consumed by the Next.js dashboard (dashboard/).
  ['json', { outputFile: 'test-results/results.json' }],
  // Live progress (running tests, current step, URL) for the dashboard; also works for terminal runs.
  ['./reporters/live-reporter.ts', { outputFile: 'test-results/live.json' }],
  [
    'allure-playwright',
    {
      resultsDir: allureResultsDir,
      detail: true,
      suiteTitle: true,
      environmentInfo: {
        Application: baseURL,
        Node: process.version,
        OS: `${os.platform()} ${os.release()}`,
        CI: String(isCI),
      },
    },
  ],
];

if (isCI) {
  reporters.push(['junit', { outputFile: 'test-results/junit.xml' }]);
}

// Desktop browsers. Pick them with BROWSERS (comma-separated keys, or "all"), e.g.
// BROWSERS=chrome,firefox npm run test:smoke. The default is Google Chrome; CROSS_BROWSER=true means all three.
// BROWSERS="" runs no desktop browser (for device-only runs). Desktop presets set a 1280x720 viewport, so each
// project overrides it with the recording size.
const BROWSER_PROJECTS: Record<string, Project> = {
  chrome: {
    name: 'chrome',
    metadata: { kind: 'desktop', label: 'Chrome' },
    use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: recordingSize },
  },
  firefox: {
    name: 'firefox',
    metadata: { kind: 'desktop', label: 'Firefox' },
    use: { ...devices['Desktop Firefox'], viewport: recordingSize },
  },
  webkit: {
    name: 'webkit',
    metadata: { kind: 'desktop', label: 'WebKit' },
    use: { ...devices['Desktop Safari'], viewport: recordingSize },
  },
};

// Mobile and tablet emulation (utils/devices.ts). Pick devices with DEVICES (keys like "iphone-17-pro", or "all").
// Videos are recorded at twice the device's CSS size so they stay sharp on high-density screens.
const DEVICE_PROJECTS: Record<string, Project> = Object.fromEntries(
  (Object.entries(DEVICE_CATALOG) as [DeviceCategory, readonly string[]][]).flatMap(([category, names]) =>
    names.map((name) => {
      const descriptor = devices[name];
      if (!descriptor) throw new Error(`Playwright has no device descriptor named "${name}"`);
      const key = deviceKey(name);
      const os = osOf(category);
      const project: Project = {
        name: key,
        metadata: { kind: 'device', label: name, category, os },
        use: {
          ...descriptor,
          ...(os === 'Android' ? { channel: 'chrome' } : {}),
          // Recorded at the screen's own size: Playwright only scales frames down, so a larger size just pads them.
          video: { mode: 'retain-on-failure', size: descriptor.viewport },
        },
      };
      return [key, project];
    }),
  ),
);

function selectProjects(variable: string, value: string, available: Record<string, Project>): Project[] {
  const keys = value
    .split(',')
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean);
  const selected = keys.includes('all') ? Object.keys(available) : keys;
  const unknown = selected.filter((key) => !available[key]);
  if (unknown.length > 0) {
    throw new Error(`Unknown value(s) in ${variable}: ${unknown.join(', ')}. Use: ${Object.keys(available).join(', ')}, all`);
  }
  return selected.map((key) => available[key]!);
}

const projects = [
  ...selectProjects('BROWSERS', process.env.BROWSERS ?? (crossBrowser ? 'chrome,firefox,webkit' : 'chrome'), BROWSER_PROJECTS),
  ...selectProjects('DEVICES', process.env.DEVICES ?? '', DEVICE_PROJECTS),
];
if (projects.length === 0) {
  throw new Error('Nothing to run: BROWSERS and DEVICES are both empty.');
}

export default defineConfig({
  testDir: './tests',
  outputDir: 'test-results/artifacts',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : '50%',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: reporters,
  use: {
    baseURL,
    // Sauce Demo exposes stable `data-test` attributes, so getByTestId() targets them.
    testIdAttribute: 'data-test',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    // Only failed tests keep media: the full video of the whole scenario and a full-page screenshot of the moment
    // it failed. Passed tests keep nothing. Add `--trace on` to record traces.
    screenshot: { mode: 'only-on-failure', fullPage: true },
    video: { mode: 'retain-on-failure', size: recordingSize },
    trace: 'off',
  },
  projects,
});
