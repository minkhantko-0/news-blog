// @ts-check
/**
 * Files written into the build after Astro finishes:
 *
 * - `_redirects` (Cloudflare) from the redirect documents in Sanity, created
 *   automatically when a story's URL changes.
 * - IndexNow (Bing, Yandex, Seznam…; Google uses the sitemaps instead): the key
 *   file `<key>.txt` in the site, and `.indexnow/urls.json` (outside the site)
 *   listing pages changed in the last hour. `scripts/indexnow.mjs` sends that
 *   list after the deploy finishes, so engines never fetch a page before it's live.
 */
import { createClient } from '@sanity/client';
import { mkdir, writeFile } from 'node:fs/promises';

/** Cloudflare allows 2,000 static redirects; beyond that, move redirects into the Worker. */
const MAX_REDIRECTS = 2000;

/** Pages edited within this window count as "changed" for IndexNow. */
const CHANGED_WINDOW_MS = 60 * 60 * 1000;

/**
 * @param {{ projectId?: string; dataset: string; site: string; indexNowKey?: string }} options
 * @returns {import('astro').AstroIntegration}
 */
export default function edgeFiles({ projectId, dataset, site, indexNowKey }) {
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

        if (!indexNowKey) return;
        if (!/^[a-zA-Z0-9-]{8,128}$/.test(indexNowKey)) throw new Error('INDEXNOW_KEY must be 8–128 letters, digits or dashes.');
        await writeFile(new URL(`${indexNowKey}.txt`, dir), indexNowKey);

        /** @type {{ type: string; slug: string; section?: string }[]} */
        const changed = await client.fetch(
          `*[_type in ["article", "video"] && defined(slug.current) && _updatedAt > $since]{
            "type": _type, "slug": slug.current,
            "section": coalesce(category->parent->slug.current, category->slug.current)
          }`,
          { since: new Date(Date.now() - CHANGED_WINDOW_MS).toISOString() },
        );
        const paths = new Set(changed.length ? ['/'] : []);
        for (const c of changed) {
          if (c.type === 'video') paths.add(`/videos/${c.slug}/`);
          else if (c.section) {
            paths.add(`/${c.section}/${c.slug}/`);
            paths.add(`/${c.section}/`);
          }
        }
        const urls = [...paths].map((p) => new URL(p, site).href);
        const out = new URL('../.indexnow/', dir);
        await mkdir(out, { recursive: true });
        await writeFile(new URL('urls.json', out), JSON.stringify({ key: indexNowKey, urls }, null, 2));
        logger.info(`IndexNow: ${urls.length} changed URLs queued for after deploy`);
      },
    },
  };
}
