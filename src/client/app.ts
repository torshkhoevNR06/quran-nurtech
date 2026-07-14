// Клиентская логика Корана онлайн. Ванильный TS, бандлится Astro.
// Отвечает за: тему, настройки чтения, режимы отображения, перевод/чтец,
// аудиоплеер, закладки, «Продолжить», прогресс, хоткеи, быстрый переход, меню.
import { openAyahEditor } from './imgeditor';

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
  layers: 'q_layers',
  tr: 'q_tr',
  reciter: 'q_reciter',
  speed: 'q_speed',
  bookmarks: 'q_bookmarks',
  last: 'q_last',
  readpos: 'q_readpos',
  progress: 'q_progress',
  uid: 'q_uid',
  time: 'q_time',
  days: 'q_days',
  streak: 'q_streak',
  memorize: 'q_memorize',
  memrep: 'q_memrep',
  transShow: 'q_trans',
  tajweed: 'q_tajweed',
};

const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) =>
  r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) =>
  Array.from(r.querySelectorAll<T>(s));

const READ_API_ENABLED =
  typeof location !== 'undefined' &&
  (location.hostname === 'quran.nurtech.dev' || location.hostname.endsWith('.nurtech.dev'));

/* ---------- хаптики (веб-вибро; iOS игнорирует, Android/PWA вибрирует) ---------- */
type Haptic = 'light' | 'medium' | 'success' | 'error';
const HAPTIC: Record<Haptic, number | number[]> = {
  light: 8,
  medium: 16,
  success: [12, 30, 14],
  error: [28, 45, 28],
};
function haptic(kind: Haptic = 'light') {
  try {
    (navigator as any).vibrate?.(HAPTIC[kind]);
  } catch {}
}

/* ---------- toast ---------- */
let toastT: number | undefined;
function toast(msg: string) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  haptic('light');
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
const DV = '5';
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

/* ---------- честная статистика чтения (dwell >= 3 сек на аяте) ---------- */
const TOTAL_AYAHS = 6236;
const DWELL_READ_SECONDS = 3;
const READ_SYNC_INTERVAL_MS = 30_000;
const ayahKeyRe = /^\d{1,3}:\d{1,3}$/;

interface ReadingDayStats {
  sec: number;
  ayahs: number;
}
interface ReadingStreak {
  current: number;
  best: number;
  lastDay: string;
}

