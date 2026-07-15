---
project: quran-nurtech
public: false
type: internal
audience: team
title: Настройки переведены на UI-компоненты
summary: Settings inspector переведён на переиспользуемые UI-компоненты без изменения пользовательского поведения.
user_impact:
  - Настройки сохраняют прежние переключатели, тему, шрифты, заучивание и scroll-lock.
  - Дальнейший polish будет проще делать единообразно через компоненты, а не вручную в каждой секции.
screenshots:
  - qa-screens/2026-07-15-ui-components-settings/desktop-settings-components.png
  - qa-screens/2026-07-15-ui-components-settings/mobile-settings-components.png
checks:
  - npm run build
  - Playwright settings components QA: 11 checks, 0 failures
deploy_url: http://127.0.0.1:4331/surah/1/
---

Notes for editor:
- What changed: added UI primitives for inspector sections, switch rows, list rows, segmented controls, sheet, toolbar and reader cards; settings markup now uses the new components.
- Where to verify: `/surah/1/`, open reading settings on desktop and mobile.
- Risks: Visual output should remain close to previous settings because old classes are intentionally preserved during migration.
