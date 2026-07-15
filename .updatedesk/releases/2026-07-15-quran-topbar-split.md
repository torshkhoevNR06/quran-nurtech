---
project: quran-nurtech
public: false
type: internal
audience: team
title: TopBar разделён на компоненты
summary: Панель приложения разделена на небольшие Astro-компоненты, а её клиентская логика вынесена из шаблона в отдельный модуль.
user_impact:
  - Поведение верхней панели сохранено на главной, поиске и странице суры.
  - Следующие доработки настроек, поиска и аудио можно делать точечно, без переписывания всего TopBar.
screenshots:
  - qa-screens/2026-07-15-topbar-split/desktop-home-topbar.png
  - qa-screens/2026-07-15-topbar-split/desktop-search-title.png
  - qa-screens/2026-07-15-topbar-split/desktop-surah-settings.png
  - qa-screens/2026-07-15-topbar-split/mobile-surah-settings.png
checks:
  - npm run build
  - Playwright smoke: /, /search/, /surah/1/ on desktop and mobile
deploy_url: local-only
---

Notes for editor:
- What changed: `src/components/TopBar.astro` now composes focused child components from `src/components/topbar/`.
- Where to verify: open `/`, `/search/`, and `/surah/1/`; check quick search, page title, settings, reciter menu, theme button, and bookmarks.
- Risks: mobile settings still needs the later full Apple-like component polish pass; this card only covers structural extraction.
