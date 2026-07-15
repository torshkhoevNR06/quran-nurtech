---
project: quran-nurtech
public: false
type: internal
audience: team
title: Progress page вынесена из inline-слоёв
summary: Страница прогресса очищена от крупного inline CSS/JS: стили перенесены в `src/styles/progress.css`, клиентская логика в `src/client/progress.ts`.
user_impact:
  - Поведение экрана прогресса сохранено без пользовательских изменений.
  - Снижен архитектурный долг перед дальнейшим Apple-like polish и компонентной миграцией.
screenshots:
  - qa-screens/2026-07-15-progress-extract/desktop-progress.png
  - qa-screens/2026-07-15-progress-extract/mobile-progress.png
checks:
  - npm run build
  - Playwright smoke: /progress desktop 1440x900, mobile 390x844
deploy_url: local http://127.0.0.1:4354/progress/
---

Notes for editor:
- What changed:
  - `src/pages/progress.astro` reduced to page markup.
  - Progress CSS and client logic now live in dedicated files.
- Where to verify:
  - `/progress/`
- Risks:
  - Low: extraction preserved selectors and logic mechanically; client module has `ts-nocheck` for this first split.
