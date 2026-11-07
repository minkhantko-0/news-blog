/**
 * Sanity content source. Maps CMS documents (schemas in apps/studio/schemaTypes)
 * into the view models in ./types.
 *
 * Reads only published content through the API CDN, with no token. Drafts and
 * scheduled stories stay private.
 */
import { createClient } from '@sanity/client';
import { youtubeId } from '../youtube';
import type { PortableTextBlock, TypedObject } from '@portabletext/types';
import type {
  Article,
  Author,
  AuthorSummary,
  BodyNode,
  Category,
  CategoryLink,
  ContentSource,
  Homepage,
  MediaImage,
  NavItem,
  Page,
  SanityImageSource,
  Seo,
  Show,
  ShowDetail,
  SiteSettings,
  SocialLink,
  StoryLabel,
  StorySummary,
  Tag,
  Video,
} from './types';

const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID;
if (!projectId) {
  throw new Error('Set PUBLIC_SANITY_PROJECT_ID in apps/web/.env (see .env.example).');
}

const client = createClient({
  projectId,
  dataset: import.meta.env.PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2026-11-01',
  useCdn: true,
  perspective: 'published',
});

// ---------- Raw query shapes ----------

interface RawImage extends Partial<SanityImageSource> {
  alt?: string;
  credit?: string;
  caption?: string;
}

interface RawCategory {
  _id: string;
  title: string;
  slug: string;
  parent?: { _id: string; title: string; slug: string } | null;
}

interface RawStory {
  _id: string;
  title: string;
  slug: string;
  dek?: string;
  label?: StoryLabel;
  category: RawCategory;
  heroImage?: RawImage;
  hasVideo: boolean;
  publishedAt: string;
}

interface RawSeo {
  title?: string;
  description?: string;
  noindex?: boolean;
  shareImage?: RawImage;
}

interface RawVideo {
  _id: string;
  title: string;
  slug: string;
  youtubeUrl?: string;
  duration?: string;
  thumbnail?: RawImage;
  description?: string;
  show?: { _id: string; name: string; slug: string } | null;
  category?: RawCategory | null;
  publishedAt: string;
}

interface RawAuthor {
  _id: string;
  name: string;
  slug: string;
  role?: string;
  photo?: RawImage;
  bio?: string;
  social?: SocialLink[];
}

interface RawArticle extends RawStory {
  authors?: RawAuthor[];
  tags?: { _id: string; title: string; slug: string }[];
  body?: TypedObject[];
  video?: RawVideo | null;
  updatedAt?: string;
  correction?: string;
  seo?: RawSeo;
}

interface RawShow {
  _id: string;
  name: string;
  slug: string;
  cardImage?: RawImage;
  description?: string;
}

interface RawNavLink {
  label: string;
  kind: 'category' | 'page' | 'url' | 'comingSoon';
  category?: RawCategory | null;
  pageSlug?: string;
  url?: string;
}

interface RawNavItem extends RawNavLink {
  children?: RawNavLink[];
}

interface RawSettings {
  name?: string;
  tagline?: string;
  nav?: RawNavItem[];
  social?: SocialLink[];
  defaultShareImage?: RawImage;
  aiTraining?: boolean;
}

// ---------- GROQ ----------

const live = /* groq */ `defined(slug.current) && coalesce(publishAt, _createdAt) <= now()`;
const newestFirst = /* groq */ `order(coalesce(publishAt, _createdAt) desc)`;

const imageFields = /* groq */ `{ alt, credit, caption, asset, crop, hotspot }`;
const seoFields = /* groq */ `{ title, description, noindex, shareImage${imageFields} }`;

const categoryFields = /* groq */ `{
  _id, title, "slug": slug.current,
  "parent": parent->{ _id, title, "slug": slug.current }
}`;

const storyFields = /* groq */ `
  _id, title, "slug": slug.current, dek, label,
  "category": category->${categoryFields},
  heroImage${imageFields},
  "hasVideo": defined(video),
  "publishedAt": coalesce(publishAt, _createdAt)
`;

