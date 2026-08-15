import { $, $$ } from './shared';

export function markMenu(menu: string, attr: string, val: string) {
  $$(`[data-menu="${menu}"] [data-${attr}]`).forEach((b) => {
    const isOn = b.getAttribute(`data-${attr}`) === val;
    b.classList.toggle('on', isOn);
    if (b.getAttribute('role') === 'tab') b.setAttribute('aria-selected', isOn ? 'true' : 'false');
    b.setAttribute('aria-pressed', isOn ? 'true' : 'false');
  });
}

let mobileScrollY = 0;
let mobileScrollLocked = false;

function installMenuSwipeDismiss(menu: HTMLElement) {
  const scrollEl = menu.querySelector<HTMLElement>('.settings-panel-body');
  let pointerId: number | null = null;
  let startX = 0;
  let startY = 0;
  let lastY = 0;
  let startTime = 0;
  let dragging = false;

  menu.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' || window.innerWidth > 1023 || !menu.classList.contains('open')) return;
    if ((scrollEl?.scrollTop || menu.scrollTop) > 0) return;
    pointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    lastY = startY;
    startTime = performance.now();
    dragging = false;
  });

  menu.addEventListener(
    'pointermove',
    (event) => {
      if (pointerId !== event.pointerId) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (!dragging && dy > 10 && dy > Math.abs(dx) * 1.25) {
        dragging = true;
        menu.classList.add('is-dragging');
        try {
          menu.setPointerCapture?.(event.pointerId);
        } catch {
          // Capture can be unavailable for synthetic/mobile pointer streams.
        }
      }
      if (!dragging) return;
      event.preventDefault();
      lastY = event.clientY;
      menu.style.setProperty('--settings-drag-y', `${Math.max(0, dy)}px`);
    },
    { passive: false }
  );

  const finish = (event: PointerEvent) => {
    if (pointerId !== event.pointerId) return;
    const dy = Math.max(0, lastY - startY);
    const elapsed = Math.max(1, performance.now() - startTime);
    const velocity = dy / elapsed;
    pointerId = null;
    if (dragging && (dy > 92 || velocity > 0.5)) closeMenus();
    dragging = false;
    menu.classList.remove('is-dragging');
    menu.style.removeProperty('--settings-drag-y');
  };

  menu.addEventListener('pointerup', finish);
  menu.addEventListener('pointercancel', finish);
}

export function updateMobileScrollLock() {
  const viewportWidth = Math.min(window.innerWidth || 0, document.documentElement.clientWidth || Infinity);
  const shouldLock =
    viewportWidth <= 1023 &&
    (document.body.classList.contains('settings-panel-open') ||
      document.body.classList.contains('drawer-open') ||
      document.body.classList.contains('mushaf-sheet-open') ||
      document.body.classList.contains('image-editor-open'));

  if (shouldLock && !mobileScrollLocked) {
    mobileScrollY = window.scrollY || 0;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${mobileScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    mobileScrollLocked = true;
  } else if (!shouldLock && mobileScrollLocked) {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    window.scrollTo(0, mobileScrollY);
    mobileScrollLocked = false;
  }
}

export function initMenus() {
  $$('[data-menu-wrap]').forEach((wrap) => {
    const toggle = $('[data-menu-toggle]', wrap);
    const menu = $('.menu', wrap);
    if (!toggle || !menu) return;

    const isSettings = menu.getAttribute('data-menu') === 'settings';
    const backdrop = isSettings ? $('[data-settings-panel-backdrop]', wrap) : null;

    if (isSettings) {
      document.body.append(menu);
      if (backdrop) document.body.append(backdrop);
      installMenuSwipeDismiss(menu as HTMLElement);
    }

    menu.addEventListener('click', (e) => e.stopPropagation());
    toggle.setAttribute('aria-expanded', 'false');
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = menu.classList.contains('open');
      closeMenus();
      if (!open) {
        menu.classList.add('open');
        toggle.setAttribute('aria-expanded', 'true');
        if (isSettings) {
          document.body.classList.add('settings-panel-open');
          updateMobileScrollLock();
        }
      }
    });
  });

  $$('[data-menu-close], [data-settings-panel-backdrop]').forEach((el) =>
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      closeMenus();
    })
  );

  document.addEventListener('click', (e) => {
    if (!(e.target as Element).closest('[data-menu-wrap]')) closeMenus();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenus();
  });
}

export function closeMenus() {
  $$('.menu.open').forEach((m) => m.classList.remove('open'));
  $$('[data-menu-toggle][aria-expanded="true"]').forEach((t) => t.setAttribute('aria-expanded', 'false'));
  document.body.classList.remove('settings-panel-open');
  updateMobileScrollLock();
}

window.addEventListener('resize', updateMobileScrollLock);
window.addEventListener('orientationchange', updateMobileScrollLock);
