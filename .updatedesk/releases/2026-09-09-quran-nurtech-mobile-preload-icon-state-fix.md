project: quran-nurtech
public: true
type: fix
audience: users
title: Исправлена иконка фоновой подгрузки
summary: При запуске фоновой загрузки мобильная кнопка сохраняет иконку и показывает анимацию вместо замены SVG текстом.
user_impact: Пользователь может нажать на активную кнопку и сохранить визуальный индикатор загрузки; подпись состояния обновляется отдельно, а иконка остается доступной для отображения прогресса.
screenshots:
  - qa-screens/2026-09-09-mushaf-qcf-fixes-after/mobile-preload-menu-final.png
checks:
  - git diff --check
  - Playwright mobile: preload button retains SVG and label after reload
  - Local route responds with HTTP 200
deploy_url: http://127.0.0.1:4321/mushaf/76
