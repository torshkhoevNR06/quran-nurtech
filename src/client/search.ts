// Клиентский поиск по русскому переводу (Кулиев). Индекс: /data/search-index.json.
interface Row {
  s: number;
  a: number;
  r: string;
}
interface Meta {
  n: number;
  nr: string;
  c: number;
}

const $ = <T extends Element = HTMLElement>(s: string) => document.querySelector<T>(s);
const norm = (s: string) => s.toLowerCase().replace(/ё/g, 'е');
const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

let index: Row[] = [];
let metas: Meta[] = [];
let loaded = false;

const input = $<HTMLInputElement>('[data-search-input]');
const surahSel = $<HTMLSelectElement>('[data-search-surah]');
const exactBox = $<HTMLInputElement>('[data-search-exact]');
const status = $('[data-search-status]');
const results = $('[data-search-results]');
const form = $('[data-search-form]');

async function ensureData() {
  if (loaded) return;
  status && (status.textContent = 'Загрузка индекса…');
  const [idx, mt] = await Promise.all([
    fetch('/data/search-index.json?v=3').then((r) => r.json()),
    fetch('/data/index.json?v=3').then((r) => r.json()),
  ]);
  index = idx;
  metas = mt;
  loaded = true;
  if (surahSel && surahSel.options.length <= 1) {
    for (const m of metas) {
      const o = document.createElement('option');
      o.value = String(m.n);
      o.textContent = `${m.n}. ${m.nr}`;
      surahSel.appendChild(o);
    }
  }
  status && (status.textContent = '');
}

function highlight(text: string, q: string): string {
  const nText = norm(text);
  const nq = norm(q);
  let out = '';
  let i = 0;
  while (i < text.length) {
    const at = nText.indexOf(nq, i);
    if (at < 0) {
      out += esc(text.slice(i));
      break;
    }
    out += esc(text.slice(i, at));
    out += '<mark class="hit">' + esc(text.slice(at, at + q.length)) + '</mark>';
    i = at + q.length;
  }
  return out;
}

const surahName = (n: number) => metas.find((m) => m.n === n)?.nr || 'Сура ' + n;

async function run(q: string) {
  await ensureData();
  q = q.trim();
  if (!q) {
    results && (results.innerHTML = '');
    status && (status.textContent = '');
    return;
  }
  const nq = norm(q);
  const exact = !!exactBox?.checked;
  const surahFilter = surahSel?.value ? +surahSel.value : 0;
  const wordRe = exact ? new RegExp(`(^|[^\\p{L}])${nq.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\p{L}]|$)`, 'u') : null;

  const hits: Row[] = [];
  for (const row of index) {
    if (surahFilter && row.s !== surahFilter) continue;
    const nr = norm(row.r);
    const ok = exact ? wordRe!.test(nr) : nr.includes(nq);
    if (ok) hits.push(row);
    if (hits.length >= 500) break;
  }

  status &&
    (status.textContent = hits.length
      ? `Найдено: ${hits.length}${hits.length >= 500 ? '+ (показаны первые 500)' : ''}`
      : 'Ничего не найдено. Попробуйте другое слово.');

  if (!results) return;
  results.innerHTML = hits
    .map(
      (h) => `
      <a class="ayah" href="/ayah/${h.s}/${h.a}" style="display:block;text-decoration:none">
        <span class="ayah-no">${surahName(h.s)} · ${h.s}:${h.a}</span>
        <div class="translation" style="margin-top:8px">${highlight(h.r, q)}</div>
      </a>`
    )
    .join('');
}

let t: number | undefined;
input?.addEventListener('input', () => {
  clearTimeout(t);
  t = window.setTimeout(() => run(input.value), 220);
});
form?.addEventListener('submit', (e) => {
  e.preventDefault();
  run(input?.value || '');
});
exactBox?.addEventListener('change', () => run(input?.value || ''));
surahSel?.addEventListener('change', () => run(input?.value || ''));

// поддержка ?q= в URL
const initial = new URLSearchParams(location.search).get('q');
if (initial && input) {
  input.value = initial;
  run(initial);
}
input?.focus();
