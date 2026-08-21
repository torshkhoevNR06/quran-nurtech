---
project: quran-nurtech
public: true
type: feature
audience: users
title: Sajda-like Mushaf reading flow
summary: Мусхаф получил Sajda-like сценарии чтения: быстрый переход к аяту, несколько стилей страницы, переключатель таджвида, сохранение последней позиции, Continue в мусхаф и экран дуа хатма.
user_impact:
  - Читатель может остаться в режиме мусхафа, открыть перевод выбранного аята, скопировать ссылку, сохранить закладку или подготовить картинку.
  - Последняя страница и выбранный аят сохраняются, поэтому кнопка «Продолжить» возвращает прямо в мусхаф.
  - После страницы 604 доступен спокойный экран дуа хатма.
screenshots:
  - qa-screens/2026-08-21-sajda-mushaf-comparison/mobile-after-style-tajweed.png
  - qa-screens/2026-08-21-sajda-mushaf-comparison/mobile-ayah-jump-sheet.png
  - qa-screens/2026-08-21-sajda-mushaf-comparison/mobile-khatm.png
  - qa-screens/2026-08-21-sajda-mushaf-comparison/desktop-dark.png
  - qa-screens/2026-08-21-sajda-mushaf-comparison/mobile-swipe-zoom-immersive.png
checks:
  - Sajda comparison recorded in qa-screens/2026-08-21-sajda-mushaf-comparison/SAJDA-COMPARISON.md
  - npm run build reached static route generation; failed on existing Windows-only dist/1:1 colon path issue after client bundle compilation.
  - npx tsc --noEmit failed on existing project-wide TypeScript issues in audio/search/topbar/reader-actions.
  - Playwright/Chrome: mobile ayah jump 2:255 opened /mushaf/42?ayah=2%3A255, sheet open, 51 words highlighted, console errors 0.
  - Playwright/Chrome: desktop dark /mushaf/28, overflow false, console errors 0.
  - Playwright/Chrome: mobile swipe /mushaf/28 -> /mushaf/29, immersive true, overflow false, console errors 0.
deploy_url: http://127.0.0.1:4321/mushaf/28
---

Notes for editor:
- What changed: Added Mushaf mode switching, style cycle, Tajweed toggle, ayah jump, copy-link action, Mushaf continue state, remote QCF font caching, and khatm dua screen.
- Where to verify: /mushaf/28, /mushaf/42?ayah=2:255, /mushaf/604, /mushaf/khatm.
- Risks: The Windows static build failure is unrelated to this change but still blocks a full local build on this machine until colon routes are handled for Windows.
