project: quran-nurtech
public: true
type: fix
audience: users
title: Иконка подгрузки сохраняется во время загрузки
summary: Исправлено мобильное состояние фоновой подгрузки: иконка больше не заменяется текстом.
user_impact: В мобильном меню кнопка сохраняет SVG-иконку, подпись состояния отображается отдельно, а активная иконка получает плавную анимацию. Пользователь может визуально контролировать процесс подгрузки.
screenshots:
  - qa-screens/2026-09-09-mushaf-qcf-fixes-after/mobile-preload-normal-final.png
  - qa-screens/2026-09-09-mushaf-qcf-fixes-after/mobile-preload-loading-final.png
checks:
  - git diff --check
  - Playwright mobile: active button contains SVG, label В фоне, animation mushafPreloadIconPulse
  - Local route responds with HTTP 200
deploy_url: http://127.0.0.1:4321/mushaf/76
