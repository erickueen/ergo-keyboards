#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const KEYBOARDS = {
  Urchin: 'keyboards/urchin/config/urchin.keymap',
  Corne: 'keyboards/corne/config/corne.keymap',
  GO60: 'keyboards/go60/config/go60.keymap',
  Glove80: 'keyboards/glove80/config/glove80.keymap',
};

const SHARED = {
  Urchin: [
    23, 24, 25, 26, 27, 28, 29, 30, 31, 32,
    35, 36, 37, 38, 39, 40, 41, 42, 43, 44,
    64, 48, 49, 50, 51, 58, 59, 60, 61, 62,
    70, 71, 72, 73,
  ],
  Corne: [
    22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33,
    34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45,
    64, 47, 48, 49, 50, 51, 58, 59, 60, 61, 62, 63,
    69, 70, 71, 72, 73, 74,
  ],
  GO60: [
    10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
    22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33,
    34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45,
    64, 47, 48, 49, 50, 51, 58, 59, 60, 61, 62, 63,
    65, 67, 68, 75, 76, 79,
    69, 70, 71, 72, 73, 74,
  ],
  Glove80: Array.from({ length: 80 }, (_, index) => index),
};

const REQUIRED_LAYERS = [
  'HRM_macOS', 'Typing', 'Autoshift',
  'LeftPinky', 'LeftRingy', 'LeftMiddy', 'LeftIndex',
  'RightPinky', 'RightRingy', 'RightMiddy', 'RightIndex',
  'Cursor', 'Keypad', 'Symbol', 'Number',
  'Mouse', 'MouseSlow', 'MouseFast', 'MouseWarp',
];

const MAGIC_SHARED_POSITIONS = new Set([64]);
const THUMB_SHARED_POSITIONS = new Set([69, 70, 71, 72, 73, 74]);
const CANONICAL_THUMB_ACCESS = {
  Urchin: [
    [70, '&thumb LAYER_Cursor BSPC'],
    [71, '&thumb LAYER_Keypad TAB'],
    [72, '&thumb LAYER_Number ESC'],
    [73, '&space LAYER_Symbol SPACE'],
  ],
  Corne: [
    [70, '&thumb LAYER_Cursor BSPC'],
    [71, '&thumb LAYER_Keypad TAB'],
    [72, '&thumb LAYER_Number ESC'],
    [73, '&space LAYER_Symbol SPACE'],
  ],
  GO60: [
    [69, '&thumb LAYER_Cursor BSPC'],
    [70, '&thumb LAYER_Keypad TAB'],
    [73, '&thumb LAYER_Number ESC'],
    [74, '&space LAYER_Symbol SPACE'],
  ],
  Glove80: [
    [69, '&thumb LAYER_Cursor BSPC'],
    [70, '&thumb LAYER_Keypad TAB'],
    [73, '&thumb LAYER_Number ESC'],
    [74, '&space LAYER_Symbol SPACE'],
  ],
};
const EXTRA_THUMB_KEYS = {
  GO60: [
    [71, '&kp LALT'],
    [72, '&kp RALT'],
  ],
  Glove80: [
    [71, '&kp LALT'],
    [72, '&kp RALT'],
  ],
};

