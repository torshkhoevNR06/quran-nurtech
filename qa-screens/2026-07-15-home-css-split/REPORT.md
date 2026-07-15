# Home CSS Split QA

Date: 2026-07-15
Branch: codex/apple-ui-four-pass
Local URL: http://127.0.0.1:4352

## Checks

- `npm run build` passed.
- `git diff --check` passed.
- Desktop home captured at 1440x900.
- Desktop home filter captured with `йа син`.
- Mobile home captured at 390x844.
- Mobile home filter captured with `йа син`.

## Result

- No horizontal overflow detected.
- Home hero, quick surahs and surah catalog render in checked states.
- Search filter visually narrows the catalog to `Йа Син`.
- Mobile bottom navigation and topbar remain visible.
