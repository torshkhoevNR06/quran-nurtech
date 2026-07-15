# Apple-like redesign: что осталось довести

Дата: 2026-07-15  
Ветка: `codex/apple-ui-four-pass`  
Приложение: `quran.nurtech.dev`

## Короткий вывод

Большая часть CSS уже разложена по слоям: токены вынесены, `global.css` почти очищен, отдельные слои есть для shell, settings, reader, mushaf, home, components и platform. Это хорошая база.

Но приложение пока нельзя считать полностью приведённым к iOS/macOS-стилистике. Главный остаточный долг уже не в одном огромном CSS-файле, а в четырёх местах:

1. Крупные Astro-страницы всё ещё хранят свои стили и поведение рядом с разметкой.
2. Компонентная система пока больше CSS-классы, чем реальные переиспользуемые Astro-компоненты.
3. Mobile/iOS и desktop/macOS поведение нужно проверять как отдельные приложения, а не как responsive web.
4. Мушаф требует отдельного polish-прохода, потому что это не обычная страница, а главный режим чтения.

## Статус после прохода Codex 2026-07-15

Этот файл был исходной картой оставшихся работ. После текущего прохода часть пунктов закрыта и проверена.

### Закрыто

- `progress.astro` разделён: стили вынесены в `src/styles/progress.css`, клиентская логика в `src/client/progress.ts`.
- `mushaf/[page].astro` разделён: клиентская логика вынесена в `src/client/mushaf.ts`, immersive CSS вынесен в `src/styles/mushaf-immersive.css`.
- `TopBar.astro` разбит на компоненты в `src/components/topbar/`, клиентская логика контекста вынесена в `src/client/topbar.ts`.
- Общие клиентские хелперы вынесены в `src/client/shared.ts`.
- Dwell-аналитика чтения вынесена в `src/client/reading-analytics.ts`.
- Верхние меню и mobile scroll-lock вынесены в `src/client/ui-menus.ts`.
- Настройки чтения вынесены в `src/client/reader-settings.ts`: тема, размеры текста, слои арабский/перевод/транслит, выбор перевода, мультиперевод и hotkey-переключение слоёв.
- Drawer/sidebar вынесен в `src/client/drawer.ts`: desktop collapse, mobile overlay, фильтр сур, вкладка джузов и прогресс в сайдбаре.
- Таджвид вынесен в `src/client/tajweed.ts`: ленивая загрузка JSON, сохранение исходного арабского HTML и тумблер в настройках.
- Закладки и «Продолжить» вынесены в `src/client/bookmarks.ts`: хранение, синхронизация кнопок, topbar-список и последнее место чтения.
- Быстрый переход вынесен в `src/client/quick-nav.ts`: `2:255`, номер суры, алиасы названий и fallback в поиск.
- Фильтр главной вынесен в `src/client/home-filter.ts`: поиск по карточкам сур и переход по клику на карточку.
- Заучивание вынесено в `src/client/memorize.ts`: тумблер режима, повтор аята и синхронизация body/storage.
- Тактильный отклик по интерактивным элементам вынесен в `src/client/interactions.ts`.
- Данные Корана вынесены в `src/client/quran-data.ts`: версия данных, индекс сур, чтецы, загрузчики тафсиров, fallback чтецов и построение audio URL.
- Добавлены реальные UI-компоненты:
  - `src/components/ui/Button.astro`;
  - `src/components/ui/IconButton.astro`;
  - `src/components/ui/Section.astro`;
  - `src/components/ui/StatTile.astro`.
- `/search/`, `/audio/`, `/download/` переведены на `PageShell` / `PageHeader` и новые UI-компоненты.
- `/stats/` переведён на `Section` и `StatTile`, а таблица статистики обновлена под системные grouped-токены.
- `/bookmarks/` и `/tasbih/` частично переведены на общий `Button`.
- Исправлен fullscreen мушафа: `body.mushaf-immersive` теперь явно скрывает `.mobile-tabbar` вместе с остальным app chrome.
- Пройдена QA-матрица:
  - 15 маршрутов;
  - desktop 1440x1000;
  - mobile 390x844;
  - 30 route/viewport combinations;
  - 0 автоматических проблем в `qa-screens/2026-07-15-full-matrix/problems.json`.
