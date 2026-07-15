---
project: quran-nurtech
public: false
type: fix
audience: team
title: Финальная QA-матрица и fullscreen мушафа
summary: Пройден полный smoke по основным экранам на desktop/mobile; fullscreen мушафа теперь явно скрывает весь app chrome, включая нижнюю мобильную навигацию.
user_impact:
  - Мушаф в режиме полного чтения больше не держит активным нижний mobile tabbar.
  - Основные экраны проверены на ошибки, пустой контент и горизонтальный скролл.
screenshots:
  - qa-screens/2026-07-15-full-matrix/mobile-mushaf-immersive-after-fix.png
  - qa-screens/2026-07-15-full-matrix/desktop-mushaf-immersive-after-fix.png
  - qa-screens/2026-07-15-full-matrix/mobile-surah-9.png
  - qa-screens/2026-07-15-full-matrix/desktop-mushaf-2.png
checks:
  - npm run build
  - Playwright full matrix: 15 routes x desktop/mobile
  - Playwright immersive mushaf check on desktop/mobile
deploy_url: local-only
---

Notes for editor:
- What changed: `body.mushaf-immersive .mobile-tabbar` is now hidden with the rest of app chrome.
- Where to verify: `/mushaf/2/`, click fullscreen, check desktop and mobile.
- Risks: visual polish can continue, but automated smoke found no blocking route/viewport failures.
