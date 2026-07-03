#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KW = 48;
const KH = 48;
const GAP = 6;
const SCALE = KW + GAP;
const OUTPUT_DIR = 'docs/keymaps';

const COLORS = {
  rosewater: '#f4dbd6',
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
  HRM_macOS: { id: 'hrm', name: 'HRM macOS', desc: 'Base layer rendered once on the shared superset layout with keyboard margins overlaid.' },
  Typing: { id: 'typing', name: 'Typing', desc: 'Plain typing layer that removes home-row mod behavior from the alpha home row.' },
  Autoshift: { id: 'autoshift', name: 'Autoshift', desc: 'AutoShift: hold a key briefly to get its shifted version.' },
  LeftPinky: { id: 'lpinky', name: 'L-Pinky', desc: 'Left pinky helper layer for bilateral home-row modifiers.' },
  LeftRingy: { id: 'lring', name: 'L-Ring', desc: 'Left ring helper layer for bilateral home-row modifiers.' },
  LeftMiddy: { id: 'lmiddy', name: 'L-Middle', desc: 'Left middle helper layer for bilateral home-row modifiers.' },
  LeftIndex: { id: 'lindex', name: 'L-Index', desc: 'Left index helper layer for bilateral home-row modifiers.' },
  RightPinky: { id: 'rpinky', name: 'R-Pinky', desc: 'Right pinky helper layer for bilateral home-row modifiers.' },
  RightRingy: { id: 'rring', name: 'R-Ring', desc: 'Right ring helper layer for bilateral home-row modifiers.' },
  RightMiddy: { id: 'rmiddy', name: 'R-Middle', desc: 'Right middle helper layer for bilateral home-row modifiers.' },
  RightIndex: { id: 'rindex', name: 'R-Index', desc: 'Right index helper layer for bilateral home-row modifiers.' },
  Cursor: { id: 'cursor', name: 'Cursor', desc: 'Navigation and text editing layer.' },
  Keypad: { id: 'keypad', name: 'Keypad', desc: 'Numpad, navigation, clipboard, and number access.' },
  Symbol: { id: 'symbol', name: 'Symbol', desc: 'Symbol and punctuation layer.' },
  Mouse: { id: 'mouse', name: 'Mouse', desc: 'Pointer movement, scrolling, and mouse button layer.' },
  MouseSlow: { id: 'mouse-slow', name: 'Mouse Slow', desc: 'Slow pointer/scroll scaling overlay.' },
  MouseFast: { id: 'mouse-fast', name: 'Mouse Fast', desc: 'Fast pointer/scroll scaling overlay.' },
  MouseWarp: { id: 'mouse-warp', name: 'Mouse Warp', desc: 'Warp-speed pointer/scroll scaling overlay.' },
  Lower: { id: 'lower', name: 'Lower', desc: 'Glove80 lower layer.' },
  Magic: { id: 'magic', name: 'Magic', desc: 'System controls: Bluetooth, RGB, bootloader, reset, media, and output selection.' },
  Number: { id: 'number', name: 'Number', desc: 'Number row and function key access.' },
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
  LAYER_Mouse: 'Mouse',
  LAYER_MouseSlow: 'MSlow',
  LAYER_MouseFast: 'MFast',
  LAYER_MouseWarp: 'MWarp',
  LAYER_Lower: 'Lower',
  LAYER_Magic: 'Magic',
  LAYER_Number: 'Number',
};

const KEY_LABELS = {
  BSLH: '\\', SQT: "'", SINGLE_QUOTE: "'", SEMI: ';', COMMA: ',', DOT: '.', FSLH: '/', GRAVE: '`',
  LBKT: '[', RBKT: ']', EQUAL: '=', MINUS: '-', SPACE: 'SPC', BSPC: 'BSPC', RET: 'RET', ENTER: 'Enter',
  ESC: 'ESC', TAB: 'TAB', DEL: 'DEL', INS: 'Ins', CAPS: 'Caps', PSCRN: 'PScr', PRINTSCREEN: 'PScr',
  PAUSE_BREAK: 'Pause', SLCK: 'ScrLk', SCROLLLOCK: 'ScrLk', K_APP: 'Menu',
  LCTRL: 'Ctrl', RCTRL: 'Ctrl', LALT: 'Alt', RALT: 'RAlt', LGUI: 'Gui', RGUI: 'Gui', LSHFT: 'Shift', RSHFT: 'Shift',
  LEFT: 'Left', RIGHT: 'Right', UP: 'Up', DOWN: 'Down', LEFT_ARROW: 'Left', RIGHT_ARROW: 'Right', UP_ARROW: 'Up', DOWN_ARROW: 'Down',
  HOME: 'Home', END: 'End', PG_UP: 'PgUp', PG_DN: 'PgDn',
  KP_N0: '0', KP_N1: '1', KP_N2: '2', KP_N3: '3', KP_N4: '4', KP_N5: '5', KP_N6: '6', KP_N7: '7', KP_N8: '8', KP_N9: '9',
  KP_MINUS: '-', KP_SLASH: '/', KP_PLUS: '+', KP_MULTIPLY: '*', KP_NUM: 'Num', KP_ENTER: 'Enter', KP_DOT: '.',
  C_MUTE: 'Mute', C_VOLUME_DOWN: 'Vol-', C_VOLUME_UP: 'Vol+', C_VOL_DN: 'Vol-', C_VOL_UP: 'Vol+', C_BRI_DN: 'Bri-', C_BRI_UP: 'Bri+',
  C_PREV: 'Prev', C_PP: 'Play', C_NEXT: 'Next', GLOBE: 'Globe',
};

