---
project: quran-nurtech
public: true
type: fix
audience: users
title: Стабильные границы строк мусхафа
summary: Длинные строки мусхафа теперь подгоняются по безопасной ширине листа и не обрезаются по краям.
user_impact:
  - На плотных страницах, включая страницу 76, аяты остаются внутри границ и центрируются единообразно.
  - Строки больше не пересчитываются в постоянном цикле, поэтому исчезают лишние подергивания при обновлении и наведении.
  - При увеличении и возврате масштаба строки сохраняют ту же безопасную ширину и не уезжают влево.
  - После перехода на соседнюю страницу и возврата страница 76 сохраняет те же line-scale и ширину строк, что при прямом открытии.
  - На больших экранах появление scroll-bar при zoom больше не сдвигает область чтения и не сбивает перетаскивание ползунка масштаба.
  - Перетаскивание ползунка с 100% до любого масштаба больше не обрывается при перестроении области чтения и появлении scroll-bar.
  - Ошибка TypeScript у separator-строк меню аята исправлена: разделители больше не требуют label.
  - Правило применяется ко всем 604 страницам QCF и сохраняет текущие режимы zoom, pan и immersive.
screenshots: []
checks:
  - npm run data
  - npx tsc --noEmit | Select-String "reader-actions|sep|Row|mushaf.ts": совпадений нет
  - Проверка структуры QCF: 604 страниц, ошибок диапазона и дублирования номеров строк 0
  - Browser QA: /mushaf/76 на 1280x900, maxOverLeft=0, maxOverRight=0
  - Browser QA: /mushaf/76 zoom 100% -> 110% -> 120%, rangeLeft delta=0, readerLeft delta=0, readerWidth delta=0
  - Browser QA: нативный drag zoom range на 1120x900 и 1440x900 дошел до 295% и 290% без повторного наведения; после возврата к 100% размеры листа совпали с исходными
  - Browser QA: /mushaf/76 -> /mushaf/77 -> /mushaf/76, 3 цикла, direct и returned совпали по scales и widths, maxOverLeft=0, maxOverRight=0
  - Browser QA: /mushaf/76 zoom 180% и возврат 100%, maxOverLeft=0, maxOverRight=0
  - Browser QA: /mushaf/76 на 390x844, maxOverLeft=0, maxOverRight=0
  - Browser QA: /mushaf/2 compact на 390x844, короткая сура осталась compact
  - Browser QA: /mushaf/69-78 на 1280x900, maxOverLeft=0, maxOverRight=0
  - npm run build: клиентская сборка и генерация маршрутов прошли; остановка на существующей Windows-ошибке маршрута dist\\1:1 (ENOENT)
deploy_url: http://127.0.0.1:4321/mushaf/76
---

Notes for editor:
- What changed: regular QCF lines now use the fixed readable line width instead of max-content geometry, while compact short-surah pages keep fit-content centering.
- What changed: line natural widths are cached per rendered font metrics, so delayed fits after navigation reuse the same baseline instead of multiplying the previous scale.
- What changed: page reveal runs one final forced fit in the same frame where font loading is removed, keeping direct loads and return navigation identical.
- What changed: zoom mode no longer forces line left offsets to 0, so the safety guard can still keep text inside the page.
- What changed: zoomed reader keeps the same outer width as the normal reader, and zoom start scrolling only runs when entering zoom from 100%.
- What changed: zoom range uses pointer capture and direct coordinate updates, so page reflow cannot cancel the active drag.
- Screenshots: browser QA screenshots were inspected in the session and not saved into the repository.
- Risks: the full build still stops on the existing Windows-only dist\\1:1 route issue unrelated to this Mushaf fix.
