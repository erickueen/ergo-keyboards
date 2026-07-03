#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const keymapPath = path.join(root, 'config', 'urchin.keymap');
const outDir = path.join(root, 'docs', 'images');

const KW = 48;
const KH = 48;

const keyPos = [
  { x: 0, y: 48 },
  { x: 48, y: 18 },
  { x: 96, y: 0 },
  { x: 144, y: 18 },
  { x: 192, y: 27.6 },
  { x: 393.6, y: 27.6 },
  { x: 441.6, y: 18 },
  { x: 489.6, y: 0 },
  { x: 537.6, y: 18 },
  { x: 585.6, y: 48 },
  { x: 0, y: 96 },
  { x: 48, y: 66 },
  { x: 96, y: 48 },
  { x: 144, y: 66 },
  { x: 192, y: 75.6 },
  { x: 393.6, y: 75.6 },
  { x: 441.6, y: 66 },
  { x: 489.6, y: 48 },
  { x: 537.6, y: 66 },
  { x: 585.6, y: 96 },
  { x: 0, y: 144 },
  { x: 48, y: 114 },
  { x: 96, y: 96 },
  { x: 144, y: 114 },
  { x: 192, y: 123.6 },
  { x: 393.6, y: 123.6 },
  { x: 441.6, y: 114 },
  { x: 489.6, y: 96 },
  { x: 537.6, y: 114 },
  { x: 585.6, y: 144 },
  { x: 168, y: 178.8, r: 15 },
  { x: 225.6, y: 200.4, r: 30 },
  { x: 360, y: 200.4, r: -30 },
  { x: 417.6, y: 178.8, r: -15 },
];

const COLORS = {
  rosewater: '#f4dbd6',
  flamingo: '#f0c6c6',
  pink: '#f5bde6',
  mauve: '#c6a0f6',
  red: '#ed8796',
  peach: '#f5a97f',
  yellow: '#eed49f',
  green: '#a6da95',
  teal: '#8bd5ca',
  sky: '#91d7e3',
  sapphire: '#7dc4e4',
  blue: '#8aadf4',
  lavender: '#b7bdf8',
  text: '#cad3f5',
  subtext1: '#b8c0e0',
  subtext0: '#a5adcb',
  overlay2: '#939ab7',
  overlay1: '#8087a2',
  overlay0: '#6e738d',
  surface1: '#494d64',
  surface0: '#363a4f',
  base: '#24273a',
  mantle: '#1e2030',
  crust: '#181926',
};

const KEY_TYPES = {
  alpha: { fill: COLORS.lavender, label: 'Alpha' },
  hrm: { fill: COLORS.mauve, label: 'HRM/Bilateral' },
  nav: { fill: COLORS.blue, label: 'Navigation' },
  mod: { fill: COLORS.green, label: 'Modifier' },
  layer: { fill: COLORS.peach, label: 'Layer Switch' },
  symbol: { fill: COLORS.yellow, label: 'Symbol' },
  number: { fill: COLORS.sapphire, label: 'Number / F-Key' },
  bt: { fill: COLORS.mauve, label: 'Bluetooth' },
  rgb: { fill: COLORS.pink, label: 'RGB' },
  system: { fill: COLORS.overlay2, label: 'System' },
  trans: { fill: COLORS.surface0, label: 'Transparent' },
  none: { fill: COLORS.crust, label: 'None' },
  macro: { fill: COLORS.red, label: 'Macro' },
  sticky: { fill: COLORS.rosewater, label: 'Sticky Mod' },
  as: { fill: COLORS.teal, label: 'AutoShift' },
  media: { fill: COLORS.sky, label: 'Media' },
  kp: { fill: COLORS.green, label: 'Keypad' },
};