const SHIFT_LABELS = {
  'LS(N1)': '!', 'LS(N2)': '@', 'LS(N3)': '#', 'LS(N4)': '$', 'LS(N5)': '%', 'LS(N6)': '^', 'LS(N7)': '&', 'LS(N8)': '*', 'LS(N9)': '(', 'LS(N0)': ')',
  'LS(GRAVE)': '~', 'LS(COMMA)': '<', 'LS(BSLH)': '|', 'LS(DOT)': '>', 'LS(LBKT)': '{', 'LS(RBKT)': '}', 'LS(FSLH)': '?', 'LS(SQT)': '"', 'LS(SINGLE_QUOTE)': '"',
  'LS(MINUS)': '_', 'LS(SEMI)': ':', 'LS(EQUAL)': '+', 'LS(TAB)': 'PrevTab',
};

const MOD_PREFIXES = [['LG', '⌘'], ['LA', '⌥'], ['LC', '⌃'], ['LS', '⇧']];
const SHIFTED_SYMBOLS = new Set(Object.keys(SHIFT_LABELS).filter((keycode) => keycode !== 'LS(TAB)'));

const MACRO_LABELS = {
  cur_SELECT_LINE: 'SelLn', cur_SELECT_WORD: 'SelWd', cur_SELECT_NONE: 'SelNo', cur_EXTEND_LINE: 'ExtLn', cur_EXTEND_WORD: 'ExtWd',
  cur_SELECT_LINE_macos_v1_TKZ: 'SelLn', cur_SELECT_WORD_macos_v1_TKZ: 'SelWd', cur_SELECT_NONE_v1_TKZ: 'SelNo', cur_EXTEND_LINE_macos_v1_TKZ: 'ExtLn', cur_EXTEND_WORD_macos_v1_TKZ: 'ExtWd',
  spanish_acute: "Lin'", bt_0: 'BT0', bt_1: 'BT1', bt_2: 'BT2', bt_3: 'BT3', mstr1_v1_TKZ: 'Macro', symb_dotdot_v1_TKZ: '..',
};

const SUPerset = createSupersetPositions();
const SHARED_POSITIONS = createHrmPreviewPositions();
const URCHIN_TO_SHARED = [
  23, 24, 25, 26, 27, 28, 29, 30, 31, 32,
  35, 36, 37, 38, 39, 40, 41, 42, 43, 44,
  64, 48, 49, 50, 51, 58, 59, 60, 61, 62,
  70, 71, 72, 73,
];
const CORNE_TO_SHARED = [
  22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33,
  34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45,
  64, 47, 48, 49, 50, 51, 58, 59, 60, 61, 62, 63,
  69, 70, 71, 72, 73, 74,
];
const GO60_TO_SHARED = [
  10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
  22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33,
  34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45,
  64, 47, 48, 49, 50, 51, 58, 59, 60, 61, 62, 63,
  65, 67, 68, 75, 76, 79,
  69, 70, 71, 72, 73, 74,
];
const GLOVE80_TO_SHARED = Array.from({ length: 80 }, (_, index) => index);
const KEYBOARDS = {
  urchin: {
    title: 'Urchin',
    keymap: 'keyboards/urchin/config/urchin.keymap',
    color: COLORS.teal,
    positions: createUrchinPositions(),
  },
  corne: {
    title: 'Corne',
    keymap: 'keyboards/corne/config/corne.keymap',
    color: COLORS.blue,
    positions: createCornePositions(),
  },
  go60: {
    title: 'GO60',
    keymap: 'keyboards/go60/config/go60.keymap',
    color: COLORS.peach,
    positions: createGo60Positions(),
  },
  glove80: {
    title: 'Glove80',
    keymap: 'keyboards/glove80/config/glove80.keymap',
    color: COLORS.mauve,
    positions: SUPerset,
  },
};

function u(x, y, r = 0) {
  return { x: x * SCALE, y: y * SCALE, r };
}

function createSupersetPositions() {
  return [
    ...row(4, 0, 5), ...row(10, 0, 5),
    ...row(1, 1, 6), ...row(11, 1, 6),
    ...row(1, 2, 6), ...row(11, 2, 6),
    ...row(1, 3, 6), ...row(11, 3, 6),
    ...row(0, 4, 6), ...row(6.3, 4.25, 6), ...row(12.7, 4, 6),
    ...row(0.7, 5.3, 5), ...row(5.7, 5.75, 6), ...row(12.0, 5.3, 5),
  ];
}

function createUrchinPositions() {
  return [
    ...row(2, 2, 5), ...row(11, 2, 5),
    ...row(2, 3, 5), ...row(11, 3, 5),
    ...row(2, 4, 5), ...row(11, 4, 5),
    u(5.1, 5.45, 15), u(6.25, 5.75, 30), u(11.75, 5.75, -30), u(12.9, 5.45, -15),
  ];
}

function createCornePositions() {
  return [
    ...row(1, 2, 6), ...row(11, 2, 6),
    ...row(1, 3, 6), ...row(11, 3, 6),
    ...row(1, 4, 6), ...row(11, 4, 6),
    u(4.7, 5.4, 0), u(5.8, 5.65, 10), u(6.9, 5.85, 20), u(11.1, 5.85, -20), u(12.2, 5.65, -10), u(13.3, 5.4, 0),
  ];
}

