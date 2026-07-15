---
project: quran-nurtech
public: false
type: internal
audience: team
title: CSS настроек вынесен в отдельный слой
summary: Большой блок стилей панели настроек вынесен из global.css в отдельный settings.css без изменения поведения интерфейса.
user_impact: Видимых изменений для пользователей нет; это снижает риск конфликтов каскада и упрощает дальнейший Apple-like polish настроек.
screenshots:
  - qa-screens/2026-07-14-settings-split/desktop-settings.png
  - qa-screens/2026-07-14-settings-split/mobile-settings.png
checks:
  - npm run build
  - Settings split QA: desktop/mobile settings open, horizontal overflow false, console errors 0
deploy_url: https://quran.nurtech.dev
---
