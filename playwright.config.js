const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  fullyParallel: true,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'qa/reports/latest/playwright-report', open: 'never' }],
  ],
  outputDir: 'qa/reports/latest/test-results',
  use: {
    baseURL: process.env.BASE_URL || 'https://menu-online-project.vercel.app/',
    browserName: 'chromium',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
});