- Дополнительно проверен immersive-мушаф на desktop/mobile: topbar, footer и tabbar скрыты, горизонтального overflow нет.
- После выноса reader settings и UI-компонентов пройден targeted QA:
  - desktop/mobile `/surah/1/`, `/stats/`, `/bookmarks/`, `/tasbih/`;
  - settings/drawer scroll-lock;
  - переключение темы и слоёв чтения;
  - 34 автоматические проверки, 0 падений;
  - скрины: `qa-screens/2026-07-15-reader-settings-extract/`.
- После выноса drawer пройден отдельный targeted QA:
  - desktop/mobile `/surah/2/`;
  - collapse/reopen sidebar, mobile scroll-lock, фильтр, вкладка джузов;
  - 11 автоматических проверок, 0 падений;
  - скрины: `qa-screens/2026-07-15-drawer-extract/`.
- После выноса таджвида пройден targeted QA:
  - desktop/mobile `/surah/1/`;
  - default-on, выключение/повторное включение через настройки;
  - 8 автоматических проверок, 0 падений;
  - скрины: `qa-screens/2026-07-15-tajweed-extract/`.
- После выноса закладок/continue пройден targeted QA:
  - desktop/mobile `/surah/1/`, desktop `/surah/3/`;
  - add/remove bookmark, topbar bookmark list, запись `q_last`;
  - 7 автоматических проверок, 0 падений;
  - скрины: `qa-screens/2026-07-15-bookmarks-extract/`.
- После выноса quick-nav пройден targeted QA:
  - `18`, `2:255`, `ихлас`, неизвестный поисковый текст;
  - 4 автоматические проверки, 0 падений;
  - скрин: `qa-screens/2026-07-15-quick-nav-extract/`.
- После выноса фильтра главной пройден targeted QA:
  - desktop `/`;
  - фильтрация карточек сур и переход по клику;
  - 3 автоматические проверки, 0 падений;
  - скрин: `qa-screens/2026-07-15-home-filter-extract/`.
- После выноса заучивания и интеракций пройден targeted QA:
  - mobile `/surah/1/`;
  - открытие настроек, включение заучивания, выбор повтора `x5`;
  - 3 автоматические проверки, 0 падений;
  - скрин: `qa-screens/2026-07-15-memorize-interactions-extract/`.
- После выноса слоя данных пройден targeted QA:
  - desktop `/surah/1/`;
  - copy/editor data через индекс сур, раскрытие тафсира, подготовка audio src и заголовка плеера;
  - 3 автоматические проверки, 0 падений;
  - скрин: `qa-screens/2026-07-15-quran-data-extract/`.

### Частично закрыто

- `src/client/app.ts` уменьшен с 2001 до примерно 896 строк, но ещё содержит несколько доменов: audio-player, reader-actions и hotkeys.
- Компонентная система начата, но ещё не покрывает `SegmentedControl`, `SwitchRow`, `ListRow`, `InspectorSection`, `Sheet`, `Toolbar`, `ReaderCard`.
- Page CSS стал чище, но `bookmarks`, `backup`, `tasbih`, `glossary`, `topics`, `image-editor` ещё требуют отдельного унификационного прохода. `stats`, `audio`, `search`, `download` уже ближе к общей системе.
- Мушаф стал стабильнее по fullscreen и базовой матрице, но advanced polish по zoom/pan/pinch/604-page audit ещё не закрыт полностью.

### Остаётся

- Дальше дробить `src/client/app.ts` по доменам: audio-player, reader-actions и hotkeys.
- Добавить недостающие UI-компоненты и мигрировать на них `Drawer`, `Player`, `settings`, `topics`, `glossary`, `backup`; продолжить углублять `bookmarks` и `tasbih`.
- Провести типографический pass по страницам с локальными стилями и убрать случайные тяжёлые веса `700/800`, где они не являются смысловым акцентом.
- Довести mobile overlay-аудит вручную: drawer scroll, settings scroll, action sheet, player, keyboard behavior, body scroll lock.
- Довести desktop three-column как полноценную state-модель: sidebar collapsed, inspector open, narrow fallback, toolbar overflow.
- Провести расширенную QA-матрицу из раздела 8: 375x667, 430x932, 768x1024, 1024x768, 1440x900, 1920x1080, плюс ручной mobile Safari.

## Что уже сделано

### CSS-архитектура

