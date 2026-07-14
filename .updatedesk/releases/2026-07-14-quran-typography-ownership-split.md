---
project: quran-nurtech
public: false
type: internal
audience: team
title: Typography rules moved to owning CSS layers
summary: Home, generic page, search and stats typography overrides moved out of src/styles/reader.css into their own feature stylesheets.
user_impact: Экраны сохраняют прежнюю типографику, а reader-слой больше не перебивает стили главной, поиска и статистики.
screenshots:
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-14-typography-ownership-split/home-desktop-light.png
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-14-typography-ownership-split/about-desktop-light.png
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-14-typography-ownership-split/search-mobile-dark.png
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-14-typography-ownership-split/stats-mobile-dark.png
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-14-typography-ownership-split/surah-desktop-dark.png
checks:
  - npm run build
  - git diff --check
  - Playwright QA: /, /about, /search, /stats, /surah/1
deploy_url: https://quran.nurtech.dev
---
