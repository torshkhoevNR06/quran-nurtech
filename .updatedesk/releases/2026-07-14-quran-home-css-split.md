---
project: quran-nurtech
public: false
type: internal
audience: team
title: Стили главной и каталога вынесены из pages.css
summary: Home hero, quick surahs, list tools and surah catalog cards moved to src/styles/home.css.
user_impact: Главная и карточки сур выглядят как раньше, но их CSS больше не смешан с общими страницами.
screenshots:
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-14-home-css-split/home-desktop-light.png
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-14-home-css-split/home-mobile-dark.png
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-14-home-css-split/videos-desktop-light.png
checks:
  - npm run build
  - git diff --check
  - Playwright QA: / desktop light, / mobile dark, /videos desktop light
deploy_url: https://quran.nurtech.dev
---