function createGo60Positions() {
  const infoPath = path.join(root, 'keyboards/go60/config/info.json');
  if (!fs.existsSync(infoPath)) return SUPerset.slice(10, 70);
  const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
  return info.layouts.LAYOUT.layout.map((entry) => u(entry.x + 0.7, entry.y + 0.45, entry.r ?? 0));
}

function row(startX, y, count) {
  return Array.from({ length: count }, (_, index) => u(startX + index, y));
}

function topTapRow(startX, y, count) {
  return row(startX, y, count).map((position) => ({ ...position, topTap: true }));
}

function createHrmPreviewPositions() {
  return [
    ...row(2.0, 0, 5), ...row(11.0, 0, 5),
    ...row(1.0, 1.2, 6), ...row(11.0, 1.2, 6),
    ...row(1.0, 2.4, 6), ...row(11.0, 2.4, 6),
    ...row(1.0, 3.6, 6), ...row(11.0, 3.6, 6),
    ...row(1.0, 4.8, 6), ...row(5.4, 7.2, 3), ...row(9.6, 7.2, 3), ...row(11.0, 4.8, 6),
    ...row(1.0, 6.0, 5), ...topTapRow(5.4, 8.5, 3), ...topTapRow(9.6, 8.5, 3), ...row(12.0, 6.0, 5),
  ];
}

function marginPositionsForLayer(positions) {
  const pick = (indexes) => indexes.map((index) => positions[index]).filter(Boolean);
  return [
    {
      title: 'Urchin',
      color: KEYBOARDS.urchin.color,
      positions: pick([
        23, 24, 25, 26, 27, 28, 29, 30, 31, 32,
        35, 36, 37, 38, 39, 40, 41, 42, 43, 44,
        47, 48, 49, 50, 51, 58, 59, 60, 61, 62,
        70, 71, 72, 73,
      ]),
    },
    {
      title: 'Corne',
      color: KEYBOARDS.corne.color,
      positions: pick([
        22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33,
        34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45,
        46, 47, 48, 49, 50, 51, 58, 59, 60, 61, 62, 63,
        69, 70, 71, 72, 73, 74,
      ]),
    },
    {
      title: 'GO60',
      color: KEYBOARDS.go60.color,
      positions: pick([
        ...Array.from({ length: 42 }, (_, index) => index + 10),
        ...Array.from({ length: 22 }, (_, index) => index + 58),
      ]),
    },
  ];
}

function sharedMappingForKeyboard(title) {
  if (title === 'Urchin') return URCHIN_TO_SHARED;
  if (title === 'Corne') return CORNE_TO_SHARED;
  if (title === 'GO60') return GO60_TO_SHARED;
  if (title === 'Glove80') return GLOVE80_TO_SHARED;
  throw new Error(`No shared mapping for ${title}`);
}

function applyLayerPreviewOverrides(layerId, keys) {
  if (layerId !== 'hrm') return keys;
  const overrides = new Map([
    [69, { tap: 'Alt', hold: '', type: 'mod' }],
    [70, { tap: 'BSPC', hold: 'Cursor', type: 'layer' }],
    [71, { tap: 'Tab', hold: 'Keypad', type: 'layer' }],
    [72, { tap: 'Esc', hold: 'Number', type: 'layer' }],
    [73, { tap: 'SPC', hold: 'Symbol', type: 'layer' }],
    [74, { tap: 'RAlt', hold: '', type: 'mod' }],
  ]);
  return keys.map((keyData, index) => keyData ? { ...keyData, ...(overrides.get(index) ?? {}) } : keyData);
}

function buildSharedLayerKeys(familyLayer, source, keyboardData) {
  const sourceMapping = sharedMappingForKeyboard(source.keyboard.title);
  if (source.layer.keys.length !== sourceMapping.length) throw new Error(`${source.keyboard.title} ${source.layer.key} has ${source.layer.keys.length} bindings; expected ${sourceMapping.length}`);

  const keys = Array.from({ length: SHARED_POSITIONS.length }, () => null);
  source.layer.keys.forEach((keyData, index) => {
    keys[sourceMapping[index]] = keyData;
  });

  if (familyLayer.id === 'magic') overlayCorneMagicRgb(keys, keyboardData);
  return applyLayerPreviewOverrides(familyLayer.id, keys);
}

function overlayCorneMagicRgb(keys, keyboardData) {
  const corne = keyboardData.find((data) => data.keyboard.title === 'Corne');
  const magic = corne?.layersById.get('magic');
  if (!magic) return;
  const mapping = sharedMappingForKeyboard('Corne');
  magic.keys.forEach((keyData, index) => {
    if (keyData.type !== 'rgb') return;
    keys[mapping[index]] = keyData;
  });
}

