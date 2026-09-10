import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const MUSHAF_ROOT = join(ROOT, 'data', 'mushaf-pages');
const QURAN_FOUNDATION_FONTS = 'https://verses.quran.foundation/fonts/quran/hafs';

// A few page JSON files contain the tail of a verse whose private-use glyphs
// live in the adjacent page font. Keep the fallback narrow so normal pages
// still request only their own font.
const MUSHAF_FONT_FALLBACKS: Record<number, number[]> = {
  121: [120],
  533: [532],
  534: [532],
  568: [569],
  570: [569],
};

const readJson = <T>(p: string): T => JSON.parse(readFileSync(p, 'utf8')) as T;

export const MUSHAF_TOTAL_PAGES = 604;
export const BASMALA = 'بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ';

export interface MushafPageWord {
  c: string;
  k: string;
  e?: 1;
}

export interface MushafPageLine {
  n: number;
  w: MushafPageWord[];
}

export interface MushafPageStart {
  s: number;
  line: number;
}

export interface MushafPage {
  p: number;
  j: number;
  lines: MushafPageLine[];
  starts?: MushafPageStart[];
}

export interface MushafMeta {
  pages: number;
  suraStart: Record<string, number>;
  juzStart: Record<string, number>;
  pageJuz: Record<string, number>;
  suraPages: Array<{
    n: number;
    nr: string;
    na: string;
    p: number;
  }>;
}

export function getMushafPage(page: number): MushafPage {
  const n = Math.max(1, Math.min(MUSHAF_TOTAL_PAGES, Math.trunc(page || 1)));
  return readJson<MushafPage>(join(MUSHAF_ROOT, `${n}.json`));
}

export function getMushafMeta(): MushafMeta {
  return readJson<MushafMeta>(join(MUSHAF_ROOT, 'meta.json'));
}

export function getMushafSurah(meta: MushafMeta, surah: number) {
  return meta.suraPages.find((s) => s.n === surah);
}

export function getMushafPagePrimarySurah(page: MushafPage): number {
  const firstWord = [...page.lines]
    .sort((a, b) => a.n - b.n)
    .flatMap((line) => line.w)
    .find((word) => word?.k);
  const surah = Number(firstWord?.k.split(':')[0]) || page.starts?.[0]?.s || 1;
  return Math.max(1, Math.min(114, Math.trunc(surah)));
}

