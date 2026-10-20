import { defineConfig } from 'allure';

/** Allure 3 report configuration, picked up automatically by `allure generate` and `allure open`. */
export default defineConfig({
  name: 'Sauce Demo E2E Report',
  output: './allure-report',
  plugins: {
    awesome: {
      options: {
        reportName: 'Sauce Demo E2E Report',
        // Tree view: Feature > Story > test (labels set by labelTest() in utils/test-helpers.ts).
        groupBy: ['feature', 'story'],
      },
    },
  },
});
