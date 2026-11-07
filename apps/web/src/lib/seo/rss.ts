/** RSS 2.0 feeds (site-wide and per section), with images for feed readers and aggregators. */
import type { Article } from '../content';
import { imageUrl } from '../images';
import { absolute, LOGO, PUBLICATION_NAME } from './site';
import { escapeXml as x } from './xml';

/** Stories per feed. */
export const FEED_SIZE = 50;

export function rssFeed(opts: { title: string; description: string; path: string; selfPath: string; articles: Article[] }): string {
  const items = opts.articles.slice(0, FEED_SIZE).map((a) => {
    const url = absolute(a.href);
    const image = imageUrl(a.image, 1200, 675);
    return `    <item>
      <title>${x(a.title)}</title>
      <link>${x(url)}</link>
      <guid isPermaLink="true">${x(url)}</guid>
      <pubDate>${new Date(a.publishedAt).toUTCString()}</pubDate>
      ${a.dek ? `<description>${x(a.dek)}</description>` : ''}
      <category>${x(a.parentCategory?.title ?? a.category.title)}</category>
      ${a.authors.map((au) => `<dc:creator>${x(au.name)}</dc:creator>`).join('\n      ')}
      <media:content url="${x(image)}" medium="image" width="1200" height="675">
        <media:description>${x(a.image.alt)}</media:description>
      </media:content>
    </item>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${x(opts.title)}</title>
    <link>${x(absolute(opts.path))}</link>
    <description>${x(opts.description)}</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${x(absolute(opts.selfPath))}" rel="self" type="application/rss+xml" />
    <image>
      <url>${x(LOGO.url)}</url>
      <title>${x(opts.title)}</title>
      <link>${x(absolute(opts.path))}</link>
    </image>
    <copyright>© ${new Date().getFullYear()} ${x(PUBLICATION_NAME)}</copyright>
${items.join('\n')}
  </channel>
</rss>
`;
}
