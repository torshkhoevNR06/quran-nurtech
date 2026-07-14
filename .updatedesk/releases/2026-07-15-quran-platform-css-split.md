---
project: quran-nurtech
public: false
type: internal
audience: team
title: Platform CSS разделён на Apple-like слои
summary: Большой src/styles/platform.css разнесён на base, interactions, desktop, tablet, iOS, compact и motion слои с сохранением прежнего порядка каскада.
user_impact: Внешний вид macOS/iOS оболочки сохраняется, а дальнейшая работа с inspector, sheets, tabbar и платформенными состояниями становится безопаснее.
screenshots:
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-15-platform-css-split/desktop-home-platform.png
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-15-platform-css-split/desktop-settings-open.png
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-15-platform-css-split/desktop-wide-settings-open.png
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-15-platform-css-split/tablet-surah-platform.png
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-15-platform-css-split/mobile-home-platform.png
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-15-platform-css-split/mobile-settings-open.png
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-15-platform-css-split/mobile-drawer-open.png
checks:
  - npm run build
  - git diff --check
  - Playwright QA: desktop/tablet/mobile platform shell, settings inspector/sheet, mobile drawer
deploy_url: https://quran.nurtech.dev
---
