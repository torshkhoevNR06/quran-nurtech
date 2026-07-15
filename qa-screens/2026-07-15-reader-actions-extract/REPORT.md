# Reader Actions Extract QA

Date: 2026-07-15  
Branch: `codex/apple-ui-four-pass`  
Base URL: `http://127.0.0.1:4331`

## Scope

Targeted regression after moving ayah actions, context menu, tafsir toggles and mushaf ayah sheet into `src/client/reader-actions.ts`.

## Checks

- Ayah Saadi tafsir button opens a rendered tafsir block.
- Ayah play button reaches the audio player and prepares a remote source.
- Desktop context menu opens on ayah right click.
- Mushaf word tap opens the ayah sheet and loads the real translation.
- Mushaf sheet tafsir action loads tafsir text.

## Result

5 checks, 0 failures.

## Artifacts

- `desktop-reader-actions.png`
- `desktop-mushaf-sheet.png`
- `results.json`