export function mushafTajweedFontCss(page: number): string {
  const { n, family, lightSvg, darkSvg, sepiaSvg, colrUrl, lightSvgUrl, darkSvgUrl, sepiaSvgUrl } = mushafTajweedFontAssets(page);
  const fallbackPages = MUSHAF_FONT_FALLBACKS[n] || [];
  const fallbackCss = fallbackPages
    .map((fallbackPage) => {
      const fallback = mushafTajweedFontAssets(fallbackPage);
      const fallbackBase = `${family}Fallback${fallbackPage}`;
      return `
@font-face{font-family:'${fallbackBase}';src:url('${fallback.colrUrl}') format('woff2');font-display:block;}
@font-face{font-family:'${fallbackBase}LightSvg';src:url('${fallback.lightSvgUrl}') format('woff2');font-display:block;}
@font-face{font-family:'${fallbackBase}DarkSvg';src:url('${fallback.darkSvgUrl}') format('woff2');font-display:block;}
@font-face{font-family:'${fallbackBase}SepiaSvg';src:url('${fallback.sepiaSvgUrl}') format('woff2');font-display:block;}`;
    })
    .join('');
  const fallbackStack = fallbackPages.map((fallbackPage) => `'${family}Fallback${fallbackPage}'`).join(',');
  const fallbackLightStack = fallbackPages.map((fallbackPage) => `'${family}Fallback${fallbackPage}LightSvg'`).join(',');
  const fallbackDarkStack = fallbackPages.map((fallbackPage) => `'${family}Fallback${fallbackPage}DarkSvg'`).join(',');
  const fallbackSepiaStack = fallbackPages.map((fallbackPage) => `'${family}Fallback${fallbackPage}SepiaSvg'`).join(',');

  return `
@font-face{font-family:'${family}';src:url('${colrUrl}') format('woff2');font-display:block;}
@font-face{font-family:'${lightSvg}';src:url('${lightSvgUrl}') format('woff2');font-display:block;}
@font-face{font-family:'${darkSvg}';src:url('${darkSvgUrl}') format('woff2');font-display:block;}
@font-face{font-family:'${sepiaSvg}';src:url('${sepiaSvgUrl}') format('woff2');font-display:block;}
@font-palette-values --mushaf-light-${n}{font-family:'${family}';base-palette:0;}
@font-palette-values --mushaf-dark-${n}{font-family:'${family}';base-palette:1;}
@font-palette-values --mushaf-sepia-${n}{font-family:'${family}';base-palette:2;}
${fallbackCss}
.qcf-page[data-mushaf-page="${n}"]{--mushaf-page-font:'${family}';${fallbackStack ? `--mushaf-page-font-fallback:${fallbackStack};` : ''}font-palette:--mushaf-light-${n};}
:root[data-theme="dark"] .qcf-page[data-mushaf-page="${n}"]{font-palette:--mushaf-dark-${n};}
:root[data-theme="sepia"] .qcf-page[data-mushaf-page="${n}"]{font-palette:--mushaf-sepia-${n};}
body[data-page-mode="mushaf"][data-mushaf-style="dark"] .qcf-page[data-mushaf-page="${n}"]{font-palette:--mushaf-dark-${n};}
body[data-page-mode="mushaf"][data-mushaf-style="paper"] .qcf-page[data-mushaf-page="${n}"]{font-palette:--mushaf-sepia-${n};}
body[data-page-mode="mushaf"][data-mushaf-style="light"] .qcf-page[data-mushaf-page="${n}"]{font-palette:--mushaf-light-${n};}
.qcf-page[data-mushaf-page="${n}"][data-mushaf-firefox="1"]{--mushaf-page-font:'${lightSvg}';${fallbackLightStack ? `--mushaf-page-font-fallback:${fallbackLightStack};` : ''}}
:root[data-theme="dark"] .qcf-page[data-mushaf-page="${n}"][data-mushaf-firefox="1"]{--mushaf-page-font:'${darkSvg}';${fallbackDarkStack ? `--mushaf-page-font-fallback:${fallbackDarkStack};` : ''}}
:root[data-theme="sepia"] .qcf-page[data-mushaf-page="${n}"][data-mushaf-firefox="1"]{--mushaf-page-font:'${sepiaSvg}';${fallbackSepiaStack ? `--mushaf-page-font-fallback:${fallbackSepiaStack};` : ''}}
body[data-page-mode="mushaf"][data-mushaf-style="dark"] .qcf-page[data-mushaf-page="${n}"][data-mushaf-firefox="1"]{--mushaf-page-font:'${darkSvg}';${fallbackDarkStack ? `--mushaf-page-font-fallback:${fallbackDarkStack};` : ''}}
body[data-page-mode="mushaf"][data-mushaf-style="paper"] .qcf-page[data-mushaf-page="${n}"][data-mushaf-firefox="1"]{--mushaf-page-font:'${sepiaSvg}';${fallbackSepiaStack ? `--mushaf-page-font-fallback:${fallbackSepiaStack};` : ''}}
body[data-page-mode="mushaf"][data-mushaf-style="light"] .qcf-page[data-mushaf-page="${n}"][data-mushaf-firefox="1"]{--mushaf-page-font:'${lightSvg}';${fallbackLightStack ? `--mushaf-page-font-fallback:${fallbackLightStack};` : ''}}
@media (prefers-color-scheme: dark){
  :root:not([data-theme]) .qcf-page[data-mushaf-page="${n}"]{font-palette:--mushaf-dark-${n};}
  :root:not([data-theme]) .qcf-page[data-mushaf-page="${n}"][data-mushaf-firefox="1"]{--mushaf-page-font:'${darkSvg}';}
}`;
}

export function mushafTajweedFontFamily(page: number): string {
  const n = Math.max(1, Math.min(MUSHAF_TOTAL_PAGES, Math.trunc(page || 1)));
  return `MushafTajweed${n}`;
}

export function mushafTajweedFontAssets(page: number) {
  const n = Math.max(1, Math.min(MUSHAF_TOTAL_PAGES, Math.trunc(page || 1)));
  return {
    n,
    family: `MushafTajweed${n}`,
    lightSvg: `MushafTajweed${n}LightSvg`,
    darkSvg: `MushafTajweed${n}DarkSvg`,
    sepiaSvg: `MushafTajweed${n}SepiaSvg`,
    colrUrl: `${QURAN_FOUNDATION_FONTS}/v4/colrv1/woff2/p${n}.woff2`,
    lightSvgUrl: `${QURAN_FOUNDATION_FONTS}/v4/ot-svg/light/woff2/p${n}.woff2`,
    darkSvgUrl: `${QURAN_FOUNDATION_FONTS}/v4/ot-svg/dark/woff2/p${n}.woff2`,
    sepiaSvgUrl: `${QURAN_FOUNDATION_FONTS}/v4/ot-svg/sepia/woff2/p${n}.woff2`,
  };
}
