import { $, $$, K, LS, toast } from './shared';

const bmKey = (s: number, a: number) => `${s}:${a}`;

function getBookmarks(): string[] {
  return LS.get<string[]>(K.bookmarks, []);
}

export function isBookmarked(s: number, a: number) {
  return getBookmarks().includes(bmKey(s, a));
}

export function toggleBookmark(s: number, a: number): boolean {
  const list = getBookmarks();
  const k = bmKey(s, a);
  const i = list.indexOf(k);
  if (i >= 0) list.splice(i, 1);
  else list.unshift(k);
  LS.set(K.bookmarks, list);
  renderBookmarks();
  syncBookmarkButtons();
  window.dispatchEvent(new CustomEvent('quran:bookmark-state', { detail: { key: k, on: i < 0 } }));
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

export function initBookmarks() {
  renderBookmarks();
  syncBookmarkButtons();
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

function rememberLast() {
  const sid = document.body.getAttribute('data-surah');
  if (!sid) return;
  const aid = document.body.getAttribute('data-ayah') || '1';
  LS.set(K.last, { s: +sid, a: +aid });
}

export function initContinue() {
  const btn = $<HTMLAnchorElement>('[data-continue]');
  const mushaf = LS.get<{ page: number; ayah?: string | null } | null>(K.mushafLast, null);
  const readpos = LS.get<{ s: number; a: number } | null>(K.readpos, null);
  const last = LS.get<{ s: number; a: number } | null>(K.last, null);
  const pos = readpos && readpos.s ? readpos : last;
  if (btn && mushaf?.page) {
    btn.href = `/mushaf/${mushaf.page}${mushaf.ayah ? `?ayah=${encodeURIComponent(mushaf.ayah)}` : ''}`;
    btn.classList.remove('hide');
    btn.title = `Продолжить: страница ${mushaf.page}`;
    rememberLast();
    return;
  }
  if (btn && pos && pos.s) {
    const ayah = pos.a || 1;
    btn.href = `/surah/${pos.s}#ayah-${ayah}`;
    btn.classList.remove('hide');
    btn.title = `Продолжить: сура ${pos.s}, аят ${ayah}`;
  }
  rememberLast();
}
