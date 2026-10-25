const path = require('node:path');
const { defineConfig } = require('@playwright/test');

const projectRoot = __dirname;
const explicitBaseURL = process.env.BASE_URL;
const baseURL = explicitBaseURL || 'http://127.0.0.1:8765/';
const localServerStartedByRunner = process.env.QA_LOCAL_SERVER_STARTED === '1';
const target = new URL(baseURL);
if (target.hostname.toLowerCase() === 'menu-online-project.vercel.app') {
  throw new Error('A suíte não executa contra produção. Use o padrão local ou informe um preview isolado em BASE_URL.');
}

// Permite que beforeEach dos cenários confirme que a execução local foi configurada.
process.env.BASE_URL = baseURL;
const timestamp = new Date().toISOString().replace(/[-:.]/g, '');
const targetLabel = explicitBaseURL && !localServerStartedByRunner ? 'preview' : 'local';
const executionId = process.env.QA_EXECUTION_ID || `full-suite-${targetLabel}-${timestamp}`;
const runDir = path.join(projectRoot, 'qa', 'reports', executionId);
const reportBaseURL = new URL(baseURL);
reportBaseURL.username = '';
reportBaseURL.password = '';
reportBaseURL.search = '';
reportBaseURL.hash = '';
require('node:fs').mkdirSync(runDir, { recursive: true });
require('node:fs').writeFileSync(
  path.join(runDir, 'execution-metadata.txt'),
  `base_url=${reportBaseURL.toString()}\ntarget=${targetLabel}\nbrowser=Chromium\nexecution_id=${executionId}\n`,
  'utf8',
);

module.exports = defineConfig({
  testDir: path.join(projectRoot, 'tests'),
  testMatch: '**/*.spec.js',
  fullyParallel: true,
  reporter: [
    ['list'],
    ['html', { outputFolder: path.join(runDir, 'playwright-report'), open: 'never' }],
    ['json', { outputFile: path.join(runDir, 'raw.json') }],
  ],
  outputDir: path.join(runDir, 'test-results'),
  ...(explicitBaseURL ? {} : {
    webServer: {
      command: 'node tests/support/serve-app.cjs',
      cwd: projectRoot,
      url: baseURL,
      timeout: 30000,
      reuseExistingServer: false,
    },
  }),
  use: {
    baseURL,
    browserName: 'chromium',
    screenshot: 'on',
    trace: 'retain-on-failure',
  },
});
