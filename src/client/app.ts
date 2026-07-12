// Клиентская логика Корана онлайн. Ванильный TS, бандлится Astro.
// Отвечает за: тему, настройки чтения, режимы отображения, перевод/чтец,
// аудиоплеер, закладки, «Продолжить», прогресс, хоткеи, быстрый переход, меню.

type Dict<T> = Record<string, T>;

/* ---------- storage ---------- */
const LS = {
  get<T>(k: string, d: T): T {
    try {
      const v = localStorage.getItem(k);
      return v == null ? d : (JSON.parse(v) as T);
    } catch {
      return d;
    }
  },
  set(k: string, v: unknown) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {}
  },
};
const K = {
  theme: 'q_theme',
  read: 'q_read',
  view: 'q_view',
  tr: 'q_tr',
  reciter: 'q_reciter',
  speed: 'q_speed',
  bookmarks: 'q_bookmarks',
  last: 'q_last',
  progress: 'q_progress',
};

const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) =>
  r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) =>
  Array.from(r.querySelectorAll<T>(s));

/* ---------- toast ---------- */
let toastT: number | undefined;
function toast(msg: string) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastT);
  toastT = window.setTimeout(() => el.classList.remove('show'), 1800);
}

/* ---------- данные (ленивая загрузка) ---------- */
interface Reciter {
  id: string;
  name: string;
  ed?: string; // редакция islamic.network
  br?: number; // битрейт
  ea?: string; // папка EveryAyah (фолбэк)
  type?: 'ayah' | 'surah';
  srv?: string; // база по-суровых файлов (mp3quran)
  skip?: number[]; // недоступные суры у по-сурового чтеца
}
interface SurahMeta {
  n: number;
  na: string;
  ne: string;
  nr: string;
  nm: string;
  t: string;
  c: number;
  slug: string;
}
// версия данных — сбивает кэш браузера при изменении public/data/* (напр. новые чтецы)
const DV = '3';
let reciters: Reciter[] = [];
let surahIndex: SurahMeta[] = [];
let ayahOffset: number[] = []; // ayahOffset[s] = число аятов до суры s (для глобального номера)
function computeOffsets(idx: SurahMeta[]) {
  ayahOffset = [];
  let acc = 0;
  for (const s of idx) {
    ayahOffset[s.n] = acc;
    acc += s.c;
  }
}
const loadReciters = async () => {
  if (!reciters.length) reciters = await fetch(`/data/reciters.json?v=${DV}`).then((r) => r.json());
  return reciters;
};
const loadIndex = async () => {
  if (!surahIndex.length) {
    surahIndex = await fetch(`/data/index.json?v=${DV}`).then((r) => r.json());
    computeOffsets(surahIndex);
  }
  return surahIndex;
};

const pad3 = (x: number) => String(x).padStart(3, '0');
// глобальный номер аята 1..6236
const globalAyah = (s: number, a: number) => (ayahOffset[s] || 0) + a;
// основной источник — Cloudflare CDN islamic.network (быстрый глобально, вкл. РФ)
const cdnUrl = (r: Reciter, s: number, a: number) =>
  `https://cdn.islamic.network/quran/audio/${r.br}/${r.ed}/${globalAyah(s, a)}.mp3`;
// фолбэк — EveryAyah
const eaUrl = (r: Reciter, s: number, a: number) =>
  `https://everyayah.com/data/${r.ea}/${pad3(s)}${pad3(a)}.mp3`;
// по-суровый чтец (mp3quran): целая сура одним файлом
const surahUrl = (r: Reciter, s: number) => `${r.srv}${pad3(s)}.mp3`;
const surahHas = (r: Reciter, s: number) => !(r.skip || []).includes(s);
const DEFAULT_RECITER_ID = 'alafasy';

/* ==========================================================================
   Тема
   ========================================================================== */
