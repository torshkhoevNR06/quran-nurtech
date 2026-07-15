---
project: quran-nurtech
public: true
type: feature
audience: users
title: Apple-like редизайн прошёл финальную матрицу
summary: Завершён Apple-like cleanup-план: приложение прошло широкую проверку основных экранов, размеров, мобильных панелей, плеера и мушафа.
user_impact:
  - Основные экраны проверены на телефоне, планшете и desktop без горизонтальных выездов.
  - Drawer, настройки, аудиоплеер и мушаф проверены отдельными пользовательскими сценариями.
  - Safari-like WebKit smoke больше не показывает warning от viewport meta.
screenshots:
  - qa-screens/2026-07-15-final-apple-ui-matrix/chromium-iphone-se-home.png
  - qa-screens/2026-07-15-final-apple-ui-matrix/chromium-iphone-large-surah_9.png
  - qa-screens/2026-07-15-final-apple-ui-matrix/chromium-desktop-normal-mushaf_2.png
  - qa-screens/2026-07-15-final-apple-ui-matrix/webkit-smoke-iphone-se-search.png
  - qa-screens/2026-07-15-final-apple-ui-matrix/webkit-smoke-desktop-normal-home.png
checks:
  - "npm run build"
  - "Playwright final Apple UI matrix: 1396 checks, 0 failures"
deploy_url: https://quran.nurtech.dev
---

Notes for editor:
- What changed: final QA matrix completed; viewport meta cleaned from WebKit-ignored interactive-widget key.
- Where to verify: qa-screens/2026-07-15-final-apple-ui-matrix/REPORT.md.
- Risks: local Playwright WebKit is Safari-like smoke, not a physical iPhone Safari manual session.
