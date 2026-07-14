---
project: quran-nurtech
public: false
type: internal
audience: team
title: Shell и reader мелкие стили вынесены из global.css
summary: Desktop toolbar density and drawer tabs moved to src/styles/shell.css; juz/page separators moved to src/styles/reader.css.
user_impact: Внешний вид не меняется, но правила топбара, бокового меню и маркеров чтения теперь лежат в своих слоях.
screenshots:
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-14-shell-reader-css-split/topbar-desktop-dark.png
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-14-shell-reader-css-split/drawer-mobile-light.png
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-14-shell-reader-css-split/reader-markers-desktop-light.png
checks:
  - npm run build
  - git diff --check
  - Playwright QA: /surah/2 desktop dark topbar, mobile light drawer, desktop light reader markers
deploy_url: https://quran.nurtech.dev
---
