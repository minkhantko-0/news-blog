/**
 * Google News sitemap: articles from the last 48 hours (Google ignores older
 * ones), up to 1,000. Rebuilt with every publish, so it stays current.
 */
import type { APIRoute } from 'astro';
import { indexableArticles } from '~/lib/seo/urls';
import { absolute, LANGUAGE, PUBLICATION_NAME } from '~/lib/seo/site';
import { escapeXml as x, xmlResponse } from '~/lib/seo/xml';

const WINDOW_MS = 48 * 60 * 60 * 1000;

export const GET: APIRoute = async () => {
  const since = Date.now() - WINDOW_MS;
  const recent = (await indexableArticles()).filter((a) => new Date(a.publishedAt).getTime() >= since).slice(0, 1000);
  const urls = recent.map(
    (a) => `  <url>
    <loc>${x(absolute(a.href))}</loc>
    <news:news>
      <news:publication>
        <news:name>${x(PUBLICATION_NAME)}</news:name>
        <news:language>${LANGUAGE}</news:language>
      </news:publication>
      <news:publication_date>${a.publishedAt}</news:publication_date>
      <news:title>${x(a.title)}</news:title>
    </news:news>
  </url>`,
  );
  return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls.join('\n')}
</urlset>
`);
};
