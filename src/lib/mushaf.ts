import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const MUSHAF_ROOT = join(ROOT, 'data', 'mushaf-pages');
const QURAN_FOUNDATION_FONTS = 'https://verses.quran.foundation/fonts/quran/hafs';

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

export function mushafTajweedFontCss(page: number): string {
  const n = Math.max(1, Math.min(MUSHAF_TOTAL_PAGES, Math.trunc(page || 1)));
  const family = `MushafTajweed${n}`;
  const lightSvg = `MushafTajweed${n}LightSvg`;
  const darkSvg = `MushafTajweed${n}DarkSvg`;
  const sepiaSvg = `MushafTajweed${n}SepiaSvg`;
  const colrUrl = `${QURAN_FOUNDATION_FONTS}/v4/colrv1/woff2/p${n}.woff2`;
  const lightSvgUrl = `${QURAN_FOUNDATION_FONTS}/v4/ot-svg/light/woff2/p${n}.woff2`;
  const darkSvgUrl = `${QURAN_FOUNDATION_FONTS}/v4/ot-svg/dark/woff2/p${n}.woff2`;
  const sepiaSvgUrl = `${QURAN_FOUNDATION_FONTS}/v4/ot-svg/sepia/woff2/p${n}.woff2`;

  return `
@font-face{font-family:'${family}';src:url('${colrUrl}') format('woff2');font-display:block;}
@font-face{font-family:'${lightSvg}';src:url('${lightSvgUrl}') format('woff2');font-display:block;}
@font-face{font-family:'${darkSvg}';src:url('${darkSvgUrl}') format('woff2');font-display:block;}
@font-face{font-family:'${sepiaSvg}';src:url('${sepiaSvgUrl}') format('woff2');font-display:block;}
@font-palette-values --mushaf-light-${n}{font-family:'${family}';base-palette:0;}
@font-palette-values --mushaf-dark-${n}{font-family:'${family}';base-palette:1;}
@font-palette-values --mushaf-sepia-${n}{font-family:'${family}';base-palette:2;}
.qcf-page[data-mushaf-page="${n}"]{--mushaf-page-font:'${family}';font-palette:--mushaf-light-${n};}
:root[data-theme="dark"] .qcf-page[data-mushaf-page="${n}"]{font-palette:--mushaf-dark-${n};}
:root[data-theme="sepia"] .qcf-page[data-mushaf-page="${n}"]{font-palette:--mushaf-sepia-${n};}
.qcf-page[data-mushaf-page="${n}"][data-mushaf-firefox="1"]{--mushaf-page-font:'${lightSvg}';}
:root[data-theme="dark"] .qcf-page[data-mushaf-page="${n}"][data-mushaf-firefox="1"]{--mushaf-page-font:'${darkSvg}';}
:root[data-theme="sepia"] .qcf-page[data-mushaf-page="${n}"][data-mushaf-firefox="1"]{--mushaf-page-font:'${sepiaSvg}';}
@media (prefers-color-scheme: dark){
  :root:not([data-theme]) .qcf-page[data-mushaf-page="${n}"]{font-palette:--mushaf-dark-${n};}
  :root:not([data-theme]) .qcf-page[data-mushaf-page="${n}"][data-mushaf-firefox="1"]{--mushaf-page-font:'${darkSvg}';}
}`;
}

export function mushafTajweedFontFamily(page: number): string {
  const n = Math.max(1, Math.min(MUSHAF_TOTAL_PAGES, Math.trunc(page || 1)));
  return `MushafTajweed${n}`;
}
