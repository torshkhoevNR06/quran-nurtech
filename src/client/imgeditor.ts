// Мощный редактор картинок аятов для Instagram: форматы, фоны-градиенты,
// выбор текстов/шрифтов/цвета, живой предпросмотр на canvas, экспорт/шеринг.

export interface AyahData {
  s: number;
  a: number;
  ar: string;
  tl: string;
  ru: string;
  aa: string;
  surahName: string;
}

type Tone = 'light' | 'dark';
interface Bg {
  id: string;
  name: string;
  tone: Tone; // рекомендуемый цвет текста
  angle: number;
  stops: [number, string][];
}

const BGS: Bg[] = [
  { id: 'emerald', name: 'Изумруд', tone: 'light', angle: 150, stops: [[0, '#062b20'], [1, '#0f9d6b']] },
  { id: 'forest', name: 'Лес', tone: 'light', angle: 160, stops: [[0, '#0a1f14'], [0.6, '#14432e'], [1, '#1f7a54']] },
  { id: 'mint', name: 'Мята', tone: 'dark', angle: 150, stops: [[0, '#eafbf3'], [1, '#bfe9d6']] },
  { id: 'ocean', name: 'Океан', tone: 'light', angle: 145, stops: [[0, '#08313a'], [1, '#1f9db0']] },
  { id: 'night', name: 'Ночь', tone: 'light', angle: 160, stops: [[0, '#0a0f1f'], [0.6, '#141c33'], [1, '#2a3a63']] },
  { id: 'sunset', name: 'Закат', tone: 'light', angle: 150, stops: [[0, '#b23a48'], [0.5, '#e07a5f'], [1, '#f2b56b']] },
  { id: 'gold', name: 'Золото', tone: 'dark', angle: 150, stops: [[0, '#f6e7c1'], [1, '#e0b25a']] },
  { id: 'rose', name: 'Роза', tone: 'dark', angle: 150, stops: [[0, '#fbe4ec'], [1, '#f3b8cd']] },
  { id: 'royal', name: 'Аметист', tone: 'light', angle: 155, stops: [[0, '#241943'], [1, '#6a4bb0']] },
  { id: 'charcoal', name: 'Графит', tone: 'light', angle: 160, stops: [[0, '#101214'], [1, '#2b3138']] },
  { id: 'sand', name: 'Песок', tone: 'dark', angle: 150, stops: [[0, '#f3ecdd'], [1, '#dcc9a3']] },
  { id: 'sky', name: 'Небо', tone: 'dark', angle: 150, stops: [[0, '#e6f2fb'], [1, '#bcd9f0']] },
  { id: 'maroon', name: 'Бордо', tone: 'light', angle: 155, stops: [[0, '#2a0b12'], [1, '#7c1f2e']] },
  { id: 'teal', name: 'Бирюза', tone: 'light', angle: 150, stops: [[0, '#04413f'], [1, '#0fb6a8']] },
];

const FORMATS: Record<string, { w: number; h: number; label: string }> = {
  '1:1': { w: 1080, h: 1080, label: '1:1 пост' },
  '4:5': { w: 1080, h: 1350, label: '4:5 пост' },
  '9:16': { w: 1080, h: 1920, label: '9:16 сторис' },
};

const FONTS: Record<string, string> = {
  Mushaf: 'Мусхаф',
  AmiriQuran: 'Амири',
  NaskhAr: 'Насх',
};

interface State {
  format: keyof typeof FORMATS;
  bg: string;
  arabic: boolean;
  arFont: string;
  translit: boolean;
  tr: 'kuliev' | 'abuadel' | 'both' | 'none';
  label: boolean;
  watermark: boolean;
  ornament: boolean;
  color: 'auto' | 'light' | 'dark';
}

const S: State = {
  format: '4:5',
  bg: 'charcoal',
  arabic: true,
  arFont: 'Mushaf',
  translit: false,
  tr: 'kuliev',
  label: true,
  watermark: true,
  ornament: true,
  color: 'auto',
};

let data: AyahData;
let canvas: HTMLCanvasElement;
let overlay: HTMLElement;

const bgCss = (b: Bg) =>
  `linear-gradient(${b.angle}deg, ${b.stops.map(([o, c]) => `${c} ${o * 100}%`).join(', ')})`;

