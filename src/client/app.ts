// Клиентская логика Корана онлайн. Ванильный TS, бандлится Astro.
// Отвечает за: перевод/чтец, аудиоплеер, действия аятов, хоткеи и быстрый переход.
import { initBookmarks, initContinue, isBookmarked, toggleBookmark } from './bookmarks';
import { openAyahEditor } from './imgeditor';
import { initDrawer } from './drawer';
import { initHomeFilter } from './home-filter';
import { initHotkeys } from './hotkeys';
import { initHapticInteractions } from './interactions';
import { initMemorize } from './memorize';
import { initQuick } from './quick-nav';
import {
  ayahSrc,
  DV,
  eaUrl,
  loadIbnKathir,
  loadIndex,
  loadReciters,
  loadSaadi,
  pickReciterForSurah,
  shortName,
  surahIndex,
  surahUrl,
  type Reciter,
} from './quran-data';
import { initReadingAnalytics } from './reading-analytics';
import {
  initReading,
  initTheme,
  initTranslation,
  initTransShow,
  initView,
  setViewHotkey,
} from './reader-settings';
import { $, $$, K, LS, toast, type Dict } from './shared';
import { initTajweed } from './tajweed';
import { closeMenus, initMenus, markMenu } from './ui-menus';

const DEFAULT_RECITER_ID = 'binhumaid';

/* ==========================================================================
   Действия аята: copy / share / bookmark / play
   ========================================================================== */
