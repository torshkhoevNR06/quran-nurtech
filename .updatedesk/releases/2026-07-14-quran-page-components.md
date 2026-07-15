---
project: quran-nurtech
public: true
type: design
audience: users
title: Единый стиль служебных страниц
summary: Служебные страницы приложения переведены на общие page-компоненты и отдельный CSS-слой, чтобы интерфейс был более цельным и ближе к системному виду iOS/macOS.
user_impact: Страницы статистики, закладок, словаря, тасбиха, резервной копии, загрузки, тем, справки и описания проекта выглядят спокойнее и консистентнее. Это также снижает риск, что старые CSS-правила будут ломать новые экраны.
screenshots:
  - qa-screens/2026-07-14-pages-components-full/desktop-stats.png
  - qa-screens/2026-07-14-pages-components-full/mobile-glossary.png
  - qa-screens/2026-07-14-pages-components-postpatch/mobile-backup-clean.png
checks:
  - npm run build
  - Playwright QA: 23 маршрута x desktop/mobile, failures 0
  - Postpatch screenshots: /stats/ desktop and /backup/ mobile, console errors 0
deploy_url: https://quran.nurtech.dev
---
