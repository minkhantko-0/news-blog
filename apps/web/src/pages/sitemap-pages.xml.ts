/** Every indexable page that isn't an article: sections, tags, authors, videos, shows, pages. */
import type { APIRoute } from 'astro';
import { absolute } from '~/lib/seo/site';
import { indexablePages } from '~/lib/seo/urls';
import { escapeXml as x, xmlResponse } from '~/lib/seo/xml';

export const GET: APIRoute = async () => {
  const urls = (await indexablePages()).map(
    (p) => `  <url><loc>${x(absolute(p.path))}</loc>${p.lastmod ? `<lastmod>${p.lastmod}</lastmod>` : ''}</url>`,
  );
  return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`);
};
