---
project: quran-nurtech
public: false
type: internal
audience: team
title: Старый визуальный слой компонентов очищен
summary: Shared component primitives now keep only layout and interaction structure; Apple-like component tokens define the actual color, border, shadow and selected states.
user_impact: Интерфейс выглядит так же, но кнопки, меню, сегменты и чипы больше не тащат старые стеклянные цвета и тени из раннего CSS-слоя.
screenshots:
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-14-component-primitives-cleanup/topbar-controls-desktop-dark.png
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-14-component-primitives-cleanup/settings-popover-desktop-light.png
  - /Users/ilnur_ryazhapov/Desktop/code_src/quran-nurtech-codex-apple-ui/qa-screens/2026-07-14-component-primitives-cleanup/mobile-controls-light.png
checks:
  - npm run build
  - git diff --check
  - Playwright QA: desktop controls dark, settings inspector light, mobile drawer controls
deploy_url: https://quran.nurtech.dev
---
