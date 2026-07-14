---
project: quran-nurtech
public: true
type: fix
audience: users
title: Настройки чтения стали аккуратнее
summary: Обновили поведение панели настроек чтения и убрали лишнее меню чтецов, которое могло оставаться поверх страницы.
user_impact: Настройки открываются чище на компьютере и телефоне, не перекрываются случайным списком чтецов и нормально прокручиваются внутри панели.
screenshots:
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech/qa-screens/2026-07-14-settings-redesign/desktop-settings-playwright-open.png
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech/qa-screens/2026-07-14-settings-redesign/mobile-settings-playwright-dark-open.png
checks:
  - npm run build
  - Playwright QA: desktop 1440x900, mobile 390x844, light/dark, overflowX=0
deploy_url: https://quran.nurtech.dev
---
