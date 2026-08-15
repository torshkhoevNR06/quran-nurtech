import { isBookmarked, toggleBookmark } from './bookmarks';
import { openAyahEditor } from './imgeditor';
import { loadIbnKathir, loadIndex, loadSaadi, surahIndex } from './quran-data';
import { $, $$, K, LS, toast } from './shared';
import { updateMobileScrollLock } from './ui-menus';

interface ReaderActionsPlayer {
  playKey(s: number, a: number): void;
  isPlayingKey?(s: number, a: number): boolean;
}

interface ReaderActionsDeps {
  player: ReaderActionsPlayer;
}

function installSwipeDismiss(target: HTMLElement, close: () => void, options: { scrollEl?: HTMLElement | null } = {}) {
  let pointerId: number | null = null;
  let startX = 0;
  let startY = 0;
  let lastY = 0;
  let startTime = 0;
  let dragging = false;
  let startedInDismissZone = false;

  const canStartDismiss = () => startedInDismissZone || !options.scrollEl || options.scrollEl.scrollTop <= 2;
  const isDismissZone = (y: number) => y - target.getBoundingClientRect().top <= 96;

  const beginDrag = (x: number, y: number) => {
    startX = x;
    startY = y;
    lastY = y;
    startTime = performance.now();
    dragging = false;
    startedInDismissZone = isDismissZone(y);
  };

  const updateDrag = (x: number, y: number) => {
    const dx = x - startX;
    const dy = y - startY;
    if (!dragging && dy > 6 && dy > Math.abs(dx) * 1.15 && canStartDismiss()) {
      dragging = true;
      target.classList.add('is-dragging');
      if (options.scrollEl) options.scrollEl.scrollTop = 0;
    }
    if (!dragging) return false;
    lastY = y;
    target.style.setProperty('--mas-drag-y', `${Math.max(0, dy)}px`);
    return true;
  };

  const finishDrag = () => {
    const dy = Math.max(0, lastY - startY);
    const elapsed = Math.max(1, performance.now() - startTime);
    const velocity = dy / elapsed;
    if (dragging && (dy > 42 || velocity > 0.28)) {
      close();
    }
    dragging = false;
    startedInDismissZone = false;
    target.classList.remove('is-dragging');
    target.style.removeProperty('--mas-drag-y');
  };

  target.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' || window.innerWidth > 820) return;
    beginDrag(event.clientX, event.clientY);
    if (!canStartDismiss()) return;
    pointerId = event.pointerId;
  });

  target.addEventListener(
    'pointermove',
    (event) => {
      if (pointerId !== event.pointerId) return;
      const wasDragging = dragging;
      if (updateDrag(event.clientX, event.clientY)) {
        try {
          target.setPointerCapture?.(event.pointerId);
        } catch {
          // Synthetic/mobile browsers can reject capture for non-active pointers.
        }
        event.preventDefault();
      }
      if (!wasDragging && dragging) event.preventDefault();
    },
    { passive: false }
  );

  const finish = (event: PointerEvent) => {
    if (pointerId !== event.pointerId) return;
    pointerId = null;
    finishDrag();
  };

  target.addEventListener('pointerup', finish);
  target.addEventListener('pointercancel', finish);

  target.addEventListener(
    'touchstart',
    (event) => {
      if (window.innerWidth > 820 || event.touches.length !== 1) return;
      const touch = event.touches[0];
      beginDrag(touch.clientX, touch.clientY);
      if (startedInDismissZone) event.preventDefault();
    },
    { passive: false }
  );

  target.addEventListener(
    'touchmove',
    (event) => {
      if (window.innerWidth > 820 || event.touches.length !== 1) return;
      if (!canStartDismiss() && !dragging) return;
      const touch = event.touches[0];
      if (!updateDrag(touch.clientX, touch.clientY)) return;
      event.preventDefault();
    },
    { passive: false }
  );

  target.addEventListener(
    'touchend',
    () => {
      if (window.innerWidth > 820 || !dragging) return;
      finishDrag();
    },
    { passive: true }
  );

  target.addEventListener(
    'touchcancel',
    () => {
      dragging = false;
      startedInDismissZone = false;
      target.classList.remove('is-dragging');
      target.style.removeProperty('--mas-drag-y');
    },
    { passive: true }
  );
}

