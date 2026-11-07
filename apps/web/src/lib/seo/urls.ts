/**
 * Which pages search engines should know about, for the sitemaps.
 * Leaves out pages marked "hide from search engines", thin tag pages and
 * page 2+ of listings (reachable through the page links).
 */
import { content, type Article } from '../content';
import { inCategory, MIN_STORIES_TO_INDEX, withTag } from '../content/derive';

export interface SitemapEntry {
  path: string;
  /** ISO date of the last meaningful change. */
  lastmod?: string;
}

const newest = (articles: Article[]) => articles[0]?.updatedAt ?? articles[0]?.publishedAt;

/** Articles that may appear in search results, newest first. */
export async function indexableArticles(): Promise<Article[]> {
  return (await content.getArticles()).filter((a) => !a.seo.noindex);
}

/** Every indexable page that isn't an article. */
export async function indexablePages(): Promise<SitemapEntry[]> {
  const [articles, categories, tags, authors, videos, shows, pages] = await Promise.all([
    indexableArticles(),
    content.getCategories(),
    content.getTags(),
    content.getAuthors(),
    content.getVideos(),
    content.getShows(),
    content.getPages(),
  ]);

  const entries: SitemapEntry[] = [{ path: '/', lastmod: newest(articles) }];

  for (const c of categories) {
    if (c.seo.noindex) continue;
    entries.push({ path: c.href, lastmod: newest(inCategory(articles, c)) });
  }
  for (const t of tags) {
    const tagged = withTag(articles, t.id);
    if (t.noindex || tagged.length < MIN_STORIES_TO_INDEX) continue;
    entries.push({ path: t.href, lastmod: newest(tagged) });
  }
  for (const a of authors) {
    entries.push({ path: a.href, lastmod: newest(articles.filter((x) => x.authors.some((au) => au.id === a.id))) });
  }
  entries.push({ path: '/videos/', lastmod: videos[0]?.publishedAt });
  for (const v of videos) entries.push({ path: v.href, lastmod: v.publishedAt });
  entries.push({ path: '/originals/' });
  for (const s of shows) entries.push({ path: s.href, lastmod: videos.find((v) => v.show?.id === s.id)?.publishedAt });
  for (const p of pages) if (!p.seo.noindex) entries.push({ path: p.href });

  return entries;
}
