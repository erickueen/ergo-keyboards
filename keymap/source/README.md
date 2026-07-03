# Keymap Source

The current generated keymaps mirror the copied keyboard configs while the monorepo build path is stabilized.

The next step is to replace this placeholder with structured source files that resolve this inheritance chain:

```text
urchin -> corne -> go60 -> glove80
```

Rules:

- `urchin` is the base layout.
- `corne` inherits from `urchin`.
- `go60` inherits from resolved `corne`.
- `glove80` inherits from resolved `go60`.
- Magic key placement is defined independently per keyboard.
- Keyboard-specific overrides win over inherited keys.
