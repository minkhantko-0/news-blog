// @ts-check
/**
 * Writes Cloudflare's `_redirects` file into the build from the redirect
 * documents in Sanity (created automatically when a story's URL changes).
 * Workers static assets apply it before serving files.
 */
import { createClient } from '@sanity/client';
import { writeFile } from 'node:fs/promises';

/** Cloudflare allows 2,000 static redirects; beyond that, move redirects into the Worker. */
const MAX_REDIRECTS = 2000;

/** @param {{ projectId?: string; dataset: string }} options @returns {import('astro').AstroIntegration} */
export default function edgeFiles({ projectId, dataset }) {
  return {
    name: 'edge-files',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        if (!projectId) throw new Error('PUBLIC_SANITY_PROJECT_ID is not set.');
        const client = createClient({ projectId, dataset, apiVersion: '2026-11-01', useCdn: false, perspective: 'published' });
        /** @type {{ from: string; to: string; permanent?: boolean }[]} */
        const redirects = await client.fetch(
          '*[_type == "redirect" && defined(from) && defined(to)] | order(_updatedAt desc){ from, to, permanent }',
        );

        const lines = [];
        for (const r of redirects) {
          if (!r.from.startsWith('/') || !r.to.startsWith('/') || r.from === r.to) continue;
          const status = r.permanent === false ? 302 : 301;
          lines.push(`${r.from} ${r.to} ${status}`);
          // Match the old URL with and without the trailing slash.
          const alt = r.from.endsWith('/') ? r.from.slice(0, -1) : `${r.from}/`;
          if (alt) lines.push(`${alt} ${r.to} ${status}`);
        }
        if (lines.length > MAX_REDIRECTS) {
          logger.warn(`${lines.length} redirect rules exceed Cloudflare's ${MAX_REDIRECTS} limit: only the newest are kept.`);
          lines.length = MAX_REDIRECTS;
        }

        await writeFile(new URL('_redirects', dir), `# Generated from Sanity redirect documents. Do not edit.\n${lines.join('\n')}\n`);
        logger.info(`_redirects: ${lines.length} rules`);
      },
    },
  };
}