function esc(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function parseLayerIds(source) {
  const ids = new Map();
  const regex = /^#define\s+LAYER_(\S+)\s+(\d+)$/gm;
  for (const match of source.matchAll(regex)) ids.set(match[1], Number(match[2]));
  return ids;
}

function parseLayers(source) {
  const layerIds = parseLayerIds(source);
  const keymapStart = source.lastIndexOf('compatible = "zmk,keymap"');
  const keymapSource = keymapStart >= 0 ? source.slice(keymapStart) : source;
  const regex = /layer_(\w+)\s*\{([\s\S]*?)bindings\s*=\s*<([\s\S]*?)>\s*;/g;
  const layers = [];
  for (const match of keymapSource.matchAll(regex)) {
    const key = match[1];
    const body = match[2];
    const display = body.match(/display-name\s*=\s*"([^"]+)"\s*;/)?.[1] ?? key;
    const meta = LAYER_META[key] ?? { id: slug(key), name: key, desc: display };
    const bindings = splitBindings(match[3]);
    layers.push({ key, index: layerIds.get(key) ?? layers.length, id: meta.id, name: meta.name, display, desc: meta.desc, bindings, keys: bindings.map(bindingToKey) });
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
    const positions = body.match(/key-positions\s*=\s*<([^>]+)>\s*;/)?.[1]?.trim().split(/\s+/).map(Number).filter(Number.isFinite) ?? [];
    const binding = splitBindings(body.match(/bindings\s*=\s*<([^>]+)>\s*;/)?.[1] ?? '')[0];
    const layers = body.match(/layers\s*=\s*<([^>]+)>\s*;/)?.[1]?.trim().split(/\s+/) ?? [];
    if (positions.length && binding) combos.push({ name, positions, binding, layers, label: comboLabel(name, binding) });
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
    } else if (current) current.push(token);
  }
  if (current) bindings.push(current);
  return bindings;
}

function bindingToKey(binding) {
  const [behavior, ...params] = binding;
  if (!behavior) return key('—', 'none');
  if (behavior === 'trans') return key('↓', 'trans');
  if (behavior === 'none') return key('—', 'none');
  if (behavior === 'kp') return keyFromKeycode(params[0]);
  if (behavior === 'sk') return key(`sk${keycodeToLabel(params[0]).replace('Shift', '⇧')}`, 'sticky');
  if (behavior === 'AS_macro' || behavior === 'AS_v1_TKZ') return key(keycodeToLabel(params[0]), 'as');
  if (behavior.startsWith('AS_')) return key(keycodeToLabel(params.at(-1)), 'as');
  if (behavior === 'magic') return params[1] && params[1] !== '0' ? key(keycodeToLabel(params[1]), 'layer', 'Magic') : key('Magic', 'layer', 'hold');
  if (behavior === 'td_LAYER_Keypad') return key('Pad', 'layer', '2x tap');
  if (['space', 'space_v3_TKZ', 'thumb', 'thumb_v2_TKZ', 'enter_sym'].includes(behavior)) return key(keycodeToLabel(params[1]), 'layer', layerLabel(params[0]));
  if (behavior === 'to') return key(`→${layerLabel(params[0])}`, 'system');
  if (behavior === 'mo' || behavior === 'tog') return key(layerLabel(params[0]), 'layer', behavior);
  if (behavior === 'bootloader') return key('Boot', 'system');
  if (behavior === 'sys_reset') return key('Rst', 'system');
  if (behavior === 'rgb_ug') return key(String(params[0]).replace(/^RGB_/, ''), 'rgb');
  if (behavior === 'bt') return key(params[0] === 'BT_CLR' ? 'BT_CLR' : params[0] === 'BT_CLR_ALL' ? 'BT_ALL' : `BT${params[1] ?? ''}`, 'bt');
  if (behavior === 'out') return key(String(params[0]).replace(/^OUT_/, ''), 'system');
  if (behavior === 'ext_power') return key(params[0] === 'EP_OFF' ? 'LED Off' : 'LED Tog', 'system');
  if (behavior === 'mmv' || behavior === 'msc' || behavior === 'mkp') return key(keycodeToLabel(params[0]), 'nav');
  if (MACRO_LABELS[behavior]) return key(MACRO_LABELS[behavior], behavior.startsWith('bt_') ? 'bt' : 'macro');
  if (behavior.endsWith('_tap') || behavior.includes('_tap_')) return key(keycodeToLabel(params[0]), 'hrm');
  if (behavior.startsWith('HRM_')) return key(keycodeToLabel(params.at(-1)), 'hrm', hrmLabel(behavior));
  return key(behavior.replace(/_v\d.*$/, ''), 'macro');
}

function hrmLabel(behavior) {
  if (behavior.includes('pinky')) return 'Ctrl';
  if (behavior.includes('ring')) return 'Alt';
  if (behavior.includes('middy')) return 'GUI';
  if (behavior.includes('index')) return 'Shift';
  return 'HRM';
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
  return String(keycode).replace(/^MOVE_/, '').replace(/^SCRL_/, '').replace(/^MB/, 'M');
}

