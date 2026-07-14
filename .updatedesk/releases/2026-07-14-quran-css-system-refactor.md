---
project: quran-nurtech
public: true
type: design
audience: users
title: Системный слой дизайна для чтения
summary: Пересобрали CSS-основу приложения: дизайн-токены, компоненты, desktop/mobile shell, читалка и мусхаф теперь разнесены по отдельным слоям вместо большого хвоста переопределений.
user_impact: Интерфейс стабильнее на телефоне и десктопе: настройки открываются как системная панель, меню и настройки имеют собственный скролл, фокусные выделения стали мягче, а навигация мусхафа получила понятные направления стрелок.
screenshots:
  - qa-screens/2026-07-14-apple-system-refactor/desktop-surah-settings-focused.png
  - qa-screens/2026-07-14-apple-system-refactor/mobile-surah-settings-focused.png
  - qa-screens/2026-07-14-apple-system-refactor/desktop-mushaf-3-focused.png
  - qa-screens/2026-07-14-apple-system-refactor/mobile-mushaf-3-focused.png
checks:
  - npm run build
  - Playwright route smoke: 15 routes x desktop/mobile, overflow/pageerror = 0
  - Playwright interaction smoke: drawer Escape, settings inspector/sheet, mobile panel scroll
deploy_url: https://quran.nurtech.dev
---

## Что изменилось

- Вынесли финальные CSS-слои в `design-tokens.css`, `components.css`, `platform.css`, `reader.css`, `mushaf.css`.
- Убрали поздний хвост override-правил из `global.css`, чтобы новые правки не дрались со старыми волнами дизайна.
- Сделали настройки более похожими на нативный inspector на desktop и sheet на mobile.
- Смягчили focus/selected состояния, чтобы по приложению не появлялись тяжелые рамки.
- Закрепили внутренний scroll у мобильных drawer/settings и закрытие drawer по Escape.
- Исправили направление стрелок в навигации мусхафа.