const showFields = /* groq */ `{ _id, name, "slug": slug.current, cardImage${imageFields}, description }`;

const videoFields = /* groq */ `{
  _id, title, "slug": slug.current, youtubeUrl, duration, description,
  thumbnail${imageFields},
  "show": show->{ _id, name, "slug": slug.current },
  "category": category->${categoryFields},
  "publishedAt": coalesce(publishAt, _createdAt)
}`;

const authorFields = /* groq */ `{ _id, name, "slug": slug.current, role, bio, social, photo${imageFields} }`;

const bodyFields = /* groq */ `body[]{
  ...,
  _type == "relatedArticle" => { "story": article->{ ${storyFields} } }
}`;

const articlesQuery = /* groq */ `*[_type == "article" && ${live}] | ${newestFirst}{
  ${storyFields},
  "authors": authors[]->${authorFields},
  "tags": tags[]->{ _id, title, "slug": slug.current },
  ${bodyFields},
  "video": video->${videoFields},
  updatedAt, correction,
  seo${seoFields}
}`;

const navLinkFields = /* groq */ `label, kind, url, "pageSlug": page->slug.current, "category": category->${categoryFields}`;

const settingsQuery = /* groq */ `*[_id == "siteSettings"][0]{
  name, tagline, social, aiTraining, defaultShareImage${imageFields},
  nav[]{ ${navLinkFields}, children[]{ ${navLinkFields} } }
}`;

const homepageQuery = /* groq */ `{
  "home": *[_id == "homepage"][0]{
    "lead": lead->{ ${storyFields} },
    "secondary": secondary[]->{ ${storyFields} },
    "trending": trending[]->{ ${storyFields} }
  },
  "latest": *[_type == "article" && ${live}] | ${newestFirst}[0...12]{ ${storyFields} },
  "videos": *[_type == "video" && ${live}] | ${newestFirst}[0...4]${videoFields},
  "shows": *[_type == "show" && defined(slug.current)] | order(order asc)${showFields}
}`;

// ---------- Mapping ----------

function toImage(raw: RawImage | undefined | null, fallbackAlt: string): MediaImage {
  if (!raw?.asset?._ref) {
    return { alt: fallbackAlt, source: { placeholder: fallbackAlt } };
  }
  return {
    alt: raw.alt || fallbackAlt,
    credit: raw.credit,
    caption: raw.caption,
    source: { sanity: { asset: raw.asset, crop: raw.crop, hotspot: raw.hotspot } },
  };
}

const categoryHref = (c: { slug: string; parent?: { slug: string } | null }) =>
  c.parent ? `/${c.parent.slug}/${c.slug}/` : `/${c.slug}/`;

const categoryLink = (c: RawCategory): CategoryLink => ({ title: c.title, href: categoryHref(c) });

const sectionOf = (c: RawCategory) => c.parent?.slug ?? c.slug;

function toSeo(raw: RawSeo | undefined): Seo {
  return {
    title: raw?.title,
    description: raw?.description,
    image: raw?.shareImage?.asset ? toImage(raw.shareImage, '') : undefined,
    noindex: raw?.noindex ?? false,
  };
}

function toStory(raw: RawStory): StorySummary {
  return {
    id: raw._id,
    title: raw.title,
    href: `/${sectionOf(raw.category)}/${raw.slug}/`,
    dek: raw.dek,
    label: raw.label,
    category: categoryLink(raw.category),
    image: toImage(raw.heroImage, raw.title),
    hasVideo: raw.hasVideo,
    publishedAt: raw.publishedAt,
  };
}

function toVideo(raw: RawVideo): Video {
  const ytId = youtubeId(raw.youtubeUrl);
  const image: MediaImage =
    raw.thumbnail?.asset?._ref || !ytId
      ? toImage(raw.thumbnail, raw.title)
      : { alt: raw.title, source: { url: `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` } };
  return {
    id: raw._id,
    title: raw.title,
    slug: raw.slug,
    href: `/videos/${raw.slug}/`,
    image,
    duration: raw.duration ?? '',
    publishedAt: raw.publishedAt,
    youtubeId: ytId,
    description: raw.description,
    show: raw.show ? { id: raw.show._id, name: raw.show.name, href: `/originals/${raw.show.slug}/` } : undefined,
    category: raw.category ? categoryLink(raw.category) : undefined,
  };
}