const isAyahKey = (k: string) => ayahKeyRe.test(k);
const localDayKey = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const dayNum = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  if (!y || !m || !d) return 0;
  return Math.floor(new Date(y, m - 1, d).getTime() / 86_400_000);
};
function fmtDuration(sec: number) {
  const s = Math.max(0, Math.round(sec || 0));
  const m = Math.round(s / 60);
  if (m < 1) return s > 0 ? '<1 мин' : '0 мин';
  if (m < 60) return `${m} мин`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h} ч${mm ? ` ${mm} мин` : ''}`;
}
function getUid() {
  let uid = LS.get<string>(K.uid, '');
  if (!uid) {
    uid =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `anon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    LS.set(K.uid, uid);
  }
  return uid;
}
function getProgress() {
  return LS.get<Dict<boolean>>(K.progress, {});
}
function readAyahCount(prog = getProgress()) {
  let c = 0;
  for (const k in prog) if (prog[k] === true && isAyahKey(k)) c++;
  return c;
}
function cleanProgressWith(key: string) {
  const raw = getProgress();
  const clean: Dict<boolean> = {};
  for (const k in raw) if (raw[k] === true && isAyahKey(k)) clean[k] = true;
  clean[key] = true;
  return clean;
}
function getDays() {
  return LS.get<Dict<ReadingDayStats>>(K.days, {});
}
function setDays(days: Dict<ReadingDayStats>) {
  LS.set(K.days, days);
}
function updateStreak(days = getDays()) {
  const active = Object.keys(days)
    .filter((d) => (days[d]?.sec || 0) > 0 || (days[d]?.ayahs || 0) > 0)
    .sort((a, b) => dayNum(a) - dayNum(b));
  let best = 0;
  let run = 0;
  let prev = 0;
  for (const d of active) {
    const n = dayNum(d);
    run = prev && n === prev + 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = n;
  }
  const today = localDayKey();
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const yesterday = localDayKey(y);
  let anchor = days[today] ? today : days[yesterday] ? yesterday : '';
  let current = 0;
  if (anchor) {
    let n = dayNum(anchor);
    const activeNums = new Set(active.map(dayNum));
    while (activeNums.has(n)) {
      current++;
      n--;
    }
  }
  const streak = { current, best, lastDay: active[active.length - 1] || '' };
  LS.set(K.streak, streak);
  return streak;
}
function addReadingSecond() {
  const total = Math.max(0, LS.get<number>(K.time, 0) || 0) + 1;
  LS.set(K.time, total);
  const days = getDays();
  const d = localDayKey();
  days[d] = { sec: Math.max(0, days[d]?.sec || 0) + 1, ayahs: Math.max(0, days[d]?.ayahs || 0) };
  setDays(days);
  updateStreak(days);
}
function markAyahRead(key: string) {
  if (!isAyahKey(key)) return false;
  const current = getProgress();
  if (current[key] === true) return false;
  const next = cleanProgressWith(key);
  LS.set(K.progress, next);
  const days = getDays();
  const d = localDayKey();
  days[d] = { sec: Math.max(0, days[d]?.sec || 0), ayahs: Math.max(0, days[d]?.ayahs || 0) + 1 };
  setDays(days);
  updateStreak(days);
  renderReadingProgress();
  scheduleReadingSync(1200);
  return true;
}
function surahReadCount(s: number, count: number, prog = getProgress()) {
  let read = 0;
  for (let a = 1; a <= count; a++) if (prog[`${s}:${a}`] === true) read++;
  return read;
}
let progressIndex: SurahMeta[] = [];
function renderReadingProgress(idx = progressIndex) {
  const pbox = $('[data-drawer-progress]');
  if (!pbox || !idx.length) return;
  const prog = getProgress();
  const readAyahs = readAyahCount(prog);
  const pct = Math.round((readAyahs / TOTAL_AYAHS) * 100);
  const time = LS.get<number>(K.time, 0) || 0;
  const streak = LS.get<ReadingStreak>(K.streak, { current: 0, best: 0, lastDay: '' });
  const summary = $('[data-read-summary]')?.textContent || '';
  pbox.innerHTML = `<div class="prog-row"><span>Прочитано <b>${pct}%</b> Корана</span><span>${readAyahs}/${TOTAL_AYAHS} аятов</span></div><div class="prog-bar"><span style="width:${Math.max(pct, readAyahs ? 1 : 0)}%"></span></div><div class="prog-stats"><span>${fmtDuration(time)}</span><span>стрик ${streak.current || 0} дн.</span></div><div class="prog-global" data-read-summary>${summary}</div>`;
}

