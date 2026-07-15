# Home Filter Extract QA

Date: 2026-07-15  
Branch: `codex/apple-ui-four-pass`  
Base URL: `http://127.0.0.1:4331`

## Scope

Targeted regression after moving home page filtering and clickable surah cards from `src/client/app.ts` into `src/client/home-filter.ts`.

## Checks

- Home surah cards render: 114 cards found.
- Home filter narrows the visible card set.
- Clicking a home surah card navigates to `/surah/1`.

## Result

3 checks, 0 failures.

## Artifacts

- `desktop-home-filter.png`
- `results.json`
