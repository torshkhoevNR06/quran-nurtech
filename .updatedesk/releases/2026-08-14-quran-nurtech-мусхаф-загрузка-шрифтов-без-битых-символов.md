---
project: quran-nurtech
public: true
type: fix
audience: users
title: "Мусхаф: загрузка шрифтов без битых символов"
summary: "В режиме Мусхафа добавлен shimmer-скелетон на время загрузки QCF-шрифта и ручная предзагрузка следующей страницы с прогрессом."
user_impact:
  - "При быстром перелистывании или слабом соединении пользователь больше не видит случайные QCF-глифы вместо текста."
  - "Следующую страницу можно заранее подгрузить: интерфейс показывает прогресс и объём загрузки в МБ."
  - "Скелетон и статус предзагрузки адаптированы под мобильный экран и не создают горизонтальный скролл."
screenshots:
  - "qa-screens/mushaf-font-skeleton-blocked-704.png"
  - "qa-screens/mushaf-inline-nav-skeleton-900.png"
  - "qa-screens/mushaf-preload-mobile-390-final.png"
checks:
  - "npm.cmd run build: Astro/Vite compilation passed, static generation still stops on existing Windows route issue ENOENT dist\\1:1."
  - "Manual Playwright/Chrome: blocked p14 QCF font and confirmed skeleton is visible while qcf lines stay opacity 0."
  - "Manual Playwright/Chrome: delayed p15 QCF font during inline navigation and confirmed page changes to /mushaf/15 with skeleton instead of broken glyphs."
  - "Manual Playwright/Chrome mobile 390px: preload status has no horizontal overflow and reports page/font loading state."
deploy_url: "http://127.0.0.1:4321/mushaf/13"
---

Notes for editor:
- The fix waits for the active computed Mushaf font family, not only the default COLRv1 family.
- Source Quran text is unchanged; the placeholder is purely visual.
- Build failure is unrelated to this change and existed before this task.
