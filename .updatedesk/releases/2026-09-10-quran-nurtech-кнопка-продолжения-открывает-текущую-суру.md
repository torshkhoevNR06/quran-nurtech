---
project: quran-nurtech
public: true
type: feature
audience: users
title: Кнопка продолжения открывает текущую суру
summary: Кнопка с иконкой продолжения в мусхафе теперь ведёт в режим чтения суры, с которой начинается текущая страница.
user_impact:
  - На каждой из 604 страниц мусхафа кнопка открывает соответствующую суру, а не текущую страницу мусхафа.
  - При перелистывании внутри мусхафа ссылка пересчитывается по первому аяту новой страницы.
screenshots: []
checks:
  - git diff --check
  - Full HTML check over /mushaf/1 through /mushaf/604 confirmed both data-mushaf-continue links match /surah/{first ayah surah}; checked=604 bad=0
  - Invoke-WebRequest http://127.0.0.1:4321/surah/3 returned HTTP 200
deploy_url: http://127.0.0.1:4321/mushaf/76
---

Notes for editor:
- What changed: data-mushaf-continue links now target /surah/{currentSurah}; currentSurah is derived from the first ayah on the mushaf page, and inline mushaf swaps sync data-mushaf-current-surah from the loaded page.
- Where to verify: /mushaf/76 toolbar and mobile menu continue buttons.
- Risks: Low; generic mushaf page navigation remains unchanged.