const LAYER_META = {
  HRM_macOS: {
    id: 'hrm',
    name: 'HRM macOS',
    desc: 'Base layer with bilateral Home Row Mods on the Urchin 3x5+2 layout. Hold home row keys for Ctrl/Alt/GUI/Shift.',
  },
  Typing: {
    id: 'typing',
    name: 'Typing',
    desc: 'Plain typing layer that removes home-row mod behavior from the alpha home row.',
  },
  Autoshift: {
    id: 'autoshift',
    name: 'Autoshift',
    desc: 'AutoShift: hold any key briefly to get its shifted version. Wraps all alphas.',
  },
  LeftPinky: { id: 'lpinky', name: 'L-Pinky', desc: 'Holding left pinky (A/Ctrl). Purple keys are bilateral taps while Ctrl is held.' },
  LeftRingy: { id: 'lring', name: 'L-Ring', desc: 'Holding left ring (S/Alt). Bilateral tapping for Alt.' },
  LeftMiddy: { id: 'lmiddy', name: 'L-Middle', desc: 'Holding left middle (D/GUI). Bilateral tapping for GUI.' },
  LeftIndex: { id: 'lindex', name: 'L-Index', desc: 'Holding left index (F/Shift). Bilateral tapping for Shift.' },
  RightPinky: { id: 'rpinky', name: 'R-Pinky', desc: 'Holding right pinky (; / Ctrl). Bilateral tapping for Ctrl.' },
  RightRingy: { id: 'rring', name: 'R-Ring', desc: 'Holding right ring (L/Alt). Bilateral tapping for Alt.' },
  RightMiddy: { id: 'rmiddy', name: 'R-Middle', desc: 'Holding right middle (K/GUI). Bilateral tapping for GUI.' },
  RightIndex: { id: 'rindex', name: 'R-Index', desc: 'Holding right index (J/Shift). Bilateral tapping for Shift.' },
  Cursor: { id: 'cursor', name: 'Cursor', desc: 'Navigation and text editing. Hold the left Backspace thumb to access.' },
  Keypad: { id: 'keypad', name: 'Keypad', desc: 'Numpad, navigation, clipboard, and number access. Hold the left Escape thumb to access.' },
  Symbol: { id: 'symbol', name: 'Symbol', desc: 'Go60-style Symbol layer adapted to the Urchin key count.' },
  Magic: { id: 'magic', name: 'Magic', desc: 'System controls: Bluetooth, RGB, bootloader, reset, media, output, and LED power.' },
  Number: { id: 'number', name: 'Number', desc: 'Desktop shortcut number row. Hold RET to access. Home row keeps pure modifiers only.' },
};

const LAYER_SHORT_NAMES = {
  LAYER_HRM_macOS: 'Base',
  LAYER_Typing: 'Type',
  LAYER_Autoshift: 'AS',
  LAYER_LeftPinky: 'LP',
  LAYER_LeftRingy: 'LR',
  LAYER_LeftMiddy: 'LM',
  LAYER_LeftIndex: 'LI',
  LAYER_RightPinky: 'RP',
  LAYER_RightRingy: 'RR',
  LAYER_RightMiddy: 'RM',
  LAYER_RightIndex: 'RI',
  LAYER_Cursor: 'Cursor',
  LAYER_Keypad: 'Keypad',
  LAYER_Symbol: 'Symbol',
  LAYER_Magic: 'Magic',
  LAYER_Number: 'Number',
};

const KEY_LABELS = {
  BSLH: '\\', SQT: "'", SEMI: ';', COMMA: ',', DOT: '.', FSLH: '/', GRAVE: '`',
  LBKT: '[', RBKT: ']', EQUAL: '=', MINUS: '-', SPACE: 'SPC', BSPC: 'BSPC', RET: 'RET',
  ESC: 'ESC', TAB: 'TAB', DEL: 'DEL', CAPS: 'Caps', PSCRN: 'PScr',
  LCTRL: 'Ctrl', RCTRL: 'Ctrl', LALT: 'Alt', RALT: 'RAlt', LGUI: 'Gui', RGUI: 'Gui', LSHFT: 'Shift', RSHFT: 'Shift',
  LEFT: 'Left', RIGHT: 'Right', UP: 'Up', DOWN: 'Down', HOME: 'Home', END: 'End', PG_UP: 'PgUp', PG_DN: 'PgDn',
  KP_N0: '0', KP_N1: '1', KP_N2: '2', KP_N3: '3', KP_N4: '4', KP_N5: '5', KP_N6: '6', KP_N7: '7', KP_N8: '8', KP_N9: '9',
  KP_MINUS: '-', KP_SLASH: '/', KP_PLUS: '+', KP_MULTIPLY: '*', KP_NUM: 'Num', KP_ENTER: 'Enter', KP_DOT: '.',
  C_MUTE: 'Mute', C_VOLUME_DOWN: 'Vol-', C_VOLUME_UP: 'Vol+', C_PREV: 'Prev', C_PP: 'Play', C_NEXT: 'Next',
  GLOBE: 'Globe',
};