function applyTheme(t: string) {
  const eff =
    t === 'system'
      ? matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : t;
  document.documentElement.setAttribute('data-theme', eff);
}
function initTheme() {
  const cur = LS.get<string>(K.theme, 'system');
  applyTheme(cur); // подстраховка, если anti-flash не отработал
  markMenu('theme', 'theme-set', cur);
  $$('[data-theme-set]').forEach((b) =>
    b.addEventListener('click', () => {
      const v = b.getAttribute('data-theme-set')!;
      LS.set(K.theme, v);
      applyTheme(v);
      markMenu('theme', 'theme-set', v);
    })
  );
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (LS.get<string>(K.theme, 'system') === 'system') applyTheme('system');
  });
}

/* ==========================================================================
   Настройки чтения
   ========================================================================== */
interface ReadCfg {
  ar: number;
  ru: number;
  lh: number;
  font: string;
}
function initReading() {
  const cfg = LS.get<ReadCfg>(K.read, { ar: 30, ru: 18, lh: 1.9, font: 'Mushaf' });
  const rootStyle = document.documentElement.style;
  const apply = () => {
    rootStyle.setProperty('--ar-size', cfg.ar + 'px');
    rootStyle.setProperty('--ru-size', cfg.ru + 'px');
    rootStyle.setProperty('--lh', String(cfg.lh));
    rootStyle.setProperty('--ar-font', cfg.font);
    LS.set(K.read, cfg);
  };
  // ползунки
  const bind = (key: keyof ReadCfg, parse: (v: string) => number) =>
    $$<HTMLInputElement>(`[data-set="${key}"]`).forEach((inp) => {
      inp.value = String(cfg[key]);
      inp.addEventListener('input', () => {
        (cfg[key] as number) = parse(inp.value);
        apply();
      });
    });
  bind('ar', (v) => parseInt(v, 10));
  bind('ru', (v) => parseInt(v, 10));
  bind('lh', (v) => parseFloat(v));
  // шрифт
  const markFont = () =>
    $$('[data-font]').forEach((b) => b.classList.toggle('on', b.getAttribute('data-font') === cfg.font));
  $$('[data-font]').forEach((b) =>
    b.addEventListener('click', () => {
      cfg.font = b.getAttribute('data-font')!;
      apply();
      markFont();
    })
  );
  markFont();
  apply();
}

/* ==========================================================================
   Режим отображения (араб / перевод / транслит / тафсир / всё)
   ========================================================================== */
function applyView(v: string) {
  const box = $('[data-ayahs]');
  if (box) box.setAttribute('data-view', v);
  $$('[data-view-seg] [data-view]').forEach((b) =>
    b.classList.toggle('on', b.getAttribute('data-view') === v)
  );
}
function initView() {
  const cur = LS.get<string>(K.view, 'all');
  applyView(cur);
  $$('[data-view-seg] [data-view]').forEach((b) =>
    b.addEventListener('click', () => {
      const v = b.getAttribute('data-view')!;
      LS.set(K.view, v);
      applyView(v);
    })
  );
}

/* ==========================================================================
   Перевод (навигация на /surah/:id/:tr)
   ========================================================================== */
function initTranslation() {
  const cur = document.body.getAttribute('data-tr') || LS.get<string>(K.tr, 'saadi');
  const names: Dict<string> = {
    kuliev: 'Кулиев',
    saadi: 'Тафсир',
    abuadel: 'Абу Адель',
    'ibn-kathir': 'Ибн Касир',
  };
  const label = $('[data-tr-current]');
  if (label) label.textContent = names[cur] || 'Перевод';
  markMenu('tr', 'tr', cur);
  markMenu('settings', 'tr', cur);
  // ВАЖНО: только кнопки перевода — НЕ body (у body есть data-tr для чтения настроек,
  // иначе клик по любому месту страницы всплывал бы к body и навигировал на /surah/:id/:tr)
  $$('button[data-tr]').forEach((b) =>
    b.addEventListener('click', () => {
      if ((b as HTMLButtonElement).disabled) return;
      const v = b.getAttribute('data-tr')!;
      LS.set(K.tr, v);
      const sid = document.body.getAttribute('data-surah');
      if (sid) location.href = `/surah/${sid}/${v}`;
      else toast('Перевод сохранён — откроется в суре');
    })
  );
}

