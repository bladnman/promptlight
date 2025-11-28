#!/usr/bin/env node
import { spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Load .env.local if it exists
const envLocalPath = resolve(process.cwd(), '.env.local');
if (existsSync(envLocalPath)) {
  const content = readFileSync(envLocalPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex > 0) {
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim();
      if (key && value) {
        process.env[key] = value;
      }
    }
  }
}

const port = process.env.VITE_PORT || '1420';
const configOverride = JSON.stringify({
  build: { devUrl: `http://localhost:${port}` }
});

console.log(`Starting dev server on port ${port}`);

const child = spawn('npx', ['tauri', 'dev', '-c', configOverride], {
  stdio: 'inherit',
  env: { ...process.env, VITE_PORT: port }
});

child.on('exit', (code) => process.exit(code || 0));
