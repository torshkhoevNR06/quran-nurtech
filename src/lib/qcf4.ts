import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const QCF_ROOT = join(ROOT, 'node_modules', 'quran-qcf4');

const readJson = <T>(p: string): T => JSON.parse(readFileSync(p, 'utf8')) as T;

export const QCF_TOTAL_PAGES = 604;
export const QCF_FONT_COUNT = 47;

export interface QcfSurahRange {
  id: number;
  name: string;
  name_arabic: string;
  verse_start: number;
  verse_end: number;
}

export interface QcfWord {
  code: number;
  char: string;
  font: string;
  text?: string;
  type: 'word' | 'end' | 'surah_header' | 'bismillah' | 'quarter';
  verse_key?: string;
  position?: number;
  sura?: number;
}

export interface QcfLine {
  line: number;
  words: QcfWord[];
}

export interface QcfPage {
  page: number;
  font: string;
  surahs: QcfSurahRange[];
  lines: QcfLine[];
}

export interface QcfVerseIndex {
  [verseKey: string]: {
    page: number;
    lines: Array<{ line: number; word_start: number; word_end: number }>;
  };
}

export function getQcfPage(page: number): QcfPage {
  const n = Math.max(1, Math.min(QCF_TOTAL_PAGES, Math.trunc(page || 1)));
  return readJson<QcfPage>(join(QCF_ROOT, 'pages', `${String(n).padStart(3, '0')}.json`));
}

export function getQcfVerses(): QcfVerseIndex {
  return readJson<QcfVerseIndex>(join(QCF_ROOT, 'verses.json'));
}

export function getQcfPageForAyah(surah: number, ayah: number): number | undefined {
  return getQcfVerses()[`${surah}:${ayah}`]?.page;
}

export function qcfFontFaces(base = '/fonts/qcf4'): string {
  const faces = Array.from({ length: QCF_FONT_COUNT }, (_, i) => {
    const id = String(i + 1).padStart(2, '0');
    return `@font-face{font-family:'QCF4_Hafs_${id}';src:url('${base}/QCF4_Hafs_${id}_W.woff2') format('woff2');font-display:block;}`;
  });
  faces.push(
    `@font-face{font-family:'QCF4_QBSML';src:url('${base}/QCF4_QBSML.woff2') format('woff2');font-display:block;}`
  );
  return faces.join('\n');
}
