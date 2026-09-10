---
project: quran-nurtech
public: true
type: feature
audience: users
title: Анимированный skeleton мусхафа
summary: В режиме мусхафа появилась живая wave-заглушка с разными силуэтами для плотных страниц, отдельных коротких сур и страниц с короткой сурой внутри листа.
user_impact:
  - При открытии и перелистывании мусхаф показывает аккуратный анимированный skeleton вместо однотипных статичных линий.
  - Заглушка повторяет тип страницы: плотный лист, компактная короткая сура или отдельная короткая секция.
  - Размер страницы и область чтения не прыгают во время загрузки шрифта или inline-перехода.
screenshots:
  - qa-screens/2026-09-08-mushaf-skeleton-variants/desktop1366-p76-dense.png
  - qa-screens/2026-09-08-mushaf-skeleton-variants/desktop1366-p596-section.png
  - qa-screens/2026-09-08-mushaf-skeleton-variants/mobile390-p2-compact.png
  - qa-screens/2026-09-08-mushaf-skeleton-variants/mobile390-p596-section.png
  - qa-screens/2026-09-08-mushaf-skeleton-variants/mobile390-p596-immersive-section.png
checks:
  - npm run data
  - git diff --check
  - npx tsc --noEmit (blocked by existing unrelated TypeScript errors in src/client/audio.ts, src/client/search.ts, and src/client/topbar.ts)
  - npm run build (blocked on Windows by existing route output path dist/1:1 containing ':')
  - Playwright QA: /mushaf/76 dense, /mushaf/2 compact, /mushaf/596 section, /mushaf/604 dense at 390x844 and 1366x900; skeleton animation active; overflowX=0
  - Playwright QA: mobile 390x844 immersive /mushaf/596 keeps section skeleton inside 390x844 sheet with overflowX=0
  - Playwright QA: delayed inline navigation 595 -> 596 and 75 -> 76 keeps sheet height stable while pending skeleton is visible
deploy_url: http://127.0.0.1:4321/mushaf/76
---

Notes for editor:
- What changed: the Mushaf route now server-renders a skeleton kind per page and exposes a small page-kind index so client-side pending pages and swipe peeks can render the right placeholder before the QCF font loads.
- Where to verify: /mushaf/76, /mushaf/2, /mushaf/596, /mushaf/604 on mobile and desktop; enter immersive mode on /mushaf/596.
- Risks: build and full TypeScript checks are still blocked by pre-existing project issues outside this change.
