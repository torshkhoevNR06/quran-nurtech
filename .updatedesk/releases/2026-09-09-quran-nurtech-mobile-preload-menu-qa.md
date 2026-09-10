project: quran-nurtech
public: true
type: fix
audience: users
title: Проверено мобильное меню подгрузки
summary: Последняя кнопка мобильного меню сохраняет анимированную иконку и показывает прогресс фоновой подгрузки.
user_impact: После открытия бокового меню и тапа по подгрузке пользователь видит состояние «В фоне» с сохраненной иконкой и отдельный попап с количеством обработанных страниц и прогрессом.
screenshots:
  - qa-screens/2026-09-09-mushaf-qcf-fixes-after/mobile-menu-open-before-preload-final.png
  - qa-screens/2026-09-09-mushaf-qcf-fixes-after/mobile-menu-preload-active-final.png
checks:
  - git diff --check
  - Playwright real flow: open mobile actions menu, tap preload, verify SVG and animation
  - Playwright mobile: progress popup visible with detail 17 / 1322
  - Local route responds with HTTP 200
deploy_url: http://127.0.0.1:4321/mushaf/76
