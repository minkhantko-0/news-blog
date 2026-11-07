/**
 * Shared getStaticPaths data for the dynamic routes. URL scheme:
 *
 *   /<section>/                  top-level category, or a page (About, Privacy…)
 *   /<section>/page/<n>/         category page n
 *   /<section>/<slug>/           sub-category, or an article
 *   /<section>/<slug>/page/<n>/  sub-category page n
 *   /tag/<slug>/, /author/<slug>/ (+ /page/<n>/)
 *
 * Studio validation keeps category, page and article slugs from colliding.
 */
import { content, type Article, type Category, type Page } from './content';
import { extraPages, inCategory } from './content/derive';

export type SectionRoute = { kind: 'category'; category: Category } | { kind: 'page'; page: Page };
export type SectionChildRoute = { kind: 'category'; category: Category } | { kind: 'article'; article: Article };

export async function sectionPaths() {
  const [categories, pages] = await Promise.all([content.getCategories(), content.getPages()]);
  return [
    ...categories
      .filter((c) => !c.parent)
      .map((category) => ({ params: { section: category.slug }, props: { kind: 'category', category } as SectionRoute })),
    ...pages.map((page) => ({ params: { section: page.slug }, props: { kind: 'page', page } as SectionRoute })),
  ];
}

export async function sectionChildPaths() {
  const [categories, articles] = await Promise.all([content.getCategories(), content.getArticles()]);
  return [
    ...categories
      .filter((c) => c.parent)
      .map((category) => ({
        params: { section: category.parent!.slug, slug: category.slug },
        props: { kind: 'category', category } as SectionChildRoute,
      })),
    ...articles.map((article) => ({
      params: { section: article.section, slug: article.slug },
      props: { kind: 'article', article } as SectionChildRoute,
    })),
  ];
}

/** /<section>/page/<n>/ and /<section>/<sub>/page/<n>/ */
export async function categoryPagePaths(level: 'top' | 'sub') {
  const [categories, articles] = await Promise.all([content.getCategories(), content.getArticles()]);
  return categories
    .filter((c) => (level === 'top' ? !c.parent : c.parent))
    .flatMap((category) =>
      extraPages(inCategory(articles, category).length).map((n) => ({
        params:
          level === 'top'
            ? { section: category.slug, page: String(n) }
            : { section: category.parent!.slug, slug: category.slug, page: String(n) },
        props: { category, pageNumber: n },
      })),
    );
}
