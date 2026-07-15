---
project: quran-nurtech
public: false
type: internal
audience: team
title: Topbar compatibility styles moved to shell.css
summary: Topbar, brand and quick-search compatibility rules moved from src/styles/pages.css to src/styles/shell.css.
user_impact: Верхняя панель выглядит как раньше, но shell-стили больше не смешаны с generic page CSS; safe-area поведение на мобильных стало устойчивее.
screenshots:
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-14-shell-topbar-css-split/home-desktop-light.png
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-14-shell-topbar-css-split/home-mobile-light.png
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-14-shell-topbar-css-split/surah-desktop-dark.png
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-14-shell-topbar-css-split/surah-mobile-dark.png
checks:
  - npm run build
  - git diff --check
  - Playwright QA: / desktop light, / mobile light, /surah/1 desktop dark, /surah/1 mobile dark
deploy_url: https://quran.nurtech.dev
---
