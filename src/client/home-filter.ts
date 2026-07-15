import { $, $$ } from './shared';

export function initHomeFilter() {
  const cards = $$('[data-surah-grid] [data-card]');
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
