# Layout Geometry

`tools/generate-keymap-svgs.mjs` currently carries the shared superset geometry in code so it can render all four existing keymaps immediately.

The intended stable model is:

- `superset.json`: every physical key position used by any keyboard.
- `keyboards/<name>.json`: mapping from each keyboard's binding order to positions in the superset.

The SVG output already follows the desired visual behavior: all diagrams use one shared superset canvas, unavailable keys are ghosted, and a thin boundary marks the active keyboard area.