- Есть отдельный `src/styles/design-tokens.css`.
- `src/styles/global.css` оставлен под базу: шрифты, reset, body, контейнер.
- Shell разбит на:
  - `shell-topbar.css`
  - `shell-player.css`
  - `shell-drawer.css`
  - `shell-desktop.css`
  - `shell-drawer-tabs.css`
  - `shell-mobile-base.css`
  - `shell-compat.css`
  - `shell-safe-area.css`
- Settings разбиты на:
  - `settings-panel.css`
  - `settings-sections.css`
  - `settings-controls.css`
  - `settings-responsive.css`
  - `settings-toggles.css`
- Reader разбит на:
  - `reader-structure.css`
  - `reader-tafsir.css`
  - `reader-modes.css`
  - `reader-context.css`
  - `reader-compat.css`
  - `reader-polish.css`
- Mushaf разбит на:
  - `mushaf-action-sheet.css`
  - `mushaf-qcf.css`
  - `mushaf-reader.css`
  - `mushaf-zoom.css`
  - `mushaf-immersive.css`
  - `mushaf-responsive.css`
- Home разбит на несколько файлов, и старые дубли карточек сур уже вычищены.
- Компонентные CSS-слои выделены:
  - `component-primitives.css`
  - `component-controls.css`
  - `component-lists.css`
  - `component-switches.css`
  - `component-cards.css`
  - `component-page.css`
  - `component-focus.css`
  - `component-mobile.css`

### UI-база

- Есть первые Astro UI-компоненты:
  - `src/components/ui/Card.astro`
  - `src/components/ui/PageHeader.astro`
  - `src/components/ui/PageShell.astro`
- Главная страница уже ближе к общей системе карточек.
- Desktop shell уже движется в сторону three-column layout.
- Settings уже выглядят ближе к inspector/sidebar, чем к старому dropdown.

## Что осталось по-настоящему

## 1. Убрать крупные inline-острова из страниц

### Проблема

Некоторые страницы всё ещё устроены как автономные мини-приложения: разметка, стили и JS живут в одном `.astro`. Это мешает консистентности, потому что эти страницы обходят общую дизайн-систему.

Самые крупные точки:

- `src/pages/progress.astro` — около 1005 строк.
- `src/pages/mushaf/[page].astro` — около 556 строк.
- `src/components/TopBar.astro` — около 428 строк.
- `src/client/app.ts` — около 2001 строки.
- В нескольких страницах остаются `<style is:global>` и `<script is:inline>`.

### Что сделать

1. `progress.astro` разделить на:
   - `src/styles/progress.css` или несколько `progress-*.css`;
   - клиентский модуль `src/client/progress.ts`;
   - компоненты `ProgressHero`, `ProgressCard`, `ProgressMap`, `ProgressStats`.
2. `mushaf/[page].astro` разделить на:
   - компонент страницы `MushafPage.astro`;
   - компонент панели `MushafToolbar.astro`;
   - клиентский модуль `src/client/mushaf.ts`;
   - возможно `src/client/mushaf-zoom.ts` и `src/client/mushaf-immersive.ts`.
3. `TopBar.astro` разделить на:
   - `TopBarSearch.astro`;
   - `TopBarSettings.astro`;
   - `TopBarReaderMenus.astro`;
   - `TopBarBookmarks.astro`;
   - `TopBarActions.astro`.
4. `src/client/app.ts` разделить по доменам:
   - `drawer`;
   - `settings`;
   - `progress-dwell`;
   - `audio-player`;
   - `reader-actions`;
   - `bookmarks`;
   - `theme`;
   - `home-filter`.

### Definition of Done

- В страницах почти нет больших `<style is:global>`.
- Inline scripts остаются только там, где они действительно зависят от build-time переменных.
- Ни один Astro-файл не превышает примерно 300-350 строк без веской причины.
- Общие действия не дублируются между страницами.

## 2. Превратить CSS-классы в реальные UI-компоненты

### Проблема

Сейчас есть общий вид кнопок, карточек, списков и секций, но многие места всё ещё пишут голые классы вручную: `btn`, `icon-btn`, `item`, `prog-card`, `tp-card`, `bk-card`, `settings-row`. Из-за этого разные экраны легко расходятся по плотности, отступам, hover/focus и текстовой иерархии.

### Что сделать

Создать компоненты:

