import { $, $$, K, LS, toast, type Dict } from './shared';

const tajCache: Record<string, any[]> = {};
const LEADING_ARABIC_MARKS = /(<span class="tj tj-[a-z]">)([\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed]+)([^<]*?)<\/span>/g;

function normalizeTajweedHtml(html: string) {
  return html
    .replace(/\u0672/g, '\u0670')
    .replace(LEADING_ARABIC_MARKS, (_, open: string, marks: string, rest: string) =>
      rest ? `${marks}${open}${rest}</span>` : marks
    );
}

const loadTajweed = async (s: number, dataVersion: string): Promise<any[]> => {
  if (!tajCache[s]) {
    const r = await fetch(`/data/tajweed/${s}.json?v=${dataVersion}`);
    if (!r.ok) throw new Error('tajweed ' + r.status);
    tajCache[s] = await r.json();
  }
  return tajCache[s];
};

async function applyTajweed(enable: boolean, dataVersion: string) {
  document.body.classList.toggle('tajweed-on', enable);
  const ayahEls = $$('.ayah[data-ayah-key]');
  ayahEls.forEach((el) => {
    const ar = $('.ar', el) as HTMLElement | null;
    if (ar && !ar.dataset.orig) ar.dataset.orig = ar.innerHTML;
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
    const taj = await loadTajweed(s, dataVersion);
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

export function initTajweed(dataVersion: string) {
  let on = LS.get<boolean>(K.tajweed, true);
  const sync = () => $$('[data-tajweed]').forEach((b) => b.classList.toggle('on', on));
  sync();
  if (on) applyTajweed(true, dataVersion);
  $$('[data-tajweed]').forEach((b) =>
    b.addEventListener('click', () => {
      on = !on;
      LS.set(K.tajweed, on);
      sync();
      applyTajweed(on, dataVersion);
    })
  );
}