const SHIFT_LABELS = {
  'LS(N1)': '!', 'LS(N2)': '@', 'LS(N3)': '#', 'LS(N4)': '$', 'LS(N5)': '%', 'LS(N6)': '^', 'LS(N7)': '&', 'LS(N8)': '*', 'LS(N9)': '(', 'LS(N0)': ')',
  'LS(GRAVE)': '~', 'LS(COMMA)': '<', 'LS(BSLH)': '|', 'LS(DOT)': '>', 'LS(LBKT)': '{', 'LS(RBKT)': '}', 'LS(FSLH)': '?', 'LS(SQT)': '"',
  'LS(MINUS)': '_', 'LS(SEMI)': ':', 'LS(TAB)': 'PrevTab',
};

const SHIFTED_SYMBOLS = new Set(Object.keys(SHIFT_LABELS).filter((keycode) => keycode !== 'LS(TAB)'));

const MACRO_LABELS = {
  cur_SELECT_LINE: 'SelLn',
  cur_SELECT_WORD: 'SelWd',
  cur_SELECT_NONE: 'SelNo',
  cur_EXTEND_LINE: 'ExtLn',
  cur_EXTEND_WORD: 'ExtWd',
  spanish_acute: "Lin'",
  bt_0: 'BT0',
  bt_1: 'BT1',
  bt_2: 'BT2',
  bt_3: 'BT3',
};

const MOD_PREFIXES = [
  ['LG', '⌘'],
  ['LA', '⌥'],
  ['LC', '⌃'],
  ['LS', '⇧'],
];

const HRM_HOLD_LABELS = {
  lP: 'Ctrl', lP_r: 'Alt', lP_m: 'GUI', lP_i: 'Shift',
  lR: 'Alt', lR_p: 'Ctrl', lR_m: 'GUI', lR_i: 'Shift',
  lM: 'GUI', lM_p: 'Ctrl', lM_r: 'Alt', lM_i: 'Shift',
  lI: 'Shift', lI_p: 'Ctrl', lI_r: 'Alt', lI_m: 'GUI',
  rP: 'Ctrl', rP_i: 'Shift', rP_m: 'GUI', rP_r: 'Alt',
  rR: 'Alt', rR_i: 'Shift', rR_m: 'GUI', rR_p: 'Ctrl',
  rM: 'GUI', rM_i: 'Shift', rM_r: 'Alt', rM_p: 'Ctrl',
  rI: 'Shift', rI_m: 'GUI', rI_r: 'Alt', rI_p: 'Ctrl',
};

const keymap = fs.readFileSync(keymapPath, 'utf8');

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function parseLayerIds(source) {
  const ids = new Map();
  const regex = /^#define\s+LAYER_(\S+)\s+(\d+)$/gm;
  for (const match of source.matchAll(regex)) {
    ids.set(match[1], Number(match[2]));
  }
  return ids;
}

function parseLayers(source) {
  const layerIds = parseLayerIds(source);
  const regex = /layer_(\w+)\s*\{([\s\S]*?)bindings\s*=\s*<([\s\S]*?)>\s*;/g;
  const layers = [];

  for (const match of source.matchAll(regex)) {
    const key = match[1];
    const body = match[2];
    const bindings = match[3];
    const display = body.match(/display-name\s*=\s*"([^"]+)"\s*;/)?.[1] ?? key;
    const meta = LAYER_META[key] ?? { id: slug(key), name: key, desc: display };

    layers.push({
      key,
      index: layerIds.get(key) ?? layers.length,
      id: meta.id,
      name: meta.name,
      display,
      desc: meta.desc,
      keys: splitBindings(bindings).map(bindingToKey),
    });
  }

  return layers.sort((a, b) => a.index - b.index);
}