- `Button.astro`
- `IconButton.astro`
- `SegmentedControl.astro`
- `SwitchRow.astro`
- `ListRow.astro`
- `InspectorSection.astro`
- `Sheet.astro`
- `Toolbar.astro`
- `ReaderCard.astro`
- `StatCard.astro`

Потом мигрировать на них:

- `TopBar.astro`
- `Drawer.astro`
- `Player.astro`
- `progress.astro`
- `stats.astro`
- `audio.astro`
- `search.astro`
- `bookmarks.astro`
- `topics.astro`
- `glossary.astro`
- `tasbih.astro`
- `backup.astro`

### Definition of Done

- Новая кнопка или строка настроек не пишется руками через набор классов.
- Все основные состояния (`hover`, `active`, `focus-visible`, `disabled`, `selected`) живут в одном компонентном слое.
- У компонентов есть компактные варианты для desktop и крупные touch-варианты для mobile.

## 3. Довести typography pass по всем экранам

### Проблема

Общие шрифтовые токены уже есть, но часть экранов всё ещё выглядит как смесь разных поколений интерфейса. Особенно это заметно там, где страницы имеют локальные стили: прогресс, темы, тасбих, закладки, backup, download, glossary.

### Что сделать

1. Ввести явные текстовые роли:
   - `--text-title-lg`;
   - `--text-title`;
   - `--text-headline`;
   - `--text-body`;
   - `--text-callout`;
   - `--text-footnote`;
   - `--text-caption`;
   - `--text-arabic-reader`;
   - `--text-arabic-mushaf`.
2. Убрать случайные `font-weight: 700/800`, если это не смысловой акцент.
3. Пройти экраны:
   - `/`
   - `/surah/*`
   - `/mushaf/*`
   - `/search`
   - `/progress`
   - `/stats`
   - `/audio`
   - `/bookmarks`
   - `/topics`
   - `/glossary`
   - `/tasbih`
   - `/download`
   - `/backup`
   - `/about`
4. Для русского reader-текста задать отдельную шкалу, чтобы перевод не выглядел как UI и не конкурировал с арабским.
5. Для арабского чтения отделить обычный режим от QCF-мушафа.

### Definition of Done

- Визуальная иерархия похожа на Apple-приложение: меньше тяжёлых заголовков, больше спокойной системной типографики.
- Русский текст читабелен, но не гигантский.
- Арабский текст не наследует случайные UI-настройки.
- На mobile нет ощущения “всё слишком крупное и тесное одновременно”.

## 4. Довести mobile как iOS-приложение

### Проблема

Mobile уже исправлялся точечно: меню, настройки, scroll lock, safe areas. Но это нужно пройти системно, как отдельный продуктовый режим. Сейчас mobile всё ещё рискует ломаться из-за body scroll, клавиатуры, fixed-слоёв, bottom player и длинных sheets.

### Что сделать

1. Проверить все overlay:
   - левое меню;
   - настройки;
   - поиск;
   - action sheet аята;
   - player;
   - mushaf immersive.
2. У каждого overlay должен быть:
   - свой scroll-контейнер;
   - body scroll lock;
   - safe-area padding;
   - закрытие по backdrop/escape/свайпу, если уместно;
   - отсутствие автофокуса, если это открывает клавиатуру без действия пользователя.
3. Bottom navigation:
   - стабильная высота;
   - не перекрывает player;
   - не перекрывает контент;
   - учитывает `env(safe-area-inset-bottom)`.
4. Player:
   - на mobile должен быть компактным mini-player;
   - expanded состояние должно быть sheet, а не плавающая desktop-плашка;
   - кнопки минимум 44 px.
5. Меню:
   - drawer должен скроллиться независимо;
   - список сур и footer не должны “залипать” случайно;
   - поиск в меню не должен сразу вызывать клавиатуру при открытии.

### Definition of Done

- iPhone viewport 390x844 и 430x932 без горизонтального overflow.
- Открытое меню скроллится само, страница под ним не едет.
- Открытые настройки скроллятся сами, страница под ними не едет.
- Player не перекрывает важный текст без возможности прокрутки.
- Все кликабельные элементы на mobile имеют нормальный touch target.

## 5. Довести desktop до настоящего macOS three-column

### Проблема

Идея правильная: sidebar слева, content в центре, inspector справа, причём inspector должен ужимать контент, а не просто ложиться поверх. Но это нужно сделать не набором специальных случаев, а общей layout-моделью.

