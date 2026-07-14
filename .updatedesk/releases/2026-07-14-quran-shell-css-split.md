---
project: quran-nurtech
public: false
type: internal
audience: team
title: Shell CSS вынесен из global.css
summary: Стили аудиоплеера, drawer/sidebar и мобильной shell-адаптации вынесены в отдельный src/styles/shell.css. Остаточные toggle-правила настроек перенесены в settings.css.
user_impact: Видимых изменений для пользователей нет; это делает интерфейсные слои более предсказуемыми и снижает риск регрессий в меню, плеере и мобильной навигации.
screenshots:
  - qa-screens/2026-07-14-shell-split/desktop-sidebar.png
  - qa-screens/2026-07-14-shell-split/mobile-drawer.png
  - qa-screens/2026-07-14-shell-split/mobile-settings.png
  - qa-screens/2026-07-14-shell-split/desktop-player.png
checks:
  - npm run build
  - Shell split QA: desktop sidebar, mobile drawer, mobile settings, desktop player, horizontal overflow false, console errors 0
deploy_url: https://quran.nurtech.dev
---