function ayahText(el: Element): { ar: string; ru: string; s: number; a: number } {
  // Арабский — из чистого оригинала (data-orig), чтобы таджвид-спаны не склеивали слова
  const arEl = $('.ar', el) as HTMLElement | null;
  const arTmp = document.createElement('div');
  arTmp.innerHTML = arEl ? arEl.dataset.orig || arEl.innerHTML : '';
  const ar = (arTmp.textContent || '').replace(/\s+/g, ' ').trim();
  const trEl = $('.tr-kuliev', el) || $('.translation', el) || $('.tafsir', el);
  const ru = (trEl?.textContent || '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(Перевод\s·\s)?(Эльмир\sКулиев|Абу\sАдель|Кулиев|Транслитерация)\s*/, '');
  const [s, a] = (el.getAttribute('data-ayah-key') || '0:0').split(':').map(Number);
  return { ar, ru, s, a };
}
// извлечь все тексты аята из DOM (для редактора картинки) — работает на стр. суры и аята
function extractAyah(el: Element, s: number, a: number) {
  const clean = (t?: string | null) => (t || '').replace(/\s+/g, ' ').trim();
  const strip = (t?: string | null) =>
    clean(t).replace(/^(Перевод\s·\s)?(Эльмир\sКулиев|Абу\sАдель|Кулиев|Транслитерация)\s*/, '');
  // Арабский берём из ЧИСТОГО оригинала (до таджвид-разметки), иначе при включённом
  // При таджвиде textContent склеивает слова. data-orig сохраняет исходный HTML.
  const arEl = $('.ar', el) as HTMLElement | null;
  const arHtml = arEl ? arEl.dataset.orig || arEl.innerHTML : '';
  const arTmp = document.createElement('div');
  arTmp.innerHTML = arHtml;
  const ar = clean(arTmp.textContent);
  const tl = $('.translit', el) ? strip($('.translit', el)!.textContent) : '';
  let ru = '',
    aa = '';
  const k = $('.tr-kuliev', el),
    ab = $('.tr-abuadel', el);
  if (k || ab) {
    ru = k ? strip(k.textContent) : '';
    aa = ab ? strip(ab.textContent) : '';
  } else {
    $$('.translation', el).forEach((t) => {
      const txt = t.textContent || '';
      if (/Абу\sАдель/.test(txt)) aa = strip(txt);
      else if (/Кулиев/.test(txt)) ru = strip(txt);
      else if (!ru) ru = strip(txt);
    });
  }
  const surahName = surahIndex.find((x) => x.n === s)?.nr || 'Сура ' + s;
  return { s, a, ar, tl, ru, aa, surahName };
}
async function shareAyah(s: number, a: number, ar: string, ru: string) {
  const url = `${location.origin}/${s}:${a}`;
  const text = `Коран ${s}:${a}\n${ar}\n${ru}\n${url}`;
  if (navigator.share) {
    try {
      await navigator.share({ title: `Коран ${s}:${a}`, text, url });
      return;
    } catch {}
  }
  copy(text);
}

function copy(text: string) {
  navigator.clipboard?.writeText(text).then(
    () => toast('Скопировано'),
    () => toast('Не удалось скопировать')
  );
}
function initAyahActions() {
  $$('[data-ayah-key]').forEach((el) => {
    const [s, a] = el.getAttribute('data-ayah-key')!.split(':').map(Number);
    $('[data-act="copy"]', el)?.addEventListener('click', async () => {
      await loadIndex();
      const t = ayahText(el);
      const name = surahIndex.find((x) => x.n === s)?.nr || 'Сура ' + s;
      const url = `${location.origin}/${s}:${a}`;
      copy(`${name} · аят ${s}:${a}\n\n${t.ar}${t.ru ? '\n\n' + t.ru : ''}\n\n${url}`);
    });
    $('[data-act="copy-link"]', el)?.addEventListener('click', () =>
      copy(`${location.origin}/${s}:${a}`)
    );
    $('[data-act="share"]', el)?.addEventListener('click', async () => {
      await loadIndex(); // surahName для редактора
      openAyahEditor(extractAyah(el, s, a));
    });
    $('[data-act="share-text"]', el)?.addEventListener('click', () => {
      const t = ayahText(el);
      shareAyah(s, a, t.ar, t.ru);
    });
    $('[data-bm]', el)?.addEventListener('click', () => {
      const on = toggleBookmark(s, a);
      toast(on ? 'В закладках' : 'Убрано');
    });
    $('[data-act="play"]', el)?.addEventListener('click', () => player.playKey(s, a));
    $$('[data-act="tafsir"]', el).forEach((btn) =>
      btn.addEventListener('click', (e) =>
        toggleTafsir(
          el,
          s,
          a,
          e.currentTarget as HTMLElement,
          (btn.getAttribute('data-src') as 'saadi' | 'ik') || undefined
        )
      )
    );
  });
}

/* ==========================================================================
   Контекстное меню аята (ПКМ на десктопе / долгий тап) — как в macOS.
   Заменяет браузерное меню: воспроизвести, тафсир, копировать, поделиться,
   открыть страницу аята, в закладки. Работает и в читалке, и в мусхафе.
   ========================================================================== */
const CTX_IC = {
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5v14l11-7z"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h6v18H6a2 2 0 0 0-2 2zM20 5a2 2 0 0 0-2-2h-6v18h6a2 2 0 0 1 2 2z"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
  image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M4 17l5-5 4 4 3-3 4 4"/></svg>',
  share:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>',
  bookmark:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"/></svg>',
  flag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3v18"/><path d="M5 4h11l-2 4 2 4H5"/></svg>',
};
function initAyahContextMenu() {
  const ayahs = $$('.ayah[data-ayah-key], [data-ayah-key].mushaf-ayah');
  if (!ayahs.length) return;
  let menu = document.querySelector('.ctx-menu') as HTMLElement | null;
  if (!menu) {
    menu = document.createElement('div');
    menu.className = 'ctx-menu';
    menu.setAttribute('role', 'menu');
    document.body.appendChild(menu);
  }
  const m = menu;
  const close = () => m.classList.remove('open');
  document.addEventListener('click', (e) => {
    if (!(e.target as Element).closest('.ctx-menu')) close();
  });
  document.addEventListener('scroll', close, true);
  window.addEventListener('resize', close);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  interface Row {
    label: string;
    icon?: string;
    run?: () => void;
    sep?: boolean;
  }
  const openAt = (x: number, y: number, el: Element) => {
    const [s, a] = el.getAttribute('data-ayah-key')!.split(':').map(Number);
    const rows: Row[] = [
      { label: 'Воспроизвести', icon: CTX_IC.play, run: () => player.playKey(s, a) },
      {
        label: 'Тафсир · ас-Саади и Ибн Касир',
        icon: CTX_IC.book,
        run: () => toggleTafsir(el, s, a, $('[data-act="tafsir"]', el) as HTMLElement | null),
      },
      { sep: true },
      {
        label: 'Продолжить отсюда',
        icon: CTX_IC.flag,
        run: () => {
          LS.set(K.readpos, { s, a });
          toast('Отмечено место чтения — кнопка «Продолжить» вернёт сюда');
        },
      },
      {
        label: 'Открыть страницу аята',
        icon: CTX_IC.link,
        run: () => {
          location.href = `/${s}:${a}`;
        },
      },
      {
        label: 'Копировать аят',
        icon: CTX_IC.copy,
        run: async () => {
          await loadIndex();
          const t = ayahText(el);
          const name = surahIndex.find((x) => x.n === s)?.nr || 'Сура ' + s;
          copy(
            `${name} · аят ${s}:${a}\n\n${t.ar}${t.ru ? '\n\n' + t.ru : ''}\n\n${location.origin}/${s}:${a}`
          );
        },
      },
      {
        label: 'Поделиться картинкой',
        icon: CTX_IC.image,
        run: async () => {
          await loadIndex();
          openAyahEditor(extractAyah(el, s, a));
        },
      },
      {
        label: 'Поделиться текстом',
        icon: CTX_IC.share,
        run: () => {
          const t = ayahText(el);
          shareAyah(s, a, t.ar, t.ru);
        },
      },
      { sep: true },
      {
        label: isBookmarked(s, a) ? 'Убрать из закладок' : 'В закладки',
        icon: CTX_IC.bookmark,
        run: () => {
          const on = toggleBookmark(s, a);
          toast(on ? 'В закладках' : 'Убрано из закладок');
        },
      },
    ];
    m.innerHTML = '';
    rows.forEach((r) => {
      if (r.sep) {
        const d = document.createElement('div');
        d.className = 'ctx-sep';
        m.appendChild(d);
        return;
      }
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ctx-item';
      b.setAttribute('role', 'menuitem');
      b.innerHTML = `<span class="ctx-ic">${r.icon || ''}</span>${r.label}`;
      b.addEventListener('click', () => {
        close();
        r.run?.();
      });
      m.appendChild(b);
    });
    m.classList.add('open');
    const mw = m.offsetWidth;
    const mh = m.offsetHeight;
    const px = Math.max(8, Math.min(x, window.innerWidth - mw - 8));
    const py = Math.max(8, Math.min(y, window.innerHeight - mh - 8));
    m.style.left = px + 'px';
    m.style.top = py + 'px';
  };

  ayahs.forEach((el) => {
    el.addEventListener('contextmenu', (e) => {
      const ev = e as MouseEvent;
      ev.preventDefault();
      openAt(ev.clientX, ev.clientY, el);
    });
  });
}

/* ==========================================================================
   Мусхаф: тап по аяту → нижний лист (перевод, тафсир, воспроизвести, закладка).
   В мусхафе перевода в DOM нет — берём из search-index.json (кэш поиска).
   ========================================================================== */
type AyahTr = { s: number; a: number; r: string; aa: string; ar: string; tl: string };
let ayahTrCache: Record<string, AyahTr> | null = null;
async function loadAyahTranslations(): Promise<Record<string, AyahTr>> {
  if (ayahTrCache) return ayahTrCache;
  const rows: AyahTr[] = await fetch(`/data/search-index.json?v=4`).then((r) => r.json());
  const map: Record<string, AyahTr> = {};
  for (const row of rows) map[`${row.s}:${row.a}`] = row;
  ayahTrCache = map;
  return map;
}
function initMushafAyahSheet() {
  const words = $$('.qcf-word[data-ayah-key]');
  if (!words.length) return;
  const sheet = document.createElement('div');
  sheet.className = 'mas';
  const backdrop = document.createElement('div');
  backdrop.className = 'mas-backdrop';
  backdrop.setAttribute('data-mas-close', '');
  const card = document.createElement('div');
  card.className = 'mas-card';
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-modal', 'true');
  card.innerHTML =
    '<div class="mas-head"><b data-mas-ref></b>' +
    '<button type="button" class="mas-x" data-mas-close aria-label="Закрыть">' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>' +
    '<div class="mas-tr" data-mas-tr></div>' +
    '<div class="mas-tafsir" data-mas-tafsir hidden></div>' +
    '<div class="mas-acts" data-mas-acts></div>';
  sheet.append(backdrop, card);
  document.body.appendChild(sheet);

  const refEl = card.querySelector('[data-mas-ref]') as HTMLElement;
  const trEl = card.querySelector('[data-mas-tr]') as HTMLElement;
  const tafEl = card.querySelector('[data-mas-tafsir]') as HTMLElement;
  const actsEl = card.querySelector('[data-mas-acts]') as HTMLElement;

  const clearHi = () =>
    $$('.qcf-word.qcf-ayah-active').forEach((w) => w.classList.remove('qcf-ayah-active'));
  const close = () => {
    sheet.classList.remove('open');
    clearHi();
  };
  sheet.addEventListener('click', (e) => {
    if ((e.target as Element).closest('[data-mas-close]')) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  const actBtn = (label: string, icon: string, run: () => void) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'mas-act';
    b.innerHTML = `<span class="mas-ic">${icon}</span>${label}`;
    b.addEventListener('click', run);
    return b;
  };

  const open = async (s: number, a: number) => {
    clearHi();
    $$(`.qcf-word[data-ayah-key="${s}:${a}"]`).forEach((w) => w.classList.add('qcf-ayah-active'));
    await loadIndex();
    const name = surahIndex.find((x) => x.n === s)?.nr || 'Сура ' + s;
    refEl.textContent = `${name} · аят ${s}:${a}`;
    trEl.textContent = 'Загружаю перевод…';
    tafEl.hidden = true;
    tafEl.textContent = '';
    sheet.classList.add('open');

    // действия
    actsEl.innerHTML = '';
    let row: AyahTr | undefined;
    const buildActs = () => {
      actsEl.append(
        actBtn('Слушать', CTX_IC.play, () => player.playKey(s, a)),
        actBtn('Тафсир', CTX_IC.book, () => showTafsir(s, a)),
        actBtn(isBookmarked(s, a) ? 'В закладках' : 'Закладка', CTX_IC.bookmark, () => {
          const on = toggleBookmark(s, a);
          toast(on ? 'В закладках' : 'Убрано');
        }),
        actBtn('Копировать', CTX_IC.copy, () => {
          if (!row) return;
          copy(`${name} · аят ${s}:${a}\n\n${row.ar}\n\n${row.r}\n\n${location.origin}/${s}:${a}`);
        }),
        actBtn('Картинка', CTX_IC.image, () => {
          if (!row) return;
          openAyahEditor({ s, a, ar: row.ar, ru: row.r, aa: row.aa, tl: row.tl, surahName: name });
        }),
        actBtn('Открыть аят', CTX_IC.link, () => (location.href = `/${s}:${a}`))
      );
    };
    buildActs();

    const map = await loadAyahTranslations();
    row = map[`${s}:${a}`];
    trEl.textContent = row?.r || 'Перевод не найден.';
  };

  const showTafsir = async (s: number, a: number) => {
    tafEl.hidden = false;
    tafEl.textContent = 'Загружаю тафсир…';
    try {
      const [saadi, ik] = await Promise.all([loadSaadi(s), loadIbnKathir(s)]);
      const sBlk = saadi.find((b: any) => b.a === a);
      const iBlk = ik.find((b: any) => b.a === a);
      tafEl.replaceChildren();
      if (sBlk) tafEl.appendChild(tafsirSectionEl('Тафсир ас-Саади', `аят ${s}:${a}`, sBlk.x));
      if (iBlk) tafEl.appendChild(tafsirSectionEl('Тафсир Ибн Касира', `аят ${s}:${a}`, iBlk.x));
      if (!sBlk && !iBlk) tafEl.textContent = 'Для этого аята тафсир не найден.';
    } catch {
      tafEl.textContent = 'Не удалось загрузить тафсир.';
    }
  };

  words.forEach((w) => {
    w.addEventListener('click', () => {
      const [s, a] = w.getAttribute('data-ayah-key')!.split(':').map(Number);
      open(s, a);
    });
  });
}

// одна секция тафсира (заголовок + текст). text — из данных, поэтому только textContent.
function tafsirSectionEl(title: string, sub: string, text: string): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'tafsir-src';
  const h = document.createElement('div');
  h.className = 'tafsir-src-h';
  const t = document.createElement('b');
  t.textContent = title;
  const su = document.createElement('span');
  su.className = 'tafsir-src-sub';
  su.textContent = ' · ' + sub;
  h.append(t, su);
  const b = document.createElement('div');
  b.className = 'tafsir-src-b';
  b.textContent = text;
  wrap.append(h, b);
  return wrap;
}

// раскрыть/свернуть тафсир под аятом; первый показ — ленивая загрузка обоих источников
// Раскрытие тафсира по ОТДЕЛЬНОМУ источнику (src='saadi'|'ik'). Без src — оба
// (для ПКМ-меню). Каждый источник — независимая раскрывашка внутри .ayah-tafsir.
async function toggleTafsir(
  el: Element,
  s: number,
  a: number,
  btn?: HTMLElement | null,
  src?: 'saadi' | 'ik'
) {
  const sources: ('saadi' | 'ik')[] = src ? [src] : ['saadi', 'ik'];
  let panel = $('.ayah-tafsir', el) as HTMLElement | null;
  for (const sr of sources) {
    const block = panel?.querySelector(`.taf-src[data-src="${sr}"]`) as HTMLElement | null;
    if (block) {
      block.remove();
      btn?.classList.remove('on');
      btn?.setAttribute('aria-expanded', 'false');
      continue;
    }
    if (!panel) {
      panel = document.createElement('div');
      panel.className = 'ayah-tafsir open';
      el.appendChild(panel);
    }
    const b = document.createElement('div');
    b.className = 'taf-src';
    b.setAttribute('data-src', sr);
    b.innerHTML = '<div class="tafsir-loading">Загружаю тафсир…</div>';
    panel.appendChild(b);
    btn?.classList.add('on');
    btn?.setAttribute('aria-expanded', 'true');
    try {
      const data = sr === 'saadi' ? await loadSaadi(s) : await loadIbnKathir(s);
      const blk = data.find((x: any) => x.a === a);
      b.replaceChildren();
      const title = sr === 'saadi' ? 'Тафсир ас-Саади' : 'Тафсир Ибн Касира';
      if (blk) b.appendChild(tafsirSectionEl(title, `аят ${s}:${a}`, blk.x));
      else b.textContent = 'Для этого аята тафсир не найден.';
    } catch {
      b.remove();
      btn?.classList.remove('on');
      btn?.setAttribute('aria-expanded', 'false');
      toast('Не удалось загрузить тафсир');
    }
  }
  if (panel && !panel.querySelector('.taf-src')) panel.remove();
}

/* ==========================================================================
   Аудиоплеер
   ========================================================================== */
interface Track {
  s: number;
  a: number;
}
const player = new (class {
  el = $('[data-player]');
  audio = $<HTMLAudioElement>('[data-player-audio]');
  playlist: Track[] = [];
  idx = -1;
  repeatOne = false;
  range: { from: number; to: number } | null = null;
  rangeArm: number | null = null;
  speed = LS.get<number>(K.speed, 1);
  reciterId = LS.get<string>(K.reciter, DEFAULT_RECITER_ID);
  triedFallback = false;
  currentReciter: Reciter | null = null;
  memorize = LS.get<boolean>(K.memorize, false); // режим заучивания
  memRep = LS.get<number>(K.memrep, 3); // повторов аята (0 = бесконечно)
  memCount = 0;
  preloader: HTMLAudioElement | null = null; // качает следующий аят заранее (бесшовно)
  preloadedUrl = '';

  async reciter(): Promise<Reciter> {
    const rs = await loadReciters();
    return rs.find((r) => r.id === this.reciterId) || rs[0];
  }
  async reciterName() {
    return (await this.reciter()).name;
  }

  init() {
    if (!this.audio) return;
    // собрать плейлист из DOM (страница суры)
    this.playlist = $$('[data-ayah-key]').map((el) => {
      const [s, a] = el.getAttribute('data-ayah-key')!.split(':').map(Number);
      return { s, a };
    });
    this.audio.playbackRate = this.speed;
    this.updateSpeedLabel();

    $('[data-player-toggle]')?.addEventListener('click', () => this.toggle());
    $('[data-player-next]')?.addEventListener('click', () => this.next());
    $('[data-player-prev]')?.addEventListener('click', () => this.prev());
    $('[data-player-repeat]')?.addEventListener('click', (e) => {
      this.repeatOne = !this.repeatOne;
      (e.currentTarget as Element).classList.toggle('on', this.repeatOne);
      toast(this.repeatOne ? 'Повтор аята включён' : 'Повтор выключен');
    });
    $('[data-player-range]')?.addEventListener('click', (e) => this.armRange(e.currentTarget as Element));
    $('[data-player-speed]')?.addEventListener('click', () => this.cycleSpeed());
    $('[data-player-close]')?.addEventListener('click', () => this.stop());

    this.audio.addEventListener('ended', () => this.onEnded());
    this.audio.addEventListener('play', () => this.setIcon(true));
    this.audio.addEventListener('playing', () => {
      this.setLoading(false);
      this.setIcon(true);
    });
    this.audio.addEventListener('waiting', () => this.setLoading(true));
    this.audio.addEventListener('canplay', () => this.setLoading(false));
    this.audio.addEventListener('pause', () => this.setIcon(false));
    this.audio.addEventListener('error', () => this.onError());

    // выбор чтеца
    $$('[data-reciter]').forEach((b) =>
      b.addEventListener('click', async () => {
        this.reciterId = b.getAttribute('data-reciter')!;
        LS.set(K.reciter, this.reciterId);
        markMenu('reciter', 'reciter', this.reciterId);
        toast('Чтец: ' + (await this.reciterName()));
        if (this.idx >= 0) this.playIdx(this.idx);
      })
    );
    // поиск по чтецам — фильтр списка в меню по имени
    const rf = $<HTMLInputElement>('[data-reciter-filter]');
    rf?.addEventListener('input', () => {
      const q = rf.value.trim().toLowerCase();
      $$('[data-reciter-list] [data-reciter]').forEach((b) => {
        const hit = !q || (b.getAttribute('data-name') || '').includes(q);
        (b as HTMLElement).style.display = hit ? '' : 'none';
      });
    });
    const sel = $<HTMLSelectElement>('[data-reciter-sel]');
    if (sel) {
      sel.value = this.reciterId;
      sel.addEventListener('change', async () => {
        this.reciterId = sel.value;
        LS.set(K.reciter, this.reciterId);
        toast('Чтец: ' + (await this.reciterName()));
        if (this.idx >= 0) this.playIdx(this.idx);
      });
    }
    markMenu('reciter', 'reciter', this.reciterId);
  }

  keyIdx(s: number, a: number) {
    return this.playlist.findIndex((t) => t.s === s && t.a === a);
  }
  playKey(s: number, a: number) {
    const cur = this.idx >= 0 ? this.playlist[this.idx] : null;
    if (cur && cur.s === s && cur.a === a) return this.toggle(); // тот же аят — пауза/продолжить
    this.memCount = 0; // новый аят — сброс счётчика заучивания
    let i = this.keyIdx(s, a);
    if (i < 0) {
      this.playlist = [{ s, a }];
      i = 0;
    }
    this.playIdx(i);
  }
  async playIdx(i: number) {
    if (i < 0 || i >= this.playlist.length || !this.audio) return;
    this.idx = i;
    const t = this.playlist[i];
    if (this.rangeArm != null) this.setRange(i);
    // мгновенный отклик UI — не ждём сеть
    this.el?.classList.add('show');
    this.highlight(t);
    this.setTitle(t);
    this.setLoading(true);
    this.triedFallback = false;
    const [r0] = await Promise.all([this.reciter(), loadIndex()]); // loadIndex → ayahOffset для глобального номера
    if (this.idx !== i || !this.audio) return; // трек сменился, пока грузили данные
    let r = pickReciterForSurah(r0, t.s); // если у выбранного нет суры — идём по цепочке
    if (r.id !== r0.id) toast(`${shortName(r0)} не читал суру — включён ${shortName(r)}`);
    const src = r.type === 'surah' ? surahUrl(r, t.s) : ayahSrc(r, t.s, t.a);
    this.currentReciter = r;
    this.setTitle(t);
    this.audio.src = src;
    this.audio.playbackRate = this.speed;
    try {
      await this.audio.play();
    } catch {}
    this.preloadNext(); // пока играет текущий — тянем следующий в кэш
  }
  // индекс, который проиграется следующим (для предзагрузки); -1 — предзагрузка не нужна
  peekNextIdx(): number {
    if (this.repeatOne) return -1; // повтор одного — тот же трек, уже загружен
    if (this.memorize && (this.memRep === 0 || this.memCount + 1 < this.memRep)) return -1;
    if (this.range) return this.idx >= this.range.to ? this.range.from : this.idx + 1;
    return this.idx >= 0 && this.idx < this.playlist.length - 1 ? this.idx + 1 : -1;
  }
  // предзагрузка следующего аята в кэш браузера — бесшовное переключение без «грузит → играет»
  async preloadNext() {
    if (this.currentReciter?.type === 'surah') return; // по-суровый чтец играет всю суру одним файлом
    const ni = this.peekNextIdx();
    if (ni < 0) return;
    const t = this.playlist[ni];
    const r0 = await this.reciter();
    const r = pickReciterForSurah(r0, t.s);
    if (r.type === 'surah') return;
    const url = ayahSrc(r, t.s, t.a);
    if (this.preloadedUrl === url) return;
    this.preloadedUrl = url;
    if (!this.preloader) {
      this.preloader = new Audio();
      this.preloader.preload = 'auto';
    }
    this.preloader.src = url;
    this.preloader.load();
  }
  toggle() {
    if (!this.audio) return;
    if (this.idx < 0) return this.playIdx(0);
    if (this.audio.paused) this.audio.play().catch(() => {});
    else this.audio.pause();
  }
  next() {
    this.memCount = 0;
    if (this.range && this.idx >= this.range.to) return this.playIdx(this.range.from);
    this.playIdx(Math.min(this.idx + 1, this.playlist.length - 1));
  }
  prev() {
    this.memCount = 0;
    this.playIdx(Math.max(this.idx - 1, 0));
  }
  stop() {
    this.audio?.pause();
    this.el?.classList.remove('show');
    this.clearHighlight();
    this.idx = -1;
  }
  onEnded() {
    if (this.repeatOne) return this.playIdx(this.idx);
    if (this.currentReciter?.type === 'surah') return this.setIcon(false); // сура целиком — не перескакиваем по аятам
    if (this.memorize) {
      this.memCount++;
      if (this.memRep === 0 || this.memCount < this.memRep) return this.playIdx(this.idx); // повторяем аят
      this.memCount = 0; // повторили N раз → следующий аят
    }
    if (this.range) {
      if (this.idx >= this.range.to) return this.playIdx(this.range.from);
      return this.playIdx(this.idx + 1);
    }
    if (this.idx < this.playlist.length - 1) this.playIdx(this.idx + 1);
    else this.setIcon(false);
  }
  armRange(btn: Element) {
    if (this.range) {
      this.range = null;
      this.rangeArm = null;
      btn.classList.remove('on');
      toast('Повтор диапазона выключен');
      return;
    }
    if (this.idx < 0) return toast('Сначала включите аят');
    this.rangeArm = this.idx;
    btn.classList.add('on');
    toast('Начало диапазона задано. Нажмите ещё раз на конечном аяте.');
  }
  setRange(endIdx: number) {
    if (this.rangeArm == null) return;
    const from = Math.min(this.rangeArm, endIdx);
    const to = Math.max(this.rangeArm, endIdx);
    this.range = { from, to };
    this.rangeArm = null;
    const a = this.playlist[from],
      b = this.playlist[to];
    toast(`Повтор ${a.s}:${a.a}–${b.a}`);
  }
  cycleSpeed() {
    const opts = [0.75, 1, 1.25, 1.5];
    this.speed = opts[(opts.indexOf(this.speed) + 1) % opts.length];
    LS.set(K.speed, this.speed);
    if (this.audio) this.audio.playbackRate = this.speed;
    this.updateSpeedLabel();
  }
  updateSpeedLabel() {
    const l = $('[data-player-speed-label]');
    if (l) l.textContent = this.speed + '×';
  }
  setIcon(playing: boolean) {
    const btn = $('[data-player-toggle]');
    if (btn && !btn.classList.contains('loading')) btn.innerHTML = playing ? ICON_PAUSE : ICON_PLAY;
    this.updateAyahButtons();
  }
  setLoading(on: boolean) {
    const btn = $('[data-player-toggle]');
    if (btn) {
      btn.classList.toggle('loading', on);
      if (!on) btn.innerHTML = this.audio && !this.audio.paused ? ICON_PAUSE : ICON_PLAY;
    }
    this.updateAyahButtons();
  }
  updateAyahButtons() {
    const cur = this.idx >= 0 ? this.playlist[this.idx] : null;
    const playing = !!(this.audio && !this.audio.paused);
    $$('[data-ayah-key] [data-act="play"]').forEach((btn) => {
      const key = (btn.closest('[data-ayah-key]') as Element)?.getAttribute('data-ayah-key');
      const isCur = !!cur && key === `${cur.s}:${cur.a}`;
      btn.classList.toggle('on', isCur);
      btn.innerHTML = isCur && playing ? ICON_PAUSE : ICON_PLAY;
    });
  }
  onError() {
    if (this.idx < 0 || !this.audio) return;
    const r = this.currentReciter;
    const t = this.playlist[this.idx];
    if (r && r.ea && !this.triedFallback) {
      // основной CDN не отдал — пробуем EveryAyah
      this.triedFallback = true;
      this.audio.src = eaUrl(r, t.s, t.a);
      this.audio.playbackRate = this.speed;
      this.audio.play().catch(() => {});
      return;
    }
    this.setLoading(false);
    toast('Аудио недоступно — попробуйте другого чтеца');
  }
  async setTitle(t: Track) {
    const title = $('[data-player-title]');
    const sub = $('[data-player-sub]');
    const meta = surahIndex.find((s) => s.n === t.s);
    const nr = meta ? meta.nr : 'Сура ' + t.s;
    const isSurah = this.currentReciter?.type === 'surah';
    if (title) title.textContent = isSurah ? `Сура ${nr}` : `${nr} · аят ${t.a}`;
    if (sub) sub.textContent = this.currentReciter ? this.currentReciter.name : await this.reciterName();
    if (!meta) loadIndex().then(() => this.setTitle(t));
  }
  highlight(t: Track) {
    this.clearHighlight();
    const el = $(`[data-ayah-key="${t.s}:${t.a}"]`);
    el?.classList.add('active');
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
  clearHighlight() {
    $$('.ayah.active').forEach((e) => e.classList.remove('active'));
  }
})();

// иконки play/pause для плеера (совпадают с lib/icons)
const ICON_PLAY =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 4.5v15l13-7.5z" fill="currentColor" stroke="none"/></svg>';
const ICON_PAUSE =
  '<svg viewBox="0 0 24 24" fill="none"><rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor"/></svg>';

/* ==========================================================================
   Старт
   ========================================================================== */
function boot() {
  initHomeFilter();
  initMemorize(player);
  initTheme();
  initReading();
  initView();
  initTranslation();
  initMenus();
  initDrawer({ dataVersion: DV, loadIndex });
  initTransShow();
  initTajweed(DV);
  initQuick({ loadIndex });
  initBookmarks();
  initContinue();
  initAyahActions();
  initAyahContextMenu();
  initMushafAyahSheet();
  initReadingAnalytics();
  player.init();
  initHotkeys({ player, setViewHotkey, toggleBookmark, closeMenus });
  initHapticInteractions();
  loadIndex(); // прогреть индекс для плеера/заголовков
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