function readLayers(name) {
  const source = fs.readFileSync(path.join(root, KEYBOARDS[name]), 'utf8');
  const keymapStart = source.lastIndexOf('compatible = "zmk,keymap"');
  const keymap = keymapStart >= 0 ? source.slice(keymapStart) : source;
  const layers = new Map();
  for (const match of keymap.matchAll(/layer_(\w+)\s*\{[\s\S]*?bindings\s*=\s*<([\s\S]*?)>\s*;/g)) {
    layers.set(match[1], splitBindings(match[2]));
  }
  return layers;
}

function splitBindings(block) {
  const tokens = block.trim().split(/\s+/).filter(Boolean);
  const bindings = [];
  let current = null;
  for (const token of tokens) {
    if (token.startsWith('&')) {
      if (current) bindings.push(current.join(' '));
      current = [token];
    } else if (current) current.push(token);
  }
  if (current) bindings.push(current.join(' '));
  return bindings;
}

function byShared(name, bindings) {
  return new Map(SHARED[name].map((sharedIndex, bindingIndex) => [sharedIndex, bindings[bindingIndex] ?? '<missing>']));
}

function canonical(binding) {
  return String(binding)
    .replace(/&HRM_left_pinky_v\w+\s+/g, '&lP ')
    .replace(/&HRM_left_ring_v\w+\s+/g, '&lR ')
    .replace(/&HRM_left_middy_v\w+\s+/g, '&lM ')
    .replace(/&HRM_left_index_v\w+\s+/g, '&lI ')
    .replace(/&HRM_right_index_v\w+\s+/g, '&rI ')
    .replace(/&HRM_right_middy_v\w+\s+/g, '&rM ')
    .replace(/&HRM_right_ring_v\w+\s+/g, '&rR ')
    .replace(/&HRM_right_pinky_v\w+\s+/g, '&rP ')
    .replace(/&HRM_left_(pinky|ring|middy|index)_tap_v\w+\s+/g, (_m, _finger) => `&${leftTapName(_finger)} `)
    .replace(/&HRM_right_(pinky|ring|middy|index)_tap_v\w+\s+/g, (_m, _finger) => `&${rightTapName(_finger)} `)
    .replace(/&HRM_left_pinky_(ring|middy|index)_v\w+\s+/g, (_m, finger) => `&lP_${shortFinger(finger)} `)
    .replace(/&HRM_left_ring_(pinky|middy|index)_v\w+\s+/g, (_m, finger) => `&lR_${shortFinger(finger)} `)
    .replace(/&HRM_left_middy_(pinky|ring|index)_v\w+\s+/g, (_m, finger) => `&lM_${shortFinger(finger)} `)
    .replace(/&HRM_left_index_(pinky|ring|middy)v?\w*\s+/g, (_m, finger) => `&lI_${shortFinger(finger)} `)
    .replace(/&HRM_right_pinky_(index|middy|ring)_v\w+\s+/g, (_m, finger) => `&rP_${shortFinger(finger)} `)
    .replace(/&HRM_right_ring_(index|middy|pinky)_v\w+\s+/g, (_m, finger) => `&rR_${shortFinger(finger)} `)
    .replace(/&HRM_right_middy_(index|ring|pinky)_v\w+\s+/g, (_m, finger) => `&rM_${shortFinger(finger)} `)
    .replace(/&HRM_right_index_(middy|ring|pinky)_v\w+\s+/g, (_m, finger) => `&rI_${shortFinger(finger)} `)
    .replace(/&AS_v\w+\s+/g, '&AS_macro ')
    .replace(/&thumb_v\w+\s+/g, '&thumb ')
    .replace(/&space_v\w+\s+/g, '&space ')
    .replace(/_macos_v\w+\b/g, '')
    .replace(/_v\w+_TKZ\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function leftTapName(finger) {
  return ({ pinky: 'lP_tap', ring: 'lR_tap', middy: 'lM_tap', index: 'lI_tap' })[finger];
}

function rightTapName(finger) {
  return ({ pinky: 'rP_tap', ring: 'rR_tap', middy: 'rM_tap', index: 'rI_tap' })[finger];
}

function shortFinger(finger) {
  return ({ pinky: 'p', ring: 'r', middy: 'm', index: 'i' })[finger];
}

function isException(layer, sharedPosition) {
  if (layer === 'Magic') return true;
  if (MAGIC_SHARED_POSITIONS.has(sharedPosition)) return true;
  if (THUMB_SHARED_POSITIONS.has(sharedPosition)) return true;
  return false;
}

function verifyCanonicalThumbAccess(allLayers) {
  const failures = [];
  for (const [keyboard, layers] of Object.entries(allLayers)) {
    for (const [layer, bindings] of layers) {
      if (layer === 'Magic') continue;
      const mapped = byShared(keyboard, bindings);
      for (const [sharedPosition, expectedBinding] of [...CANONICAL_THUMB_ACCESS[keyboard], ...(EXTRA_THUMB_KEYS[keyboard] ?? [])]) {
        const actual = canonical(mapped.get(sharedPosition));
        const expected = canonical(expectedBinding);
        if (actual !== expected) failures.push(`${keyboard} ${layer} shared ${sharedPosition}: expected canonical thumb access "${expected}", got "${actual}"`);
      }
    }
  }
  return failures;
}

function verify() {
  const allLayers = Object.fromEntries(Object.keys(KEYBOARDS).map((name) => [name, readLayers(name)]));
  const failures = verifyCanonicalThumbAccess(allLayers);
  for (const layer of REQUIRED_LAYERS) {
    const baseBindings = allLayers.Urchin.get(layer);
    if (!baseBindings) failures.push(`Urchin is missing required layer ${layer}`);
    const base = byShared('Urchin', baseBindings ?? []);
    for (const target of ['Corne', 'GO60', 'Glove80']) {
      const targetBindings = allLayers[target].get(layer);
      if (!targetBindings) {
        failures.push(`${target} is missing required layer ${layer}`);
        continue;
      }
      const mapped = byShared(target, targetBindings);
      for (const sharedPosition of SHARED.Urchin) {
        if (isException(layer, sharedPosition)) continue;
        const expected = canonical(base.get(sharedPosition));
        const actual = canonical(mapped.get(sharedPosition));
        if (expected !== actual) failures.push(`${target} ${layer} shared ${sharedPosition}: expected "${expected}", got "${actual}"`);
      }
    }
  }
  if (failures.length) {
    console.error(`Urchin parity failed with ${failures.length} issue(s):`);
    for (const failure of failures.slice(0, 120)) console.error(`- ${failure}`);
    if (failures.length > 120) console.error(`- ... ${failures.length - 120} more`);
    process.exit(1);
  }
  console.log('Urchin parity check passed');
}

verify();
