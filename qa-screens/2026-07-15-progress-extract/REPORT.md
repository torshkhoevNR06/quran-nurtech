# Progress Extract QA

Date: 2026-07-15
Branch: `codex/apple-ui-four-pass`

## Scope

- `/progress/`
- Extraction of page CSS from `src/pages/progress.astro` to `src/styles/progress.css`
- Extraction of page client logic from inline script to `src/client/progress.ts`

## Checks

- `npm run build` passed.
- Playwright smoke passed on desktop 1440x900 and mobile 390x844.
- No captured page errors.
- No horizontal document overflow.
- Progress page rendered:
  - 6 stat tiles
  - 114 surah map cells
  - 30 juz rows
  - khatm plan card

## Screenshots

- `desktop-progress.png`
- `mobile-progress.png`

## Notes

The mobile full-page screenshot still exposes existing fixed mobile chrome/drawer layering behavior during stitched capture. That is not caused by this extraction, but it should be handled in the upcoming mobile polish pass.