function formatModifiedKey(keycode) {
  if (SHIFT_LABELS[keycode]) return SHIFT_LABELS[keycode];
  for (const [prefix, label] of MOD_PREFIXES) {
    const wrapped = `${prefix}(`;
    if (String(keycode).startsWith(wrapped) && String(keycode).endsWith(')')) return `${label}${formatModifiedKey(String(keycode).slice(wrapped.length, -1))}`;
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
  return ['TAB', 'ESC', 'RET', 'BSPC', 'DEL', 'INS', 'CAPS', 'LEFT', 'RIGHT', 'UP', 'DOWN', 'LEFT_ARROW', 'RIGHT_ARROW', 'UP_ARROW', 'DOWN_ARROW', 'HOME', 'END', 'PG_UP', 'PG_DN', 'PSCRN', 'PRINTSCREEN', 'K_APP'].includes(keycode);
}

function isSymbol(keycode) {
  return ['BSLH', 'SQT', 'SINGLE_QUOTE', 'SEMI', 'COMMA', 'DOT', 'FSLH', 'GRAVE', 'LBKT', 'RBKT', 'EQUAL', 'MINUS'].includes(keycode);
}

function layerLabel(value) {
  if (value === '0') return '0';
  return LAYER_SHORT_NAMES[value] ?? String(value).replace(/^LAYER_/, '');
}

function layerIdFromReference(value) {
  if (!value) return null;
  const key = String(value).replace(/^LAYER_/, '');
  return LAYER_META[key]?.id ?? slug(key);
}

function targetLayerForBinding(binding) {
  const [behavior, ...params] = binding;
  if (!behavior) return null;
  if (['to', 'mo', 'tog'].includes(behavior)) return layerIdFromReference(params[0]);
  if (['space', 'space_v3_TKZ', 'thumb', 'thumb_v2_TKZ', 'enter_sym'].includes(behavior)) return layerIdFromReference(params[0]);
  if (behavior === 'magic' || behavior === 'magic_as') return layerIdFromReference(params[0]);
  if (behavior === 'lower') return 'lower';
  if (behavior === 'td_LAYER_Keypad') return 'keypad';
  return null;
}

function textColor(fill) {
  const r = parseInt(fill.slice(1, 3), 16) / 255;
  const g = parseInt(fill.slice(3, 5), 16) / 255;
  const b = parseInt(fill.slice(5, 7), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.5 ? COLORS.base : COLORS.text;
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
    } else current = next;
  }
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

function fontSize(label) {
  if (label.length > 10) return 7;
  if (label.length > 8) return 8;
  if (label.length > 6) return 9;
  if (label.length > 4) return 10;
  if (label.length > 2) return 12;
  return 17;
}

function comboLabel(name, binding) {
  const named = { capslock: 'Caps Lock', tab: 'Tab', sticky_hyp_rght: 'Hyper', sticky_meh_rght: 'Meh', F11: 'F11', F12: 'F12' };
  return named[name] ?? bindingToKey(binding).tap;
}

function comboAppliesToLayer(combo, layer) {
  return combo.layers.length === 0 || combo.layers.includes(`LAYER_${layer.key}`);
}

function boundsFor(positions) {
  const xs = positions.flatMap((pos) => [pos.x, pos.x + KW]);
  const ys = positions.flatMap((pos) => [pos.y, pos.y + KH]);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
}

function renderLegend(layer, x, y, width) {
  const usedTypes = [...new Set(layer.keys.map((keyData) => keyData.type).filter(Boolean))];
  let cursorX = x;
  let cursorY = y;
  const parts = [];
  for (const type of usedTypes) {
    const labelText = KEY_TYPES[type]?.label ?? type;
    const itemWidth = 34 + labelText.length * 7;
    if (cursorX + itemWidth > width - 60) {
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

function renderBoundary(positions, color) {
  return connectedKeyGroups(positions).map((group) => {
    const activeBounds = boundsFor(group);
    return `<rect class="keyboard-boundary" x="${activeBounds.minX - 10}" y="${activeBounds.minY - 10}" width="${activeBounds.maxX - activeBounds.minX + 20}" height="${activeBounds.maxY - activeBounds.minY + 20}" rx="18" style="stroke:${color ?? COLORS.teal}"/>`;
  }).join('\n');
}

function connectedKeyGroups(positions) {
  const groups = [];
  const seen = new Set();
  const maxDistance = SCALE * 1.7;
  positions.forEach((_, start) => {
    if (seen.has(start)) return;
    const queue = [start];
    const group = [];
    seen.add(start);
    for (let i = 0; i < queue.length; i += 1) {
      const index = queue[i];
      const pos = positions[index];
      group.push(pos);
      positions.forEach((candidate, candidateIndex) => {
        if (seen.has(candidateIndex)) return;
        const dx = pos.x - candidate.x;
        const dy = pos.y - candidate.y;
        if (Math.sqrt(dx * dx + dy * dy) <= maxDistance) {
          seen.add(candidateIndex);
          queue.push(candidateIndex);
        }
      });
    }
    groups.push(group);
  });
  return groups;
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
  if (keyData.tap === '↓') inner.push(`<text x="${x + KW / 2}" y="${y + KH / 2 + 1}" class="tap transparent">↓</text>`);
  else if (keyData.tap !== '—') {
    const tapY = keyData.hold || pos.topTap ? y + KH / 2 - 6 : y + KH / 2 + 2;
    inner.push(`<text x="${x + KW / 2}" y="${tapY}" class="tap" style="font-size:${fontSize(String(keyData.tap))}px;fill:${primary}">${esc(keyData.tap)}</text>`);
  }
  if (keyData.hold) inner.push(`<text x="${x + KW / 2}" y="${y + KH - 9}" class="hold" style="fill:${hold}">${esc(keyData.hold)}</text>`);
  parts.push(...inner);
  if (pos.r) parts.push('</g>');
  return parts.join('\n');
}

function renderGhost(pos) {
  const x = pos.x;
  const y = pos.y;
  const body = `<rect class="ghost-key" x="${x}" y="${y}" width="${KW}" height="${KH}" rx="8"/>`;
  return pos.r ? `<g transform="rotate(${pos.r} ${x + KW / 2} ${y + KH / 2})">${body}</g>` : body;
}

function renderShortcuts(shortcuts, positions, keyboardY) {
  if (shortcuts.length === 0) return '';
  const parts = [];
  const rows = 2;
  shortcuts.forEach((shortcut, index) => {
    const centers = shortcut.positions.map((position) => positions[position]).filter(Boolean).map((pos) => ({ x: pos.x + KW / 2, y: keyboardY + pos.y + KH / 2 }));
    if (centers.length === 0) return;
    const targetX = (Math.min(...centers.map((center) => center.x)) + Math.max(...centers.map((center) => center.x))) / 2;
    const rowIndex = index % rows;
    const labelY = keyboardY - 70 + rowIndex * 28;
    const labelWidth = Math.max(58, shortcut.label.length * 7 + 28);
    const labelX = Math.max(40, targetX - labelWidth / 2);
    const labelCenterX = labelX + labelWidth / 2;
    const lineEndY = keyboardY - 20;
    parts.push('<g class="shortcut">');
    centers.forEach((center) => {
      parts.push(`<path d="M ${labelCenterX.toFixed(1)} ${labelY + 20} C ${labelCenterX.toFixed(1)} ${lineEndY}, ${center.x.toFixed(1)} ${lineEndY}, ${center.x.toFixed(1)} ${center.y.toFixed(1)}"/>`);
      parts.push(`<circle cx="${center.x.toFixed(1)}" cy="${center.y.toFixed(1)}" r="4.2"/>`);
    });
    parts.push(`<rect x="${labelX.toFixed(1)}" y="${labelY}" width="${labelWidth}" height="22" rx="11"/>`);
    parts.push(`<text x="${labelCenterX.toFixed(1)}" y="${labelY + 15}">${esc(shortcut.label)}</text>`);
    parts.push('</g>');
  });
  return parts.join('\n  ');
}

function activationMarkersForLayer(layerId, keyboardData) {
  if (layerId === 'hrm') return [];
  const markers = [];
  const seen = new Set();
  for (const data of keyboardData) {
    const mapping = sharedMappingForKeyboard(data.keyboard.title);
    for (const layer of data.layers) {
      layer.bindings.forEach((binding, index) => {
        if (targetLayerForBinding(binding) !== layerId) return;
        const sharedIndex = mapping[index];
        if (!Number.isFinite(sharedIndex)) return;
        const key = `${data.keyboard.title}:${sharedIndex}`;
        if (seen.has(key)) return;
        seen.add(key);
        markers.push({ sharedIndex, color: data.keyboard.color, title: data.keyboard.title });
      });
    }
  }
  return markers;
}

function renderActivationMarkers(markers, positions) {
  const byPosition = new Map();
  for (const marker of markers) {
    if (!byPosition.has(marker.sharedIndex)) byPosition.set(marker.sharedIndex, []);
    byPosition.get(marker.sharedIndex).push(marker);
  }
  const parts = [];
  for (const [sharedIndex, positionMarkers] of byPosition) {
    const pos = positions[sharedIndex];
    if (!pos) continue;
    positionMarkers.forEach((marker, index) => parts.push(renderFootprintMarker(pos, marker, index, positionMarkers.length)));
  }
  return parts.join('\n    ');
}

function renderFootprintMarker(pos, marker, index, total) {
  const spacing = 9;
  const offset = (index - (total - 1) / 2) * spacing;
  const cx = pos.x + KW / 2 + offset;
  const cy = pos.y + KH / 2 + 1;
  return `<g class="layer-activator" aria-label="${esc(marker.title)} activation key" transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)})">
      <ellipse cx="0" cy="0" rx="8.2" ry="10.2" style="fill:${COLORS.base};opacity:.72;stroke:${marker.color};stroke-width:1.2"/>
      <path d="M -5.8 -0.5 C -5.8 -6.1, 5.8 -6.1, 5.8 -0.5" style="stroke:${marker.color}"/>
      <path d="M -4.1 2.2 C -4.1 -3.1, 4.1 -3.1, 4.1 2.2" style="stroke:${marker.color}"/>
      <path d="M -2.2 5.0 C -2.2 .2, 2.2 .2, 2.2 5.0" style="stroke:${marker.color}"/>
      <path d="M 0 -1.4 L 0 6.4" style="stroke:${marker.color}"/>
    </g>`;
}

function renderLayerAccessGuide(layerId, x, y) {
  if (layerId !== 'hrm') return { svg: '', height: 0 };
  const rows = [
    ['Urchin', 'Cursor: BSPC', 'Keypad: Tab', 'Number: Esc', 'Symbol: SPC'],
    ['Corne', 'Cursor: BSPC', 'Keypad: Tab', 'Number: RET', 'Symbol: SPC'],
    ['GO60/Glove80', 'Cursor: BSPC', 'Keypad: DEL', 'Mouse: RET', 'Symbol: SPC'],
  ];
  const svg = [
    `<text x="${x}" y="${y}" class="legend-text">Thumb layer access</text>`,
    ...rows.map((row, index) => {
      const rowY = y + 22 + index * 20;
      return `<text x="${x}" y="${rowY}" class="subtitle">${esc(row[0])}: ${row.slice(1).map(esc).join(' · ')}</text>`;
    }),
  ].join('\n  ');
  return { svg, height: 88 };
}

function renderFamilyLayer(familyLayer, keyboardData, sharedCombos) {
  const source = selectLayerSource(familyLayer, keyboardData);
  const { layer } = source;
  const canvasPositions = SHARED_POSITIONS;
  const supersetBounds = boundsFor(canvasPositions);
  const margin = 60;
  const width = Math.ceil(supersetBounds.maxX + margin * 2);
  const descLines = wrapWords(familyLayer.desc, 132);
  const previewKeys = buildSharedLayerKeys(familyLayer, source, keyboardData);
  const displayedKeys = previewKeys.filter(Boolean);
  const legend = renderLegend({ keys: displayedKeys }, margin, 108 + descLines.length * 18, width);
  const shortcuts = sharedCombos.map((combo) => mapComboToSharedPositions(combo)).filter((combo) => comboAppliesToLayer(combo, layer));
  const shortcutBand = shortcuts.length ? 72 : 0;
  const keyboardY = legend.bottom + 50 + shortcutBand;
  const keyboardHeight = Math.ceil(supersetBounds.maxY + margin);
  const accessGuideY = keyboardY + keyboardHeight + 8;
  const accessGuide = renderLayerAccessGuide(familyLayer.id, margin, accessGuideY);
  const outlineLegendY = accessGuideY + accessGuide.height;
  const height = outlineLegendY + 48;
  const title = `${String(familyLayer.index).padStart(2, '0')} / ${familyLayer.name}`;
  const ghostKeys = canvasPositions.map(renderGhost).join('\n');
  const keys = previewKeys.map((keyData, index) => keyData ? renderKey(keyData, canvasPositions[index]) : '').filter(Boolean).join('\n');
  const activationMarkers = renderActivationMarkers(activationMarkersForLayer(familyLayer.id, keyboardData), canvasPositions);
  const boundaryKeyboards = marginPositionsForLayer(canvasPositions);
  const boundaries = boundaryKeyboards.map((data) => renderBoundary(data.positions, data.color)).join('\n');
  const outlineLegend = boundaryKeyboards.map((data, index) => {
    const x = margin + index * 130;
    return `<line x1="${x}" y1="${outlineLegendY}" x2="${x + 32}" y2="${outlineLegendY}" class="outline-legend-line" style="stroke:${data.color}"/><text x="${x + 42}" y="${outlineLegendY + 4}" class="legend-text">${esc(data.title)}</text>`;
  }).join('\n  ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">${esc(title)} shared keymap layer</title>
  <desc id="desc">${esc(familyLayer.desc)}</desc>
  <style>
    .title { font: 800 28px Inter, Avenir Next, Segoe UI, sans-serif; fill: ${COLORS.text}; letter-spacing: .2px; }
    .subtitle { font: 500 14px Inter, Avenir Next, Segoe UI, sans-serif; fill: ${COLORS.subtext0}; }
    .legend-text { font: 600 12px Inter, Avenir Next, Segoe UI, sans-serif; fill: ${COLORS.subtext1}; }
    .tap { font-family: Berkeley Mono, SFMono-Regular, Consolas, Liberation Mono, monospace; font-weight: 800; text-anchor: middle; dominant-baseline: central; }
    .tap.transparent { font-size: 16px; fill: ${COLORS.overlay0}; }
    .hold { font: 800 10px Inter, Avenir Next, Segoe UI, sans-serif; text-anchor: middle; dominant-baseline: central; }
    .key { stroke: rgba(202,211,245,.22); stroke-width: 1.4; }
    .ghost-key { fill: transparent; stroke: rgba(202,211,245,.13); stroke-width: 1; stroke-dasharray: 4 7; }
    .keyboard-boundary { fill: transparent; stroke-width: 3; opacity: .74; }
    .layer-activator { opacity: .96; filter: drop-shadow(0 1px 2px rgba(24,25,38,.8)); }
    .layer-activator * { stroke: ${COLORS.base}; stroke-width: 1.15; }
    .outline-legend-line { stroke-width: 4; stroke-linecap: round; }
    .shortcut path { fill: none; stroke: ${COLORS.teal}; stroke-width: 1.2; opacity: .62; stroke-linecap: round; }
    .shortcut circle { fill: ${COLORS.teal}; stroke: ${COLORS.base}; stroke-width: 1.5; }
    .shortcut rect { fill: ${COLORS.crust}; stroke: ${COLORS.teal}; stroke-width: 1.2; }
    .shortcut text { font: 800 11px Inter, Avenir Next, Segoe UI, sans-serif; fill: ${COLORS.text}; text-anchor: middle; letter-spacing: .2px; }
  </style>
  <rect x="0" y="0" width="${width}" height="${height}" rx="28" fill="${COLORS.base}"/>
  <circle cx="105" cy="42" r="140" fill="${COLORS.mauve}" opacity="0.10"/>
  <circle cx="${width - 130}" cy="70" r="190" fill="${COLORS.blue}" opacity="0.10"/>
  <text x="${margin}" y="50" class="title">${esc(title)}</text>
  ${descLines.map((line, i) => `<text x="${margin}" y="${78 + i * 18}" class="subtitle">${esc(line)}</text>`).join('\n  ')}
  ${legend.svg}
  <g transform="translate(${margin} ${keyboardY})">
    ${ghostKeys.split('\n').join('\n    ')}
    ${keys.split('\n').join('\n    ')}
    ${boundaries.split('\n').join('\n    ')}
    ${activationMarkers.split('\n').join('\n    ')}
  </g>
  ${renderShortcuts(shortcuts, canvasPositions.map((pos) => ({ ...pos, x: pos.x + margin })), keyboardY)}
  ${accessGuide.svg}
  ${outlineLegend}
  <text x="${margin}" y="${outlineLegendY + 28}" class="subtitle">Keys are rendered once from the shared layer; colored margins show which physical region exists on each smaller keyboard. Glove80 is the full superset.</text>
</svg>
`;
}

function mapComboToSharedPositions(combo) {
  return { ...combo, positions: combo.positions.map((position) => URCHIN_TO_SHARED[position]).filter(Number.isFinite) };
}

function selectLayerSource(familyLayer, keyboardData) {
  const available = keyboardData.map((data) => ({ ...data, layer: data.layersById.get(familyLayer.id) })).filter((data) => data.layer);
  if (available.length === 0) throw new Error(`No keyboard defines layer ${familyLayer.id}`);
  if (familyLayer.id === 'magic') return available.find((data) => data.keyboard.title === 'Urchin') ?? available[0];
  return available.sort((a, b) => b.keyboard.positions.length - a.keyboard.positions.length)[0];
}

function loadKeyboardData(name) {
  const keyboard = KEYBOARDS[name];
  if (!keyboard) throw new Error(`Unknown keyboard: ${name}`);
  const keymapPath = path.join(root, keyboard.keymap);
  const source = fs.readFileSync(keymapPath, 'utf8');
  const layers = parseLayers(source);
  const combos = parseCombos(source);
  return { keyboard, layers, layersById: new Map(layers.map((layer) => [layer.id, layer])), combos };
}

function loadSharedCombos() {
  const source = fs.readFileSync(path.join(root, KEYBOARDS.urchin.keymap), 'utf8');
  return parseCombos(source);
}

function familyLayers(keyboardData) {
  const metaOrder = new Map(Object.values(LAYER_META).map((meta, index) => [meta.id, index]));
  const byId = new Map();
  for (const data of keyboardData) {
    for (const layer of data.layers) {
      const current = byId.get(layer.id);
      if (!current) byId.set(layer.id, { id: layer.id, name: layer.name, desc: layer.desc, order: metaOrder.get(layer.id) ?? 1000 + layer.index });
      else current.order = Math.min(current.order, metaOrder.get(layer.id) ?? 1000 + layer.index);
    }
  }
  return [...byId.values()].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)).map((layer, index) => ({ ...layer, index }));
}

function cleanOutputDir(outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  for (const entry of fs.readdirSync(outDir, { withFileTypes: true })) {
    const target = path.join(outDir, entry.name);
    if (entry.isFile() && entry.name.startsWith('keymap-') && entry.name.endsWith('.svg')) fs.unlinkSync(target);
    if (entry.isDirectory() && KEYBOARDS[entry.name]) fs.rmSync(target, { recursive: true, force: true });
  }
}

function layerMatchesFilter(layer, filter) {
  if (!filter) return true;
  const normalized = slug(filter);
  return [layer.id, layer.name, String(layer.index), String(layer.index).padStart(2, '0')].some((value) => slug(value) === normalized);
}

function generateFamily(check, layerFilter) {
  const keyboardData = Object.keys(KEYBOARDS).map(loadKeyboardData);
  const sharedCombos = loadSharedCombos();
  const outDir = path.join(root, OUTPUT_DIR);
  const layers = familyLayers(keyboardData).filter((layer) => layerMatchesFilter(layer, layerFilter));
  if (layers.length === 0) throw new Error(`No layer matched ${layerFilter}`);
  const rendered = new Map(layers.map((layer) => [`keymap-${String(layer.index).padStart(2, '0')}-${slug(layer.id)}.svg`, renderFamilyLayer(layer, keyboardData, sharedCombos)]));
  if (check) {
    const missing = [];
    const stale = [];
    for (const [filename, content] of rendered) {
      const target = path.join(outDir, filename);
      if (!fs.existsSync(target)) missing.push(path.relative(root, target));
      else if (fs.readFileSync(target, 'utf8') !== content) stale.push(path.relative(root, target));
    }
    if (!layerFilter && fs.existsSync(outDir)) {
      for (const entry of fs.readdirSync(outDir, { withFileTypes: true })) {
        if (entry.isFile() && entry.name.startsWith('keymap-') && entry.name.endsWith('.svg') && !rendered.has(entry.name)) {
          stale.push(path.relative(root, path.join(outDir, entry.name)));
        }
      }
    }
    if (!layerFilter) {
      for (const name of Object.keys(KEYBOARDS)) {
        const legacyDir = path.join(outDir, name);
        if (fs.existsSync(legacyDir)) stale.push(path.relative(root, legacyDir));
      }
    }
    if (missing.length || stale.length) throw new Error(`Family SVGs are stale. Missing: ${missing.join(', ') || 'none'}; changed/stale: ${stale.join(', ') || 'none'}`);
    console.log(`Family: ${rendered.size} SVGs up to date`);
    return;
  }
  if (!layerFilter) cleanOutputDir(outDir);
  else fs.mkdirSync(outDir, { recursive: true });
  for (const [filename, content] of rendered) fs.writeFileSync(path.join(outDir, filename), content);
  console.log(`Family: generated ${rendered.size} SVGs in ${path.relative(root, outDir)}`);
}

const args = process.argv.slice(2);
const check = args.includes('--check');
const layerFilter = args.find((arg) => arg.startsWith('--layer='))?.split('=')[1];

generateFamily(check, layerFilter);