const pageSessionId =
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
let readSyncTimer: number | undefined;
let readLastSyncAt = 0;
function readingPayload() {
  const unitsRead = readAyahCount();
  return {
    uid: getUid(),
    sessionId: pageSessionId,
    unitsRead,
    totalSeconds: Math.max(0, Math.round(LS.get<number>(K.time, 0) || 0)),
    coverage: +(unitsRead / TOTAL_AYAHS).toFixed(4),
    lastActiveAt: new Date().toISOString(),
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    days: getDays(),
    streak: LS.get<ReadingStreak>(K.streak, { current: 0, best: 0, lastDay: '' }),
  };
}
function sendReadingSync(useBeacon = false) {
  if (!READ_API_ENABLED) return;
  clearTimeout(readSyncTimer);
  readSyncTimer = undefined;
  const payload = JSON.stringify(readingPayload());
  readLastSyncAt = Date.now();
  if (useBeacon && navigator.sendBeacon) {
    const blob = new Blob([payload], { type: 'application/json' });
    if (navigator.sendBeacon('/api/read', blob)) return;
  }
  fetch('/api/read', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}
function scheduleReadingSync(delay = 5000) {
  if (!READ_API_ENABLED) return;
  clearTimeout(readSyncTimer);
  readSyncTimer = window.setTimeout(() => sendReadingSync(false), delay);
}
function maybePeriodicReadingSync() {
  if (Date.now() - readLastSyncAt >= READ_SYNC_INTERVAL_MS) scheduleReadingSync(100);
}
async function loadPublicReadSummary() {
  if (!READ_API_ENABLED) return;
  const box = $('[data-read-summary]');
  if (!box) return;
  try {
    const r = await fetch('/api/read/summary', { headers: { Accept: 'application/json' } });
    if (!r.ok) return;
    const data = await r.json();
    const devices = Number(data.devices || 0);
    const active = Number(data.activeToday || 0);
    if (devices > 0) box.textContent = `Устройства: ${devices} · сегодня активны: ${active}`;
  } catch {}
}

const dwellState = {
  io: null as IntersectionObserver | null,
  visible: new Set<string>(),
  dwell: {} as Dict<number>,
  seen: new Set<string>(),
  timer: 0,
  focused: true,
};
function canTickReading() {
  return !document.hidden && dwellState.focused;
}
function updateLastFromVisible() {
  const keys = Array.from(dwellState.visible);
  if (!keys.length) return;
  const last = keys
    .map((k) => k.split(':').map(Number))
    .sort((a, b) => (a[0] === b[0] ? b[1] - a[1] : b[0] - a[0]))[0];
  if (last) LS.set(K.last, { s: last[0], a: last[1] });
}
function startDwellTimer() {
  if (dwellState.timer) return;
  dwellState.timer = window.setInterval(() => {
    if (!canTickReading() || dwellState.visible.size === 0) return;
    addReadingSecond();
    updateLastFromVisible();
    dwellState.visible.forEach((key) => {
      dwellState.dwell[key] = (dwellState.dwell[key] || 0) + 1;
      if (dwellState.dwell[key] >= DWELL_READ_SECONDS && !dwellState.seen.has(key)) {
        dwellState.seen.add(key);
        markAyahRead(key);
      }
    });
    maybePeriodicReadingSync();
  }, 1000);
}
function initReadingAnalytics() {
  const els = $$<HTMLElement>('[data-ayah-key]');
  if (!els.length || !('IntersectionObserver' in window)) return;
  getUid();
  updateStreak();
  dwellState.io?.disconnect();
  dwellState.visible.clear();
  dwellState.dwell = {};
  dwellState.io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const key = (entry.target as HTMLElement).dataset.ayahKey || '';
        if (!isAyahKey(key)) return;
        if (entry.isIntersecting) dwellState.visible.add(key);
        else dwellState.visible.delete(key);
      });
    },
    { root: null, rootMargin: '-70px 0px -45% 0px', threshold: 0 }
  );
  els.forEach((el) => dwellState.io?.observe(el));
  startDwellTimer();
  window.addEventListener('blur', () => {
    dwellState.focused = false;
    sendReadingSync(true);
  });
  window.addEventListener('focus', () => {
    dwellState.focused = true;
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) sendReadingSync(true);
  });
  window.addEventListener('pagehide', () => sendReadingSync(true));
}

