---
project: quran-nurtech
public: true
type: feature
audience: users
title: Мобильный плеер больше не конфликтует с нижним меню
summary: На телефоне нижнее меню теперь уезжает, когда открыт аудиоплеер, и не перекрывает управление прослушиванием.
user_impact:
  - Кнопки плеера остаются доступными на длинных сурах.
  - Нижняя навигация не накладывается на плеер и возвращается после закрытия прослушивания.
  - Меню и настройки на телефоне сохраняют собственный scroll и не открывают клавиатуру сами.
screenshots:
  - qa-screens/2026-07-15-extended-mobile-ios-audit/iphone-se-_surah_9_.png
  - qa-screens/2026-07-15-extended-mobile-ios-audit/iphone-pro-_surah_9_.png
  - qa-screens/2026-07-15-extended-mobile-ios-audit/iphone-se-_search_.png
  - qa-screens/2026-07-15-extended-mobile-ios-audit/iphone-pro-_stats_.png
checks:
  - "npm run build"
  - "Playwright extended mobile iOS audit: 52 checks, 0 failures"
deploy_url: https://quran.nurtech.dev
---

Notes for editor:
- What changed: player now marks body.player-open, so the mobile tabbar hides independently from DOM adjacency.
- Where to verify: /surah/9/ on 375x667 and 430x932 mobile viewports.
- Risks: real iOS Safari bottom browser chrome can change available viewport height, but safe-area and simulated Safari checks passed.
