# Ergo Keyboards

Monorepo for ZMK keyboard firmware configs:

- Urchin
- Corne
- GO60
- Glove80

The current migration preserves each keyboard's existing keymap first. Shared-keymap inheritance will be layered on top after the monorepo build path is stable.

## Generate Keymaps

The generator mirrors the source keymaps into `keymap/generated/` so CI can detect drift while the inheritance model is introduced. Nix supplies the Node runtime used by the generator.

```bash
nix-build -A keymaps -o generated-keymaps
cp -R generated-keymaps/. keymap/generated/
nix-build -A keymapsCheck -o keymaps-check
```

## Generate SVGs

SVGs render one shared keymap layer on the superset layout. Colored margins show the physical regions used by Urchin, Corne, and GO60; Glove80 is the full superset.

```bash
nix-build -A keymapSvgs -o generated-keymap-svgs
cp -R generated-keymap-svgs/. docs/keymaps/
nix-build -A keymapSvgsCheck -o keymap-svgs-check
```

Committed diagrams live under `docs/keymaps/`, one file per logical layer.

## Keymap Diagrams

The generated SVG diagrams are checked in as documentation for the keyboard family. Regenerate them with `nix-build -A keymapSvgs -o generated-keymap-svgs` after changing keymaps or layout geometry, then copy the output into `docs/keymaps/`.

HRM helper layers such as pinky, ring, middle, and index are generated under `docs/keymaps/` but omitted here because they add noise to the overview.

### HRM macOS

![HRM macOS layer](docs/keymaps/keymap-00-hrm.svg)

### Typing

![Typing layer](docs/keymaps/keymap-01-typing.svg)

### Autoshift

![Autoshift layer](docs/keymaps/keymap-02-autoshift.svg)

### Cursor

![Cursor layer](docs/keymaps/keymap-11-cursor.svg)

### Keypad

![Keypad layer](docs/keymaps/keymap-12-keypad.svg)

### Symbol

![Symbol layer](docs/keymaps/keymap-13-symbol.svg)

### Mouse

![Mouse layer](docs/keymaps/keymap-14-mouse.svg)

### Mouse Slow

![Mouse Slow layer](docs/keymaps/keymap-15-mouse-slow.svg)

### Mouse Fast

![Mouse Fast layer](docs/keymaps/keymap-16-mouse-fast.svg)

### Mouse Warp

![Mouse Warp layer](docs/keymaps/keymap-17-mouse-warp.svg)

### Lower

![Lower layer](docs/keymaps/keymap-18-lower.svg)

### Magic

![Magic layer](docs/keymaps/keymap-19-magic.svg)

### Number

![Number layer](docs/keymaps/keymap-20-number.svg)

## Nix Builds

This repo uses legacy `nix-build`, matching MoErgo's current build style.

```bash
nix-build -A keymaps -o generated-keymaps
nix-build -A keymapSvgs -o generated-keymap-svgs
nix-build -A checks -o checks
nix-build -A go60
nix-build -A glove80
nix-build -A corne_left
nix-build -A corne_right
nix-build -A urchin_left
nix-build -A urchin_right
nix-build -A all
nix-build -A ci -o ci-build
```

`default.nix` uses `./src` when present for the MoErgo ZMK source, matching CI. If `./src` is missing, it fetches `moergo-sc/zmk` from `main`.

`nix-build -A checks -o checks` runs generated keymap checks, generated SVG checks, and Urchin parity verification. `nix-build -A ci -o ci-build` runs the checks, regenerates keymap mirrors and SVGs in Nix outputs, and builds the firmware bundle.

CI uses the upstream MoErgo Cachix cache read-only for dependency acceleration. Firmware downloads are published through GitHub Actions artifacts and the GitHub `latest` release.

GitHub Actions creates or updates an automated PR from `ci/regenerate-keymap-svgs` when Nix-generated SVGs differ from committed `docs/keymaps/*.svg` on trusted `push` or manual runs. Pull requests still fail the SVG check instead of pushing changes into contributor branches.

CI uploads firmware as separate downloadable artifacts for `firmware-go60`, `firmware-glove80`, `firmware-corne`, `firmware-urchin`, and `firmware-settings-reset`, plus a combined `firmware-all` artifact containing every UF2.

## Latest Firmware Downloads

CI also publishes ZIP files to the moving `latest` release tag, so these links always point at the newest successful `main` build:

| Firmware | Download |
| --- | --- |
| GO60 | [firmware-go60.zip](https://github.com/erickueen/ergo-keyboards/releases/download/latest/firmware-go60.zip) |
| Glove80 | [firmware-glove80.zip](https://github.com/erickueen/ergo-keyboards/releases/download/latest/firmware-glove80.zip) |
| Corne | [firmware-corne.zip](https://github.com/erickueen/ergo-keyboards/releases/download/latest/firmware-corne.zip) |
| Urchin | [firmware-urchin.zip](https://github.com/erickueen/ergo-keyboards/releases/download/latest/firmware-urchin.zip) |
| Settings reset | [firmware-settings-reset.zip](https://github.com/erickueen/ergo-keyboards/releases/download/latest/firmware-settings-reset.zip) |
| All firmware | [firmware-all.zip](https://github.com/erickueen/ergo-keyboards/releases/download/latest/firmware-all.zip) |

## Build Outputs

`nix-build -A all -o firmware` should produce:

- `firmware/go60.uf2`
- `firmware/glove80.uf2`
- `firmware/corne_left.uf2`
- `firmware/corne_right.uf2`
- `firmware/urchin_left.uf2`
- `firmware/urchin_right.uf2`
- `firmware/settings_reset.uf2`

## Keymap Inheritance Target

Planned inheritance order:

```text
urchin -> corne -> go60 -> glove80
```

The magic key remains keyboard-specific. Other keys inherit from the previous keyboard unless overridden.
