// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { loadEnv } from 'vite';
import edgeFiles from './integrations/edge-files.mjs';

const env = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');

export default defineConfig({
  // Replace with the real domain at launch (also used for canonical URLs and sitemaps).
  site: env.PUBLIC_SITE_URL || 'https://hollywoodpest.example',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [
    edgeFiles({
      projectId: env.PUBLIC_SANITY_PROJECT_ID,
      dataset: env.PUBLIC_SANITY_DATASET || 'production',
      site: env.PUBLIC_SITE_URL || 'https://hollywoodpest.example',
      // Only once the site is open to search engines.
      indexNowKey: env.PUBLIC_ALLOW_INDEXING === 'true' ? env.INDEXNOW_KEY : undefined,
    }),
  ],
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'Barlow Condensed',
      cssVariable: '--font-barlow',
      weights: ['700', '800', '900'],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
      fallbacks: ['Arial Narrow', 'sans-serif'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'Inter',
      cssVariable: '--font-inter',
      weights: ['400 700'],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
