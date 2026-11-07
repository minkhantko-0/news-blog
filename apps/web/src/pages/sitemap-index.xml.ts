/** Sitemap index: points search engines at the individual sitemaps. */
import type { APIRoute } from 'astro';
import { absolute } from '~/lib/seo/site';
import { xmlResponse } from '~/lib/seo/xml';

const SITEMAPS = ['/sitemap-news.xml', '/sitemap-articles.xml', '/sitemap-pages.xml'];

export const GET: APIRoute = () =>
  xmlResponse(`<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${SITEMAPS.map((path) => `  <sitemap><loc>${absolute(path)}</loc><lastmod>${new Date().toISOString()}</lastmod></sitemap>`).join('\n')}
</sitemapindex>
`);