function parseCombos(source) {
  const combos = [];
  const comboBlock = source.match(/combos\s*\{([\s\S]*?)\n\s*\};\n\s*};/);
  if (!comboBlock) return combos;

  const regex = /combo_(\w+)\s*\{([\s\S]*?)\};/g;
  for (const match of comboBlock[1].matchAll(regex)) {
    const name = match[1];
    const body = match[2];
    const positions = body.match(/key-positions\s*=\s*<([^>]+)>\s*;/)?.[1]
      ?.trim()
      .split(/\s+/)
      .map(Number)
      .filter(Number.isFinite) ?? [];
    const binding = splitBindings(body.match(/bindings\s*=\s*<([^>]+)>\s*;/)?.[1] ?? '')[0];
    const layers = body.match(/layers\s*=\s*<([^>]+)>\s*;/)?.[1]?.trim().split(/\s+/) ?? [];

    if (positions.length && binding) {
      combos.push({ name, positions, binding, layers, label: comboLabel(name, binding) });
    }
  }

  return combos;
}

function splitBindings(block) {
  const tokens = block.trim().split(/\s+/).filter(Boolean);
  const bindings = [];
  let current = null;

  for (const token of tokens) {
    if (token.startsWith('&')) {
      if (current) bindings.push(current);
      current = [token.slice(1)];
    } else if (current) {
      current.push(token);
    }
  }

  if (current) bindings.push(current);
  return bindings;
}

function bindingToKey(binding) {
  const [behavior, ...params] = binding;

  if (behavior === 'trans') return key('↓', 'trans');
  if (behavior === 'none') return key('—', 'none');
  if (behavior === 'kp') return keyFromKeycode(params[0]);
  if (behavior === 'sk') return key(`sk${keycodeToLabel(params[0]).replace('Shift', '⇧')}`, 'sticky');
  if (behavior === 'AS_macro') return key(keycodeToLabel(params[0]), 'as');
  if (behavior === 'magic') return params[1] && params[1] !== '0' ? key(keycodeToLabel(params[1]), 'layer', 'Magic') : key('Magic', 'layer', 'hold');
  if (behavior === 'td_LAYER_Keypad') return key('Pad', 'layer', '2x tap');
  if (behavior === 'space' || behavior === 'thumb' || behavior === 'enter_sym') {
    return key(keycodeToLabel(params[1]), 'layer', layerLabel(params[0]));
  }
  if (behavior === 'to') return key(`→${layerLabel(params[0])}`, 'system');
  if (behavior === 'bootloader') return key('Boot', 'system');
  if (behavior === 'sys_reset') return key('Rst', 'system');
  if (behavior === 'rgb_ug') return key(String(params[0]).replace(/^RGB_/, ''), 'rgb');
  if (behavior === 'bt') return key(params[0] === 'BT_CLR' ? 'BT_CLR' : `BT${params[1] ?? ''}`, 'bt');
  if (behavior === 'out') return key(String(params[0]).replace(/^OUT_/, ''), 'system');
  if (behavior === 'ext_power') return key(params[0] === 'EP_OFF' ? 'LED Off' : 'LED Tog', 'system');
  if (MACRO_LABELS[behavior]) return key(MACRO_LABELS[behavior], behavior.startsWith('bt_') ? 'bt' : 'macro');
  if (behavior.endsWith('_tap')) return key(keycodeToLabel(params[0]), 'hrm');
  if (HRM_HOLD_LABELS[behavior]) return key(keycodeToLabel(params.at(-1)), 'hrm', HRM_HOLD_LABELS[behavior]);

  return key(behavior, 'macro');
}

function key(tap, type = 'alpha', hold = null) {
  return { tap, type, hold };
}

function keyFromKeycode(keycode) {
  if (String(keycode).startsWith('C_')) return key(keycodeToLabel(keycode), 'media');
  if (String(keycode).startsWith('KP_')) return key(keycodeToLabel(keycode), 'kp');
  if (/^F\d+$/.test(String(keycode)) || /^N\d$/.test(String(keycode))) return key(keycodeToLabel(keycode), 'number');
  if (isModifier(keycode)) return key(keycodeToLabel(keycode), 'mod');
  if (isNavigation(keycode)) return key(keycodeToLabel(keycode), 'nav');
  if (SHIFTED_SYMBOLS.has(keycode) || keycode === 'LA(E)') return key(keycode === 'LA(E)' ? "Mac'" : keycodeToLabel(keycode), 'symbol');
  if (keycode === 'LS(TAB)') return key(keycodeToLabel(keycode), 'nav');
  if (SHIFT_LABELS[keycode] || isModifiedKey(keycode)) return key(formatModifiedKey(keycode), 'macro');
  if (isSymbol(keycode)) return key(keycodeToLabel(keycode), 'symbol');
  return key(keycodeToLabel(keycode), 'alpha');
}

