---
project: quran-nurtech
public: false
type: internal
audience: team
title: Global CSS очищен до базового слоя
summary: Topbar rules moved to shell.css, shared control/menu rules moved to components.css, adaptive leftovers moved to shell, reader, pages and platform layers.
user_impact: Внешний вид сохраняется, но стили стали предсказуемее: global.css больше не хранит topbar, controls и адаптивные исключения.
screenshots:
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-14-global-base-css-split/reader-desktop-dark.png
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-14-global-base-css-split/drawer-mobile-light.png
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-14-global-base-css-split/home-desktop-light.png
checks:
  - npm run build
  - git diff --check
  - Playwright QA: /surah/2 desktop dark, /surah/2 mobile drawer light, / home desktop light
deploy_url: https://quran.nurtech.dev
---
