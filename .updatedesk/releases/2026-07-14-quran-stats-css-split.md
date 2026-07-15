---
project: quran-nurtech
public: false
type: internal
audience: team
title: Стили статистики вынесены в отдельный слой
summary: Stats table and statistic tile rules moved from pages.css to src/styles/stats.css with the same desktop and mobile behavior.
user_impact: Экран статистики выглядит так же, но его таблицы и карточки больше не смешаны с CSS главной, поиска и аудио.
screenshots:
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-14-stats-css-split/stats-desktop-light.png
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-14-stats-css-split/stats-mobile-dark.png
checks:
  - npm run build
  - git diff --check
  - Playwright QA: /stats desktop light and mobile dark
deploy_url: https://quran.nurtech.dev
---
