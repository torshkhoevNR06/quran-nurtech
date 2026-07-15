---
project: quran-nurtech
public: true
type: feature
audience: users
title: Настройки на desktop получили устойчивый three-column fallback
summary: На широких экранах настройки работают как правый inspector и ужимают рабочую область, а на 1024–1119 px открываются как аккуратный popover внутри экрана.
user_impact:
  - На 1280/1440 px настройки больше не перекрывают контент, а занимают правую колонку.
  - На 1024 px панель настроек не улетает вниз за экран и остаётся прокручиваемой.
  - Sidebar можно сворачивать независимо, без горизонтального overflow и поломки toolbar.
screenshots:
  - qa-screens/2026-07-15-desktop-three-column-audit/desktop-1440-settings.png
  - qa-screens/2026-07-15-desktop-three-column-audit/desktop-1280-settings.png
  - qa-screens/2026-07-15-desktop-three-column-audit/tablet-1024-settings.png
  - qa-screens/2026-07-15-desktop-three-column-audit/tablet-1024-drawer.png
checks:
  - npm run build
  - "Playwright desktop three-column audit: 6 checks, 0 failures"
deploy_url: https://quran.nurtech.dev
---

Notes for editor:
- What changed: добавлен промежуточный 1024-1119 px fallback для settings; подтверждены inspector push, sidebar collapse и toolbar overflow на 1440/1280/1024.
- Where to verify: /surah/1/ на desktop/tablet ширинах.
- Risks: затрагивает только responsive-позиционирование settings panel.
