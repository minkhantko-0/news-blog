/** Site-wide RSS feed: the latest stories. */
import type { APIRoute } from 'astro';
import { content } from '~/lib/content';
import { rssFeed } from '~/lib/seo/rss';
import { indexableArticles } from '~/lib/seo/urls';
import { xmlResponse } from '~/lib/seo/xml';

export const GET: APIRoute = async () => {
  const settings = await content.getSiteSettings();
  return xmlResponse(
    rssFeed({
      title: settings.name,
      description: 'Breaking celebrity, entertainment, sports and viral news.',
      path: '/',
      selfPath: '/rss.xml',
      articles: await indexableArticles(),
    }),
    'application/rss+xml',
  );
};