function keycodeToLabel(keycode) {
  if (!keycode) return '';
  if (SHIFT_LABELS[keycode]) return SHIFT_LABELS[keycode];
  if (/^N\d$/.test(keycode)) return keycode.slice(1);
  if (/^[A-Z]$/.test(keycode)) return keycode;
  if (KEY_LABELS[keycode]) return KEY_LABELS[keycode];
  if (isModifiedKey(keycode)) return formatModifiedKey(keycode);
  return keycode;
}

function formatModifiedKey(keycode) {
  if (SHIFT_LABELS[keycode]) return SHIFT_LABELS[keycode];

  for (const [prefix, label] of MOD_PREFIXES) {
    const wrapped = `${prefix}(`;
    if (keycode.startsWith(wrapped) && keycode.endsWith(')')) {
      return `${label}${formatModifiedKey(keycode.slice(wrapped.length, -1))}`;
    }
  }

  return keycodeToLabel(keycode);
}

function isModifiedKey(keycode) {
  return MOD_PREFIXES.some(([prefix]) => String(keycode).startsWith(`${prefix}(`));
}

function isModifier(keycode) {
  return ['LCTRL', 'RCTRL', 'LALT', 'RALT', 'LGUI', 'RGUI', 'LSHFT', 'RSHFT'].includes(keycode);
}

function isNavigation(keycode) {
  return ['TAB', 'ESC', 'RET', 'BSPC', 'DEL', 'CAPS', 'LEFT', 'RIGHT', 'UP', 'DOWN', 'HOME', 'END', 'PG_UP', 'PG_DN', 'PSCRN'].includes(keycode);
}

function isSymbol(keycode) {
  return ['BSLH', 'SQT', 'SEMI', 'COMMA', 'DOT', 'FSLH', 'GRAVE', 'LBKT', 'RBKT', 'EQUAL', 'MINUS'].includes(keycode);
}

function layerLabel(value) {
  if (value === '0') return '0';
  return LAYER_SHORT_NAMES[value] ?? String(value).replace(/^LAYER_/, '');
}

function textColor(fill) {
  const r = parseInt(fill.slice(1, 3), 16) / 255;
  const g = parseInt(fill.slice(3, 5), 16) / 255;
  const b = parseInt(fill.slice(5, 7), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.5 ? COLORS.base : COLORS.text;
}

function wrapWords(text, maxChars) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines.slice(0, 3);
}

function fontSize(label) {
  if (label.length > 8) return 8;
  if (label.length > 6) return 9;
  if (label.length > 4) return 10;
  if (label.length > 2) return 12;
  return 17;
}

function comboLabel(name, binding) {
  const named = {
    capslock: 'Caps Lock',
    tab: 'Tab',
    sticky_hyp_rght: 'Hyper',
    sticky_meh_rght: 'Meh',
    F11: 'F11',
    F12: 'F12',
  };
  if (named[name]) return named[name];

  return bindingToKey(binding).tap;
}

function comboAppliesToLayer(combo, layer) {
  return combo.layers.length === 0 || combo.layers.includes(`LAYER_${layer.key}`);
}

