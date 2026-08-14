---
project: quran-nurtech
public: true
type: feature
audience: users
title: Мобильный Мусхаф: свайпы, fullscreen и устойчивый масштаб
summary: Улучшен мобильный режим Мусхафа: страницы листаются свайпом справа-налево, полноэкранный режим стал чище, а увеличение больше не уводит аяты за края экрана.
user_impact:
  - На телефоне страницы Мусхафа можно плавно перелистывать свайпом, при быстрой навигации показывается подготовленная соседняя страница или скелетон.
  - В fullscreen на мобильном скрыты лишние панели и стрелки, убрана рамка листа, текст занимает чистую область чтения.
  - При увеличении на телефоне растёт текст и появляется вертикальная прокрутка без горизонтального overflow и обрезания букв.
  - Карточка аята с переводом, тафсиром и действиями снова открывается после перелистывания страниц.
screenshots:
  - qa-screens/mushaf-mobile-toolbar-v4.png
  - qa-screens/mushaf-mobile-immersive-v6.png
  - qa-screens/mushaf-mobile-v2-p31.png
  - qa-screens/mushaf-mobile-v2-p44.png
checks:
  - git diff --check
  - Playwright mobile 390x844: pages 23, 30, 31, 44 at 100%, 125%, 160%
  - Playwright swipe: /mushaf/23 -> /mushaf/24 inline navigation
  - Playwright tap after swipe: ayah action sheet opens with translation
  - Playwright mobile fullscreen: toolbar hidden, immersive arrows hidden, sheet width equals viewport
  - npm run build (fails on existing Windows static route issue: ENOENT creating dist/1:1)
deploy_url: http://127.0.0.1:4321/mushaf/23
---

Notes for editor:
- Изменения касаются мобильного режима Мусхафа, fullscreen, zoom/reflow и делегированного открытия карточки аята.
- Известное ограничение сборки не связано с этой правкой: Astro на Windows не может создать папку `dist/1:1`.
