import { $, $$ } from './shared';

export function markMenu(menu: string, attr: string, val: string) {
  $$(`[data-menu="${menu}"] [data-${attr}]`).forEach((b) =>
    b.classList.toggle('on', b.getAttribute(`data-${attr}`) === val)
  );
}

let mobileScrollY = 0;
let mobileScrollLocked = false;

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
