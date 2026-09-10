project: quran-nurtech
public: true
type: fix
audience: users
title: Исправлена кнопка подгрузки в мобильном меню
summary: Кнопка подгрузки выровнена по остальным действиям и получила понятную анимацию во время работы.
user_impact: Подпись «Подгрузить» находится на общем уровне с другими названиями меню, а иконка плавно сигнализирует о фоновой загрузке. Остальные пункты меню и десктопный интерфейс не изменены.
screenshots:
  - qa-screens/2026-09-09-mushaf-qcf-fixes-after/mobile-preload-menu-final.png
checks:
  - git diff --check
  - Playwright mobile: label display block, preload icon animation mushafPreloadIconPulse 1.1s
  - Local route responds with HTTP 200
deploy_url: http://127.0.0.1:4321/mushaf/76
