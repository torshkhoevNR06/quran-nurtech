---
project: quran-nurtech
public: true
type: fix
audience: users
title: Тасбих: аккуратный счётчик и выбор цели
summary: Исправлено центрирование числа в круге тасбиха и состояние кнопок выбора цели.
user_impact:
  - Число счётчика теперь визуально находится в центре круга.
  - При выборе цели 33, 99, 100 или без предела подсвечивается только одна активная кнопка.
  - Состояние кнопок синхронизировано с доступным `aria-selected`.
screenshots:
  - qa-screens/tasbih-header-centered-description.png
  - qa-screens/tasbih-target-100-centered.png
checks:
  - Playwright check on /tasbih at 825px: page title and description are centered, overflow 0.
  - Playwright check on /tasbih at 436px: after selecting 100 only target 100 is active, counter centered, overflow 0.
  - Playwright check on /tasbih at 436px: after selecting 99 only target 99 is active.
deploy_url: http://127.0.0.1:4321/tasbih
---

Notes for editor:
- What changed: tasbih target buttons now update both `.on` and `aria-selected`; counter text is positioned as a centered overlay in the ring; description text is centered under the heading.
- Where to verify: /tasbih, choose 100 then 99.
- Risks: limited to the Tasbih page.
