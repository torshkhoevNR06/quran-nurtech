// @ts-nocheck
// App-wide custom select enhancer. Native selects stay as the data source, so
// existing change handlers keep working while the visible control matches the UI.

const ENHANCED = 'data-ui-select-enhanced';
const SKIP = '[data-native-select], .native-select-hidden';

function optionLabel(option: HTMLOptionElement) {
  return (option.textContent || '').trim();
}

function optionSub(option: HTMLOptionElement) {
  return option.getAttribute('data-sub') || '';
}

function closeAll(except?: HTMLElement) {
  document.querySelectorAll<HTMLElement>('.ui-select.is-open').forEach((root) => {
    if (root === except) return;
    closeSelect(root);
  });
}

function closeSelect(root: HTMLElement) {
  const trigger = root.querySelector<HTMLButtonElement>('[data-ui-select-trigger]');
  const menu = document.getElementById(root.getAttribute('data-ui-select-menu-id') || '');
  root.classList.remove('is-open');
  trigger?.setAttribute('aria-expanded', 'false');
  if (menu) {
    menu.hidden = true;
    menu.classList.remove('is-open');
  }
}

function positionMenu(root: HTMLElement) {
  const trigger = root.querySelector<HTMLButtonElement>('[data-ui-select-trigger]');
  const menu = document.getElementById(root.getAttribute('data-ui-select-menu-id') || '');
  if (!trigger || !menu || menu.hidden) return;

  const rect = trigger.getBoundingClientRect();
  const margin = 8;
  const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  const desiredWidth = Math.max(rect.width, Number(root.dataset.uiSelectMinWidth || 220));
  const width = Math.min(desiredWidth, vw - margin * 2);
  const left = Math.min(Math.max(margin, rect.left), vw - width - margin);
  const below = vh - rect.bottom - margin;
  const above = rect.top - margin;
  const openUp = below < 220 && above > below;
  const maxHeight = Math.max(160, Math.min(openUp ? above - margin : below - margin, 360));

  menu.style.width = width + 'px';
  menu.style.maxHeight = maxHeight + 'px';
  menu.style.left = left + 'px';
  if (openUp) {
    menu.style.top = '';
    menu.style.bottom = Math.max(margin, vh - rect.top + 6) + 'px';
  } else {
    menu.style.bottom = '';
    menu.style.top = Math.min(vh - margin, rect.bottom + 6) + 'px';
  }
}

function selectedOption(select: HTMLSelectElement) {
  return select.selectedOptions[0] || Array.from(select.options).find((o) => o.value === select.value) || select.options[0];
}

function syncSelect(root: HTMLElement) {
  const select = root.querySelector<HTMLSelectElement>('select');
  const label = root.querySelector<HTMLElement>('[data-ui-select-label]');
  const menu = document.getElementById(root.getAttribute('data-ui-select-menu-id') || '');
  if (!select || !label || !menu) return;

  const selected = selectedOption(select);
  label.textContent = selected ? optionLabel(selected) : '';
  menu.querySelectorAll<HTMLButtonElement>('[data-ui-select-option]').forEach((button) => {
    const isSelected = button.dataset.value === select.value;
    button.classList.toggle('is-selected', isSelected);
    button.setAttribute('aria-selected', isSelected ? 'true' : 'false');
  });
}

function rebuildOptions(root: HTMLElement) {
  const select = root.querySelector<HTMLSelectElement>('select');
  const menu = document.getElementById(root.getAttribute('data-ui-select-menu-id') || '');
  if (!select || !menu) return;

  const frag = document.createDocumentFragment();
  Array.from(select.options).forEach((option, index) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.role = 'option';
    item.className = 'ui-select-option';
    item.dataset.uiSelectOption = '';
    item.dataset.value = option.value;
    item.disabled = option.disabled;
    item.tabIndex = -1;

    const text = document.createElement('span');
    text.textContent = optionLabel(option);
    item.appendChild(text);

    const sub = optionSub(option);
    if (sub) {
      const small = document.createElement('small');
      small.textContent = sub;
      item.appendChild(small);
    }

    item.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (option.disabled) return;
      select.selectedIndex = index;
      select.dispatchEvent(new Event('input', { bubbles: true }));
      select.dispatchEvent(new Event('change', { bubbles: true }));
      syncSelect(root);
      closeSelect(root);
      root.querySelector<HTMLButtonElement>('[data-ui-select-trigger]')?.focus();
    });

    frag.appendChild(item);
  });

  menu.replaceChildren(frag);
  syncSelect(root);
}

