# Quran Data Extract QA

Date: 2026-07-15  
Branch: `codex/apple-ui-four-pass`  
Base URL: `http://127.0.0.1:4331`

## Scope

Targeted regression after moving Quran data loading, tafsir loaders, reciter metadata, and audio URL helpers into `src/client/quran-data.ts`.

## Checks

- Index-backed surah name is available for copy/editor data.
- Tafsir loader opens and renders Saadi text.
- Audio play prepares a remote audio source and updates the player title.

## Result

3 checks, 0 failures.

Note: an earlier local attempt used an outdated selector for the tafsir panel; the final saved `results.json` is the corrected passing run.

## Artifacts

- `desktop-quran-data.png`
- `results.json`
