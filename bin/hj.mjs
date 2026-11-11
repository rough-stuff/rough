#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const tsx = require.resolve('tsx/cli');
const main = fileURLToPath(new URL('../src/cli/main.ts', import.meta.url));
const r = spawnSync(process.execPath, [tsx, main, ...process.argv.slice(2)], { stdio: 'inherit' });
process.exit(r.status ?? 1);
