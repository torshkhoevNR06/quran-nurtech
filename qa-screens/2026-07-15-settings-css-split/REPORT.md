# Settings CSS Split QA

Date: 2026-07-15
Branch: codex/apple-ui-four-pass
Local URL: http://127.0.0.1:4350

## Checks

- `npm run build` passed.
- `git diff --check` passed.
- Desktop settings inspector captured at 1440x900 on `/surah/9`.
- Narrow desktop settings inspector captured at 1180x820 on `/surah/9`.
- Mobile settings sheet captured at 390x844 on `/surah/1/?v=settings-redesign-3`.
- Mobile home settings sheet captured at 390x844 on `/`.

## Result

- Settings toggle opened in all checked states.
- No horizontal overflow detected.
- Desktop inspector occupies the right side without overlay overflow.
- Mobile settings panel uses its own scroll area.
