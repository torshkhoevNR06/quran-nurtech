---
project: quran-nurtech
public: true
type: feature
audience: users
title: Mushaf preload progress indicator
summary: В шапке мусхафа появился анимированный индикатор фоновой подгрузки с попапом прогресса.
user_impact:
  - Пользователь видит, что подгрузка всех страниц, сур и QCF-шрифтов реально идёт в фоне.
  - В попапе показываются выполненные задачи, процент и примерный оставшийся объём в МБ.
screenshots:
  - qa-screens/2026-08-21-mushaf-preload-topbar-progress/desktop-1366x900-popover.png
  - qa-screens/2026-08-21-mushaf-preload-topbar-progress/mobile-390x844-popover.png
checks:
  - GET http://127.0.0.1:4321/mushaf/12 returned 200.
  - Playwright QA desktop 1366x900: preload indicator appears, popover shows 2 / 1322 and remaining MB, page navigation during preload completed in 15ms.
  - Playwright QA mobile 390x844: preload indicator appears, popover opens on tap, does not overlap the mushaf sheet or bottom controls, page navigation during preload completed in 19ms.
  - npm run build (known Windows failure on pre-existing /1:1 route path: ENOENT mkdir dist\1:1).
deploy_url: http://127.0.0.1:4321/mushaf/12
---

Notes for editor:
- What changed: the background preload flow now publishes progress to a topbar indicator and popover while preserving page navigation.
- Where to verify: open /mushaf/12, press «Подгрузить», then hover/tap the animated icon in the app header.
- Risks: remaining MB is approximate until each request exposes an actual content length.