function toShow(raw: RawShow): ShowDetail {
  return {
    id: raw._id,
    name: raw.name,
    slug: raw.slug,
    href: `/originals/${raw.slug}/`,
    image: toImage(raw.cardImage, `${raw.name} show artwork`),
    description: raw.description,
  };
}

function toAuthorSummary(raw: RawAuthor): AuthorSummary {
  return {
    id: raw._id,
    name: raw.name,
    href: `/author/${raw.slug}/`,
    role: raw.role,
    photo: raw.photo?.asset ? toImage(raw.photo, raw.name) : undefined,
  };
}

/** Resolves image, gallery and related-story nodes into view models. */
function toBody(nodes: TypedObject[] | undefined): BodyNode[] {
  return (nodes ?? []).map((node): BodyNode => {
    const n = node as TypedObject & Record<string, unknown> & { _key: string };
    switch (n._type) {
      case 'mediaImage':
        return { _type: 'bodyImage', _key: n._key, image: toImage(n as RawImage, '') };
      case 'gallery':
        return { _type: 'gallery', _key: n._key, images: ((n.images as RawImage[]) ?? []).map((i) => toImage(i, '')) };
      case 'relatedArticle':
        return { _type: 'relatedArticle', _key: n._key, story: n.story ? toStory(n.story as RawStory) : undefined };
      default:
        return node as PortableTextBlock;
    }
  });
}

function toArticle(raw: RawArticle): Article {
  const story = toStory(raw);
  const parent = raw.category.parent;
  return {
    ...story,
    slug: raw.slug,
    section: sectionOf(raw.category),
    categoryId: raw.category._id,
    parentCategory: parent ? { id: parent._id, title: parent.title, href: `/${parent.slug}/` } : undefined,
    authors: (raw.authors ?? []).filter(Boolean).map(toAuthorSummary),
    tags: (raw.tags ?? []).filter(Boolean).map((t) => ({ id: t._id, title: t.title, href: `/tag/${t.slug}/` })),
    body: toBody(raw.body),
    video: raw.video ? toVideo(raw.video) : undefined,
    updatedAt: raw.updatedAt,
    correction: raw.correction,
    seo: toSeo(raw.seo),
  };
}

