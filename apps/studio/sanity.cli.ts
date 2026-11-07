import { defineCliConfig } from 'sanity/cli';

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  },
  // Free hosting at https://<studioHost>.sanity.studio (`pnpm deploy`)
  studioHost: 'hollywoodpest',
  typegen: {
    path: '../web/src/**/*.{ts,astro}',
    generates: '../web/src/lib/content/sanity.types.ts',
  },
});
