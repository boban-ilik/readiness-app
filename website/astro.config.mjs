import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://thereadiness.app',
  output: 'static',
  integrations: [sitemap()],
  trailingSlash: 'ignore',
});
