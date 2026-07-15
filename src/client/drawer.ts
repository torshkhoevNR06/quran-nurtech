import {
  getProgress,
  loadPublicReadSummary,
  renderReadingProgress,
  surahReadCount,
} from './reading-analytics';
import { $, $$ } from './shared';
import { closeMenus, updateMobileScrollLock } from './ui-menus';

interface SurahMeta {
  n: number;
  na: string;
  ne: string;
  nr: string;
  nm: string;
  c: number;
}

interface DrawerOptions {
  dataVersion: string;
  loadIndex: () => Promise<SurahMeta[]>;
}

function drawerLine(text: string) {
  const el = document.createElement('span');
  el.className = 'drawer-row-sub';
  el.textContent = text;
  return el;
}

function buildDrawerLink({
  href,
  number,
  title,
  subtitle,
  arabic,
  active,
  read,
  attrs,
}: {
  href: string;
  number: string | number;
  title: string;
  subtitle: string;
  arabic?: string;
  active?: boolean;
  read?: boolean;
  attrs?: Record<string, string | number>;
}) {
  const link = document.createElement('a');
  link.href = href;
  if (active) link.classList.add('on');
  if (read) link.classList.add('read');
  for (const [key, value] of Object.entries(attrs || {})) link.setAttribute(key, String(value));

  const n = document.createElement('span');
  n.className = 'n';
  n.textContent = String(number);

  const name = document.createElement('span');
  name.className = 'nm';
  name.textContent = title;
  name.appendChild(drawerLine(subtitle));

  link.append(n, name);
  if (arabic) {
    const ar = document.createElement('span');
    ar.className = 'ar-name';
    ar.textContent = arabic;
    link.appendChild(ar);
  }
  return link;
}

export async function initDrawer({ dataVersion, loadIndex }: DrawerOptions) {
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

  const sid = document.body.getAttribute('data-surah');
  const idx = await loadIndex();
  const prog = getProgress();
  renderReadingProgress(idx);
  loadPublicReadSummary();

  if (listEl) {
    listEl.replaceChildren(
      ...idx.map((s) =>
        buildDrawerLink({
          href: `/surah/${s.n}`,
          number: s.n,
          title: s.nr,
          subtitle: `${s.nm} · ${s.c} аятов`,
          arabic: s.na.replace('سُورَةُ ', ''),
          active: String(s.n) === sid,
          read: surahReadCount(s.n, s.c, prog) >= s.c,
          attrs: {
            'data-n': s.n,
            'data-name': `${s.nr} ${s.ne} ${s.nm}`.toLowerCase(),
          },
        })
      )
    );
  }

  const filter = $<HTMLInputElement>('[data-drawer-filter]');
  filter?.addEventListener('input', () => {
    const q = filter.value.trim().toLowerCase();
    $$('[data-drawer-list] a').forEach((a) => {
      const hit = !q || (a.getAttribute('data-name') || '').includes(q) || a.getAttribute('data-n') === q;
      (a as HTMLElement).style.display = hit ? '' : 'none';
    });
  });

  const juzEl = $('[data-drawer-juz]');
  if (juzEl && !juzEl.childElementCount) {
    try {
      const jz: any[] = await fetch(`/data/juz.json?v=${dataVersion}`).then((r) => r.json());
      juzEl.replaceChildren(
        ...jz.map((z) =>
          buildDrawerLink({
            href: `/surah/${z.s}#ayah-${z.a}`,
            number: z.j,
            title: `Джуз ${z.j}`,
            subtitle: `${z.sr} · ${z.s}:${z.a} · стр. ${z.p}`,
            attrs: { 'data-juz': z.j },
          })
        )
      );
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
