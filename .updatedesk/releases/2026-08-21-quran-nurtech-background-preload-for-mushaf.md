---
project: quran-nurtech
public: true
type: feature
audience: users
title: Background preload for Mushaf
summary: Кнопка «Подгрузить» в мусхафе теперь запускает фоновую подгрузку всех страниц, QCF-шрифтов и страниц сур.
user_impact:
  - Можно начать полную подготовку мусхафа к чтению и продолжать листать страницы без ожидания.
  - Статус подгрузки больше не перекрывает страницу мусхафа и нижнюю навигацию.
screenshots:
  - qa-screens/2026-08-21-mushaf-background-preload/desktop-page13-final-1366x900.png
  - qa-screens/2026-08-21-mushaf-background-preload/mobile-page13-final-390x844.png
checks:
  - Manual Playwright QA on http://127.0.0.1:4321/mushaf/12: clicked preload, navigated to page 13 while loading, desktop transition 14ms, no status overlap.
  - Manual Playwright QA on http://127.0.0.1:4321/mushaf/12: mobile 390x844 background preload via DOM click, navigated to page 13 while loading, transition 20ms, no horizontal overflow.
  - npm run build (known Windows failure on pre-existing /1:1 route path: ENOENT mkdir dist\1:1).
deploy_url: http://127.0.0.1:4321/mushaf/12
---

Notes for editor:
- What changed: the preload action now queues 604 mushaf pages, 604 QCF font files, and 114 surah pages in a low-concurrency background worker.
- Where to verify: open /mushaf/12, press «Подгрузить», then move to the next page while the button shows «В фоне».
- Risks: a full preload can take time on weak networks, but it runs in the background and keeps page navigation responsive.
