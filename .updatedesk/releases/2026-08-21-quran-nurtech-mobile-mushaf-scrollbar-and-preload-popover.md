---
project: quran-nurtech
public: true
type: fix
audience: users
title: Мобильный мусхаф без лишнего скролла
summary: В обычном мобильном режиме убран тонкий скроллбар страницы мусхафа, а окно фоновой подгрузки теперь открывается поверх текста без сдвига страницы.
user_impact:
  - Кнопки навигации остаются под мусхафом, а страница не пытается прокручиваться в обычном масштабе.
  - При увеличении мусхафа возвращается внутренний скролл с аккуратной дорожкой и ограниченными краями.
  - Попап подгрузки открывается поверх мусхафа и закрывается повторным нажатием на иконку.
screenshots:
  - qa-screens/2026-08-21-mushaf-mobile-scrollbar-preload-popover/mobile-390x844-normal.png
  - qa-screens/2026-08-21-mushaf-mobile-scrollbar-preload-popover/mobile-390x844-zoomed.png
  - qa-screens/2026-08-21-mushaf-mobile-scrollbar-preload-popover/mobile-390x844-popover-overlay.png
  - qa-screens/2026-08-21-mushaf-mobile-scrollbar-preload-popover/mobile-430x932-popover-overlay.png
checks:
  - GET http://127.0.0.1:4321/mushaf/40 returned 200
  - Playwright mobile 390x844 normal mode verified overflow hidden and hidden scrollbar
  - Playwright mobile 390x844 zoomed mode verified internal auto scroll and styled scrollbar track
  - Playwright mobile 390x844 and 430x932 verified preload popover overlays the mushaf, does not shift it, and closes on second tap
deploy_url: http://127.0.0.1:4321/mushaf/40
---

Notes for editor:
- What changed: mobile scrollbar behavior and the topbar preload popover interaction were adjusted for the mushaf route.
- Where to verify: open /mushaf/40 on a phone viewport, then zoom in and tap the preload indicator twice.
- Risks: browser scrollbar styling differs between engines, so the native scroll thumb may render slightly differently on Safari and Chromium.
