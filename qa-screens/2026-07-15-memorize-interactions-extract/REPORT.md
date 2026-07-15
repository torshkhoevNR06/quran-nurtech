# Memorize And Interactions Extract QA

Date: 2026-07-15  
Branch: `codex/apple-ui-four-pass`  
Base URL: `http://127.0.0.1:4331`

## Scope

Targeted regression after moving memorize controls into `src/client/memorize.ts` and generic haptic tap handling into `src/client/interactions.ts`.

## Checks

- Mobile settings button opens the settings panel.
- Memorize toggle applies `body.memorize-on` and writes `q_memorize`.
- `x5` repetition button applies selected state and writes `q_memrep`.

## Result

3 checks, 0 failures.

## Artifacts

- `mobile-memorize-settings.png`
- `results.json`
