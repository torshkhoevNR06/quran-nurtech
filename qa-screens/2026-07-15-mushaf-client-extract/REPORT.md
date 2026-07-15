# Mushaf Client Extract QA

Date: 2026-07-15
Branch: `codex/apple-ui-four-pass`

## Scope

- `/mushaf/2/`
- Extraction of static immersive display CSS from inline style to `src/styles/mushaf-immersive.css`
- Extraction of mushaf sizing, zoom/pan, fullscreen and navigation behavior to `src/client/mushaf.ts`

## Checks

- `npm run build` passed.
- Playwright smoke passed on desktop 1440x900 and mobile 390x844.
- No captured page errors.
- No horizontal document overflow.
- QCF page rendered with 15 lines.
- Zoom button changed page state to `mushaf-zoomed` and updated label to `110%`.
- Immersive button added `body.mushaf-immersive`, displayed the exit control, and hid the app topbar.

## Screenshots

- `desktop-mushaf.png`
- `desktop-mushaf-immersive.png`
- `mobile-mushaf.png`
- `mobile-mushaf-immersive.png`

## Notes

The dynamic QCF font CSS remains inline because it is generated per page. The mobile immersive screenshot still shows that mushaf page composition needs a dedicated visual polish pass, especially on short pages with large empty paper area.
