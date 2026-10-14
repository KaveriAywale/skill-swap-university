#!/usr/bin/env node
'use strict';

/**
 * Starts the API server and the Vite dev server together with a single command.
 *
 *   npm run dev
 *
 * No extra dependency required. Press Ctrl+C once to stop both processes.
 *
 * The API port is chosen automatically: if 5000 is already taken (a common
 * cause of a silent crash when people leave an old server running), the next
 * free port is used and the Vite proxy is pointed at it. That way the two
 * halves always talk to each other.
 */

const { spawn } = require('child_process');
const net = require('net');
const path = require('path');

const root = path.resolve(__dirname, '..');
const isWindows = process.platform === 'win32';
const npm = isWindows ? 'npm.cmd' : 'npm';

const API_PORT_START = Number(process.env.API_PORT) || 5000;

function findFreePort(port) {
  return new Promise((resolve, reject) => {
    const tester = net.createServer();
    tester.unref();
    tester.once('error', (err) => {
      if (err.code === 'EADDRINUSE' || err.code === 'EACCES') {
        resolve(findFreePort(port + 1));
      } else {
        reject(err);
      }
    });
    tester.once('listening', () => {
      const found = tester.address().port;
      tester.close(() => resolve(found));
    });
    tester.listen(port);
  });
}

function start(name, args, env) {
  // On Windows `npm` is `npm.cmd`, which needs a shell to execute. Passing a
  // single command string (instead of an args array) avoids the DEP0190 warning.
  const child = isWindows
    ? spawn([npm, ...args].join(' '), { cwd: root, stdio: 'inherit', shell: true, env })
    : spawn(npm, args, { cwd: root, stdio: 'inherit', env });
  child.on('exit', (code) => {
    if (code) console.log(`\n[dev] ${name} stopped with exit code ${code}.`);
  });
  return child;
}

async function main() {
  const apiPort = await findFreePort(API_PORT_START);
  if (apiPort !== API_PORT_START) {
    console.log(`[dev] port ${API_PORT_START} is busy, using ${apiPort} for the API instead.`);
  } else {
    console.log(`[dev] API will listen on port ${apiPort}.`);
  }

  const apiTarget = `http://127.0.0.1:${apiPort}`;
  console.log(`[dev] client proxy -> ${apiTarget}`);
  console.log('[dev] open the "Local" URL that Vite prints below.\n');

  const children = [
    start('server', ['--prefix', 'server', 'run', 'dev'], { ...process.env, PORT: String(apiPort) }),
    start('client', ['--prefix', 'client', 'run', 'dev'], {
      ...process.env,
      VITE_PROXY_TARGET: apiTarget,
    }),
  ];

  let shuttingDown = false;
  function shutdown() {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log('\n[dev] Shutting down...');
    children.forEach((child) => {
      try {
        child.kill();
      } catch {
        /* ignore */
      }
    });
    process.exit(0);
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[dev] failed to start', err);
  process.exit(1);
});
