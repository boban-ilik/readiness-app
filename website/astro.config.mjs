import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://thereadiness.app',
  output: 'static',
  // privacy and support are hand-written pages in public/, which the sitemap
  // integration does not see on its own.
  integrations: [sitemap({ customPages: ['https://thereadiness.app/privacy/', 'https://thereadiness.app/support/'] })],
  trailingSlash: 'ignore',
});
