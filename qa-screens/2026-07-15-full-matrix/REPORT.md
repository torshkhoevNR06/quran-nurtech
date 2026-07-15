# Full Apple-like QA matrix

Date: 2026-07-15
Branch: `codex/apple-ui-four-pass`

## Scope

Full smoke pass for the remaining Apple-like redesign work after CSS/module/component extraction.

## Routes

Checked on desktop 1440x1000 and mobile 390x844:

- `/`
- `/surah/1/`
- `/surah/9/`
- `/mushaf/1/`
- `/mushaf/2/`
- `/search/`
- `/progress/`
- `/stats/`
- `/audio/`
- `/bookmarks/`
- `/topics/`
- `/glossary/`
- `/tasbih/`
- `/download/`
- `/about/`

## Automated Checks

- HTTP status is successful.
- Main content is not empty.
- TopBar/drawer/mobile tabbar presence is stable.
- No console errors or page errors.
- No horizontal overflow.
- Mушаф page renders QCF page container.
- Surah pages render ayah items.

## Result

- 30 route/viewport combinations checked.
- 0 automated problems in `problems.json`.
- `npm run build` passed.

## Extra Mushaf Immersive Check

After a focused immersive-mode check, mobile fullscreen still had the mobile tabbar computed as visible. The CSS now hides `.mobile-tabbar` under `body.mushaf-immersive`.

Verified after fix:

- desktop immersive: topbar/footer/tabbar `display: none`, no overflow.
- mobile immersive: topbar/footer/tabbar `display: none`, no overflow.

## Evidence

- `results.json`
- `problems.json`
- `immersive-results.json`
- `immersive-after-fix-results.json`
- screenshots in this folder for every route/viewport and immersive state
