/** Pure helpers that slice the article list for listing pages. */
import type { Article, Category, StorySummary } from './types';

/** Stories per listing page (category, tag, author). */
export const PAGE_SIZE = 18;

/** A top-level section includes its sub-categories' stories. */
export function inCategory(articles: Article[], category: Category): Article[] {
  return articles.filter((a) => a.categoryId === category.id || a.parentCategory?.id === category.id);
}

export function withTag(articles: Article[], tagId: string): Article[] {
  return articles.filter((a) => a.tags.some((t) => t.id === tagId));
}

export function byAuthor(articles: Article[], authorId: string): Article[] {
  return articles.filter((a) => a.authors.some((au) => au.id === authorId));
}

/** Same category first, then same section, then newest; never the story itself. */
export function relatedTo(article: Article, articles: Article[], count = 4): StorySummary[] {
  const others = articles.filter((a) => a.id !== article.id);
  const rank = (a: Article) => (a.categoryId === article.categoryId ? 0 : a.section === article.section ? 1 : 2);
  return [...others].sort((a, b) => rank(a) - rank(b)).slice(0, count);
}

export interface PageSlice<T> {
  items: T[];
  current: number;
  total: number;
}

export function pageCount(total: number): number {
  return Math.max(1, Math.ceil(total / PAGE_SIZE));
}

/** Items for page `n` (1-based). */
export function pageOf<T>(items: T[], n: number): PageSlice<T> {
  return { items: items.slice((n - 1) * PAGE_SIZE, n * PAGE_SIZE), current: n, total: pageCount(items.length) };
}

/** Page numbers 2..N, for the /page/N/ routes (page 1 lives at the base URL). */
export function extraPages(count: number): number[] {
  return Array.from({ length: Math.max(0, pageCount(count) - 1) }, (_, i) => i + 2);
}

/** Tag pages with only a few stories add little for search engines. */
export const MIN_STORIES_TO_INDEX = 3;
