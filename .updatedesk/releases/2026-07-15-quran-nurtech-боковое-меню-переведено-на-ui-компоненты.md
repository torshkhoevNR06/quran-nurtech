---
project: quran-nurtech
public: false
type: internal
audience: team
title: Боковое меню переведено на UI-компоненты
summary: Drawer/sidebar переведён на общие ListRow, IconButton и SegmentedControl, а встроенные стили вынесены в отдельный shell CSS-слой.
user_impact:
  - Меню сохраняет поиск сур, вкладку джузов, collapse/reopen на desktop и mobile sheet со своим скроллом.
  - Код меню стал ближе к общей Apple-like системе и меньше зависит от inline CSS в Astro.
screenshots:
  - qa-screens/2026-07-15-drawer-component/desktop-drawer-component.png
  - qa-screens/2026-07-15-drawer-component/mobile-drawer-component.png
checks:
  - npm run build
  - Playwright drawer component QA: 11 checks, 0 failures
deploy_url: http://127.0.0.1:4331/surah/2/
---

Notes for editor:
- What changed: `Drawer.astro` uses shared UI rows and segmented tabs; source-list CSS moved to `src/styles/shell-drawer-source-list.css`.
- Where to verify: `/surah/2/`, open/collapse drawer, filter surahs and switch to juz tab on desktop and mobile.
- Risks: Client-generated surah/juz rows are still HTML strings from `src/client/drawer.ts`; this was intentionally left for a later deeper pass.
