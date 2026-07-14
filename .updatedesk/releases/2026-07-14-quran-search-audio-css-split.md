---
project: quran-nurtech
public: false
type: internal
audience: team
title: Стили поиска и аудио вынесены из pages.css
summary: Search form/results rules moved to src/styles/search.css; audio selectors/player/list rules moved to src/styles/audio.css.
user_impact: Поиск и аудио выглядят как раньше, но их CSS больше не смешан с общим слоем страниц.
screenshots:
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-14-search-audio-css-split/search-desktop-light.png
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-14-search-audio-css-split/search-mobile-dark.png
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-14-search-audio-css-split/audio-desktop-light.png
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-14-search-audio-css-split/audio-mobile-dark.png
checks:
  - npm run build
  - git diff --check
  - Playwright QA: /search and /audio desktop light plus mobile dark
deploy_url: https://quran.nurtech.dev
---
