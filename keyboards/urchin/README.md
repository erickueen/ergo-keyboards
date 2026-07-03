# Urchin ZMK Config

ZMK firmware configuration for a wireless Urchin split keyboard on nice!nano-compatible controllers.

This layout is based on the MoErgo GO60/TailorKey layout ideas documented here:

https://sites.google.com/view/tailorkey/moergo/go60

The keymap adapts the Corne GO60-style layout to the Urchin 3x5+2 layout, with bilateral home-row modifiers, thumb-driven navigation layers, and a Magic utility layer.

## Firmware Notes

- Root build artifacts are expected as `urchin_left.uf2` and `urchin_right.uf2`.
- The Urchin keymap intentionally drops the Corne outer columns and maps the retained four thumb keys to Backspace, Tab, Enter, and Space.
- The visual layer reference is generated from `config/urchin.keymap` using the physical coordinates in `config/urchin.json`.

## Magic Layer

The Magic layer is reached by holding `Z` on the base layer. Tapping `Z` still sends `Z`.

Magic provides firmware and connectivity controls:

- Bootloader and reset keys on both outer columns.
- Media controls for mute, volume down, and volume up.
- Bluetooth profile selection for profiles 0-3 and Bluetooth clear.
- USB output selection.
- Quick return to base and autoshift layer access.

## Visual Layer Reference

Static SVGs are generated from `config/urchin.keymap` with Catppuccin Macchiato colors and the Urchin physical layout from `config/urchin.json`. Regenerate them after keymap changes with:

```bash
node scripts/generate-keymap-svgs.mjs
```

### Base Layers

#### 0: HRM macOS

<img src="docs/images/keymap-00-hrm.svg" alt="HRM macOS layer" width="920">

#### 1: Typing

<img src="docs/images/keymap-01-typing.svg" alt="Typing layer" width="920">

#### 2: Autoshift

<img src="docs/images/keymap-02-autoshift.svg" alt="Autoshift layer" width="920">

### Bilateral HRM Helper Layers

#### 3: L-Pinky

<img src="docs/images/keymap-03-lpinky.svg" alt="Left pinky bilateral HRM layer" width="920">

#### 4: L-Ring

<img src="docs/images/keymap-04-lring.svg" alt="Left ring bilateral HRM layer" width="920">

#### 5: L-Middle

<img src="docs/images/keymap-05-lmiddy.svg" alt="Left middle bilateral HRM layer" width="920">

#### 6: L-Index

<img src="docs/images/keymap-06-lindex.svg" alt="Left index bilateral HRM layer" width="920">

#### 7: R-Pinky

<img src="docs/images/keymap-07-rpinky.svg" alt="Right pinky bilateral HRM layer" width="920">

#### 8: R-Ring

<img src="docs/images/keymap-08-rring.svg" alt="Right ring bilateral HRM layer" width="920">

#### 9: R-Middle

<img src="docs/images/keymap-09-rmiddy.svg" alt="Right middle bilateral HRM layer" width="920">

#### 10: R-Index

<img src="docs/images/keymap-10-rindex.svg" alt="Right index bilateral HRM layer" width="920">

### Functional Layers

#### 11: Cursor

<img src="docs/images/keymap-11-cursor.svg" alt="Cursor layer" width="920">

#### 12: Keypad

<img src="docs/images/keymap-12-keypad.svg" alt="Keypad layer" width="920">

#### 13: Symbol

<img src="docs/images/keymap-13-symbol.svg" alt="Symbol layer" width="920">

#### 14: Magic

<img src="docs/images/keymap-14-magic.svg" alt="Magic layer" width="920">

#### 15: Number

<img src="docs/images/keymap-15-number.svg" alt="Number layer" width="920">
