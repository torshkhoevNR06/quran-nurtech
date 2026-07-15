---
project: quran-nurtech
public: false
type: internal
audience: team
title: Reader compatibility styles moved out of pages.css
summary: Surah, ayah, tafsir and ayah navigation compatibility rules moved from src/styles/pages.css to src/styles/reader.css.
user_impact: Экран чтения должен выглядеть как раньше, но его стили теперь собраны в reader-слое и меньше конфликтуют с общими страницами.
screenshots:
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-14-reader-compat-css-split/surah-desktop-light.png
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-14-reader-compat-css-split/surah-mobile-dark.png
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-14-reader-compat-css-split/ayah-desktop-dark.png
checks:
  - npm run build
  - git diff --check
  - Playwright QA: /surah/1 desktop light, /surah/1 mobile dark, /2:255 desktop dark
deploy_url: https://quran.nurtech.dev
---
