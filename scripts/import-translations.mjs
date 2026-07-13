#!/usr/bin/env node
// Импорт: перевод Абу Аделя (alquran.cloud ru.abuadel) → поле `aa` у каждого аята;
// тафсир Ибн Касира рус. (spa5k ru-tafsir-ibne-kahtir, по-суровые бандлы) → data/tafsir-ibnkathir/;
// тафсир ас-Саади НЕ импортируем из spa5k: у ru-tafseer-al-saddi системный сдвиг
// привязки к аятам. Для ас-Саади используйте scripts/import-saadi-quran-online.mjs.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const QDIR = join(ROOT, 'data', 'quran');
const IKDIR = join(ROOT, 'data', 'tafsir-ibnkathir');
const SDIR = join(ROOT, 'data', 'tafsir-saadi');
if (!existsSync(IKDIR)) mkdirSync(IKDIR, { recursive: true });
if (!existsSync(SDIR)) mkdirSync(SDIR, { recursive: true });

// нормализуем текст тафсира: <br>/<p> → переносы строк, остальные теги убираем
const cleanTafsir = (t) =>
  String(t || '')
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<\s*\/\s*p\s*>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

async function getJson(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } catch (e) {
      if (i === tries - 1) throw e;
      await new Promise((res) => setTimeout(res, 600 * (i + 1)));
    }
  }
}

// ---- 1. Абу Адель (весь Коран одним запросом) ----
console.log('→ Абу Адель (ru.abuadel)…');
const aa = await getJson('https://api.alquran.cloud/v1/quran/ru.abuadel');
const aaMap = {};
for (const s of aa.data.surahs) {
  aaMap[s.number] = {};
  for (const a of s.ayahs) aaMap[s.number][a.numberInSurah] = a.text;
}
let aaCount = 0,
  aaMissing = 0;
for (let n = 1; n <= 114; n++) {
  const p = join(QDIR, `${n}.json`);
  const surah = JSON.parse(readFileSync(p, 'utf8'));
  for (const ayah of surah.a) {
    const t = aaMap[n]?.[ayah.n];
    if (t) {
      ayah.aa = t;
      aaCount++;
    } else aaMissing++;
  }
  writeFileSync(p, JSON.stringify(surah));
}
console.log(`  Абу Адель: добавлено ${aaCount}, пропущено ${aaMissing}`);

// ---- 2. Ибн Касир (по-суровые бандлы, конкурентно) ----
console.log('→ Ибн Касир (ru-tafsir-ibne-kahtir)…');
const base = 'https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir/ru-tafsir-ibne-kahtir';
let ikAyahs = 0,
  ikSurahs = 0;
let next = 1;
async function worker() {
  while (next <= 114) {
    const n = next++;
    const arr = await getJson(`${base}/${n}.json`);
    const out = arr
      .map((x) => ({ a: Number(x.ayah), x: String(x.text || '').trim() }))
      .filter((x) => x.x && x.a > 0)
      .sort((p, q) => p.a - q.a);
    writeFileSync(join(IKDIR, `${n}.json`), JSON.stringify(out));
    ikAyahs += out.length;
    ikSurahs++;
  }
}
await Promise.all(Array.from({ length: 8 }, worker));
console.log(`  Ибн Касир: сур ${ikSurahs}, аятов с тафсиром ${ikAyahs}`);

console.log('→ ас-Саади пропущен: используйте npm run import:saadi (quran-online.ru, верная привязка).');
console.log('Готово.');
