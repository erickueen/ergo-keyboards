# Agent Notes

This repo is a ZMK keyboard firmware monorepo for Urchin, Corne, GO60, and Glove80. Treat this file as the quick-start contract for future automated agents.

## Project Rules

- Use legacy `nix-build`, not flakes.
- Urchin is the canonical behavior source for shared keymap behavior.
- Corne, GO60, and Glove80 should stay behavior-synced to Urchin through the sync/parity tools unless an exception below applies.
- Do not reintroduce the Gaming layer.
- Keep each keyboard's Bluetooth name explicit and unique in its base `.conf`: Urchin is `urchin`, Corne is `Cornelius`, GO60 is `Go60`, and Glove80 is `Glove80`.
- Keep generated mirrors in `keymap/generated/` in sync with keyboard configs.
- Keep generated SVGs in `docs/keymaps/` in sync after changing keymaps, layout geometry, or SVG rendering logic.
- Do not commit or push changes unless the user explicitly asks for it.

## Allowed Parity Exceptions

- Magic layer contents may be keyboard-specific.
- Magic key physical placement may differ:
  - Urchin: hold `Z` with `&magic LAYER_Magic Z`.
  - Corne: hold the grave/backtick key left of `Z` with `&magic LAYER_Magic 0`.
  - GO60 and Glove80: use their dedicated Magic key positions.
- Thumb cluster physical placement may differ, but canonical access must remain available on every non-Magic layer:
  - `BSPC -> Cursor`
  - `TAB -> Keypad`
  - `ESC -> Number`
  - `SPC -> Symbol`
- Thumb-layer exceptions are intentional:
  - Symbol layer uses `GLOBE` on the Backspace thumb position and `@` on the Tab thumb position.
  - Cursor layer uses `RET` on the Esc thumb position, matching the original Urchin firmware.
  - Number layer uses `SPC -> Mouse` on the Space thumb position.
- GO60 and Glove80 use six-thumb visual order: `BSPC / TAB / LALT / RALT / ESC / SPC`.
- Larger boards may keep extra keys, but Urchin-equivalent mapped positions must match Urchin behavior.

## Important Files

- `keyboards/urchin/config/urchin.keymap`: canonical shared behavior source.
- `keyboards/corne/config/corne.keymap`: synced Corne keymap with Magic/thumb exceptions.
- `keyboards/go60/config/go60.keymap`: synced GO60 keymap with extra physical keys preserved.
- `keyboards/glove80/config/glove80.keymap`: synced Glove80 keymap with extra physical keys preserved.
- `tools/sync-urchin-parity.mjs`: projects Urchin behavior onto Corne, GO60, and Glove80 mapped layers.
- `tools/verify-urchin-parity.mjs`: enforces shared Urchin behavior parity and thumb access rules.
- `tools/generate-keymaps.mjs`: regenerates checked-in mirror keymaps under `keymap/generated/`.
- `tools/generate-keymap-svgs.mjs`: regenerates layer-centric SVG docs under `docs/keymaps/`.
- `default.nix`: legacy Nix entry point for checks, generated keymaps, SVG generation, firmware, and CI bundle.
- `.github/workflows/build.yml`: CI workflow for Nix checks, firmware artifacts, and SVG regeneration PRs.

## Common Workflows

After editing canonical keymap behavior, usually run:

```bash
node tools/sync-urchin-parity.mjs
nix-build -A keymaps -o generated-keymaps
cp -R generated-keymaps/. keymap/generated/
nix-build -A keymapSvgs -o generated-keymap-svgs
cp -R generated-keymap-svgs/. docs/keymaps/
```

For fast local validation, run:

```bash
nix-build -A checks -o checks
```

For the standard Nix validation gate, run:

```bash
nix-build -A checks -o checks
```

For firmware outputs, regenerate the local Nix result symlink before testing UF2 files locally. The `firmware/` directory is a local Nix output symlink and can be stale after source changes.

```bash
nix-build -A all -o firmware
```

For faster keyboard-specific firmware validation, build only the affected targets. For example, after Corne-only changes, run:

```bash
nix-build -A corne_left -o firmware-corne-left
nix-build -A corne_right -o firmware-corne-right
```

Use `nix-build -A all -o firmware` when you need the aggregate local `firmware/` folder refreshed for manual flashing or final local verification.

For the full CI-equivalent bundle, run:

```bash
nix-build -A ci -o ci-build
```

Clean local Nix result symlinks after validation when they are not intentionally needed:

```bash
rm -f checks generated-keymaps generated-keymap-svgs keymaps-check keymap-svgs-check ci-build result
```

## SVG Documentation Rules

- SVG output is layer-centric: one SVG per logical layer in `docs/keymaps/`.
- The shared canvas is based on the Glove80 superset layout.
- Colored boundaries indicate Urchin, Corne, and GO60 regions; Glove80 is the full superset.
- README embeds the useful overview SVGs and omits noisy HRM helper layers.
- HRM Magic indicators should show Urchin on `Z` and Corne on grave/backtick; on the HRM SVG they are placed at the top-right of the key so they do not cover key labels.
- Corne disabled thumb ghost keys should remain transparent/dashed beside `BSPC` and `SPC`.
- Mouse Slow/Fast/Warp SVGs intentionally render the base Mouse controls plus speed/warp guide cards.

## CI Behavior

- CI runs `nix-build -A keymapSvgs -o generated-keymap-svgs`.
- CI runs `nix-build -A ci -o ci-build`.
- CI configures the upstream MoErgo Cachix cache as read-only for dependency acceleration. Do not add project-owned Cachix push steps unless the user explicitly asks for external Nix binary caching.
- CI uploads firmware artifacts as separate downloadable ZIP artifacts: `firmware-go60`, `firmware-glove80`, `firmware-corne`, `firmware-urchin`, `firmware-settings-reset`, and combined `firmware-all`.
- CI publishes stable ZIP downloads to the moving `latest` release tag on trusted `push` and manual runs.
- On trusted `push` and manual runs, CI copies generated SVGs into `docs/keymaps/` and opens or updates an auto-PR from `ci/regenerate-keymap-svgs` if committed SVGs differ.
- On pull requests, SVG drift should fail the check instead of pushing changes to contributor branches.

## Expected Firmware Artifacts

`nix-build -A all -o firmware` and the CI bundle should produce:

- `go60.uf2`
- `glove80.uf2`
- `corne_left.uf2`
- `corne_right.uf2`
- `urchin_left.uf2`
- `urchin_right.uf2`
- `settings_reset.uf2`

## Implementation Cautions

- Prefer small, mechanical keymap edits followed by sync/regeneration over hand-editing every generated artifact.
- Do not weaken `tools/verify-urchin-parity.mjs` unless the user explicitly approves a new parity exception.
- If editing `.github/workflows/build.yml`, run `actionlint` before pushing. With Nix available:

```bash
nix-shell -p actionlint --run 'actionlint .github/workflows/build.yml'
```

- Quote YAML strings containing colons, such as Git commit messages.
- The root Nix file uses `./src` for MoErgo ZMK when present; CI creates `./src` by checking out `moergo-sc/zmk`.
- Local MoErgo source may also exist outside the repo at `/home/erickueen/code/moergo-zmk`, but repo builds should not depend on that path.