function renderShortcuts(shortcuts, keyboardY) {
  if (shortcuts.length === 0) return '';

  const parts = [];
  const originX = 133;
  const originY = keyboardY + 14;
  const rows = 2;

  shortcuts.forEach((shortcut, index) => {
    const centers = shortcut.positions
      .map((position) => keyPos[position])
      .filter(Boolean)
      .map((pos) => ({ x: originX + pos.x + KW / 2, y: originY + pos.y + KH / 2 }));
    if (centers.length === 0) return;

    const minX = Math.min(...centers.map((center) => center.x));
    const maxX = Math.max(...centers.map((center) => center.x));
    const targetX = (minX + maxX) / 2;
    const row = index % rows;
    const labelY = keyboardY - 70 + row * 28;
    const labelWidth = Math.max(58, shortcut.label.length * 7 + 28);
    const labelX = Math.max(66, Math.min(854 - labelWidth, targetX - labelWidth / 2));
    const labelCenterX = labelX + labelWidth / 2;
    const lineEndY = keyboardY - 20;

    parts.push(`<g class="shortcut">`);
    centers.forEach((center) => {
      parts.push(`<path d="M ${labelCenterX.toFixed(1)} ${labelY + 20} C ${labelCenterX.toFixed(1)} ${lineEndY}, ${center.x.toFixed(1)} ${lineEndY}, ${center.x.toFixed(1)} ${center.y.toFixed(1)}"/>`);
      parts.push(`<circle cx="${center.x.toFixed(1)}" cy="${center.y.toFixed(1)}" r="4.2"/>`);
    });
    parts.push(`<rect x="${labelX.toFixed(1)}" y="${labelY}" width="${labelWidth}" height="22" rx="11"/>`);
    parts.push(`<text x="${labelCenterX.toFixed(1)}" y="${labelY + 15}">${esc(shortcut.label)}</text>`);
    parts.push(`</g>`);
  });

  return parts.join('\n  ');
}

function renderLegend(layer, x, y) {
  const usedTypes = [...new Set(layer.keys.map((keyData) => keyData.type).filter(Boolean))];
  let cursorX = x;
  let cursorY = y;
  const parts = [];

  for (const type of usedTypes) {
    const labelText = KEY_TYPES[type]?.label ?? type;
    const itemWidth = 34 + labelText.length * 7;
    if (cursorX + itemWidth > 850) {
      cursorX = x;
      cursorY += 26;
    }

    const fill = KEY_TYPES[type]?.fill ?? KEY_TYPES.alpha.fill;
    parts.push(`<rect x="${cursorX}" y="${cursorY - 12}" width="14" height="14" rx="3" fill="${fill}"/>`);
    parts.push(`<text x="${cursorX + 20}" y="${cursorY}" class="legend-text">${esc(labelText)}</text>`);
    cursorX += itemWidth;
  }

  return { svg: parts.join('\n'), bottom: cursorY + 8 };
}

function renderKey(keyData, pos) {
  const fill = KEY_TYPES[keyData.type]?.fill ?? KEY_TYPES.alpha.fill;
  const primary = textColor(fill);
  const hold = primary === COLORS.base ? 'rgba(36,39,58,0.70)' : COLORS.subtext1;
  const x = pos.x;
  const y = pos.y;
  const inner = [];
  const parts = pos.r ? [`<g transform="rotate(${pos.r} ${x + KW / 2} ${y + KH / 2})">`] : [];
  inner.push(`<rect class="key" x="${x}" y="${y}" width="${KW}" height="${KH}" rx="8" fill="${fill}"/>`);

  if (keyData.tap === '↓') {
    inner.push(`<text x="${x + KW / 2}" y="${y + KH / 2 + 1}" class="tap transparent">↓</text>`);
  } else if (keyData.tap !== '—') {
    const labelText = String(keyData.tap);
    const ty = keyData.hold ? y + KH / 2 - 6 : y + KH / 2 + 2;
    inner.push(`<text x="${x + KW / 2}" y="${ty}" class="tap" style="font-size:${fontSize(labelText)}px;fill:${primary}">${esc(labelText)}</text>`);
  }

  if (keyData.hold) {
    inner.push(`<text x="${x + KW / 2}" y="${y + KH - 9}" class="hold" style="fill:${hold}">${esc(keyData.hold)}</text>`);
  }

  parts.push(...inner);
  if (pos.r) parts.push('</g>');
  return parts.join('\n');
}

