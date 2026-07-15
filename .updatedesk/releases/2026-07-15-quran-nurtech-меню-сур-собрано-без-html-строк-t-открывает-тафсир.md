---
project: quran-nurtech
public: true
type: design
audience: users
title: Меню сур собрано без HTML-строк, T открывает тафсир
summary: Список сур и джузов в боковом меню стал собираться через единый helper, а клавиша T теперь открывает тафсир текущего аята.
user_impact:
  - Боковое меню сохраняет тот же вид, но стало устойчивее: подписи больше не завязаны на inline-стили.
  - На desktop можно быстро открыть тафсир текущего аята клавишей T.
screenshots:
  - qa-screens/2026-07-15-drawer-hotkey-helper/desktop-drawer-hotkey.png
  - qa-screens/2026-07-15-drawer-hotkey-helper/mobile-drawer.png
checks:
  - npm run build
  - Playwright drawer helper + tafsir hotkey QA: 8 checks, 0 failures
deploy_url: https://quran.nurtech.dev
---

Notes for editor:
- What changed: drawer list rendering moved to DOM helper and the T hotkey now triggers the tafsir button for the current ayah.
- Where to verify: open /surah/2, switch drawer tabs, filter surahs, press T on desktop.
- Risks: no content source changed; this is shell rendering and hotkey behavior only.