function gradient(ctx: CanvasRenderingContext2D, b: Bg, W: number, H: number) {
  const rad = (b.angle * Math.PI) / 180;
  const dx = Math.sin(rad),
    dy = -Math.cos(rad);
  const half = (Math.abs(W * dx) + Math.abs(H * dy)) / 2;
  const g = ctx.createLinearGradient(W / 2 - dx * half, H / 2 - dy * half, W / 2 + dx * half, H / 2 + dy * half);
  for (const [o, c] of b.stops) g.addColorStop(o, c);
  return g;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

// нарисовать всё (используется и для предпросмотра, и для экспорта)
function render() {
  const fmt = FORMATS[S.format];
  const W = fmt.w,
    H = fmt.h;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const b = BGS.find((x) => x.id === S.bg) || BGS[0];
  const tone: Tone = S.color === 'auto' ? b.tone : S.color;
  const ink = tone === 'light' ? '#ffffff' : '#14201a';
  const soft = tone === 'light' ? 'rgba(255,255,255,0.82)' : 'rgba(20,32,26,0.72)';
  const acc = tone === 'light' ? 'rgba(255,255,255,0.95)' : 'rgba(15,120,90,0.95)';

  // фон
  ctx.fillStyle = gradient(ctx, b, W, H);
  ctx.fillRect(0, 0, W, H);
  // виньетка
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, tone === 'light' ? 'rgba(0,0,0,0.22)' : 'rgba(255,255,255,0.14)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
  // узор — тонкая геометрическая сетка ромбов
  if (S.ornament) {
    ctx.save();
    ctx.strokeStyle = tone === 'light' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
    ctx.lineWidth = 2;
    const step = W / 9;
    ctx.beginPath();
    for (let x = -H; x < W + H; x += step) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x + H, H);
      ctx.moveTo(x, H);
      ctx.lineTo(x + H, 0);
    }
    ctx.stroke();
    ctx.restore();
  }

  const pad = Math.round(W * 0.11);
  const maxW = W - pad * 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // соберём блоки (тип, строки, размер, межстрочный)
  type Block = { lines: string[]; size: number; lh: number; color: string; font: string; rtl?: boolean; gapTop: number };
  const blocks: Block[] = [];
  const sizeK = W / 1080;

  if (S.arabic && data.ar) {
    let sz = 74 * sizeK;
    let lines: string[] = [];
    for (; sz >= 42 * sizeK; sz -= 4 * sizeK) {
      ctx.font = `${sz}px ${S.arFont}, 'AmiriQuran', serif`;
      lines = wrap(ctx, data.ar, maxW);
      if (lines.length <= (S.format === '9:16' ? 6 : 4)) break;
    }
    blocks.push({ lines, size: sz, lh: sz * 1.85, color: ink, font: `${sz}px ${S.arFont}, 'AmiriQuran', serif`, rtl: true, gapTop: 0 });
  }
  if (S.translit && data.tl) {
    const sz = 30 * sizeK;
    ctx.font = `italic ${sz}px Georgia, serif`;
    blocks.push({ lines: wrap(ctx, data.tl, maxW), size: sz, lh: sz * 1.4, color: soft, font: `italic ${sz}px Georgia, serif`, gapTop: 44 * sizeK });
  }
  const addTr = (txt: string, lbl: string) => {
    if (!txt) return;
    const lsz = 22 * sizeK;
    const sz = 34 * sizeK;
    ctx.font = `700 ${lsz}px system-ui, sans-serif`;
    blocks.push({ lines: [lbl.toUpperCase()], size: lsz, lh: lsz * 1.5, color: acc, font: `700 ${lsz}px system-ui, sans-serif`, gapTop: 46 * sizeK });
    ctx.font = `${sz}px system-ui, sans-serif`;
    blocks.push({ lines: wrap(ctx, txt, maxW), size: sz, lh: sz * 1.42, color: ink, font: `${sz}px system-ui, sans-serif`, gapTop: 10 * sizeK });
  };
  if (S.tr === 'kuliev' || S.tr === 'both') addTr(data.ru, 'Кулиев');
  if (S.tr === 'abuadel' || S.tr === 'both') addTr(data.aa, 'Абу Адель');

  // высота контента
  let contentH = 0;
  blocks.forEach((bl) => (contentH += bl.gapTop + bl.lines.length * bl.lh));

  // область: между подписью сверху и водяным знаком снизу
  const topArea = S.label ? pad + 60 * sizeK : pad;
  const botArea = S.watermark ? H - pad - 40 * sizeK : H - pad;
  let y = topArea + Math.max(0, (botArea - topArea - contentH) / 2);

  // подпись сверху
  if (S.label) {
    ctx.fillStyle = acc;
    ctx.font = `700 ${28 * sizeK}px system-ui, sans-serif`;
    ctx.direction = 'ltr' as CanvasDirection;
    ctx.fillText(`Сура ${data.surahName} · аят ${data.s}:${data.a}`, W / 2, pad + 34 * sizeK);
  }

  // блоки
  let first = true;
  for (const bl of blocks) {
    y += bl.gapTop;
    ctx.font = bl.font;
    ctx.fillStyle = bl.color;
    ctx.direction = (bl.rtl ? 'rtl' : 'ltr') as CanvasDirection;
    // орнамент-разделитель после арабского
    if (!first && bl.rtl === undefined && S.ornament && blocks[0]?.rtl && bl === blocks.find((x) => !x.rtl)) {
      // (разделитель рисуем один раз ниже)
    }
    for (const l of bl.lines) {
      y += bl.size;
      ctx.fillText(l, W / 2, y);
      y += bl.lh - bl.size;
    }
    first = false;
  }

  // водяной знак
  if (S.watermark) {
    ctx.direction = 'ltr' as CanvasDirection;
    ctx.fillStyle = soft;
    ctx.font = `600 ${26 * sizeK}px system-ui, sans-serif`;
    ctx.fillText('quran.nurtech.dev', W / 2, H - pad);
  }
}