function openSelect(root: HTMLElement) {
  const trigger = root.querySelector<HTMLButtonElement>('[data-ui-select-trigger]');
  const menu = document.getElementById(root.getAttribute('data-ui-select-menu-id') || '');
  if (!trigger || !menu) return;
  closeAll(root);
  trigger.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  root.classList.add('is-open');
  trigger.setAttribute('aria-expanded', 'true');
  menu.hidden = false;
  menu.classList.add('is-open');
  requestAnimationFrame(function () {
    positionMenu(root);
    const selected = menu.querySelector<HTMLButtonElement>('.is-selected:not(:disabled)');
    (selected || menu.querySelector<HTMLButtonElement>('[data-ui-select-option]:not(:disabled)'))?.focus({ preventScroll: true });
  });
}

function enhanceSelect(select: HTMLSelectElement) {
  if (select.hasAttribute(ENHANCED) || select.closest('[data-custom-select]') || select.matches(SKIP)) return;
  select.setAttribute(ENHANCED, '1');

  const root = document.createElement('span');
  root.className = 'ui-select';
  if (select.classList.contains('mushaf-nav-sel')) root.classList.add('ui-select-mushaf');
  if (select.classList.contains('inline-control-lg')) root.classList.add('ui-select-lg');
  const id = 'ui-select-menu-' + Math.random().toString(36).slice(2);
  root.dataset.uiSelectMenuId = id;
  if (select.options.length > 18) root.dataset.uiSelectMinWidth = select.classList.contains('mushaf-nav-sel') ? '240' : '280';

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'ui-select-trigger';
  trigger.dataset.uiSelectTrigger = '';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-label', select.getAttribute('aria-label') || 'Выбрать');

  const label = document.createElement('span');
  label.className = 'ui-select-label';
  label.dataset.uiSelectLabel = '';
  const chevron = document.createElement('span');
  chevron.className = 'ui-select-chevron';
  chevron.setAttribute('aria-hidden', 'true');
  trigger.append(label, chevron);

  const menu = document.createElement('div');
  menu.id = id;
  menu.className = 'ui-select-menu';
  menu.role = 'listbox';
  menu.hidden = true;
  menu.addEventListener('click', (event) => event.stopPropagation());
  menu.addEventListener('keydown', (event) => {
    const options = Array.from(menu.querySelectorAll<HTMLButtonElement>('[data-ui-select-option]:not(:disabled)'));
    if (event.key === 'Escape') {
      event.preventDefault();
      closeSelect(root);
      trigger.focus();
      return;
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Enter' || event.key === ' ') {
      (document.activeElement as HTMLButtonElement | null)?.click();
      return;
    }
    const current = Math.max(0, options.indexOf(document.activeElement as HTMLButtonElement));
    const nextIndex =
      event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : event.key === 'ArrowUp' ? current - 1 : current + 1;
    options[Math.max(0, Math.min(options.length - 1, nextIndex))]?.focus({ preventScroll: true });
  });
  document.body.appendChild(menu);

  select.classList.add('ui-select-native');
  select.after(root);
  root.append(select, trigger);

  trigger.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    root.classList.contains('is-open') ? closeSelect(root) : openSelect(root);
  });

  root.addEventListener('keydown', (event) => {
    const options = Array.from(menu.querySelectorAll<HTMLButtonElement>('[data-ui-select-option]:not(:disabled)'));
    if (event.key === 'Escape') {
      closeSelect(root);
      trigger.focus();
      return;
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    if (!root.classList.contains('is-open')) {
      openSelect(root);
      return;
    }
    const current = Math.max(0, options.indexOf(document.activeElement as HTMLButtonElement));
    const nextIndex =
      event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : event.key === 'ArrowUp' ? current - 1 : event.key === 'ArrowDown' ? current + 1 : current;
    if (event.key === 'Enter' || event.key === ' ') {
      (document.activeElement as HTMLButtonElement | null)?.click();
      return;
    }
    options[Math.max(0, Math.min(options.length - 1, nextIndex))]?.focus({ preventScroll: true });
  });

  select.addEventListener('change', () => syncSelect(root));
  new MutationObserver(() => rebuildOptions(root)).observe(select, { childList: true, subtree: true, attributes: true });
  rebuildOptions(root);
}

export function initCustomSelects() {
  document.querySelectorAll<HTMLSelectElement>('select').forEach(enhanceSelect);
  document.addEventListener('click', () => closeAll());
  window.addEventListener('resize', () => document.querySelectorAll<HTMLElement>('.ui-select.is-open').forEach(positionMenu), { passive: true });
  window.addEventListener('scroll', () => document.querySelectorAll<HTMLElement>('.ui-select.is-open').forEach(positionMenu), true);
  new MutationObserver(() => {
    document.querySelectorAll<HTMLSelectElement>('select').forEach(enhanceSelect);
  }).observe(document.body, { childList: true, subtree: true });
}
