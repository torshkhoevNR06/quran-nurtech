project: quran-nurtech
public: true
type: fix
audience: users
title: Попап подгрузки можно скрывать
summary: Прогресс фоновой загрузки больше не мешает чтению мусхафа и управляется той же кнопкой.
user_impact: Повторный тап по активной кнопке подгрузки скрывает или возвращает попап прогресса. Загрузка продолжает работать в фоне, а меню и мусхаф не перекрываются постоянно.
screenshots:
  - qa-screens/2026-09-09-mushaf-qcf-fixes-after/mobile-preload-toggle-visible-final.png
checks:
  - git diff --check
  - Playwright mobile flow: open menu, start preload, hide popup, show popup again
  - Local route responds with HTTP 200
deploy_url: http://127.0.0.1:4321/mushaf/76
