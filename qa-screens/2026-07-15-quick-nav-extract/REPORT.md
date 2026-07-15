# Quick nav extract QA

Date: 2026-07-15
Branch: `codex/apple-ui-four-pass`
Local URL: `http://127.0.0.1:4331`

## Checks

- `npm run build` passed after extraction.
- Quick input opens `/surah/18` for `18`.
- Quick input opens `/2:255` for `2:255`.
- Quick input opens `/surah/112` for `ихлас`.
- Unknown text falls back to `/search?q=...`.

## Screenshots

- `desktop-quick-search-fallback.png`

## Result

4 automated checks, 0 failures. Details: `results.json`.
