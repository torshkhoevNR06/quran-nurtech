---
project: quran-nurtech
public: false
type: internal
audience: team
title: Shell CSS разделён на зоны интерфейса
summary: Большой src/styles/shell.css разнесён на topbar, player, drawer, desktop shell, drawer tabs, mobile base, compatibility и safe-area слои с сохранением прежнего порядка каскада.
user_impact: Внешний вид верхней панели, бокового меню и мобильного drawer сохраняется, а дальнейшая доработка shell становится безопаснее.
screenshots:
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-15-shell-css-split/desktop-home-shell.png
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-15-shell-css-split/desktop-surah-9-shell.png
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-15-shell-css-split/mobile-home-shell.png
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-15-shell-css-split/mobile-surah-9-shell.png
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-15-shell-css-split/mobile-drawer-open.png
checks:
  - npm run build
  - git diff --check
  - Playwright QA: home and surah shell on desktop/mobile, mobile drawer open
deploy_url: https://quran.nurtech.dev
---
