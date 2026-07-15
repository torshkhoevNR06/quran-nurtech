# App module split QA

Date: 2026-07-15
Branch: `codex/apple-ui-four-pass`

## Scope

The shared client helpers and dwell-based reading analytics were extracted from `src/client/app.ts` into:

- `src/client/shared.ts`
- `src/client/reading-analytics.ts`

## Checks

- `npm run build` passed.
- Desktop smoke at 1440x1000:
  - `/` renders TopBar and drawer progress.
  - `/surah/2/` renders 286 ayahs and dwell reading marks 1 ayah after 4 seconds.
  - `/progress/` renders without client errors or horizontal overflow.
- Mobile smoke at 390x844:
  - `/` renders without horizontal overflow.
  - `/surah/2/` renders without horizontal overflow.
  - Dwell reading marks 1 ayah after scrolling the first ayah into the active reading zone.

## Evidence

- `desktop-home.png`
- `desktop-surah-dwell.png`
- `desktop-progress.png`
- `mobile-home.png`
- `mobile-surah-dwell.png`
- `mobile-surah-dwell-active-zone.png`
- `results.json`

## Notes

- The first mobile dwell pass stayed above the active observer zone and correctly did not count reading time.
- After scrolling the ayah into the active zone, mobile dwell counted time and one read ayah.
