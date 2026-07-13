#!/usr/bin/env node
// Импорт: 1) page/juz/hizb по каждому аяту (alquran.cloud quran-uthmani) → поля p/j/h
//            в data/quran/*.json (для постраничной навигации мусхафа);
//         2) таджвид-разметка (alquran.cloud quran-tajweed) → data/tajweed/*.json
//            = [{a, h}], где h — арабский с <span class="tj tj-<rule>"> по правилам.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const QDIR = join(ROOT, 'data', 'quran');
const TAJDIR = join(ROOT, 'data', 'tajweed');
if (!existsSync(TAJDIR)) mkdirSync(TAJDIR, { recursive: true });

async function getJson(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } catch (e) {
      if (i === tries - 1) throw e;
      await new Promise((res) => setTimeout(res, 700 * (i + 1)));
    }
  }
}

// [h:1[ٱ]  →  <span class="tj tj-h">ٱ</span>   (номер после ':' игнорируем — цвет по букве)
const LEADING_ARABIC_MARKS = /(<span class="tj tj-[a-z]">)([\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed]+)([^<]*?)<\/span>/g;
const normalizeTajweedHtml = (html) =>
  html
    .replace(/\u0672/g, '\u0670')
    .replace(LEADING_ARABIC_MARKS, (_, open, marks, rest) =>
      rest ? `${marks}${open}${rest}</span>` : marks
    );
const parseTajweed = (t) =>
  normalizeTajweedHtml(
    String(t || '').replace(
      /\[([a-z])(?::\d+)?\[([^\]]*)\]/g,
      (_, rule, txt) => `<span class="tj tj-${rule}">${txt}</span>`
    )
  );

console.log('→ page/juz/hizb (quran-uthmani)…');
const uth = await getJson('https://api.alquran.cloud/v1/quran/quran-uthmani');
console.log('→ таджвид (quran-tajweed)…');
const taj = await getJson('https://api.alquran.cloud/v1/quran/quran-tajweed');

const metaMap = {};
for (const s of uth.data.surahs) {
  metaMap[s.number] = {};
  for (const a of s.ayahs)
    metaMap[s.number][a.numberInSurah] = { p: a.page, j: a.juz, h: a.hizbQuarter };
}
const tajMap = {};
for (const s of taj.data.surahs) {
  tajMap[s.number] = {};
  for (const a of s.ayahs) tajMap[s.number][a.numberInSurah] = a.text;
}

let meta = 0,
  tajCount = 0;
for (let n = 1; n <= 114; n++) {
  const p = join(QDIR, `${n}.json`);
  const surah = JSON.parse(readFileSync(p, 'utf8'));
  const tajOut = [];
  for (const ayah of surah.a) {
    const m = metaMap[n]?.[ayah.n];
    if (m) {
      ayah.p = m.p;
      ayah.j = m.j;
      ayah.h = m.h;
      meta++;
    }
    const tj = tajMap[n]?.[ayah.n];
    if (tj) {
      tajOut.push({ a: ayah.n, h: parseTajweed(tj) });
      tajCount++;
    }
  }
  writeFileSync(p, JSON.stringify(surah));
  writeFileSync(join(TAJDIR, `${n}.json`), JSON.stringify(tajOut));
}
console.log(`Готово. page/juz у ${meta} аятов, таджвид у ${tajCount} аятов.`);