/* ==========================================================================
   Меню верхней панели
   ========================================================================== */
function markMenu(menu: string, attr: string, val: string) {
  $$(`[data-menu="${menu}"] [data-${attr}]`).forEach((b) =>
    b.classList.toggle('on', b.getAttribute(`data-${attr}`) === val)
  );
}
function initMenus() {
  $$('[data-menu-wrap]').forEach((wrap) => {
    const toggle = $('[data-menu-toggle]', wrap);
    const menu = $('.menu', wrap);
    if (!toggle || !menu) return;
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = menu.classList.contains('open');
      closeMenus();
      if (!open) menu.classList.add('open');
    });
  });
  document.addEventListener('click', (e) => {
    if (!(e.target as Element).closest('[data-menu-wrap]')) closeMenus();
  });
}
function closeMenus() {
  $$('.menu.open').forEach((m) => m.classList.remove('open'));
}

/* ==========================================================================
   Drawer (список сур)
   ========================================================================== */
async function initDrawer() {
  const drawer = $('[data-drawer]');
  const backdrop = $('[data-drawer-backdrop]');
  const listEl = $('[data-drawer-list]');
  const open = () => {
    drawer?.classList.add('show');
    backdrop?.classList.add('show');
    $<HTMLInputElement>('[data-drawer-filter]')?.focus();
  };
  const close = () => {
    drawer?.classList.remove('show');
    backdrop?.classList.remove('show');
  };
  $$('[data-act="drawer"]').forEach((b) => b.addEventListener('click', open));
  $$('[data-act="drawer-close"]').forEach((b) => b.addEventListener('click', close));
  backdrop?.addEventListener('click', close);

  // список сур строим на клиенте (чтобы не дублировать в каждой странице)
  const sid = document.body.getAttribute('data-surah');
  const idx = await loadIndex();
  if (listEl) {
    listEl.innerHTML = idx
      .map((s) => {
        const name = `${s.nr} ${s.ne} ${s.nm}`.toLowerCase();
        const ar = s.na.replace('سُورَةُ ', '');
        return `<a href="/surah/${s.n}" data-n="${s.n}" data-name="${name}"${String(s.n) === sid ? ' class="on"' : ''}><span class="n">${s.n}</span><span class="nm">${s.nr}<span style="display:block;font-weight:400;font-size:12px;color:var(--ink-faint)">${s.nm} · ${s.c} аятов</span></span><span class="ar-name">${ar}</span></a>`;
      })
      .join('');
  }
  // фильтр
  const filter = $<HTMLInputElement>('[data-drawer-filter]');
  filter?.addEventListener('input', () => {
    const q = filter.value.trim().toLowerCase();
    $$('[data-drawer-list] a').forEach((a) => {
      const hit = !q || (a.getAttribute('data-name') || '').includes(q) || a.getAttribute('data-n') === q;
      (a as HTMLElement).style.display = hit ? '' : 'none';
    });
  });
}

/* ==========================================================================
   Быстрый переход: "2:255", "18", "ясин", "аль-кахф"
   ========================================================================== */
const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/й/g, 'и')
    .replace(/[^a-zа-я0-9]+/g, '');
