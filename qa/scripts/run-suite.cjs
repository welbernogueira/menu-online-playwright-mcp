const path = require('node:path');
const { spawn } = require('node:child_process');

const root = path.resolve(__dirname, '..', '..');
const timestamp = new Date().toISOString().replace(/[-:.]/g, '');
const executionId = process.env.QA_EXECUTION_ID || `full-suite-local-${timestamp}`;
const localURL = 'http://127.0.0.1:8765/';
const useLocalCopy = !process.env.BASE_URL;
const cli = require.resolve('@playwright/test/cli');

function runProcess(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, options);
    child.once('error', reject);
    child.once('exit', (code, signal) => resolve({ status: code ?? (signal ? 1 : 0), signal }));
  });
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForLocalServer(server) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`O servidor local terminou antes de iniciar (code ${server.exitCode}).`);
    try {
      const response = await fetch(localURL);
      if (response.ok && response.headers.get('x-qa-static-server') === 'menu-online') {
        await delay(200);
        if (server.exitCode !== null) throw new Error('A porta 8765 já estava ocupada; a suíte não usará um servidor preexistente.');
        return;
      }
    } catch (error) {
      if (String(error).includes('porta 8765')) throw error;
    }
    await delay(250);
  }
  throw new Error('Timeout aguardando o servidor local em http://127.0.0.1:8765/.');
}

async function stopLocalServer(server) {
  if (!server || server.exitCode !== null) return;
  const exited = new Promise((resolve) => server.once('exit', resolve));
  server.kill('SIGTERM');
  await Promise.race([exited, delay(3000)]);
  if (server.exitCode === null) server.kill();
}

async function main() {
  let server;
  let testStatus = 1;
  let reportStatus = 0;
  const env = { ...process.env, QA_EXECUTION_ID: executionId };

  try {
    if (useLocalCopy) {
      env.BASE_URL = localURL;
      env.QA_LOCAL_SERVER_STARTED = '1';
      server = spawn(process.execPath, [path.join(root, 'tests', 'support', 'serve-app.cjs')], {
        cwd: root,
        env,
        stdio: 'inherit',
      });
      await waitForLocalServer(server);
    }

    const testRun = await runProcess(process.execPath, [cli, 'test', ...process.argv.slice(2)], {
      cwd: root,
      env,
      stdio: 'inherit',
    });
    testStatus = testRun.status;
  } catch (error) {
    console.error(`Execução QA interrompida: ${error.message}`);
    testStatus = 1;
  } finally {
    await stopLocalServer(server);
  }

  const rawPath = path.join(root, 'qa', 'reports', executionId, 'raw.json');
  if (require('node:fs').existsSync(rawPath)) {
    const raw = JSON.parse(require('node:fs').readFileSync(rawPath, 'utf8'));
    if (raw.stats.expected + raw.stats.unexpected > 0) {
      const reportBuild = await runProcess(process.execPath, [path.join(__dirname, 'build-run-report.cjs'), executionId], {
        cwd: root,
        stdio: 'inherit',
      });
      reportStatus = reportBuild.status;
      console.log(`Relatórios e cards HTML: qa/reports/${executionId}/`);
    } else {
      console.log('A consulta de lista/ajuda não executou cenários; nenhum relatório de execução foi atualizado.');
    }
  } else {
    console.log('Nenhum raw.json foi gerado; não há relatório para normalizar.');
  }

  process.exitCode = testStatus;
  if (reportStatus !== 0 && process.exitCode === 0) process.exitCode = reportStatus;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
