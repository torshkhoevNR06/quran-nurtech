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
    listEl.innerHTML = idx
      .map((s) => {
        const name = `${s.nr} ${s.ne} ${s.nm}`.toLowerCase();
        const ar = s.na.replace('سُورَةُ ', '');
        const cls = [String(s.n) === sid ? 'on' : '', surahReadCount(s.n, s.c, prog) >= s.c ? 'read' : '']
          .filter(Boolean)
          .join(' ');
        return `<a href="/surah/${s.n}" data-n="${s.n}" data-name="${name}"${cls ? ` class="${cls}"` : ''}><span class="n">${s.n}</span><span class="nm">${s.nr}<span style="display:block;font-weight:400;font-size:12px;color:var(--ink-faint)">${s.nm} · ${s.c} аятов</span></span><span class="ar-name">${ar}</span></a>`;
      })
      .join('');
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
      juzEl.innerHTML = jz
        .map(
          (z) =>
            `<a href="/surah/${z.s}#ayah-${z.a}" data-juz="${z.j}"><span class="n">${z.j}</span><span class="nm">Джуз ${z.j}<span style="display:block;font-weight:400;font-size:12px;color:var(--ink-faint)">${z.sr} · ${z.s}:${z.a} · стр. ${z.p}</span></span></a>`
        )
        .join('');
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
