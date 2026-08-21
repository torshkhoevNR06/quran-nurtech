---
project: quran-nurtech
public: true
type: feature
audience: users
title: Небольшие суры в мусхафе центрируются на странице
summary: Компактные страницы и отдельные короткие суры внутри поздних страниц мусхафа теперь показывают заголовок, басмалу и текст как единую центрированную группу.
user_impact:
  - «Аль-Фатиха» больше не прижимается к верхнему краю листа в режиме мусхафа.
  - Начало «Аль-Бакара» на странице 2 также центрируется как компактная страница, даже если сура продолжается дальше.
  - Отдельные короткие суры на страницах 596–599 получили собственный центрированный блок внутри страницы.
  - Название суры и басмала перемещаются вместе с текстом, сохраняя цельное восприятие страницы.
  - Страницы с несколькими законченными короткими сурами, включая 600–604, сохраняют прежнюю плотную раскладку.
screenshots:
  - qa-screens/2026-08-21-mushaf-compact-surah-centering/mobile390-p1.png
  - qa-screens/2026-08-21-mushaf-compact-surah-centering/mobile390-p2-dark-final.png
  - qa-screens/2026-08-21-mushaf-compact-surah-centering/mobile390-p596-compact-section.png
  - qa-screens/2026-08-21-mushaf-compact-surah-centering/mobile390-p597-compact-section.png
  - qa-screens/2026-08-21-mushaf-compact-surah-centering/desktop-p1.png
  - qa-screens/2026-08-21-mushaf-compact-surah-centering/mobile390-p604.png
checks:
  - Playwright Chrome mobile 390x844: /mushaf/1 compact=1, offset=3, no horizontal overflow
  - Playwright Chrome mobile 390x844: /mushaf/2 compact=1, offset=3, no horizontal overflow
  - Playwright Chrome mobile 390x844 dark theme: /mushaf/2 compact=1, offset=3, no horizontal overflow
  - Playwright Chrome mobile 390x844: /mushaf/596 compactSection=93, no horizontal overflow
  - Playwright Chrome mobile 390x844: /mushaf/597 compactSection=95, no horizontal overflow
  - Playwright Chrome mobile 390x844: /mushaf/598 compactSection=97, no horizontal overflow
  - Playwright Chrome mobile 390x844: /mushaf/599 compactSection=99, no horizontal overflow
  - Playwright Chrome mobile 390x844: /mushaf/600 and /mushaf/604 compactSection=null by multi-short-surah exception
  - Playwright Chrome inline navigation: /mushaf/596 -> /mushaf/597 carries compactSection=95 after swap
  - Playwright Chrome desktop 1365x900: /mushaf/1 compact=1, no overflow
  - Playwright Chrome mobile 390x844: /mushaf/604 compact=0, unchanged normal reflow, no horizontal overflow
  - Playwright Chrome touch zoom: /mushaf/1 keeps saved zoom state and switches to zoom reflow
  - npm run build: blocked by existing Windows route output issue, ENOENT mkdir dist\1:1
deploy_url: http://127.0.0.1:4321/mushaf/1
---

Notes for editor:
- What changed: compact standalone pages are detected server-side and rendered with a line offset inside the canonical 15-line QCF grid; late pages with exactly one complete short-surah section get mobile section centering.
- Where to verify: open /mushaf/1, /mushaf/2, /mushaf/596, /mushaf/597, /mushaf/598, /mushaf/599 on mobile; compare with /mushaf/600 and /mushaf/604.
- Risks: limited to pages where one complete short surah is visually separated from surrounding content; zoom mode keeps the existing mobile reflow.
