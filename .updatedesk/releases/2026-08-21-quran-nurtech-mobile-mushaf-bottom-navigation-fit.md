---
project: quran-nurtech
public: true
type: feature
audience: users
title: Mobile Mushaf bottom navigation fit
summary: Нижняя панель мусхафа на телефонах стала компактнее и больше не сжимает элементы друг в друга.
user_impact:
  - На мобильном скрыты кнопки поиска по аяту и продолжения/воспроизведения из нижней панели мусхафа.
  - На очень узких экранах нижняя панель оставляет только номер страницы и основные действия, чтобы избежать наложений.
screenshots:
  - qa-screens/2026-08-21-mushaf-mobile-bottom-nav-fit/mobile-390x844.png
  - qa-screens/2026-08-21-mushaf-mobile-bottom-nav-fit/mobile-430x932.png
  - qa-screens/2026-08-21-mushaf-mobile-bottom-nav-fit/mobile-440x956.png
  - qa-screens/2026-08-21-mushaf-mobile-bottom-nav-fit/mobile-320x760.png
checks:
  - GET http://127.0.0.1:4321/mushaf/39 returned 200.
  - Playwright QA at 320x760, 360x800, 390x844, 430x932, 440x956: no document horizontal overflow, no toolbar child overflow, no overlapping toolbar controls.
  - Verified mobile search and continue/play buttons are hidden in the bottom toolbar.
deploy_url: http://127.0.0.1:4321/mushaf/39
---

Notes for editor:
- What changed: mobile toolbar CSS now hides low-priority controls and uses a narrow-screen breakpoint for compact navigation.
- Where to verify: open /mushaf/39 on 390px, 430px, and 440px wide mobile viewports.
- Risks: on screens below 360px the surah/juz dropdowns are hidden from the bottom toolbar to preserve usable controls.
