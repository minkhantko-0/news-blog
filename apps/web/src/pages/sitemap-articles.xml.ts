/**
 * Every indexable article, with its main image (for Google Images and Discover).
 * A sitemap holds up to 50,000 URLs: split it by year before the archive gets there.
 */
import type { APIRoute } from 'astro';
import { imageUrl } from '~/lib/images';
import { indexableArticles } from '~/lib/seo/urls';
import { absolute } from '~/lib/seo/site';
import { escapeXml as x, xmlResponse } from '~/lib/seo/xml';

export const GET: APIRoute = async () => {
  const articles = await indexableArticles();
  const urls = articles.map(
    (a) => `  <url>
    <loc>${x(absolute(a.href))}</loc>
    <lastmod>${a.updatedAt ?? a.publishedAt}</lastmod>
    <image:image><image:loc>${x(imageUrl(a.image, 1200, 675))}</image:loc></image:image>
  </url>`,
  );
  return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('\n')}
</urlset>
`);
};
