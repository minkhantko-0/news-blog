/**
 * Sanity content source. Maps CMS documents (schemas in apps/studio/schemas)
 * into the view models in ./types.
 *
 * Reads only published content through the API CDN, with no token. Drafts and
 * scheduled stories stay private.
 */
import { createClient } from '@sanity/client';
import type {
  CategoryLink,
  ContentSource,
  Homepage,
  MediaImage,
  NavItem,
  SanityImageSource,
  Show,
  SiteSettings,
  SocialLink,
  StoryLabel,
  StorySummary,
  VideoSummary,
} from './types';

const client = createClient({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID,
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
  title: string;
  slug: string;
  parentSlug?: string;
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

interface RawVideo {
  _id: string;
  title: string;
  slug: string;
  youtubeUrl?: string;
  duration?: string;
  thumbnail?: RawImage;
  publishedAt: string;
}

interface RawShow {
  _id: string;
  name: string;
  slug: string;
  cardImage?: RawImage;
}

interface RawNavLink {
  label: string;
  kind: 'category' | 'page' | 'url' | 'comingSoon';
  category?: RawCategory;
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
}

// ---------- GROQ ----------

const live = /* groq */ `defined(slug.current) && coalesce(publishAt, _createdAt) <= now()`;

const imageFields = /* groq */ `{ alt, credit, caption, asset, crop, hotspot }`;

const categoryFields = /* groq */ `{ title, "slug": slug.current, "parentSlug": parent->slug.current }`;

const storyFields = /* groq */ `{
  _id, title, "slug": slug.current, dek, label,
  "category": category->${categoryFields},
  heroImage${imageFields},
  "hasVideo": defined(video),
  "publishedAt": coalesce(publishAt, _createdAt)
}`;

const showFields = /* groq */ `{ _id, name, "slug": slug.current, cardImage${imageFields} }`;

const videoFields = /* groq */ `{
  _id, title, "slug": slug.current, youtubeUrl, duration,
  thumbnail${imageFields},
  "publishedAt": coalesce(publishAt, _createdAt)
}`;

const navLinkFields = /* groq */ `label, kind, url, "pageSlug": page->slug.current, "category": category->${categoryFields}`;

const settingsQuery = /* groq */ `*[_id == "siteSettings"][0]{
  name, tagline, social,
  nav[]{ ${navLinkFields}, children[]{ ${navLinkFields} } }
}`;

const homepageQuery = /* groq */ `{
  "home": *[_id == "homepage"][0]{
    "lead": lead->${storyFields},
    "secondary": secondary[]->${storyFields},
    "trending": trending[]->${storyFields}
  },
  "latest": *[_type == "article" && ${live}] | order(coalesce(publishAt, _createdAt) desc)[0...12]${storyFields},
  "videos": *[_type == "video" && ${live}] | order(coalesce(publishAt, _createdAt) desc)[0...4]${videoFields},
  "shows": *[_type == "show" && defined(slug.current)] | order(order asc)${showFields}
}`;

// ---------- Mapping ----------

function toImage(raw: RawImage | undefined, fallbackAlt: string): MediaImage {
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

function categoryLink(c: RawCategory): CategoryLink {
  return {
    title: c.title,
    href: c.parentSlug ? `/${c.parentSlug}/${c.slug}/` : `/${c.slug}/`,
  };
}

function toStory(raw: RawStory): StorySummary {
  const section = raw.category.parentSlug ?? raw.category.slug;
  return {
    id: raw._id,
    title: raw.title,
    href: `/${section}/${raw.slug}/`,
    dek: raw.dek,
    label: raw.label,
    category: categoryLink(raw.category),
    image: toImage(raw.heroImage, raw.title),
    hasVideo: raw.hasVideo,
    publishedAt: raw.publishedAt,
  };
}

/** Extracts the video ID from youtube.com/watch?v=, youtu.be/, /shorts/ and /embed/ URLs. */
export function youtubeId(url: string | undefined): string | undefined {
  return url?.match(/(?:youtu\.be\/|[?&]v=|\/(?:shorts|embed|live)\/)([\w-]{11})/)?.[1];
}

function toVideo(raw: RawVideo): VideoSummary {
  const ytId = youtubeId(raw.youtubeUrl);
  const image: MediaImage =
    raw.thumbnail?.asset?._ref || !ytId
      ? toImage(raw.thumbnail, raw.title)
      : { alt: raw.title, source: { url: `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` } };
  return {
    id: raw._id,
    title: raw.title,
    href: `/videos/${raw.slug}/`,
    image,
    duration: raw.duration ?? '',
    publishedAt: raw.publishedAt,
  };
}

function toShow(raw: RawShow): Show {
  return {
    id: raw._id,
    name: raw.name,
    href: `/originals/${raw.slug}/`,
    image: toImage(raw.cardImage, `${raw.name} show artwork`),
  };
}

function toNavItem(raw: RawNavItem): NavItem {
  const base = { label: raw.label, children: (raw.children ?? []).map((c) => toNavItem(c)) };
  switch (raw.kind) {
    case 'category':
      return { ...base, href: raw.category ? categoryLink(raw.category).href : '/' };
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

export const sanitySource: ContentSource = {
  async getSiteSettings(): Promise<SiteSettings> {
    const raw = await client.fetch<RawSettings | null>(settingsQuery);
    return {
      name: raw?.name ?? 'HollywoodPest',
      tagline: raw?.tagline ?? 'Social-First Media Company',
      nav: (raw?.nav ?? []).map(toNavItem),
      social: raw?.social ?? [],
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
    const curated = (list?: (RawStory | null)[]) => (list ?? []).filter((s): s is RawStory => Boolean(s)).map(toStory);

    const [lead] = fill(curated(raw.home?.lead ? [raw.home.lead] : []), latest, 1, used);
    if (!lead) throw new Error('No published articles yet: the homepage needs at least one.');
    const secondary = fill(curated(raw.home?.secondary), latest, 2, used);
    // Trending may repeat stories shown elsewhere on the page.
    const trending = fill(curated(raw.home?.trending), latest, 5, new Set([lead.id]));

    return {
      lead,
      secondary,
      trending,
      latest: latest.filter((s) => !used.has(s.id)).slice(0, 6),
      videos: raw.videos.map(toVideo),
      shows: raw.shows.map(toShow),
    };
  },
};