function renderLayer(layer) {
  if (layer.keys.length !== keyPos.length) {
    throw new Error(`${layer.key} has ${layer.keys.length} bindings; expected ${keyPos.length}`);
  }

  const descLines = wrapWords(layer.desc, 112);
  const legend = renderLegend(layer, 60, 106 + descLines.length * 18);
  const shortcuts = combos.filter((combo) => comboAppliesToLayer(combo, layer));
  const shortcutBand = shortcuts.length ? 68 : 0;
  const keyboardY = legend.bottom + 30 + shortcutBand;
  const height = keyboardY + 268;
  const layerNumber = String(layer.index).padStart(2, '0');
  const title = `${layerNumber} / ${layer.name}`;
  const keys = layer.keys.map((keyData, i) => renderKey(keyData, keyPos[i])).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="920" height="${height}" viewBox="0 0 920 ${height}" role="img" aria-labelledby="title desc">
  <title id="title">${esc(title)} Urchin keymap layer</title>
  <desc id="desc">${esc(layer.desc)}</desc>
  <style>
    .title { font: 800 28px Inter, Avenir Next, Segoe UI, sans-serif; fill: ${COLORS.text}; letter-spacing: .2px; }
    .subtitle { font: 500 14px Inter, Avenir Next, Segoe UI, sans-serif; fill: ${COLORS.subtext0}; }
    .legend-text { font: 600 12px Inter, Avenir Next, Segoe UI, sans-serif; fill: ${COLORS.subtext1}; }
    .half { font: 800 12px Inter, Avenir Next, Segoe UI, sans-serif; fill: ${COLORS.overlay1}; letter-spacing: 3px; text-anchor: middle; }
    .tap { font-family: Berkeley Mono, SFMono-Regular, Consolas, Liberation Mono, monospace; font-weight: 800; text-anchor: middle; dominant-baseline: central; }
    .tap.transparent { font-size: 16px; fill: ${COLORS.overlay0}; }
    .hold { font: 800 10px Inter, Avenir Next, Segoe UI, sans-serif; text-anchor: middle; dominant-baseline: central; }
    .key { stroke: rgba(202,211,245,.22); stroke-width: 1.4; }
    .shortcut path { fill: none; stroke: ${COLORS.teal}; stroke-width: 1.2; opacity: .62; stroke-linecap: round; }
    .shortcut circle { fill: ${COLORS.teal}; stroke: ${COLORS.base}; stroke-width: 1.5; }
    .shortcut rect { fill: ${COLORS.crust}; stroke: ${COLORS.teal}; stroke-width: 1.2; }
    .shortcut text { font: 800 11px Inter, Avenir Next, Segoe UI, sans-serif; fill: ${COLORS.text}; text-anchor: middle; letter-spacing: .2px; }
  </style>
  <rect x="0" y="0" width="920" height="${height}" rx="28" fill="${COLORS.base}"/>
  <circle cx="105" cy="42" r="140" fill="${COLORS.mauve}" opacity="0.10"/>
  <circle cx="790" cy="70" r="190" fill="${COLORS.blue}" opacity="0.10"/>
  <text x="60" y="50" class="title">${esc(title)}</text>
  ${descLines.map((line, i) => `<text x="60" y="${78 + i * 18}" class="subtitle">${esc(line)}</text>`).join('\n  ')}
  ${legend.svg}
  <rect x="117" y="${keyboardY - 24}" width="686" height="248" rx="22" fill="${COLORS.mantle}" stroke="${COLORS.surface1}" stroke-width="1.5"/>
  <text x="268" y="${keyboardY - 2}" class="half">LEFT</text>
  <text x="652" y="${keyboardY - 2}" class="half">RIGHT</text>
  <g transform="translate(133 ${keyboardY + 14})">
${keys.split('\n').map((line) => `    ${line}`).join('\n')}
  </g>
  ${renderShortcuts(shortcuts, keyboardY)}
</svg>
`;
}

const layers = parseLayers(keymap);
const combos = parseCombos(keymap);

fs.mkdirSync(outDir, { recursive: true });

for (const entry of fs.readdirSync(outDir)) {
  if (entry.startsWith('keymap-') && entry.endsWith('.svg')) {
    fs.unlinkSync(path.join(outDir, entry));
  }
}

for (const layer of layers) {
  const filename = `keymap-${String(layer.index).padStart(2, '0')}-${slug(layer.id)}.svg`;
  fs.writeFileSync(path.join(outDir, filename), renderLayer(layer));
}

console.log(`Generated ${layers.length} SVG files from ${path.relative(root, keymapPath)} in ${path.relative(root, outDir)}`);