function chip(label: string, active: boolean, attr: string) {
  return `<button type="button" class="ie-chip${active ? ' on' : ''}" ${attr}>${label}</button>`;
}

function controlsHtml() {
  return `
  <div class="ie-section"><h5>Формат</h5><div class="ie-row">
    ${Object.entries(FORMATS).map(([k, f]) => chip(f.label, S.format === k, `data-ie-format="${k}"`)).join('')}
  </div></div>
  <div class="ie-section"><h5>Фон</h5><div class="ie-bgs">
    ${BGS.map((b) => `<button type="button" class="ie-bg${S.bg === b.id ? ' on' : ''}" data-ie-bg="${b.id}" title="${b.name}" style="background:${bgCss(b)}"></button>`).join('')}
  </div></div>
  <div class="ie-section"><h5>Тексты</h5><div class="ie-row">
    ${chip('Арабский', S.arabic, 'data-ie-toggle="arabic"')}
    ${chip('Транслит', S.translit, 'data-ie-toggle="translit"')}
    ${chip('Узор', S.ornament, 'data-ie-toggle="ornament"')}
    ${chip('Подпись', S.label, 'data-ie-toggle="label"')}
    ${chip('Вод. знак', S.watermark, 'data-ie-toggle="watermark"')}
  </div></div>
  <div class="ie-section"><h5>Перевод</h5><div class="ie-row">
    ${chip('Кулиев', S.tr === 'kuliev', 'data-ie-tr="kuliev"')}
    ${chip('Абу Адель', S.tr === 'abuadel', 'data-ie-tr="abuadel"')}
    ${chip('Оба', S.tr === 'both', 'data-ie-tr="both"')}
    ${chip('Без', S.tr === 'none', 'data-ie-tr="none"')}
  </div></div>
  <div class="ie-section"><h5>Арабский шрифт</h5><div class="ie-row">
    ${Object.entries(FONTS).map(([k, v]) => chip(v, S.arFont === k, `data-ie-font="${k}"`)).join('')}
  </div></div>
  <div class="ie-section"><h5>Цвет текста</h5><div class="ie-row">
    ${chip('Авто', S.color === 'auto', 'data-ie-color="auto"')}
    ${chip('Светлый', S.color === 'light', 'data-ie-color="light"')}
    ${chip('Тёмный', S.color === 'dark', 'data-ie-color="dark"')}
  </div></div>`;
}

