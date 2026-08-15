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

function installDrawerSwipeDismiss(drawer: HTMLElement | null, close: () => void) {
  if (!drawer) return;
  const scrollEl = drawer.querySelector<HTMLElement>('.dscroll');
  let pointerId: number | null = null;
  let startX = 0;
  let startY = 0;
  let lastY = 0;
  let startTime = 0;
  let dragging = false;

  drawer.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' || window.innerWidth > 820 || !drawer.classList.contains('show')) return;
    if (scrollEl && scrollEl.scrollTop > 0) return;
    pointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    lastY = startY;
    startTime = performance.now();
    dragging = false;
  });

  drawer.addEventListener(
    'pointermove',
    (event) => {
      if (pointerId !== event.pointerId) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (!dragging && dy > 10 && dy > Math.abs(dx) * 1.25) {
        dragging = true;
        drawer.classList.add('is-dragging');
        try {
          drawer.setPointerCapture?.(event.pointerId);
        } catch {
          // Some touch/synthetic events cannot be captured; drag still works without capture.
        }
      }
      if (!dragging) return;
      event.preventDefault();
      lastY = event.clientY;
      drawer.style.setProperty('--drawer-drag-y', `${Math.max(0, dy)}px`);
    },
    { passive: false }
  );

  const finish = (event: PointerEvent) => {
    if (pointerId !== event.pointerId) return;
    const dy = Math.max(0, lastY - startY);
    const elapsed = Math.max(1, performance.now() - startTime);
    const velocity = dy / elapsed;
    pointerId = null;
    if (dragging && (dy > 94 || velocity > 0.5)) close();
    dragging = false;
    drawer.classList.remove('is-dragging');
    drawer.style.removeProperty('--drawer-drag-y');
  };

  drawer.addEventListener('pointerup', finish);
  drawer.addEventListener('pointercancel', finish);
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

function preferredTranslationPath(surah: string | number) {
  let tr = '';
  try {
    tr = localStorage.getItem('q_tr') || '';
    if (tr) tr = JSON.parse(tr);
  } catch {
    tr = '';
  }
  return /^(abuadel|saadi|ibn-kathir)$/.test(tr) ? `/surah/${surah}/${tr}` : `/surah/${surah}`;
}

function enhanceDrawerList(listEl: Element, idx: SurahMeta[], sid: string | null, prog: ReturnType<typeof getProgress>) {
  const existing = Array.from(listEl.querySelectorAll<HTMLAnchorElement>('a[data-n]'));
  if (!existing.length) {
    listEl.replaceChildren(
      ...idx.map((s) =>
        buildDrawerLink({
          href: preferredTranslationPath(s.n),
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
    return;
  }

  const byNumber = new Map(idx.map((s) => [String(s.n), s]));
  existing.forEach((link) => {
    const surah = byNumber.get(link.getAttribute('data-n') || '');
    if (!surah) return;
    link.href = preferredTranslationPath(surah.n);
    link.classList.toggle('on', String(surah.n) === sid);
    link.classList.toggle('read', surahReadCount(surah.n, surah.c, prog) >= surah.c);
    link.setAttribute('data-name', `${surah.nr} ${surah.ne} ${surah.nm}`.toLowerCase());
  });
}

function syncPreferredSurahLinks(listEl: Element | null) {
  listEl?.querySelectorAll<HTMLAnchorElement>('a[data-n]').forEach((link) => {
    const n = link.getAttribute('data-n');
    if (n) link.href = preferredTranslationPath(n);
  });
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
    if (persist) localStorage.setItem('q_sidebar', 'closed');
    updateMobileScrollLock();
  };

  const syncDesktopSidebar = () => {
    if (!desktopMq.matches) return;
    if (localStorage.getItem('q_sidebar') === 'open') localStorage.setItem('q_sidebar', 'closed');
    setDesktopSidebar(false, false);
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
  installDrawerSwipeDismiss(drawer, close);

  listEl?.addEventListener('click', (event) => {
    const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[data-n]');
    if (!link) return;
    const href = preferredTranslationPath(link.getAttribute('data-n') || '');
    if (href) {
      link.setAttribute('href', href);
      event.preventDefault();
      location.href = href;
    }
  }, true);

  syncPreferredSurahLinks(listEl);
  const sid = document.body.getAttribute('data-surah');
  let idx: SurahMeta[] = [];
  try {
    idx = await loadIndex();
  } catch {
    idx = [];
  }
  const prog = getProgress();
  renderReadingProgress(idx);
  if (idx.length) {
    loadPublicReadSummary();
  }

  if (listEl && idx.length && listEl.childElementCount) {
    enhanceDrawerList(listEl, idx, sid, prog);
  } else if (listEl && idx.length) {
    listEl.replaceChildren(
      ...idx.map((s) =>
        buildDrawerLink({
          href: preferredTranslationPath(s.n),
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
      $$('[data-dtab]').forEach((x) => {
        const selected = x === t;
        x.classList.toggle('on', selected);
        x.setAttribute('aria-selected', selected ? 'true' : 'false');
      });
      drawerRoot?.setAttribute('data-dtab-active', t.getAttribute('data-dtab') || 'surah');
    })
  );
}