### Что сделать

1. Ввести явную desktop-сетку:
   - left sidebar;
   - content;
   - right inspector.
2. Состояния:
   - no inspector;
   - inspector open;
   - sidebar collapsed;
   - both sidebars constrained;
   - narrow desktop fallback.
3. Правила:
   - если inspector открыт и места хватает, он занимает свою колонку;
   - если места не хватает, левый sidebar может схлопнуться;
   - если места всё равно мало, inspector становится overlay;
   - content не должен становиться нечитаемо узким.
4. Toolbar:
   - не должен ломаться при узкой ширине;
   - второстепенные controls уходят в меню;
   - title/search/settings/bookmark/audio остаются понятными.
5. Sidebar:
   - независимый scroll;
   - footer закреплён;
   - search не создаёт layout jump.

### Definition of Done

- Desktop 1440, 1280, 1024 px ведут себя предсказуемо.
- Inspector может ужимать контент в широком режиме.
- При нехватке места интерфейс сам переходит в более компактную модель.
- Нет наложения inspector на важный контент, кроме сознательного fallback.

## 6. Мушаф: отдельный polish-проект

### Проблема

Мушаф нельзя оценивать как обычный responsive block. Пользователь ожидает ощущение настоящего приложения для чтения: стабильная страница, нормальный zoom/pan, отсутствие лишнего сайта вокруг, корректное fullscreen-поведение, светлая и тёмная тема без ощущения инверсии.

### Что сделать

1. Вынести весь inline JS из `mushaf/[page].astro` в клиентский модуль.
2. Разделить режимы:
   - normal;
   - fit-to-screen;
   - zoomed/pannable;
   - immersive/fullscreen.
3. Zoom/pan:
   - pinch на mobile;
   - trackpad/mouse wheel на desktop с modifier;
   - double tap/click для fit/zoom;
   - сохранение масштаба и позиции;
   - reset без скачка страницы.
4. Fullscreen:
   - стабильно скрывает topbar, drawer, footer, bottom nav, browser-like site chrome внутри приложения;
   - не возвращает случайно верхние элементы после изменения масштаба/поворота;
   - exit-кнопка не перекрывает текст.
5. Палитра:
   - light: бумага, мягкие чернила, минимум серого веб-фона;
   - dark: не просто белый текст на чёрном, а спокойный ночной режим;
   - tajweed-цвета должны быть различимы в обеих темах.
6. Навигация:
   - стрелки должны соответствовать направлению чтения и ожиданиям пользователя;
   - page input не должен ломать mobile layout;
   - нижняя навигация должна быть доступна, но не мешать чтению.

### Definition of Done

- Мушаф на mobile открывается как экран приложения, а не как страница сайта.
- При увеличении страницу можно нормально двигать.
- Fullscreen не возвращает лишний header/footer.
- Светлая и тёмная тема обе выглядят специально спроектированными.
- На 604 страницах нет грубых обрезаний строк.

## 7. Разобрать remaining page CSS

### Текущее состояние

Остались сравнительно крупные отдельные CSS-файлы:

- `image-editor.css` — около 193 строк.
- `stats.css` — около 149 строк.
- `search.css` — около 123 строк.
- `audio.css` — около 120 строк.

Они не катастрофические, но их нужно привести к тому же принципу:

- page-specific файл хранит только layout конкретной страницы;
- визуал карточек, кнопок, списков, форм идёт через components;
- typography идёт через tokens/utilities.

### Что сделать

1. `search.css`:
   - отделить search layout от result row/list components.
2. `audio.css`:
   - привести к общим toolbar/list/control компонентам.
3. `stats.css`:
   - перевести карточки и таблицы на `ui-section`, `ui-card`, `ListRow`.
4. `image-editor.css`:
   - решить, нужен ли этот экран в общей дизайн-системе;
   - если да, выделить tool surface, toolbar, preview, form controls.

### Definition of Done

- Page CSS не задаёт заново button/card/list визуал.
- Page CSS можно удалить/заменить без поломки общей системы.

## 8. Полная QA-матрица

### Почему это важно

Проект уже много раз ломался на mobile, меню, мушафе и settings. После CSS-разноса нужно проверить не только сборку, а реальные пользовательские сценарии.

