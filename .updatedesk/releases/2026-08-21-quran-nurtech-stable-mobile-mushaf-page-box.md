---
project: quran-nurtech
public: true
type: fix
audience: users
title: Стабильный размер мобильного мусхафа
summary: Мобильный лист мусхафа больше не меняет высоту при перелистывании и не сужается на мгновение при обновлении страницы.
user_impact:
  - При свайпе или переходе на соседнюю страницу лист сохраняет ту же высоту в обычном режиме.
  - При reload сразу используется финальная ширина листа, без временных пустых полей по бокам.
  - Zoom и выход из fullscreen продолжают возвращать обычную геометрию мусхафа.
screenshots:
  - qa-screens/2026-08-21-mushaf-stable-page-box/reload-settled-after.png
  - qa-screens/2026-08-21-mushaf-stable-page-box/keynav-settled-after.png
  - qa-screens/2026-08-21-mushaf-stable-page-box/swipe-320x740-p67-after.png
  - qa-screens/2026-08-21-mushaf-stable-page-box/swipe-390x844-p67-after.png
  - qa-screens/2026-08-21-mushaf-stable-page-box/swipe-430x932-p67-after.png
  - qa-screens/2026-08-21-mushaf-stable-page-box/swipe-390x844-p42-after.png
  - qa-screens/2026-08-21-mushaf-stable-page-box/zoom-390x844-p67-after.png
  - qa-screens/2026-08-21-mushaf-stable-page-box/immersive-exit-390x844-p67-after.png
checks:
  - Playwright reload frame sampling at 390x844 verified sheet width stays 384px from domcontentloaded through settled state
  - Playwright key navigation page 67 to 68 verified normal, pending, and settled sheet height all stay 664px
  - Playwright swipe navigation verified stable sheet heights at 320x740, 390x844, and 430x932
  - Playwright swipe navigation page 42 to 43 verified stable sheet height and no horizontal overflow
  - Playwright zoom check verified zoomed mode keeps internal scroll
  - Playwright immersive enter/exit check verified normal mobile height returns to 664px
deploy_url: http://127.0.0.1:4321/mushaf/67
---

Notes for editor:
- What changed: mobile Mushaf CSS fallbacks now match JS layout values, and page-change placeholders reuse the current sheet height.
- Where to verify: open /mushaf/67 on a phone viewport, reload, then swipe to /mushaf/68.
- Risks: browser dynamic viewport units can differ on real mobile browser chrome, so final QA should include real Safari/Chrome device swipes.
