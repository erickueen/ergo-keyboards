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
  Urchin: [23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 47, 48, 49, 50, 51, 58, 59, 60, 61, 62, 70, 71, 72, 73],
  Corne: [22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 64, 47, 48, 49, 50, 51, 58, 59, 60, 61, 62, 63, 69, 70, 71, 72, 73, 74],
  GO60: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 64, 47, 48, 49, 50, 51, 58, 59, 60, 61, 62, 63, 65, 67, 68, 75, 76, 79, 69, 70, 71, 72, 73, 74],
  Glove80: Array.from({ length: 80 }, (_, index) => index),
};

const ROWS = {
  Urchin: [10, 10, 10, 4],
  Corne: [12, 12, 12, 6],
  GO60: [12, 12, 12, 12, 6, 6],
  Glove80: [10, 12, 12, 12, 18, 16],
};

const SYNC_LAYERS = ['Cursor', 'Keypad', 'Symbol', 'Number', 'Mouse', 'MouseSlow', 'MouseFast', 'MouseWarp'];
const SKIP_SHARED = new Set([64, 69, 70, 71, 72, 73, 74]);
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

const LAYER_THUMB_OVERRIDES = {
  Symbol: {
    Urchin: [[70, '&kp GLOBE'], [71, '&kp LS(N2)'], [72, '&none'], [73, '&none']],
    Corne: [[70, '&kp GLOBE'], [71, '&kp LS(N2)'], [72, '&none'], [73, '&none']],
    GO60: [[69, '&kp GLOBE'], [70, '&kp LS(N2)'], [73, '&none'], [74, '&none']],
    Glove80: [[69, '&kp GLOBE'], [70, '&kp LS(N2)'], [73, '&none'], [74, '&none']],
  },
  Cursor: {
    Urchin: [[72, '&kp RET']],
    Corne: [[72, '&kp RET']],
    GO60: [[73, '&kp RET']],
    Glove80: [[73, '&kp RET']],
  },
  Number: {
    Urchin: [[73, '&space LAYER_Mouse SPACE']],
    Corne: [[73, '&space LAYER_Mouse SPACE']],
    GO60: [[74, '&space LAYER_Mouse SPACE']],
    Glove80: [[74, '&space LAYER_Mouse SPACE']],
  },
};

const TARGET_BINDING_ALIASES = {
  GO60: [
    [/&cur_SELECT_LINE\b/g, '&cur_SELECT_LINE_macos_v1_TKZ'],
    [/&cur_SELECT_WORD\b/g, '&cur_SELECT_WORD_macos_v1_TKZ'],
    [/&cur_SELECT_NONE\b/g, '&cur_SELECT_NONE_v1_TKZ'],
    [/&cur_EXTEND_LINE\b/g, '&cur_EXTEND_LINE_macos_v1_TKZ'],
    [/&cur_EXTEND_WORD\b/g, '&cur_EXTEND_WORD_macos_v1_TKZ'],
    [/&space\b/g, '&space_v3_TKZ'],
    [/&thumb\b/g, '&thumb_v2_TKZ'],
  ],
  Glove80: [
    [/&cur_SELECT_LINE\b/g, '&cur_SELECT_LINE_macos_v1_TKZ'],
    [/&cur_SELECT_WORD\b/g, '&cur_SELECT_WORD_macos_v1_TKZ'],
    [/&cur_SELECT_NONE\b/g, '&cur_SELECT_NONE_v1_TKZ'],
    [/&cur_EXTEND_LINE\b/g, '&cur_EXTEND_LINE_macos_v1_TKZ'],
    [/&cur_EXTEND_WORD\b/g, '&cur_EXTEND_WORD_macos_v1_TKZ'],
    [/&space\b/g, '&space_v3_TKZ'],
    [/&thumb\b/g, '&thumb_v2_TKZ'],
  ],
};

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

function parseLayers(source) {
  const layers = new Map();
  const regex = /(\n\s*layer_(\w+)\s*\{[\s\S]*?bindings\s*=\s*<)([\s\S]*?)(>\s*;[\s\S]*?\n\s*\};)/g;
  for (const match of source.matchAll(regex)) {
    layers.set(match[2], { full: match[0], prefix: match[1], body: match[3], suffix: match[4], bindings: splitBindings(match[3]) });
  }
  return layers;
}

function bindingForTarget(target, binding) {
  return (TARGET_BINDING_ALIASES[target] ?? []).reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), binding);
}

function thumbAccessForLayer(target, layerName) {
  const access = new Map(CANONICAL_THUMB_ACCESS[target]);
  for (const [sharedIndex, binding] of LAYER_THUMB_OVERRIDES[layerName]?.[target] ?? []) access.set(sharedIndex, binding);
  return [...access.entries()];
}

function syncBindings(target, baseBindings, targetBindings) {
  const result = targetBindings ? [...targetBindings] : Array.from({ length: SHARED[target].length }, () => '&trans');
  const baseByShared = new Map(SHARED.Urchin.map((sharedIndex, index) => [sharedIndex, baseBindings[index]]));
  SHARED[target].forEach((sharedIndex, targetIndex) => {
    if (!baseByShared.has(sharedIndex) || SKIP_SHARED.has(sharedIndex)) return;
    result[targetIndex] = bindingForTarget(target, baseByShared.get(sharedIndex));
  });
  return result;
}

