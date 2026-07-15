# Bookmarks extract QA

Date: 2026-07-15
Branch: `codex/apple-ui-four-pass`
Local URL: `http://127.0.0.1:4331`

## Checks

- `npm run build` passed after extraction.
- Desktop `/surah/1/`: ayah bookmark button stores `1:1`, marks the button active, renders the saved ayah in the topbar bookmark menu, and removes it on second click.
- Desktop `/surah/3/`: continue/last position writes `q_last` as `3:1`.
- Mobile `/surah/1/`: ayah bookmark tap stores `1:1`.

## Screenshots

- `desktop-bookmark-menu.png`
- `mobile-bookmarked-ayah.png`

## Result

7 automated checks, 0 failures. Details: `results.json`.
