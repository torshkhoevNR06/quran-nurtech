project: quran-nurtech
public: true
type: design
audience: users
title: Мобильные действия мусхафа вынесены в плавающий слой
summary: На мобильных экранах управление мусхафом теперь открывается компактной плавающей кнопкой с плавным вертикальным меню.
user_impact: Кнопки навигации, перехода, темы, таджвида, продолжения, полноэкранного режима и фоновой подгрузки не занимают место под страницей. Обычный тап по аяту показывает controls, а удержание открывает шторку аята. В immersive-режиме плавающие controls и zoom скрыты.
screenshots:
  - qa-screens/2026-09-08-mushaf-mobile-floating-controls/12-controls-final.png
  - qa-screens/2026-09-08-mushaf-mobile-floating-controls/13-menu-final.png
  - qa-screens/2026-09-08-mushaf-mobile-floating-controls/16-long-ayah-press-final.png
  - qa-screens/2026-09-08-mushaf-mobile-floating-controls/17-immersive-final.png
checks:
  - npm run data
  - git diff --check
  - npx tsc --noEmit (existing unrelated errors remain in audio.ts, search.ts, and topbar.ts)
  - Manual/visual QA at 320x700, 390x844, 430x932, and desktop viewport
  - Mobile short tap, long press, swipe navigation, zoom, menu actions, and immersive exit
deploy_url: http://127.0.0.1:4321/mushaf/76