function build() {
  overlay = document.createElement('div');
  overlay.className = 'ie-overlay';
  overlay.innerHTML = `
    <div class="ie-modal" role="dialog" aria-label="Редактор картинки аята">
      <button class="ie-close" data-ie-close aria-label="Закрыть">✕</button>
      <div class="ie-preview"><canvas data-ie-canvas></canvas></div>
      <div class="ie-panel">
        <div class="ie-controls" data-ie-controls>${controlsHtml()}</div>
        <div class="ie-foot" data-ie-foot></div>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  canvas = overlay.querySelector('[data-ie-canvas]') as HTMLCanvasElement;

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || (e.target as Element).closest('[data-ie-close]')) close();
  });
  overlay.querySelector('[data-ie-controls]')!.addEventListener('click', (e) => {
    const el = (e.target as Element).closest('button');
    if (!el) return;
    const g = (n: string) => el.getAttribute(n);
    if (g('data-ie-format')) S.format = g('data-ie-format') as keyof typeof FORMATS;
    else if (g('data-ie-bg')) S.bg = g('data-ie-bg')!;
    else if (g('data-ie-tr')) S.tr = g('data-ie-tr') as State['tr'];
    else if (g('data-ie-font')) S.arFont = g('data-ie-font')!;
    else if (g('data-ie-color')) S.color = g('data-ie-color') as State['color'];
    else if (g('data-ie-toggle')) (S as any)[g('data-ie-toggle')!] = !(S as any)[g('data-ie-toggle')!];
    else return;
    refresh();
  });
  renderFoot();
  overlay.querySelector('[data-ie-foot]')!.addEventListener('click', (e) => {
    const b = (e.target as Element).closest('button');
    if (!b) return;
    if (b.hasAttribute('data-ie-share')) shareImg();
    else if (b.hasAttribute('data-ie-copy')) copyImg();
    else if (b.hasAttribute('data-ie-download')) downloadImg();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('show')) close();
  });
}

function refresh() {
  overlay.querySelector('[data-ie-controls]')!.innerHTML = controlsHtml();
  render();
}

const isTouch = () => matchMedia('(pointer: coarse)').matches;
const canCopyImg = () =>
  !!(navigator.clipboard && (navigator.clipboard as any).write && 'ClipboardItem' in window);
function canShareFiles() {
  try {
    const f = new File([new Blob([''], { type: 'image/png' })], 'q.png', { type: 'image/png' });
    return !!(navigator.canShare && navigator.canShare({ files: [f] }));
  } catch {
    return false;
  }
}

// набор кнопок зависит от платформы: на мобиле системный «Поделиться» прикрепляет
// картинку; на десктопе он часто отдаёт в Telegram/Instagram только текст, теряя файл,
// поэтому там надёжнее «Копировать» в буфер (⌘/Ctrl+V) или «Скачать».
function renderFoot() {
  const foot = overlay.querySelector('[data-ie-foot]') as HTMLElement;
  let buttons: string;
  let hint = '';
  if (isTouch() && canShareFiles()) {
    buttons =
      `<button class="btn primary" data-ie-share>Поделиться</button>` +
      `<button class="btn" data-ie-download>Скачать</button>`;
  } else if (canCopyImg()) {
    buttons =
      `<button class="btn primary" data-ie-copy>Копировать</button>` +
      `<button class="btn" data-ie-download>Скачать</button>`;
    hint = `<div class="ie-hint">Вставьте картинку в Telegram или Instagram: <b>⌘/Ctrl + V</b></div>`;
  } else {
    buttons = `<button class="btn primary" data-ie-download>Скачать картинку</button>`;
  }
  foot.innerHTML = `<div class="ie-actions">${buttons}</div>${hint}`;
}

const fileName = () => `quran-${data.s}-${data.a}.png`;
const toBlob = (): Promise<Blob> =>
  new Promise((res) => canvas.toBlob((b) => res(b!), 'image/png', 0.95));

function download(blob: Blob) {
  const u = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = u;
  link.download = fileName();
  link.click();
  setTimeout(() => URL.revokeObjectURL(u), 1500);
}

async function downloadImg() {
  render();
  download(await toBlob());
  toastIE('Картинка сохранена');
}

async function shareImg() {
  render();
  const blob = await toBlob();
  const file = new File([blob], fileName(), { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      // без title/text — иначе часть таргетов (Telegram на десктопе) шлёт только текст
      await navigator.share({ files: [file] });
      return;
    } catch (e: any) {
      if (e && e.name === 'AbortError') return;
    }
  }
  download(blob);
}

async function copyFallback() {
  render();
  download(await toBlob());
  toastIE('Скопировать не вышло — картинка скачана');
}

function copyImg() {
  // ClipboardItem принимает Promise<Blob>, а clipboard.write вызывается синхронно в
  // пользовательском жесте — так копирование картинки работает несмотря на async-рендер.
  render();
  try {
    const item = new ClipboardItem({ 'image/png': toBlob() });
    navigator.clipboard.write([item]).then(
      () => toastIE('Картинка скопирована — вставьте в Telegram (⌘/Ctrl + V)'),
      () => copyFallback()
    );
  } catch {
    copyFallback();
  }
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;
function toastIE(msg: string) {
  let t = overlay.querySelector('.ie-toast') as HTMLElement | null;
  if (!t) {
    t = document.createElement('div');
    t.className = 'ie-toast';
    overlay.querySelector('.ie-modal')!.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t!.classList.remove('show'), 2800);
}

function close() {
  overlay.classList.remove('show');
  document.body.style.overflow = '';
}

export async function openAyahEditor(d: AyahData) {
  data = d;
  // разумные умолчания источников: если нет aa, ставим kuliev
  if (S.tr !== 'none' && !d.aa && (S.tr === 'abuadel' || S.tr === 'both')) S.tr = 'kuliev';
  if (!overlay) build();
  overlay.classList.add('show');
  document.body.style.overflow = 'hidden';
  refresh();
  try {
    if (document.fonts && (document.fonts as any).ready) {
      await (document.fonts as any).ready;
      render(); // перерисовать после загрузки шрифтов
    }
  } catch {}
}
