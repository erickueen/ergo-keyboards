#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const KEYBOARDS = {
  urchin: 'keyboards/urchin/config/urchin.keymap',
  corne: 'keyboards/corne/config/corne.keymap',
  go60: 'keyboards/go60/config/go60.keymap',
  glove80: 'keyboards/glove80/config/glove80.keymap',
};

function usage() {
  console.error('Usage: node tools/generate-keymaps.mjs [--all] [--keyboard=name] [--check]');
}

function readSource(name) {
  const relative = KEYBOARDS[name];
  if (!relative) throw new Error(`Unknown keyboard: ${name}`);
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

function generatedPath(name) {
  return path.join(root, 'keymap/generated', name, `${name}.keymap`);
}

function generate(name, check) {
  const source = readSource(name);
  const target = generatedPath(name);

  if (check) {
    if (!fs.existsSync(target)) throw new Error(`Missing generated keymap: ${path.relative(root, target)}`);
    const current = fs.readFileSync(target, 'utf8');
    if (current !== source) throw new Error(`Generated keymap is stale: ${path.relative(root, target)}`);
    console.log(`${name}: generated keymap up to date`);
    return;
  }

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, source);
  console.log(`${name}: wrote ${path.relative(root, target)}`);
}

const args = process.argv.slice(2);
if (args.includes('--help')) {
  usage();
  process.exit(0);
}

const check = args.includes('--check');
const requested = args.includes('--all') || !args.some((arg) => arg.startsWith('--keyboard='))
  ? Object.keys(KEYBOARDS)
  : args.filter((arg) => arg.startsWith('--keyboard=')).map((arg) => arg.split('=')[1]);

for (const name of requested) generate(name, check);
