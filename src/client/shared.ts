export type Dict<T> = Record<string, T>;

export const LS = {
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

export const K = {
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

export const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) =>
  r.querySelector<T>(s);

export const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) =>
  Array.from(r.querySelectorAll<T>(s));

type Haptic = 'light' | 'medium' | 'success' | 'error';
const HAPTIC: Record<Haptic, number | number[]> = {
  light: 8,
  medium: 16,
  success: [12, 30, 14],
  error: [28, 45, 28],
};

export function haptic(kind: Haptic = 'light') {
  try {
    (navigator as any).vibrate?.(HAPTIC[kind]);
  } catch {}
}

let toastT: number | undefined;
export function toast(msg: string) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  haptic('light');
  clearTimeout(toastT);
  toastT = window.setTimeout(() => el.classList.remove('show'), 1800);
}
