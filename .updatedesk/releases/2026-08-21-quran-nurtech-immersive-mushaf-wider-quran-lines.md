---
project: quran-nurtech
public: true
type: fix
audience: users
title: Шире строки мусхафа в fullscreen
summary: В полноэкранном режиме мусхафа арабские строки стали крупнее и ровнее занимают доступную ширину экрана на телефонах.
user_impact:
  - Аяты в fullscreen больше не выглядят слишком мелкими и сжатыми по центру.
  - Строки тянутся к стабильным левым и правым границам с небольшим безопасным отступом.
  - Проверено, что строки не вылезают за край и не обрезаются на разных ширинах телефонов.
screenshots:
  - qa-screens/2026-08-21-mushaf-immersive-line-width/mobile-390x844-p57-before.png
  - qa-screens/2026-08-21-mushaf-immersive-line-width/mobile-320x740-p57-after.png
  - qa-screens/2026-08-21-mushaf-immersive-line-width/mobile-360x800-p57-after.png
  - qa-screens/2026-08-21-mushaf-immersive-line-width/mobile-390x844-p57-after.png
  - qa-screens/2026-08-21-mushaf-immersive-line-width/mobile-414x896-p57-after.png
  - qa-screens/2026-08-21-mushaf-immersive-line-width/mobile-430x932-p57-after.png
  - qa-screens/2026-08-21-mushaf-immersive-line-width/mobile-390x844-p42-after.png
  - qa-screens/2026-08-21-mushaf-immersive-line-width/mobile-390x844-p2-after.png
checks:
  - Playwright fullscreen page 57 checked at 320x740, 360x800, 390x844, 414x896, and 430x932
  - Playwright verified fullscreen page 57 has no Quran line overflow at each tested phone width
  - Playwright checked fullscreen page 42 and page 2 at 390x844 for dense and compact page behavior
  - Playwright smoke checked normal mobile 390x844, desktop 1200x900, and fullscreen tablet-width 768x900
deploy_url: http://127.0.0.1:4321/mushaf/57
---

Notes for editor:
- What changed: fullscreen mobile Mushaf uses a dedicated text baseline and bounded QCF line scaling.
- Where to verify: open /mushaf/57 on a phone viewport, enter fullscreen, and compare side gutters with the previous narrow centered text.
- Risks: Quran font metrics can vary slightly by browser, so final QA should include real iOS Safari and Android Chrome.