function ayahText(el: Element): { ar: string; ru: string; s: number; a: number } {
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

function extractAyah(el: Element, s: number, a: number) {
  const clean = (t?: string | null) => (t || '').replace(/\s+/g, ' ').trim();
  const strip = (t?: string | null) =>
    clean(t).replace(/^(Перевод\s·\s)?(Эльмир\sКулиев|Абу\sАдель|Кулиев|Транслитерация)\s*/, '');
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

const CTX_IC = {
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5v14l11-7z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>',
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
    b.innerHTML = '<div class="tafsir-loading">Загружаю тафсир...</div>';
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

export function initAyahActions({ player }: ReaderActionsDeps) {
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
      await loadIndex();
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

export function initAyahContextMenu({ player }: ReaderActionsDeps) {
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

export function initMushafAyahSheet({ player }: ReaderActionsDeps) {
  const words = $$('.qcf-word[data-ayah-key]');
  if (!words.length) return;
  if (document.body.getAttribute('data-mushaf-ayah-sheet-ready') === '1') return;
  document.body.setAttribute('data-mushaf-ayah-sheet-ready', '1');
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
    document.body.classList.remove('mushaf-sheet-open');
    updateMobileScrollLock();
    clearHi();
  };
  sheet.addEventListener('click', (e) => {
    if ((e.target as Element).closest('[data-mas-close]')) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
  installSwipeDismiss(card, close, { scrollEl: card });

  const actBtn = (label: string, icon: string, run: (button: HTMLButtonElement) => void, kind?: string) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'mas-act';
    if (kind) b.dataset.kind = kind;
    b.innerHTML = `<span class="mas-ic">${icon}</span>${label}`;
    b.addEventListener('click', () => {
      run(b);
      b.blur();
    });
    return b;
  };

  const pulseAction = (button: HTMLButtonElement, label?: string) => {
    const original = button.innerHTML;
    button.classList.add('is-feedback');
    if (label) {
      const icon = button.querySelector('.mas-ic')?.innerHTML || '';
      button.innerHTML = `<span class="mas-ic">${icon}</span>${label}`;
    }
    window.setTimeout(() => {
      button.classList.remove('is-feedback');
      button.innerHTML = original;
    }, 900);
  };

  const open = async (s: number, a: number) => {
    clearHi();
    $$(`.qcf-word[data-ayah-key="${s}:${a}"]`).forEach((w) => w.classList.add('qcf-ayah-active'));
    await loadIndex();
    const name = surahIndex.find((x) => x.n === s)?.nr || 'Сура ' + s;
    refEl.textContent = `${name} · аят ${s}:${a}`;
    trEl.textContent = 'Загружаю перевод...';
    tafEl.hidden = true;
    tafEl.textContent = '';
    sheet.classList.add('open');
    document.body.classList.add('mushaf-sheet-open');
    updateMobileScrollLock();

    actsEl.innerHTML = '';
    let row: AyahTr | undefined;
    const syncAudioButton = (button: HTMLButtonElement) => {
      const playing = !!player.isPlayingKey?.(s, a);
      button.classList.toggle('on', playing);
      button.setAttribute('aria-pressed', playing ? 'true' : 'false');
      button.innerHTML = `<span class="mas-ic">${playing ? CTX_IC.pause : CTX_IC.play}</span>Слушать`;
    };
    const syncBookmarkButton = (button: HTMLButtonElement) => {
      const on = isBookmarked(s, a);
      button.classList.toggle('on', on);
      button.classList.toggle('is-bookmarked', on);
      button.setAttribute('aria-pressed', on ? 'true' : 'false');
      button.innerHTML = `<span class="mas-ic">${CTX_IC.bookmark}</span>${on ? 'В закладках' : 'Закладка'}`;
    };
    const syncTafsirButton = (button: HTMLButtonElement, on: boolean) => {
      button.classList.toggle('on', on);
      button.setAttribute('aria-pressed', on ? 'true' : 'false');
    };
    const buildActs = () => {
      const playButton = actBtn('Слушать', CTX_IC.play, (button) => {
        const next = !button.classList.contains('on');
        button.classList.toggle('on', next);
        button.setAttribute('aria-pressed', next ? 'true' : 'false');
        button.innerHTML = `<span class="mas-ic">${next ? CTX_IC.pause : CTX_IC.play}</span>Слушать`;
        player.playKey(s, a);
      }, 'play');
      syncAudioButton(playButton);
      const bookmarkButton = actBtn(isBookmarked(s, a) ? 'В закладках' : 'Закладка', CTX_IC.bookmark, (button) => {
        const on = toggleBookmark(s, a);
        syncBookmarkButton(button);
        toast(on ? 'В закладках' : 'Убрано');
      }, 'bookmark');
      bookmarkButton.dataset.bm = `${s}:${a}`;
      syncBookmarkButton(bookmarkButton);
      const tafsirButton = actBtn('Тафсир', CTX_IC.book, async (button) => {
        if (!tafEl.hidden) {
          tafEl.hidden = true;
          tafEl.textContent = '';
          syncTafsirButton(button, false);
          return;
        }
        syncTafsirButton(button, true);
        await showTafsir(s, a);
      }, 'tafsir');
      syncTafsirButton(tafsirButton, false);
      actsEl.append(
        playButton,
        tafsirButton,
        bookmarkButton,
        actBtn('Копировать', CTX_IC.copy, (button) => {
          const activeArabic = $$(`.qcf-word[data-ayah-key="${s}:${a}"]`)
            .map((word) => word.textContent || '')
            .join('')
            .trim();
          const text = row
            ? `${name} · аят ${s}:${a}\n\n${row.ar}\n\n${row.r}\n\n${location.origin}/${s}:${a}`
            : `${name} · аят ${s}:${a}\n\n${activeArabic}\n\n${location.origin}/${s}:${a}`;
          copy(text);
          pulseAction(button, 'Скопировано');
        }, 'copy'),
        actBtn('Картинка', CTX_IC.image, (button) => {
          if (!row) return;
          pulseAction(button);
          openAyahEditor({ s, a, ar: row.ar, ru: row.r, aa: row.aa, tl: row.tl, surahName: name });
        }, 'image'),
        actBtn('Открыть аят', CTX_IC.link, () => (location.href = `/${s}:${a}`), 'link')
      );
    };
    buildActs();

    const map = await loadAyahTranslations();
    row = map[`${s}:${a}`];
    trEl.textContent = row?.r || 'Перевод не найден.';
  };

  const showTafsir = async (s: number, a: number) => {
    tafEl.hidden = false;
    tafEl.textContent = 'Загружаю тафсир...';
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

  document.addEventListener('click', (event) => {
    const word = (event.target as Element | null)?.closest?.('.qcf-word[data-ayah-key]') as HTMLElement | null;
    if (!word) return;
    event.preventDefault();
    const [s, a] = word.getAttribute('data-ayah-key')!.split(':').map(Number);
    open(s, a);
  });

  window.addEventListener('quran:audio-state', (event) => {
    const detail = (event as CustomEvent<{ key: string; playing: boolean }>).detail;
    const button = actsEl.querySelector<HTMLButtonElement>('[data-kind="play"]');
    if (!button || !detail) return;
    const activeKey = refEl.textContent?.match(/(\d+):(\d+)/)?.[0] || '';
    const playing = detail.key === activeKey && detail.playing;
    button.classList.toggle('on', playing);
    button.setAttribute('aria-pressed', playing ? 'true' : 'false');
    button.innerHTML = `<span class="mas-ic">${playing ? CTX_IC.pause : CTX_IC.play}</span>Слушать`;
  });

  window.addEventListener('quran:bookmark-state', (event) => {
    const detail = (event as CustomEvent<{ key: string; on: boolean }>).detail;
    const button = actsEl.querySelector<HTMLButtonElement>('[data-kind="bookmark"]');
    if (!button || !detail || button.dataset.bm !== detail.key) return;
    button.classList.toggle('on', detail.on);
    button.classList.toggle('is-bookmarked', detail.on);
    button.setAttribute('aria-pressed', detail.on ? 'true' : 'false');
    button.innerHTML = `<span class="mas-ic">${CTX_IC.bookmark}</span>${detail.on ? 'В закладках' : 'Закладка'}`;
  });
}
