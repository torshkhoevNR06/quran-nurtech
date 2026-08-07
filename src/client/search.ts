// Полный поиск по Корану: Кулиев (r), Абу Адель (aa), транслитерация (tl), арабский (ar).
interface Row {
  s: number;
  a: number;
  r: string;
  aa: string;
  tl: string;
  ar: string;
}
interface Meta {
  n: number;
  nr: string;
  c: number;
}
type SrcKey = 'r' | 'aa' | 'tl' | 'ar';

const $ = <T extends Element = HTMLElement>(s: string) => document.querySelector<T>(s);
const SRC_LABEL: Record<SrcKey, string> = { r: 'Кулиев', aa: 'Абу Адель', tl: 'Транслит', ar: 'Арабский' };
const SRC_ORDER: SrcKey[] = ['r', 'aa', 'tl', 'ar'];

// нормализация по типу поля (для сопоставления)
const normRu = (s: string) => s.toLowerCase().replace(/ё/g, 'е');
const normTl = (s: string) => s.toLowerCase();
const normAr = (s: string) =>
  s
    .replace(/[ؐ-ًؚ-ٰٟۖ-ۭ࣓-ࣿ]/g, '') // харакаты/знаки
    .replace(/[آأإٱ]/g, 'ا') // алефы → ا
    .replace(/ى/g, 'ي') // ى → ي
    .replace(/\s+/g, ' ')
    .trim();
const normFor = (k: SrcKey, s: string) => (k === 'ar' ? normAr(s) : k === 'tl' ? normTl(s) : normRu(s));

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

let index: Row[] = [];
let metas: Meta[] = [];
let loaded = false;

const input = $<HTMLInputElement>('[data-search-input]');
const surahSel = $<HTMLSelectElement>('[data-search-surah]');
const sourceSel = $<HTMLSelectElement>('[data-search-source]');
const exactBox = $<HTMLInputElement>('[data-search-exact]');
const status = $('[data-search-status]');
const results = $('[data-search-results]');
const form = $('[data-search-form]');
const empty = $('[data-search-empty]');

function initCustomSelects() {
  const closeAll = (except?: HTMLElement) => {
    document.querySelectorAll<HTMLElement>('[data-custom-select].is-open').forEach((root) => {
      if (root === except) return;
      root.classList.remove('is-open');
      root.querySelector<HTMLButtonElement>('[data-select-trigger]')?.setAttribute('aria-expanded', 'false');
    });
  };

  document.querySelectorAll<HTMLElement>('[data-custom-select]').forEach((root) => {
    const select = root.querySelector<HTMLSelectElement>('[data-native-select]');
    const trigger = root.querySelector<HTMLButtonElement>('[data-select-trigger]');
    const label = root.querySelector<HTMLElement>('[data-select-label]');
    const options = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-select-option]'));
    if (!select || !trigger || !label || !options.length) return;

    const sync = (value = select.value) => {
      const selected = options.find((option) => (option.dataset.value || '') === value) || options[0];
      label.textContent = selected?.querySelector('span')?.textContent || '';
      options.forEach((option) => {
        const isSelected = option === selected;
        option.classList.toggle('is-selected', isSelected);
        option.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      });
    };

    const close = () => {
      root.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
    };

    const open = () => {
      closeAll(root);
      root.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
    };

    trigger.addEventListener('click', (event) => {
      event.stopPropagation();
      root.classList.contains('is-open') ? close() : open();
    });

    options.forEach((option) => {
      option.addEventListener('click', (event) => {
        event.stopPropagation();
        select.value = option.dataset.value || '';
        sync(select.value);
        select.dispatchEvent(new Event('change', { bubbles: true }));
        close();
        trigger.focus();
      });
    });

    root.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        close();
        trigger.focus();
        return;
      }
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp' && event.key !== 'Enter' && event.key !== ' ') return;
      if (!root.classList.contains('is-open')) {
        event.preventDefault();
        open();
        return;
      }
      const currentIndex = Math.max(
        0,
        options.findIndex((option) => option.classList.contains('is-selected')),
      );
      const direction = event.key === 'ArrowUp' ? -1 : 1;
      const next = options[Math.min(options.length - 1, Math.max(0, currentIndex + direction))];
      if ((event.key === 'Enter' || event.key === ' ') && document.activeElement !== trigger) {
        (document.activeElement as HTMLButtonElement | null)?.click();
      } else if (next) {
        event.preventDefault();
        next.focus();
      }
    });

    select.addEventListener('change', () => sync(select.value));
    sync();
  });

  document.addEventListener('click', () => closeAll());
}

