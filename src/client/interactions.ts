import { haptic } from './shared';

const HAPTIC_SELECTOR =
  'button, a, .switch, .seg button, .item, [role="button"], .dlist a, .tafsir-toggle, .dtabs button';

export function initHapticInteractions() {
  document.addEventListener(
    'pointerdown',
    (e) => {
      const t = (e.target as Element | null)?.closest?.(HAPTIC_SELECTOR);
      if (t) haptic('light');
    },
    { passive: true }
  );
}
