# Hotkeys Extract QA

Date: 2026-07-15  
Branch: `codex/apple-ui-four-pass`  
Base URL: `http://127.0.0.1:4331`

## Scope

Targeted regression after moving keyboard shortcuts into `src/client/hotkeys.ts`.

## Checks

- `/` focuses the quick navigation input.
- `A`, `S`, `D` toggle reader layers.
- `B` toggles bookmark for the current ayah.
- `]` activates the next ayah.

## Result

4 checks, 0 failures.

Note: `T` was not counted as a passing shortcut because the current reader settings model has layers for Arabic, translation and transliteration, but no separate tafsir layer state. This is pre-existing behavior and should be handled as a product decision if needed.

## Artifacts

- `desktop-hotkeys.png`
- `results.json`