function formatBindings(target, bindings) {
  const rows = [];
  let index = 0;
  for (const count of ROWS[target]) {
    rows.push(`   ${bindings.slice(index, index + count).join('  ')}`);
    index += count;
  }
  return `\n${rows.join('\n')}\n`;
}

function layerBlock(layer, target, bindings) {
  return `

        layer_${layer} {
            display-name = "${displayName(layer)}";
            bindings = <${formatBindings(target, bindings)}            >;
        };`;
}

function normalizeThumbAccess(target, source) {
  let next = source;
  let layers = parseLayers(next);
  for (const [layerName, layer] of layers) {
    if (layerName === 'Magic') continue;
    const bindings = [...layer.bindings];
    let changed = false;
    for (const [sharedIndex, binding] of [...thumbAccessForLayer(target, layerName), ...(EXTRA_THUMB_KEYS[target] ?? [])]) {
      const bindingIndex = SHARED[target].indexOf(sharedIndex);
      if (bindingIndex === -1 || bindingIndex >= bindings.length) continue;
      const targetBinding = bindingForTarget(target, binding);
      if (bindings[bindingIndex] === targetBinding) continue;
      bindings[bindingIndex] = targetBinding;
      changed = true;
    }
    if (!changed) continue;
    next = next.replace(layer.full, `${layer.prefix}${formatBindings(target, bindings)}${layer.suffix}`);
    layers = parseLayers(next);
  }
  return next;
}

function displayName(layer) {
  return ({ Keypad: 'PAD', Number: 'NUM', Mouse: 'MOUSE', MouseSlow: 'MSLOW', MouseFast: 'MFAST', MouseWarp: 'MWARP' })[layer] ?? layer.toUpperCase();
}

function ensureDefine(source, define, value) {
  const fallbackIndex = source.search(/\n(?:\/\* To deal with[\s\S]*?\*\/\n)?#ifndef\s+LAYER_Lower\b/);
  const topLevelSource = fallbackIndex === -1 ? source : source.slice(0, fallbackIndex);
  if (new RegExp(`^#define\\s+${define}\\b`, 'm').test(topLevelSource)) return source;

  const withoutStaleDefine = source.replace(new RegExp(`\n#define\\s+${define}\\s+\\d+\n`, 'g'), '\n');
  const insertIndex = withoutStaleDefine.search(/\n(?:\/\* To deal with[\s\S]*?\*\/\n)?#ifndef\s+LAYER_Lower\b/);
  const insertionSource = insertIndex === -1 ? withoutStaleDefine : withoutStaleDefine.slice(0, insertIndex);
  const layerDefines = [...insertionSource.matchAll(/^#define\s+LAYER_\S+\s+\d+$/gm)];
  const last = layerDefines.at(-1);
  if (!last) throw new Error(`No layer defines found for ${define}`);
  const offset = last.index + last[0].length;
  return `${withoutStaleDefine.slice(0, offset)}\n#define ${define} ${value}${withoutStaleDefine.slice(offset)}`;
}

function syncTarget(target, source, baseLayers) {
  let next = source;
  if (target === 'GO60') next = ensureDefine(next, 'LAYER_Number', 19);
  if (target === 'Glove80') {
    next = ensureDefine(next, 'LAYER_Keypad', 19);
    next = ensureDefine(next, 'LAYER_Number', 20);
  }
  if (target === 'GO60') next = next.replace('&thumb_v2_TKZ LAYER_Mouse ESC', '&thumb_v2_TKZ LAYER_Number ESC');
  if (target === 'Glove80') {
    next = next.replace('&kp TAB  &kp LALT   &kp RALT  &thumb_v2_TKZ LAYER_Mouse ESC', '&thumb_v2_TKZ LAYER_Keypad TAB  &kp LALT   &kp RALT  &thumb_v2_TKZ LAYER_Number ESC');
  }
  next = normalizeThumbAccess(target, next);

  let targetLayers = parseLayers(next);
  for (const layer of SYNC_LAYERS) {
    const base = baseLayers.get(layer);
    if (!base) continue;
    const current = targetLayers.get(layer);
    const synced = syncBindings(target, base.bindings, current?.bindings);
    if (current) {
      next = next.replace(current.full, `${current.prefix}${formatBindings(target, synced)}${current.suffix}`);
    } else {
      const magic = parseLayers(next).get('Magic');
      if (!magic) throw new Error(`${target} missing Magic layer; cannot insert ${layer}`);
      next = next.replace(magic.full, `${magic.full}${layerBlock(layer, target, synced)}`);
    }
    targetLayers = parseLayers(next);
  }
  return normalizeThumbAccess(target, next);
}

const baseFile = path.join(root, KEYBOARDS.Urchin);
const originalBaseSource = fs.readFileSync(baseFile, 'utf8');
const baseSource = normalizeThumbAccess('Urchin', originalBaseSource);
if (baseSource !== originalBaseSource) {
  fs.writeFileSync(baseFile, baseSource);
  console.log('Urchin: normalized thumb layer access');
}
const baseLayers = parseLayers(baseSource);

for (const target of ['Corne', 'GO60', 'Glove80']) {
  const file = path.join(root, KEYBOARDS[target]);
  const before = fs.readFileSync(file, 'utf8');
  const after = syncTarget(target, before, baseLayers);
  if (after !== before) {
    fs.writeFileSync(file, after);
    console.log(`${target}: synced Urchin parity layers`);
  } else {
    console.log(`${target}: already in sync`);
  }
}
