---
project: quran-nurtech
public: true
type: design
audience: users
title: Редактор картинок аятов стал системным bottom sheet
summary: Редактор картинки аята получил системный desktop-modal и мобильный bottom sheet с внутренней прокруткой настроек.
user_impact:
  - На телефоне редактор открывается как нативная нижняя панель и не прокручивает страницу под собой.
  - На desktop настройки и предпросмотр разделены аккуратнее, кнопки и чипы совпадают с общей UI-системой приложения.
screenshots:
  - qa-screens/2026-07-15-image-editor-polish/desktop-editor.png
  - qa-screens/2026-07-15-image-editor-polish/mobile-editor.png
checks:
  - npm run build
  - Playwright image editor polish QA: 12 checks, 0 failures
deploy_url: https://quran.nurtech.dev
---

Notes for editor:
- What changed: image editor now uses system material, shared button classes, dialog semantics and mobile internal scroll.
- Where to verify: open any ayah, use the share/image action, then check desktop and mobile editor layout.
- Risks: canvas export logic was not redesigned; this pass is scoped to shell, controls and scroll behavior.
