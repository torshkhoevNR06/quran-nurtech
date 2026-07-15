---
project: quran-nurtech
public: false
type: design
audience: team
title: Единые UI-компоненты для ключевых экранов
summary: Добавлены reusable Astro-компоненты для кнопок, иконок и секций; поиск, аудио и скачивание переведены на общий PageShell/PageHeader слой.
user_impact:
  - Поиск, аудио и скачивание выглядят более консистентно с остальным приложением.
  - Дальнейшая Apple-like доводка может идти через общие компоненты, а не локальные стили в каждой странице.
screenshots:
  - qa-screens/2026-07-15-ui-components/desktop-search.png
  - qa-screens/2026-07-15-ui-components/desktop-audio.png
  - qa-screens/2026-07-15-ui-components/mobile-search.png
  - qa-screens/2026-07-15-ui-components/mobile-download.png
checks:
  - npm run build
  - Playwright smoke: /search/, /audio/, /download/ on desktop and mobile
deploy_url: local-only
---

Notes for editor:
- What changed: added `Button`, `IconButton`, and `Section` components in `src/components/ui/`.
- Where to verify: `/search/`, `/audio/`, `/download/`.
- Risks: more pages still have local page-level styles and should be migrated in the next polish pass.