const ALIASES: Dict<number> = {
  фатиха: 1, бакара: 2, бакора: 2, имран: 3, ниса: 4, маида: 5, анам: 6, араф: 7,
  анфаль: 8, тауба: 9, юнус: 10, худ: 11, юсуф: 12, раад: 13, ибрахим: 14, хиджр: 15,
  нахль: 16, исра: 17, кахф: 18, кяхф: 18, марьям: 19, таха: 20, анбия: 21, хадж: 22,
  муминун: 23, нур: 24, фуркан: 25, шуара: 26, намль: 27, касас: 28, анкабут: 29,
  рум: 30, лукман: 31, саджда: 32, ахзаб: 33, саба: 34, фатыр: 35, ясин: 36, иасин: 36,
  саффат: 37, сад: 38, зумар: 39, гафир: 40, фуссылят: 41, шура: 42, зухруф: 43,
  духан: 44, джасия: 45, ахкаф: 46, мухаммад: 47, фатх: 48, худжурат: 49, каф: 50,
  зарият: 51, тур: 52, наджм: 53, камар: 54, рахман: 55, вакиа: 56, хадид: 57,
  муджадиля: 58, хашр: 59, мумтахана: 60, сафф: 61, джума: 62, мунафикун: 63,
  тагабун: 64, талак: 65, тахрим: 66, мульк: 67, калам: 68, хакка: 69, мааридж: 70,
  нух: 71, джинн: 72, муззаммиль: 73, муддассир: 74, кияма: 75, инсан: 76, мурсалят: 77,
  наба: 78, назиат: 79, абаса: 80, таквир: 81, инфитар: 82, мутаффифин: 83, иншикак: 84,
  бурудж: 85, тарик: 86, аля: 87, гашия: 88, фаджр: 89, баляд: 90, шамс: 91, лейль: 92,
  духа: 93, шарх: 94, тин: 95, аляк: 96, кадр: 97, беййина: 98, зальзаля: 99, адият: 100,
  кариа: 101, такасур: 102, аср: 103, хумаза: 104, филь: 105, курайш: 106, маун: 107,
  каусар: 108, кафирун: 109, наср: 110, масад: 111, ихлас: 112, фаляк: 113, фалак: 113,
  нас: 114,
};

async function resolveQuick(raw: string): Promise<string | null> {
  const q = raw.trim();
  if (!q) return null;
  // формат s:a / s.a / s a / s/a
  const m = q.match(/^(\d{1,3})\s*[:.\-\/\s]\s*(\d{1,3})$/);
  if (m) {
    const s = +m[1],
      a = +m[2];
    if (s >= 1 && s <= 114) return `/ayah/${s}/${Math.max(1, a)}`;
  }
  // просто число суры
  if (/^\d{1,3}$/.test(q)) {
    const s = +q;
    if (s >= 1 && s <= 114) return `/surah/${s}`;
  }
  // по названию
  const nq = norm(q).replace(/^(аль|аш|ас|ан|ат|аз|ар|ад|al|ash|as|an)/, '');
  const idx = await loadIndex();
  // алиас
  for (const key in ALIASES) if (key.includes(nq) || nq.includes(key)) return `/surah/${ALIASES[key]}`;
  // по русскому/транслит названию
  const hit = idx.find((s) => {
    const cand = [norm(s.nr), norm(s.ne), norm(s.nm), s.slug.replace(/-/g, '')];
    return cand.some((c) => c && (c.includes(nq) || nq.includes(c)));
  });
  return hit ? `/surah/${hit.n}` : null;
}
function initQuick() {
  const form = $('[data-quick]');
  const input = $<HTMLInputElement>('[data-quick-input]');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const dest = await resolveQuick(input?.value || '');
    if (dest) location.href = dest;
    else toast('Не нашёл суру. Попробуйте номер, «2:255» или название.');
  });
}

/* ==========================================================================
   Закладки
   ========================================================================== */
const bmKey = (s: number, a: number) => `${s}:${a}`;
function getBookmarks(): string[] {
  return LS.get<string[]>(K.bookmarks, []);
}
function isBookmarked(s: number, a: number) {
  return getBookmarks().includes(bmKey(s, a));
}
function toggleBookmark(s: number, a: number): boolean {
  const list = getBookmarks();
  const k = bmKey(s, a);
  const i = list.indexOf(k);
  if (i >= 0) list.splice(i, 1);
  else list.unshift(k);
  LS.set(K.bookmarks, list);
  renderBookmarks();
  syncBookmarkButtons();
  return i < 0;
}
function renderBookmarks() {
  const box = $('[data-bookmark-list]');
  if (!box) return;
  const list = getBookmarks();
  const empty = $('[data-bookmark-empty]');
  box.querySelectorAll('a.item').forEach((n) => n.remove());
  if (!list.length) {
    empty?.classList.remove('hide');
    return;
  }
  empty?.classList.add('hide');
  for (const k of list) {
    const [s, a] = k.split(':');
    const el = document.createElement('a');
    el.className = 'item';
    el.href = `/ayah/${s}/${a}`;
    el.innerHTML = `<span>Аят ${s}:${a}</span>`;
    box.appendChild(el);
  }
}
function syncBookmarkButtons() {
  $$('[data-bm]').forEach((b) => {
    const [s, a] = b.getAttribute('data-bm')!.split(':').map(Number);
    b.classList.toggle('on', isBookmarked(s, a));
  });
}
function initBookmarks() {
  renderBookmarks();
  syncBookmarkButtons();
  // добавить текущий (на странице аята)
  const add = $('[data-bookmark-add]');
  const sid = document.body.getAttribute('data-surah');
  const aid = document.body.getAttribute('data-ayah');
  if (add && sid && aid) {
    add.classList.remove('hide');
    add.addEventListener('click', () => {
      const on = toggleBookmark(+sid, +aid);
      toast(on ? 'Аят добавлен в закладки' : 'Убрано из закладок');
    });
  }
}

