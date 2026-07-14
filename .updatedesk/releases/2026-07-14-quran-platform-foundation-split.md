---
project: quran-nurtech
public: false
type: internal
audience: team
title: Платформенные UI-утилиты вынесены в platform.css
summary: Focus ring, active press feedback, tabular numbers, switch control and reduced-motion/transparency rules moved from global.css to src/styles/platform.css.
user_impact: Визуально поведение не меняется, но системные правила macOS/iOS теперь собраны в профильном платформенном слое.
screenshots:
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-14-platform-foundation-split/settings-desktop-dark.png
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-14-platform-foundation-split/settings-mobile-light.png
checks:
  - npm run build
  - git diff --check
  - Playwright QA: settings panel desktop dark, settings panel mobile light, search focus desktop light
deploy_url: https://quran.nurtech.dev
---
