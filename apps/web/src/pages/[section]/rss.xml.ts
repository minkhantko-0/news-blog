/** One RSS feed per top-level section, e.g. /news/rss.xml */
import type { APIRoute, GetStaticPaths } from 'astro';
import { content, type Category } from '~/lib/content';
import { inCategory } from '~/lib/content/derive';
import { rssFeed } from '~/lib/seo/rss';
import { indexableArticles } from '~/lib/seo/urls';
import { xmlResponse } from '~/lib/seo/xml';

export const getStaticPaths = (async () => {
  const categories = await content.getCategories();
  return categories.filter((c) => !c.parent).map((category) => ({ params: { section: category.slug }, props: { category } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const { category } = props as { category: Category };
  const settings = await content.getSiteSettings();
  return xmlResponse(
    rssFeed({
      title: `${settings.name}: ${category.title}`,
      description: category.description ?? `The latest ${category.title} stories.`,
      path: category.href,
      selfPath: `${category.href}rss.xml`,
      articles: inCategory(await indexableArticles(), category),
    }),
    'application/rss+xml',
  );
};
