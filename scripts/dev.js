#!/usr/bin/env node
'use strict';

/**
 * Starts the API server and the Vite dev server together with a single command.
 *
 *   npm run dev
 *
 * No extra dependency required. Press Ctrl+C once to stop both processes.
 */

const { spawn } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');
const isWindows = process.platform === 'win32';
const npm = isWindows ? 'npm.cmd' : 'npm';

const targets = [
  { name: 'server', args: ['--prefix', 'server', 'run', 'dev'] },
  { name: 'client', args: ['--prefix', 'client', 'run', 'dev'] },
];

const children = targets.map(({ name, args }) => {
  // On Windows `npm` is `npm.cmd`, which needs a shell to execute. Passing a
  // single command string (instead of an args array) avoids the DEP0190 warning.
  const child = isWindows
    ? spawn([npm, ...args].join(' '), { cwd: root, stdio: 'inherit', shell: true })
    : spawn(npm, args, { cwd: root, stdio: 'inherit' });
  child.on('exit', (code) => {
    if (code) console.log(`\n[dev] ${name} stopped with exit code ${code}.`);
  });
  return child;
});

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
