import { defineConfig } from 'astro/config';

// Статический сайт (SSG): индексируемые URL, максимум SEO/перфа.
// CSS выносим во внешний файл (inlineStylesheets:'auto') — сайт большой (~6.6k страниц),
// один кэшируемый CSS вместо инлайна в каждую страницу.
export default defineConfig({
  site: 'https://quran.nurtech.dev',
  output: 'static',
  build: { inlineStylesheets: 'auto', assets: 'assets' },
  compressHTML: true,
  devToolbar: { enabled: false },
  trailingSlash: 'ignore',
});