// Ленивая подгрузка тафсиров по суре (кэш в памяти на сессию). При ошибке НЕ кэшируем,
// чтобы повторный клик мог попробовать заново.
const saadiCache: Record<string, any[]> = {};
const ikCache: Record<string, any[]> = {};
const loadSaadi = async (s: number): Promise<any[]> => {
  if (!saadiCache[s]) {
    const r = await fetch(`/data/tafsir-saadi/${s}.json?v=${DV}`);
    if (!r.ok) throw new Error('saadi ' + r.status);
    saadiCache[s] = await r.json();
  }
  return saadiCache[s];
};
const loadIbnKathir = async (s: number): Promise<any[]> => {
  if (!ikCache[s]) {
    const r = await fetch(`/data/tafsir-ibnkathir/${s}.json?v=${DV}`);
    if (!r.ok) throw new Error('ibnkathir ' + r.status);
    ikCache[s] = await r.json();
  }
  return ikCache[s];
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
// основной URL аята: есть islamic.network-редакция (ed) → CDN, иначе напрямую EveryAyah (ea).
// Так у ea-only чтецов нет лишнего 404→фолбэк, а предзагрузка совпадает с реальным src.
const ayahSrc = (r: Reciter, s: number, a: number) => (r.ed ? cdnUrl(r, s, a) : eaUrl(r, s, a));
const DEFAULT_RECITER_ID = 'binhumaid';
// цепочка фолбэка для по-суровых чтецов: где нет Ахмада Талиба → Сувейлис → (где нет обоих) Алафаси
const FALLBACK_CHAIN = ['binhumaid', 'souilass', 'alafasy'];
const shortName = (r: Reciter) => r.name.split('·')[0].trim();
// вернуть чтеца, который реально прочитал эту суру (если у выбранного её нет — идём по цепочке)
function pickReciterForSurah(r: Reciter, s: number): Reciter {
  if (r.type !== 'surah' || surahHas(r, s)) return r;
  for (const id of FALLBACK_CHAIN) {
    if (id === r.id) continue;
    const c = reciters.find((x) => x.id === id);
    if (c && (c.type !== 'surah' || surahHas(c, s))) return c;
  }
  return reciters.find((x) => x.id === 'alafasy') || reciters[0];
}

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
  // Быстрый тумблер в хедере: флип светлая↔тёмная от ТЕКУЩЕЙ отрисованной темы
  // (работает и когда выбрана «системная» — берём фактический data-theme).
  $$('[data-theme-toggle]').forEach((b) =>
    b.addEventListener('click', () => {
      const effNow = document.documentElement.getAttribute('data-theme');
      const next = effNow === 'dark' ? 'light' : 'dark';
      LS.set(K.theme, next);
      applyTheme(next);
      markMenu('theme', 'theme-set', next);
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
  hb?: boolean; // скрывать пояснения в скобках (…) и […]
}
// убрать пояснения в скобках из текста перевода
const stripBrackets = (s: string) =>
  s
    .replace(/\s*[([][^)\]]*[)\]]/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim();
function applyBrackets(on: boolean) {
  $$('.translation').forEach((el) => {
    const e = el as HTMLElement;
    // подпись «Перевод · …» отделена <br>: обрабатываем только текстовый хвост
    if (on) {
      if (e.dataset.full == null) e.dataset.full = e.innerHTML;
      const parts = e.dataset.full.split('<br>'); // всегда из оригинала
      const tail = parts.pop()!; // последний сегмент = сам текст перевода
      const head = parts.length ? parts.join('<br>') + '<br>' : '';
      e.innerHTML = head + stripBrackets(tail);
    } else if (e.dataset.full != null) {
      e.innerHTML = e.dataset.full;
      delete e.dataset.full;
    }
  });
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
  // скрытие пояснений в скобках
  const markHb = () =>
    $$('[data-hide-brackets]').forEach((b) => b.classList.toggle('on', !!cfg.hb));
  $$('[data-hide-brackets]').forEach((b) =>
    b.addEventListener('click', () => {
      cfg.hb = !cfg.hb;
      apply();
      applyBrackets(!!cfg.hb);
      markHb();
    })
  );
  markHb();
  if (cfg.hb) applyBrackets(true);
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
// Независимые слои отображения (араб / транслит / перевод — каждый вкл/выкл).
// Дефолт: арабский + перевод (транслит выключен).
interface Layers {
  ar: boolean;
  tl: boolean;
  tr: boolean;
}
let layersState: Layers = { ar: true, tl: false, tr: true };
function applyLayers(l: Layers) {
  // подстраховка: хотя бы один слой должен быть включён
  if (!l.ar && !l.tl && !l.tr) l.ar = true;
  const box = $('[data-ayahs]');
  if (box) {
    box.classList.toggle('hide-ar', !l.ar);
    box.classList.toggle('hide-tl', !l.tl);
    box.classList.toggle('hide-tr', !l.tr);
  }
  $$('[data-layer]').forEach((b) =>
    b.classList.toggle('on', !!(l as any)[b.getAttribute('data-layer')!])
  );
}
function initView() {
  layersState = LS.get<Layers>(K.layers, { ar: true, tl: false, tr: true });
  applyLayers(layersState);
  $$('[data-layer]').forEach((b) =>
    b.addEventListener('click', () => {
      const k = b.getAttribute('data-layer') as keyof Layers;
      layersState[k] = !layersState[k];
      LS.set(K.layers, layersState);
      applyLayers(layersState);
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
let mobileScrollY = 0;
let mobileScrollLocked = false;
function updateMobileScrollLock() {
  const viewportWidth = Math.min(window.innerWidth || 0, document.documentElement.clientWidth || Infinity);
  const shouldLock =
    viewportWidth <= 1023 &&
    (document.body.classList.contains('settings-panel-open') || document.body.classList.contains('drawer-open'));
  if (shouldLock && !mobileScrollLocked) {
    mobileScrollY = window.scrollY || 0;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${mobileScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    mobileScrollLocked = true;
  } else if (!shouldLock && mobileScrollLocked) {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    window.scrollTo(0, mobileScrollY);
    mobileScrollLocked = false;
  }
}
window.addEventListener('resize', updateMobileScrollLock);
window.addEventListener('orientationchange', updateMobileScrollLock);
function initMenus() {
  $$('[data-menu-wrap]').forEach((wrap) => {
    const toggle = $('[data-menu-toggle]', wrap);
    const menu = $('.menu', wrap);
    if (!toggle || !menu) return;
    const isSettings = menu.getAttribute('data-menu') === 'settings';
    const backdrop = isSettings ? $('[data-settings-panel-backdrop]', wrap) : null;
    if (isSettings) {
      document.body.append(menu);
      if (backdrop) document.body.append(backdrop);
    }
    menu.addEventListener('click', (e) => e.stopPropagation());
    toggle.setAttribute('aria-expanded', 'false');
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = menu.classList.contains('open');
      closeMenus();
      if (!open) {
        menu.classList.add('open');
        toggle.setAttribute('aria-expanded', 'true');
        if (isSettings) {
          document.body.classList.add('settings-panel-open');
          updateMobileScrollLock();
        }
      }
    });
  });
  $$('[data-menu-close], [data-settings-panel-backdrop]').forEach((el) =>
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      closeMenus();
    })
  );
  document.addEventListener('click', (e) => {
    if (!(e.target as Element).closest('[data-menu-wrap]')) closeMenus();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenus();
  });
}
function closeMenus() {
  $$('.menu.open').forEach((m) => m.classList.remove('open'));
  $$('[data-menu-toggle][aria-expanded="true"]').forEach((t) => t.setAttribute('aria-expanded', 'false'));
  document.body.classList.remove('settings-panel-open');
  updateMobileScrollLock();
}

/* ==========================================================================
   Drawer (список сур)
   ========================================================================== */
async function initDrawer() {
  const drawer = $('[data-drawer]');
  const backdrop = $('[data-drawer-backdrop]');
  const listEl = $('[data-drawer-list]');
  const desktopMq = window.matchMedia('(min-width: 1120px)');
  const setDesktopSidebar = (open: boolean, persist = true) => {
    document.documentElement.setAttribute('data-sidebar', open ? 'open' : 'closed');
    drawer?.classList.toggle('show', open);
    document.body.classList.remove('drawer-open');
    backdrop?.classList.remove('show');
    if (persist) localStorage.setItem('q_sidebar', open ? 'open' : 'closed');
    updateMobileScrollLock();
  };
  const syncDesktopSidebar = () => {
    if (!desktopMq.matches) return;
    const saved = localStorage.getItem('q_sidebar');
    setDesktopSidebar(saved !== 'closed', false);
  };
  const open = () => {
    closeMenus();
    if (desktopMq.matches) {
      const next = document.documentElement.getAttribute('data-sidebar') === 'closed';
      setDesktopSidebar(next);
      return;
    }
    drawer?.classList.add('show');
    backdrop?.classList.add('show');
    document.body.classList.add('drawer-open');
    updateMobileScrollLock();
  };
  const close = () => {
    if (desktopMq.matches) {
      setDesktopSidebar(false);
      return;
    }
    drawer?.classList.remove('show');
    backdrop?.classList.remove('show');
    document.body.classList.remove('drawer-open');
    updateMobileScrollLock();
  };
  syncDesktopSidebar();
  desktopMq.addEventListener?.('change', syncDesktopSidebar);
  $$('[data-act="drawer"]').forEach((b) => b.addEventListener('click', open));
  $$('[data-act="drawer-close"]').forEach((b) => b.addEventListener('click', close));
  backdrop?.addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('drawer-open')) close();
  });

  // список сур строим на клиенте (чтобы не дублировать в каждой странице)
  const sid = document.body.getAttribute('data-surah');
  const idx = await loadIndex();
  progressIndex = idx;
  // прогресс чтения: только честно засчитанные аяты (dwell >= 3 сек), не факт открытия страницы.
  const prog = LS.get<Dict<boolean>>(K.progress, {});
  renderReadingProgress(idx);
  loadPublicReadSummary();
  if (listEl) {
    listEl.innerHTML = idx
      .map((s) => {
        const name = `${s.nr} ${s.ne} ${s.nm}`.toLowerCase();
        const ar = s.na.replace('سُورَةُ ', '');
        const cls = [String(s.n) === sid ? 'on' : '', surahReadCount(s.n, s.c, prog) >= s.c ? 'read' : '']
          .filter(Boolean)
          .join(' ');
        return `<a href="/surah/${s.n}" data-n="${s.n}" data-name="${name}"${cls ? ` class="${cls}"` : ''}><span class="n">${s.n}</span><span class="nm">${s.nr}<span style="display:block;font-weight:400;font-size:12px;color:var(--ink-faint)">${s.nm} · ${s.c} аятов</span></span><span class="ar-name">${ar}</span></a>`;
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

  // вкладка «Джузы» — навигация по мусхафу (30 джузов)
  const juzEl = $('[data-drawer-juz]');
  if (juzEl && !juzEl.childElementCount) {
    try {
      const jz: any[] = await fetch(`/data/juz.json?v=${DV}`).then((r) => r.json());
      juzEl.innerHTML = jz
        .map(
          (z) =>
            `<a href="/surah/${z.s}#ayah-${z.a}" data-juz="${z.j}"><span class="n">${z.j}</span><span class="nm">Джуз ${z.j}<span style="display:block;font-weight:400;font-size:12px;color:var(--ink-faint)">${z.sr} · ${z.s}:${z.a} · стр. ${z.p}</span></span></a>`
        )
        .join('');
    } catch {}
  }
  const drawerRoot = $('[data-drawer]');
  $$('[data-dtab]').forEach((t) =>
    t.addEventListener('click', () => {
      $$('[data-dtab]').forEach((x) => x.classList.toggle('on', x === t));
      drawerRoot?.setAttribute('data-dtab-active', t.getAttribute('data-dtab') || 'surah');
    })
  );
}

/* ==========================================================================
   Мультивыбор переводов в тексте (Кулиев / Абу Адель) — оба уже в DOM
   ========================================================================== */
function initTransShow() {
  const box = $('[data-ayahs]');
  if (!box) return;
  const cfg = LS.get<Dict<boolean>>(K.transShow, { kuliev: true, abuadel: true });
  const apply = () => {
    box.setAttribute('data-tr-kuliev', cfg.kuliev ? '1' : '0');
    box.setAttribute('data-tr-abuadel', cfg.abuadel ? '1' : '0');
    $$('[data-tr-show]').forEach((b) =>
      b.classList.toggle('on', !!cfg[b.getAttribute('data-tr-show')!])
    );
  };
  apply();
  $$('[data-tr-show]').forEach((b) =>
    b.addEventListener('click', () => {
      const k = b.getAttribute('data-tr-show')!;
      cfg[k] = !cfg[k];
      LS.set(K.transShow, cfg);
      apply();
    })
  );
}

/* ==========================================================================
   Таджвид — цветная подсветка правил чтения (ленивая подгрузка по суре)
   ========================================================================== */
const tajCache: Record<string, any[]> = {};
const LEADING_ARABIC_MARKS = /(<span class="tj tj-[a-z]">)([\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed]+)([^<]*?)<\/span>/g;
function normalizeTajweedHtml(html: string) {
  return html
    .replace(/\u0672/g, '\u0670')
    .replace(LEADING_ARABIC_MARKS, (_, open: string, marks: string, rest: string) =>
      rest ? `${marks}${open}${rest}</span>` : marks
    );
}
const loadTajweed = async (s: number): Promise<any[]> => {
  if (!tajCache[s]) {
    const r = await fetch(`/data/tajweed/${s}.json?v=${DV}`);
    if (!r.ok) throw new Error('tajweed ' + r.status);
    tajCache[s] = await r.json();
  }
  return tajCache[s];
};
async function applyTajweed(enable: boolean) {
  document.body.classList.toggle('tajweed-on', enable);
  const ayahEls = $$('.ayah[data-ayah-key]');
  ayahEls.forEach((el) => {
    const ar = $('.ar', el) as HTMLElement | null;
    if (ar && !ar.dataset.orig) ar.dataset.orig = ar.innerHTML; // сохранить оригинал
  });
  if (!enable) {
    ayahEls.forEach((el) => {
      const ar = $('.ar', el) as HTMLElement | null;
      if (ar && ar.dataset.orig) ar.innerHTML = ar.dataset.orig;
    });
    return;
  }
  const s = Number(document.body.getAttribute('data-surah'));
  if (!s) return;
  try {
    const taj = await loadTajweed(s);
    const map: Dict<string> = {};
    taj.forEach((t: any) => (map[t.a] = normalizeTajweedHtml(t.h)));
    ayahEls.forEach((el) => {
      const a = Number(el.getAttribute('data-ayah-key')!.split(':')[1]);
      const ar = $('.ar', el) as HTMLElement | null;
      if (ar && map[a]) ar.innerHTML = map[a];
    });
  } catch {
    document.body.classList.remove('tajweed-on');
    $$('[data-tajweed]').forEach((b) => b.classList.remove('on'));
    toast('Не удалось загрузить таджвид');
  }
}
function initTajweed() {
  let on = LS.get<boolean>(K.tajweed, true);
  const sync = () => $$('[data-tajweed]').forEach((b) => b.classList.toggle('on', on));
  sync();
  if (on) applyTajweed(true);
  $$('[data-tajweed]').forEach((b) =>
    b.addEventListener('click', () => {
      on = !on;
      LS.set(K.tajweed, on);
      sync();
      applyTajweed(on);
    })
  );
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
    if (s >= 1 && s <= 114) return `/${s}:${Math.max(1, a)}`;
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
    const val = (input?.value || '').trim();
    if (!val) return;
    const dest = await resolveQuick(val);
    // ссылка/сура → переход; произвольный текст → полнотекстовый поиск по Корану
    location.href = dest || '/search?q=' + encodeURIComponent(val);
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
    el.href = `/${s}:${a}`;
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
}
function initContinue() {
  const btn = $<HTMLAnchorElement>('[data-continue]');
  // Явная отметка «продолжить отсюда» приоритетнее авто-последнего места
  const readpos = LS.get<{ s: number; a: number } | null>(K.readpos, null);
  const last = LS.get<{ s: number; a: number } | null>(K.last, null);
  const pos = readpos && readpos.s ? readpos : last;
  if (btn && pos && pos.s) {
    btn.href = `/surah/${pos.s}#ayah-${pos.a}`;
    btn.classList.remove('hide');
    btn.title = `Продолжить: сура ${pos.s}, аят ${pos.a}`;
  }
  rememberLast();
}

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
  // таджвиде textContent склеивает слова. data-orig сохраняется в applyTajweed.
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
  // хоткеи тумблят слои: a — арабский, s — перевод, d — транслит
  const map: Dict<keyof Layers> = { arabic: 'ar', translation: 'tr', translit: 'tl' };
  const k = map[v];
  if (!k) return;
  layersState[k] = !layersState[k];
  LS.set(K.layers, layersState);
  applyLayers(layersState);
  const names: Dict<string> = { ar: 'Арабский', tr: 'Перевод', tl: 'Транслитерация' };
  toast(`${names[k]}: ${layersState[k] ? 'вкл' : 'выкл'}`);
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
  const cards = $$('[data-surah-grid] [data-card]');
  // вся карточка кликабельна → открыть суру (клики по вложенным ссылкам-действиям не перехватываем)
  cards.forEach((c) => {
    c.addEventListener('click', (e) => {
      if ((e.target as Element).closest('a')) return;
      const href = c.getAttribute('data-href');
      if (href) location.href = href;
    });
  });
  const inp = $<HTMLInputElement>('[data-home-filter]');
  if (!inp) return;
  inp.addEventListener('input', () => {
    const q = inp.value.trim().toLowerCase();
    cards.forEach((c) => {
      const hit = !q || (c.getAttribute('data-name') || '').includes(q);
      (c as HTMLElement).style.display = hit ? '' : 'none';
    });
  });
}

/* ==========================================================================
   Заучивание (скрыть перевод + повтор аята N раз)
   ========================================================================== */
function initMemorize() {
  const applyMem = () => {
    $$('[data-memorize]').forEach((b) => b.classList.toggle('on', player.memorize));
    $$('[data-memrep]').forEach((b) =>
      b.classList.toggle('on', +b.getAttribute('data-memrep')! === player.memRep)
    );
    document.body.classList.toggle('memorize-on', player.memorize);
  };
  $$('[data-memorize]').forEach((b) =>
    b.addEventListener('click', () => {
      player.memorize = !player.memorize;
      player.memCount = 0;
      LS.set(K.memorize, player.memorize);
      applyMem();
      toast(player.memorize ? 'Заучивание вкл: перевод скрыт, аят повторяется' : 'Заучивание выкл');
    })
  );
  $$('[data-memrep]').forEach((b) =>
    b.addEventListener('click', () => {
      player.memRep = +b.getAttribute('data-memrep')!;
      player.memCount = 0;
      LS.set(K.memrep, player.memRep);
      applyMem();
    })
  );
  applyMem();
}

/* ==========================================================================
   Старт
   ========================================================================== */
function boot() {
  initHomeFilter();
  initMemorize();
  initTheme();
  initReading();
  initView();
  initTranslation();
  initMenus();
  initDrawer();
  initTransShow();
  initTajweed();
  initQuick();
  initBookmarks();
  initContinue();
  initAyahActions();
  initAyahContextMenu();
  initMushafAyahSheet();
  initReadingAnalytics();
  player.init();
  initHotkeys();
  // тактильный отклик на тапы по интерактивным элементам (веб-вибро)
  document.addEventListener(
    'pointerdown',
    (e) => {
      const t = (e.target as Element | null)?.closest?.(
        'button, a, .switch, .seg button, .item, [role="button"], .dlist a, .tafsir-toggle, .dtabs button'
      );
      if (t) haptic('light');
    },
    { passive: true }
  );
  loadIndex(); // прогреть индекс для плеера/заголовков
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
