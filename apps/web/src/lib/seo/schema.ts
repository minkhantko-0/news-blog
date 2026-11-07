/**
 * Structured data (schema.org JSON-LD). One @graph per page: the
 * organization and website on every page, plus what the page is about.
 * Typed with schema-dts, Google's TypeScript definitions for schema.org.
 */
import type {
  BreadcrumbList,
  NewsArticle,
  NewsMediaOrganization,
  Person,
  ProfilePage,
  Thing,
  VideoObject,
  WebPage,
  WebSite,
} from 'schema-dts';
import type { Article, Author, SiteSettings, Video } from '../content';
import { imageUrl } from '../images';
import { absolute, LANGUAGE, LOGO, officialProfiles, PUBLICATION_NAME, SITE_URL } from './site';

const ORG_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

export type GraphNode = Exclude<Thing, string>;

export function organization(settings: SiteSettings): NewsMediaOrganization {
  const sameAs = officialProfiles(settings.social);
  return {
    '@type': 'NewsMediaOrganization',
    '@id': ORG_ID,
    name: settings.name || PUBLICATION_NAME,
    url: `${SITE_URL}/`,
    logo: { '@type': 'ImageObject', url: LOGO.url, width: `${LOGO.width}`, height: `${LOGO.height}` },
    slogan: settings.tagline,
    ...(sameAs.length ? { sameAs } : {}),
    publishingPrinciples: absolute('/editorial-standards/'),
    correctionsPolicy: absolute('/corrections/'),
  };
}

export function website(settings: SiteSettings): WebSite {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: settings.name || PUBLICATION_NAME,
    url: `${SITE_URL}/`,
    inLanguage: LANGUAGE,
    publisher: { '@id': ORG_ID },
  };
}

export function breadcrumbs(items: { name: string; path: string }[]): BreadcrumbList {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: [{ name: 'Home', path: '/' }, ...items].map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absolute(item.path),
    })),
  };
}

export function webPage(path: string, name: string, description?: string): WebPage {
  return {
    '@type': 'WebPage',
    '@id': absolute(path),
    url: absolute(path),
    name,
    ...(description ? { description } : {}),
    isPartOf: { '@id': WEBSITE_ID },
    inLanguage: LANGUAGE,
  };
}

const person = (a: { name: string; href: string; role?: string }) =>
  ({
    '@type': 'Person' as const,
    '@id': `${absolute(a.href)}#person`,
    name: a.name,
    url: absolute(a.href),
    ...(a.role ? { jobTitle: a.role } : {}),
  }) satisfies Person;

/** "1:38" → "PT1M38S", "1:02:05" → "PT1H2M5S" */
export function isoDuration(duration: string): string | undefined {
  const parts = duration.split(':').map(Number);
  if (parts.length < 2 || parts.some((n) => Number.isNaN(n))) return undefined;
  const [h, m, s] = parts.length === 3 ? parts : [0, parts[0]!, parts[1]!];
  return `PT${h ? `${h}H` : ''}${m ? `${m}M` : ''}${s || (!h && !m) ? `${s}S` : ''}`;
}

export function videoObject(video: Video): VideoObject {
  const thumbs = [imageUrl(video.image, 1280, 720), imageUrl(video.image, 1200, 900), imageUrl(video.image, 1200, 1200)];
  const duration = isoDuration(video.duration);
  return {
    '@type': 'VideoObject',
    '@id': `${absolute(video.href)}#video`,
    name: video.title,
    description: video.description || video.title,
    thumbnailUrl: [...new Set(thumbs)],
    uploadDate: video.publishedAt,
    ...(duration ? { duration } : {}),
    ...(video.youtubeId
      ? { embedUrl: `https://www.youtube.com/embed/${video.youtubeId}`, contentUrl: `https://www.youtube.com/watch?v=${video.youtubeId}` }
      : {}),
    url: absolute(video.href),
    publisher: { '@id': ORG_ID },
  };
}

/**
 * NewsArticle with images in the three shapes Google asks for (16:9, 4:3,
 * 1:1, at least 1200px wide), so it can pick the right crop for Top Stories
 * and Discover.
 */
export function newsArticle(article: Article): NewsArticle {
  const url = absolute(article.href);
  const images = [
    imageUrl(article.image, 1200, 675),
    imageUrl(article.image, 1200, 900),
    imageUrl(article.image, 1200, 1200),
  ];
  return {
    '@type': 'NewsArticle',
    '@id': `${url}#article`,
    headline: article.title.slice(0, 110),
    ...(article.dek ? { description: article.dek } : {}),
    image: [...new Set(images)],
    datePublished: article.publishedAt,
    dateModified: article.updatedAt ?? article.publishedAt,
    author: article.authors.map(person),
    publisher: { '@id': ORG_ID },
    mainEntityOfPage: { '@id': url },
    url,
    articleSection: article.parentCategory?.title ?? article.category.title,
    ...(article.tags.length ? { keywords: article.tags.map((t) => t.title) } : {}),
    inLanguage: LANGUAGE,
    isAccessibleForFree: true,
    ...(article.video ? { video: videoObject(article.video) } : {}),
  };
}

export function profilePage(author: Author): ProfilePage {
  const url = absolute(author.href);
  return {
    '@type': 'ProfilePage',
    '@id': url,
    url,
    isPartOf: { '@id': WEBSITE_ID },
    mainEntity: {
      ...person(author),
      description: author.bio,
      ...(author.photo ? { image: imageUrl(author.photo, 400, 400) } : {}),
      ...(officialProfiles(author.social).length ? { sameAs: officialProfiles(author.social) } : {}),
      worksFor: { '@id': ORG_ID },
    },
  };
}

/** The JSON-LD document for a page: organization + website + page nodes. */
export function graph(settings: SiteSettings, nodes: GraphNode[]) {
  return { '@context': 'https://schema.org', '@graph': [organization(settings), website(settings), ...nodes] };
}