/* ==========================================================================
   Продолжить (последнее место) + прогресс
   ========================================================================== */
function rememberLast() {
  const sid = document.body.getAttribute('data-surah');
  if (!sid) return;
  const aid = document.body.getAttribute('data-ayah') || '1';
  LS.set(K.last, { s: +sid, a: +aid });
  // прогресс: множество прочитанных сур
  const prog = LS.get<Dict<boolean>>(K.progress, {});
  prog[sid] = true;
  LS.set(K.progress, prog);
}
function initContinue() {
  const btn = $<HTMLAnchorElement>('[data-continue]');
  const last = LS.get<{ s: number; a: number } | null>(K.last, null);
  if (btn && last && last.s) {
    btn.href = `/surah/${last.s}#ayah-${last.a}`;
    btn.classList.remove('hide');
    btn.title = `Продолжить: сура ${last.s}, аят ${last.a}`;
  }
  rememberLast();
}

/* ==========================================================================
   Действия аята: copy / share / bookmark / play
   ========================================================================== */
function ayahText(el: Element): { ar: string; ru: string; s: number; a: number } {
  const ar = $('.ar', el)?.textContent?.trim() || '';
  const ru = ($('.translation', el) || $('.tafsir', el))?.textContent?.trim() || '';
  const [s, a] = (el.getAttribute('data-ayah-key') || '0:0').split(':').map(Number);
  return { ar, ru, s, a };
}
async function shareAyah(s: number, a: number, ar: string, ru: string) {
  const url = `${location.origin}/ayah/${s}/${a}`;
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
    $('[data-act="copy"]', el)?.addEventListener('click', () => {
      const t = ayahText(el);
      copy(`Коран ${s}:${a}\n${t.ar}\n${t.ru}`);
    });
    $('[data-act="copy-link"]', el)?.addEventListener('click', () =>
      copy(`${location.origin}/ayah/${s}/${a}`)
    );
    $('[data-act="share"]', el)?.addEventListener('click', () => {
      const t = ayahText(el);
      shareAyah(s, a, t.ar, t.ru);
    });
    $('[data-bm]', el)?.addEventListener('click', () => {
      const on = toggleBookmark(s, a);
      toast(on ? 'В закладках' : 'Убрано');
    });
    $('[data-act="play"]', el)?.addEventListener('click', () => player.playKey(s, a));
  });
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
  reciterId = LS.get<string>(K.reciter, 'alafasy');
  triedFallback = false;
  currentReciter: Reciter | null = null;

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
    let r = r0;
    let src: string;
    if (r.type === 'surah') {
      if (surahHas(r, t.s)) {
        src = surahUrl(r, t.s); // целая сура одним файлом
      } else {
        // у по-сурового чтеца нет этой суры → фолбэк на чтеца по умолчанию (по аятам)
        const def = reciters.find((x) => x.id === DEFAULT_RECITER_ID) || reciters[0];
        toast(`${r.name.split('·')[0].trim()} не читал эту суру — включён чтец по умолчанию`);
        r = def;
        src = cdnUrl(def, t.s, t.a);
      }
    } else {
      src = cdnUrl(r, t.s, t.a);
    }
    this.currentReciter = r;
    this.setTitle(t);
    this.audio.src = src;
    this.audio.playbackRate = this.speed;
    try {
      await this.audio.play();
    } catch {}
  }
  toggle() {
    if (!this.audio) return;
    if (this.idx < 0) return this.playIdx(0);
    if (this.audio.paused) this.audio.play().catch(() => {});
    else this.audio.pause();
  }
  next() {
    if (this.range && this.idx >= this.range.to) return this.playIdx(this.range.from);
    this.playIdx(Math.min(this.idx + 1, this.playlist.length - 1));
  }
  prev() {
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
   Горячие клавиши
   ========================================================================== */
function currentAyahIdx(): number {
  return player.idx >= 0 ? player.idx : 0;
}
function initHotkeys() {
  document.addEventListener('keydown', (e) => {
    const tag = (e.target as Element)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
      if (e.key === 'Escape') (e.target as HTMLElement).blur();
      return;
    }
    const sid = document.body.getAttribute('data-surah');
    switch (e.key) {
      case '/':
        e.preventDefault();
        $<HTMLInputElement>('[data-quick-input]')?.focus();
        break;
      case '[':
        if (e.altKey) navSurah(-1);
        else if (e.shiftKey) jumpAyah(-10);
        else jumpAyah(-1);
        break;
      case ']':
        if (e.altKey) navSurah(1);
        else if (e.shiftKey) jumpAyah(10);
        else jumpAyah(1);
        break;
      case 'p':
      case 'P':
        e.preventDefault();
        player.toggle();
        break;
      case 'a':
      case 'A':
        setViewHotkey('arabic');
        break;
      case 's':
      case 'S':
        setViewHotkey('translation');
        break;
      case 'd':
      case 'D':
        setViewHotkey('translit');
        break;
      case 't':
      case 'T':
        setViewHotkey('tafsir');
        break;
      case 'b':
      case 'B':
        if (sid) {
          const t = player.playlist[currentAyahIdx()];
          if (t) {
            const on = toggleBookmark(t.s, t.a);
            toast(on ? 'В закладках' : 'Убрано');
          }
        }
        break;
      case 'Escape':
        closeMenus();
        break;
    }
  });
}
function setViewHotkey(v: string) {
  LS.set(K.view, v);
  applyView(v);
  toast('Режим: ' + v);
}
function jumpAyah(delta: number) {
  const box = $('[data-ayahs]');
  if (!box) return;
  const els = $$('[data-ayah-key]');
  if (!els.length) return;
  let base = player.idx >= 0 ? player.idx : 0;
  const target = Math.min(Math.max(base + delta, 0), els.length - 1);
  els[target].scrollIntoView({ block: 'center', behavior: 'smooth' });
  els[target].classList.add('active');
  setTimeout(() => {
    if (player.idx < 0) els[target].classList.remove('active');
  }, 1200);
  player.idx = target;
}
async function navSurah(delta: number) {
  const sid = document.body.getAttribute('data-surah');
  if (!sid) return;
  const n = +sid + delta;
  if (n >= 1 && n <= 114) location.href = `/surah/${n}`;
}

/* ==========================================================================
   Фильтр сур на главной
   ========================================================================== */
function initHomeFilter() {
  const inp = $<HTMLInputElement>('[data-home-filter]');
  if (!inp) return;
  const cards = $$('[data-surah-grid] [data-card]');
  inp.addEventListener('input', () => {
    const q = inp.value.trim().toLowerCase();
    cards.forEach((c) => {
      const hit = !q || (c.getAttribute('data-name') || '').includes(q);
      (c as HTMLElement).style.display = hit ? '' : 'none';
    });
  });
}

/* ==========================================================================
   Старт
   ========================================================================== */
function boot() {
  initHomeFilter();
  initTheme();
  initReading();
  initView();
  initTranslation();
  initMenus();
  initDrawer();
  initQuick();
  initBookmarks();
  initContinue();
  initAyahActions();
  player.init();
  initHotkeys();
  loadIndex(); // прогреть индекс для плеера/заголовков
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
