---
project: quran-nurtech
public: false
type: internal
audience: team
title: Старый pages.css разобран на отдельные слои
summary: Generic page, feedback toast and utility helpers moved from src/styles/pages.css into page-base.css, feedback.css and utilities.css; pages.css removed from the app imports.
user_impact: Внешний вид страниц сохраняется, а CSS больше не держится на старом смешанном page-слое, который мог возвращать регрессии.
screenshots:
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-15-page-base-css-split/about-desktop-light.png
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-15-page-base-css-split/search-mobile-dark.png
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-15-page-base-css-split/surah-mobile-dark.png
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-15-page-base-css-split/audio-desktop-light.png
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-15-page-base-css-split/home-desktop-light.png
checks:
  - npm run build
  - git diff --check
  - Playwright QA: /about, /search, /surah/1, /audio, /
deploy_url: https://quran.nurtech.dev
---