async function ensureData() {
  if (loaded) return;
  status && (status.textContent = 'Загрузка индекса…');
  const [idx, mt] = await Promise.all([
    fetch('/data/search-index.json?v=4').then((r) => r.json()),
    fetch('/data/index.json?v=4').then((r) => r.json()),
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

// подсветка (только для полей с посимвольной нормализацией: ru/tl)
function highlight(text: string, q: string, k: SrcKey): string {
  if (k === 'ar') return esc(text); // арабский показываем как есть (нормализация меняет длину)
  const nText = normFor(k, text);
  const nq = normFor(k, q);
  let out = '';
  let i = 0;
  while (i < text.length) {
    const at = nText.indexOf(nq, i);
    if (at < 0) {
      out += esc(text.slice(i));
      break;
    }
    out += esc(text.slice(i, at)) + '<mark class="hit">' + esc(text.slice(at, at + q.length)) + '</mark>';
    i = at + q.length;
  }
  return out;
}

const surahName = (n: number) => metas.find((m) => m.n === n)?.nr || 'Сура ' + n;
const reEsc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function run(q: string) {
  await ensureData();
  q = q.trim();
  if (!q) {
    results && (results.innerHTML = '');
    status && (status.textContent = '');
    empty?.classList.remove('hide');
    return;
  }
  empty?.classList.add('hide');
  const exact = !!exactBox?.checked;
  const surahFilter = surahSel?.value ? +surahSel.value : 0;
  const src = (sourceSel?.value || 'all') as 'all' | SrcKey;
  const active: SrcKey[] = src === 'all' ? SRC_ORDER : [src];

  // предрасчёт нормализованного запроса по типам + regex для точного слова
  const nq: Partial<Record<SrcKey, string>> = {};
  const wordRe: Partial<Record<SrcKey, RegExp>> = {};
  for (const k of active) {
    nq[k] = normFor(k, q);
    if (exact) wordRe[k] = new RegExp(`(^|[^\\p{L}])${reEsc(nq[k]!)}([^\\p{L}]|$)`, 'u');
  }

  const hits: { row: Row; k: SrcKey }[] = [];
  for (const row of index) {
    if (surahFilter && row.s !== surahFilter) continue;
    for (const k of active) {
      const val = (row[k] || '') as string;
      if (!val) continue;
      const nv = normFor(k, val);
      const ok = exact ? wordRe[k]!.test(nv) : nv.includes(nq[k]!);
      if (ok) {
        hits.push({ row, k });
        break; // первый совпавший источник для этого аята
      }
    }
    if (hits.length >= 500) break;
  }

  status &&
    (status.textContent = hits.length
      ? `Найдено: ${hits.length}${hits.length >= 500 ? '+ (первые 500)' : ''}`
      : 'Ничего не найдено. Попробуйте другое слово или источник.');

  if (!results) return;
  results.innerHTML = hits
    .map(({ row, k }) => {
      const text = (row[k] || '') as string;
      const rtl = k === 'ar' ? ' style="direction:rtl;text-align:right;font-family:var(--ar-font),serif"' : '';
      return `
      <a class="search-result" href="/${row.s}:${row.a}">
        <span class="search-result-top">
          <span class="ayah-no">${surahName(row.s)} · ${row.s}:${row.a}</span>
          <span class="chip">${SRC_LABEL[k]}</span>
        </span>
        <span class="translation"${rtl}>${highlight(text, q, k)}</span>
      </a>`;
    })
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
sourceSel?.addEventListener('change', () => run(input?.value || ''));

document.querySelectorAll<HTMLButtonElement>('[data-search-example]').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (!input) return;
    input.value = btn.getAttribute('data-search-example') || '';
    run(input.value);
  });
});

initCustomSelects();

const initial = new URLSearchParams(location.search).get('q');
if (initial && input) {
  input.value = initial;
  run(initial);
}
input?.focus();
