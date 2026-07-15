---
project: quran-nurtech
public: true
type: feature
audience: users
title: Мобильные панели получили общий scroll-lock
summary: Мобильные меню, настройки, редактор картинки, лист аята в мушафе и плеер теперь ведут себя как отдельные iOS-панели: скроллятся внутри себя и не двигают страницу под ними.
user_impact:
  - При открытии меню, настроек, редактора картинки или листа аята страница под панелью больше не прокручивается.
  - В мобильной строке аята снова доступны дополнительные действия, включая открытие редактора картинки.
  - Нижний лист аята в мушафе и mini-player учитывают safe area и не вылезают за viewport.
screenshots:
  - qa-screens/2026-07-15-mobile-overlay-audit/mobile-drawer.png
  - qa-screens/2026-07-15-mobile-overlay-audit/mobile-settings.png
  - qa-screens/2026-07-15-mobile-overlay-audit/mobile-image-editor.png
  - qa-screens/2026-07-15-mobile-overlay-audit/mobile-mushaf-sheet.png
  - qa-screens/2026-07-15-mobile-overlay-audit/mobile-player.png
checks:
  - npm run build
  - "Playwright mobile overlay audit: 6 checks, 0 failures"
deploy_url: https://quran.nurtech.dev
---

Notes for editor:
- What changed: общий mobile scroll-lock расширен на настройки, drawer, mushaf sheet и image editor; settings sheet стал собственным scroll-контейнером; mobile-действия аята больше не скрываются; mushaf sheet и player поправлены под safe area.
- Where to verify: /surah/1/ и /mushaf/2 на телефоне.
- Risks: изменения затрагивают только mobile overlays и связанные CSS-состояния.
