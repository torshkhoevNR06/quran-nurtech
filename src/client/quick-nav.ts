import { $ } from './shared';

interface SurahMeta {
  n: number;
  ne: string;
  nr: string;
  nm: string;
  slug: string;
}

interface QuickNavOptions {
  loadIndex: () => Promise<SurahMeta[]>;
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/й/g, 'и')
    .replace(/[^a-zа-я0-9]+/g, '');

const ALIASES: Record<string, number> = {
  фатиха: 1, бакара: 2, бакора: 2, имран: 3, ниса: 4, маида: 5, анам: 6, араф: 7,
  анфаль: 8, тауба: 9, юнус: 10, худ: 11, юсуф: 12, раад: 13, ибрахим: 14, хиджр: 15,
  нахль: 16, исра: 17, кахф: 18, кяхф: 18, марьям: 19, таха: 20, анбия: 21, хадж: 22,
  муминун: 23, нур: 24, фуркан: 25, шуара: 26, намль: 27, касас: 28, анкабут: 29,
  рум: 30, лукман: 31, саджда: 32, ахзаб: 33, саба: 34, фатыр: 35, ясин: 36, иасин: 36,
  саффат: 37, сад: 38, зумар: 39, гафир: 40, фуссылят: 41, шура: 42, зухруф: 43,
  духан: 44, джасия: 45, ахкаф: 46, мухаммад: 47, фатх: 48, худжурат: 49, каф: 50,
  зарият: 51, тур: 52, наджм: 53, камар: 54, рахман: 55, вакиа: 56, хадид: 57,
  муджадиля: 58, хашр: 59, мумтахана: 60, сафф: 61, джума: 62, мунафикун: 63,
  тагабун: 64, талак: 65, тахрим: 66, мульк: 67, калам: 68, хакка: 69, мааридж: 70,
  нух: 71, джинн: 72, муззаммиль: 73, муддассир: 74, кияма: 75, инсан: 76, мурсалят: 77,
  наба: 78, назиат: 79, абаса: 80, таквир: 81, инфитар: 82, мутаффифин: 83, иншикак: 84,
  бурудж: 85, тарик: 86, аля: 87, гашия: 88, фаджр: 89, баляд: 90, шамс: 91, лейль: 92,
  духа: 93, шарх: 94, тин: 95, аляк: 96, кадр: 97, беййина: 98, зальзаля: 99, адият: 100,
  кариа: 101, такасур: 102, аср: 103, хумаза: 104, филь: 105, курайш: 106, маун: 107,
  каусар: 108, кафирун: 109, наср: 110, масад: 111, ихлас: 112, фаляк: 113, фалак: 113,
  нас: 114,
};

async function resolveQuick(raw: string, loadIndex: QuickNavOptions['loadIndex']): Promise<string | null> {
  const q = raw.trim();
  if (!q) return null;

  const m = q.match(/^(\d{1,3})\s*[:.\-\/\s]\s*(\d{1,3})$/);
  if (m) {
    const s = +m[1],
      a = +m[2];
    if (s >= 1 && s <= 114) return `/${s}:${Math.max(1, a)}`;
  }

  if (/^\d{1,3}$/.test(q)) {
    const s = +q;
    if (s >= 1 && s <= 114) return `/surah/${s}`;
  }

  const nq = norm(q).replace(/^(аль|аш|ас|ан|ат|аз|ар|ад|al|ash|as|an)/, '');
  const idx = await loadIndex();
  for (const key in ALIASES) if (key.includes(nq) || nq.includes(key)) return `/surah/${ALIASES[key]}`;
  const hit = idx.find((s) => {
    const cand = [norm(s.nr), norm(s.ne), norm(s.nm), s.slug.replace(/-/g, '')];
    return cand.some((c) => c && (c.includes(nq) || nq.includes(c)));
  });
  return hit ? `/surah/${hit.n}` : null;
}

export function initQuick({ loadIndex }: QuickNavOptions) {
  const form = $('[data-quick]');
  const input = $<HTMLInputElement>('[data-quick-input]');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const val = (input?.value || '').trim();
    if (!val) return;
    const dest = await resolveQuick(val, loadIndex);
    location.href = dest || '/search?q=' + encodeURIComponent(val);
  });
}