### Маршруты для проверки

- `/`
- `/surah/1`
- `/surah/2`
- `/surah/9`
- `/mushaf/1`
- `/mushaf/2`
- `/mushaf/604`
- `/search`
- `/progress`
- `/stats`
- `/audio`
- `/bookmarks`
- `/topics`
- `/glossary`
- `/tasbih`
- `/download`
- `/backup`
- `/about`
- `/privacy`
- `/translators`
- `/videos`

### Viewports

- iPhone SE-like: 375x667.
- iPhone modern: 390x844.
- iPhone large: 430x932.
- iPad/tablet: 768x1024.
- Desktop compact: 1024x768.
- Desktop normal: 1440x900.
- Desktop wide: 1920x1080.

### Сценарии

- Открыть/закрыть левое меню.
- Скроллить меню.
- Искать суру в меню.
- Открыть settings.
- Скроллить settings.
- Переключить перевод/тафсир/таджвид.
- Начать аудио.
- Свернуть/закрыть player.
- Открыть action sheet аята.
- Перейти в мушаф.
- Увеличить мушаф.
- Выйти из zoom.
- Включить immersive.
- Перейти на следующую/предыдущую страницу.
- Проверить отсутствие horizontal overflow.
- Проверить focus-visible на desktop.
- Проверить, что mobile не показывает жирные desktop focus rings.

### Definition of Done

- На каждый ключевой экран есть screenshot.
- Есть automated smoke для основных сценариев.
- Есть ручной чек-лист для mobile Safari, потому что часть проблем видна только там.

## 9. Рекомендуемый порядок следующих работ

### Шаг 1. Закрыть архитектурные дыры без изменения дизайна

Цель: снизить вероятность регрессий.

1. Вынести стили `progress.astro`.
2. Вынести JS `progress.astro`.
3. Разбить `TopBar.astro`.
4. Разбить `src/client/app.ts` на модули.

### Шаг 2. Компонентная система

Цель: чтобы новые экраны собирались из одних и тех же деталей.

1. `Button`.
2. `IconButton`.
3. `ListRow`.
4. `InspectorSection`.
5. `Sheet`.
6. `Toolbar`.
7. Миграция settings/topbar/drawer/player.

### Шаг 3. Mobile-first polish

Цель: чтобы телефон ощущался как приложение.

1. Drawer.
2. Settings sheet.
3. Player.
4. Search.
5. Progress/stats.
6. Body scroll lock audit.

### Шаг 4. Desktop three-column

Цель: macOS-like layout без случайных overlay.

1. Layout state machine.
2. Sidebar collapse.
3. Inspector resize/collapse.
4. Toolbar overflow behavior.

### Шаг 5. Мушаф

Цель: отдельный качественный reader-mode.

1. Вынести JS.
2. Zoom/pan.
3. Fullscreen.
4. Палитры.
5. QA 604 страниц по критическим точкам.

### Шаг 6. Финальный QA и удаление совместимости

Цель: убрать старые костыли.

1. Найти правила с `compat`, `polish`, поздними override-комментариями.
2. Проверить, какие уже не нужны.
3. Удалять только после screenshot-smoke.
4. Зафиксировать итоговую карту CSS-слоёв.

## 10. Приоритеты

### P0

- Мушаф не должен обрезаться и должен нормально скроллиться/зумиться.
- Mobile drawer/settings должны иметь собственный scroll и не двигать страницу под собой.
- Desktop settings inspector должен вести себя предсказуемо при нехватке ширины.
- Убрать самые крупные inline-стили/скрипты из `progress.astro` и `mushaf/[page].astro`.

### P1

- Разбить `TopBar.astro`.
- Разбить `src/client/app.ts`.
- Довести UI-компоненты.
- Пройти typography по всем страницам.

### P2

- Дочистить мелкие CSS-файлы страниц.
- Удалить `compat/polish` слои, которые больше не нужны.
- Добавить визуальные regression smoke-скрипты.

## 11. Главный риск

Самый большой риск сейчас — продолжать полировать внешний вид поверх старой структуры. Так будут появляться новые поздние CSS-правила, а старые конфликты вернутся.

Правильный следующий фокус: сначала уменьшать крупные острова и закреплять компонентную систему, потом делать новый visual polish. Иначе каждый новый красивый фикс будет ещё одним слоем поверх предыдущего.