function toNavItem(raw: RawNavItem): NavItem {
  const base = { label: raw.label, children: (raw.children ?? []).map((c) => toNavItem(c)) };
  switch (raw.kind) {
    case 'category':
      return { ...base, href: raw.category ? categoryHref(raw.category) : '/' };
    case 'page':
      return { ...base, href: raw.pageSlug ? `/${raw.pageSlug}/` : '/' };
    case 'url':
      return { ...base, href: raw.url ?? '/', external: /^https?:\/\//.test(raw.url ?? '') };
    case 'comingSoon':
    default:
      return { ...base, comingSoon: true };
  }
}

/** Fills empty curated slots with the newest stories not already shown. */
function fill(curated: StorySummary[], pool: StorySummary[], count: number, used: Set<string>): StorySummary[] {
  const result = curated.filter((s) => !used.has(s.id)).slice(0, count);
  result.forEach((s) => used.add(s.id));
  for (const s of pool) {
    if (result.length >= count) break;
    if (used.has(s.id)) continue;
    result.push(s);
    used.add(s.id);
  }
  return result;
}

const curatedStories = (list?: (RawStory | null)[]) =>
  (list ?? []).filter((s): s is RawStory => Boolean(s?.category)).map(toStory);

export const sanitySource: ContentSource = {
  async getSiteSettings(): Promise<SiteSettings> {
    const raw = await client.fetch<RawSettings | null>(settingsQuery);
    return {
      name: raw?.name ?? 'HollywoodPest',
      tagline: raw?.tagline ?? 'Social-First Media Company',
      nav: (raw?.nav ?? []).map(toNavItem),
      social: raw?.social ?? [],
      defaultShareImage: raw?.defaultShareImage?.asset ? toImage(raw.defaultShareImage, raw.name ?? 'HollywoodPest') : undefined,
      allowAiTraining: raw?.aiTraining ?? false,
    };
  },

  async getHomepage(): Promise<Homepage> {
    const raw = await client.fetch<{
      home: { lead?: RawStory; secondary?: RawStory[]; trending?: RawStory[] } | null;
      latest: RawStory[];
      videos: RawVideo[];
      shows: RawShow[];
    }>(homepageQuery);

    const latest = raw.latest.map(toStory);
    const used = new Set<string>();

    const [lead] = fill(curatedStories(raw.home?.lead ? [raw.home.lead] : []), latest, 1, used);
    if (!lead) throw new Error('No published articles yet: the homepage needs at least one.');
    const secondary = fill(curatedStories(raw.home?.secondary), latest, 2, used);
    // Trending may repeat stories shown elsewhere on the page.
    const trending = fill(curatedStories(raw.home?.trending), latest, 5, new Set([lead.id]));

    return {
      lead,
      secondary,
      trending,
      latest: latest.filter((s) => !used.has(s.id)).slice(0, 6),
      videos: raw.videos.map(toVideo),
      shows: raw.shows.map(toShow) satisfies Show[],
    };
  },

  async getArticles(): Promise<Article[]> {
    // One request for every article keeps builds within the free API quota.
    // Revisit (page through in chunks) once the archive reaches several thousand stories.
    const raw = await client.fetch<RawArticle[]>(articlesQuery);
    return raw.filter((a) => a.category).map(toArticle);
  },

  async getCategories(): Promise<Category[]> {
    const raw = await client.fetch<(RawCategory & { description?: string; seo?: RawSeo })[]>(
      `*[_type == "category" && defined(slug.current)] | order(order asc){ ..., ${categoryFields.slice(1, -1)}, description, seo${seoFields} }`,
    );
    return raw.map((c) => ({
      id: c._id,
      title: c.title,
      slug: c.slug,
      href: categoryHref(c),
      description: c.description,
      parent: c.parent ? { id: c.parent._id, title: c.parent.title, slug: c.parent.slug, href: `/${c.parent.slug}/` } : undefined,
      seo: toSeo(c.seo),
    }));
  },

  async getTags(): Promise<Tag[]> {
    const raw = await client.fetch<{ _id: string; title: string; slug: string; noindex?: boolean }[]>(
      `*[_type == "tag" && defined(slug.current)] | order(title asc){ _id, title, "slug": slug.current, noindex }`,
    );
    return raw.map((t) => ({ id: t._id, title: t.title, slug: t.slug, href: `/tag/${t.slug}/`, noindex: t.noindex ?? false }));
  },

  async getAuthors(): Promise<Author[]> {
    const raw = await client.fetch<RawAuthor[]>(`*[_type == "author" && defined(slug.current)] | order(name asc)${authorFields}`);
    return raw.map((a) => ({ ...toAuthorSummary(a), slug: a.slug, bio: a.bio ?? '', social: a.social ?? [] }));
  },

  async getVideos(): Promise<Video[]> {
    const raw = await client.fetch<RawVideo[]>(`*[_type == "video" && ${live}] | ${newestFirst}${videoFields}`);
    return raw.map(toVideo);
  },

  async getShows(): Promise<ShowDetail[]> {
    const raw = await client.fetch<RawShow[]>(`*[_type == "show" && defined(slug.current)] | order(order asc)${showFields}`);
    return raw.map(toShow);
  },

  async getPages(): Promise<Page[]> {
    const raw = await client.fetch<{ _id: string; title: string; slug: string; body?: TypedObject[]; seo?: RawSeo }[]>(
      `*[_type == "page" && defined(slug.current)]{ _id, title, "slug": slug.current, body, seo${seoFields} }`,
    );
    return raw.map((p) => ({ id: p._id, title: p.title, slug: p.slug, href: `/${p.slug}/`, body: toBody(p.body), seo: toSeo(p.seo) }));
  },
};
