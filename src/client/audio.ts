// Самодостаточный аудио-плеер страницы /audio: чтец + сура + аяты, повтор, скорость, скачивание.
interface Reciter {
  id: string;
  name: string;
  folder: string;
}
interface Meta {
  n: number;
  nr: string;
  c: number;
}
const $ = <T extends Element = HTMLElement>(s: string) => document.querySelector<T>(s);
const pad3 = (x: number) => String(x).padStart(3, '0');
const url = (folder: string, s: number, a: number) =>
  `https://everyayah.com/data/${folder}/${pad3(s)}${pad3(a)}.mp3`;

const ICON_PLAY = '<svg viewBox="0 0 24 24" stroke="currentColor"><path d="M6 4.5v15l13-7.5z" fill="currentColor" stroke="none"/></svg>';
const ICON_PAUSE = '<svg viewBox="0 0 24 24"><rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor"/></svg>';

const reciterSel = $<HTMLSelectElement>('[data-audio-reciter]');
const surahSel = $<HTMLSelectElement>('[data-audio-surah]');
const rowsBox = $('[data-a-rows]');
const audio = $<HTMLAudioElement>('[data-a-audio]');
const titleEl = $('[data-a-title]');
const subEl = $('[data-a-sub]');
const toggleBtn = $('[data-a-toggle]');

let reciters: Reciter[] = [];
let metas: Meta[] = [];
let cur = { s: 1, c: 7 };
let idx = -1;
let repeatOne = false;
let speed = 1;

const params = new URLSearchParams(location.search);
const savedReciter = (() => {
  try {
    return JSON.parse(localStorage.getItem('q_reciter') || '""');
  } catch {
    return '';
  }
})();

const folder = () => (reciters.find((r) => r.id === reciterSel!.value) || reciters[0]).folder;
const reciterName = () => (reciters.find((r) => r.id === reciterSel!.value) || reciters[0]).name;

async function init() {
  [reciters, metas] = await Promise.all([
    fetch('/data/reciters.json').then((r) => r.json()),
    fetch('/data/index.json').then((r) => r.json()),
  ]);
  if (reciterSel) {
    reciterSel.innerHTML = reciters.map((r) => `<option value="${r.id}">${r.name}</option>`).join('');
    if (savedReciter && reciters.some((r) => r.id === savedReciter)) reciterSel.value = savedReciter;
    else if (params.get('reciter')) reciterSel.value = params.get('reciter')!;
  }
  if (surahSel) {
    surahSel.innerHTML = metas.map((m) => `<option value="${m.n}">${m.n}. ${m.nr} (${m.c})</option>`).join('');
    const qs = +(params.get('s') || 1);
    surahSel.value = String(qs >= 1 && qs <= 114 ? qs : 1);
  }
  renderSurah();

  reciterSel?.addEventListener('change', () => {
    try {
      localStorage.setItem('q_reciter', JSON.stringify(reciterSel!.value));
    } catch {}
    renderSurah();
  });
  surahSel?.addEventListener('change', renderSurah);
  toggleBtn?.addEventListener('click', toggle);
  $('[data-a-next]')?.addEventListener('click', () => play(idx + 1));
  $('[data-a-prev]')?.addEventListener('click', () => play(idx - 1));
  $('[data-a-repeat]')?.addEventListener('click', (e) => {
    repeatOne = !repeatOne;
    (e.currentTarget as Element).classList.toggle('on', repeatOne);
  });
  $('[data-a-speed]')?.addEventListener('click', cycleSpeed);
  audio?.addEventListener('ended', onEnded);
  audio?.addEventListener('play', () => setIcon(true));
  audio?.addEventListener('pause', () => setIcon(false));
  audio?.addEventListener('error', () => idx >= 0 && (subEl && (subEl.textContent = 'Аудио недоступно')));
}

function renderSurah() {
  const m = metas.find((x) => x.n === +surahSel!.value)!;
  cur = { s: m.n, c: m.c };
  idx = -1;
  const f = folder();
  let html = '';
  for (let a = 1; a <= m.c; a++) {
    html += `<div class="ayah" data-row="${a}" style="display:flex;align-items:center;gap:10px;padding:10px 4px">
      <button class="icon-btn" data-play="${a}" aria-label="Слушать аят ${a}">${ICON_PLAY}</button>
      <span style="flex:1"><b>${m.nr}</b> · аят ${m.n}:${a}</span>
      <a class="icon-btn" href="${url(f, m.n, a)}" download aria-label="Скачать аят ${a}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 3v12M7 10l5 5 5-5M4 20h16"/></svg></a>
    </div>`;
  }
  rowsBox!.innerHTML = html;
  rowsBox!.querySelectorAll('[data-play]').forEach((b) =>
    b.addEventListener('click', () => play(+b.getAttribute('data-play')! - 1))
  );
}

function play(i: number) {
  if (i < 0 || i >= cur.c || !audio) return;
  idx = i;
  audio.src = url(folder(), cur.s, i + 1);
  audio.playbackRate = speed;
  audio.play().catch(() => {});
  const m = metas.find((x) => x.n === cur.s)!;
  titleEl && (titleEl.textContent = `${m.nr} · аят ${cur.s}:${i + 1}`);
  subEl && (subEl.textContent = reciterName());
  rowsBox?.querySelectorAll('.ayah.active').forEach((e) => e.classList.remove('active'));
  const row = rowsBox?.querySelector(`[data-row="${i + 1}"]`);
  row?.classList.add('active');
  row?.scrollIntoView({ block: 'center', behavior: 'smooth' });
}
function toggle() {
  if (!audio) return;
  if (idx < 0) return play(0);
  audio.paused ? audio.play().catch(() => {}) : audio.pause();
}
function onEnded() {
  if (repeatOne) return play(idx);
  if (idx < cur.c - 1) play(idx + 1);
  else setIcon(false);
}
function cycleSpeed() {
  const opts = [0.75, 1, 1.25, 1.5];
  speed = opts[(opts.indexOf(speed) + 1) % opts.length];
  if (audio) audio.playbackRate = speed;
  const l = $('[data-a-speed-label]');
  if (l) l.textContent = speed + '×';
}
function setIcon(playing: boolean) {
  if (toggleBtn) toggleBtn.innerHTML = playing ? ICON_PAUSE : ICON_PLAY;
}

init();
