/**
 * View models used by the components.
 *
 * Components only know these shapes, never raw Sanity documents. This keeps the
 * design independent of the CMS: ./sanity.ts maps CMS data into these types.
 */
import type { PortableTextBlock, TypedObject } from '@portabletext/types';

export interface SanityImageSource {
  asset: { _ref: string };
  crop?: { top: number; bottom: number; left: number; right: number };
  hotspot?: { x: number; y: number; height: number; width: number };
}

export interface MediaImage {
  alt: string;
  credit?: string;
  caption?: string;
  /**
   * Sanity image (resized on the fly), a fixed remote URL (e.g. a YouTube
   * thumbnail), or a placeholder seed.
   */
  source: { sanity: SanityImageSource } | { url: string } | { placeholder: string };
}

export interface Seo {
  title?: string;
  description?: string;
  image?: MediaImage;
  noindex: boolean;
}

export type StoryLabel = 'breaking' | 'exclusive' | 'developing';

export interface CategoryLink {
  title: string;
  href: string;
}

export interface StorySummary {
  id: string;
  title: string;
  href: string;
  dek?: string;
  category: CategoryLink;
  label?: StoryLabel;
  image: MediaImage;
  /** Story leads with a video: cards show a play badge. */
  hasVideo: boolean;
  /** ISO 8601 */
  publishedAt: string;
}

export interface AuthorSummary {
  id: string;
  name: string;
  href: string;
  role?: string;
  photo?: MediaImage;
}

export interface Author extends AuthorSummary {
  slug: string;
  bio: string;
  social: SocialLink[];
}

export interface TagLink {
  id: string;
  title: string;
  href: string;
}

export interface Tag extends TagLink {
  slug: string;
  noindex: boolean;
}

export interface VideoSummary {
  id: string;
  title: string;
  href: string;
  image: MediaImage;
  /** e.g. "1:38" */
  duration: string;
  publishedAt: string;
}

export interface Video extends VideoSummary {
  slug: string;
  youtubeId?: string;
  description?: string;
  show?: { id: string; name: string; href: string };
  category?: CategoryLink;
}

/** Body nodes after mapping: images and related stories are resolved. */
export type BodyNode =
  | PortableTextBlock
  | { _type: 'bodyImage'; _key: string; image: MediaImage }
  | { _type: 'gallery'; _key: string; images: MediaImage[] }
  | { _type: 'socialEmbed'; _key: string; url: string }
  | { _type: 'pullQuote'; _key: string; quote: string; attribution?: string }
  | { _type: 'relatedArticle'; _key: string; story?: StorySummary }
  | TypedObject;

export interface Article extends StorySummary {
  slug: string;
  /** Top-level section slug, the first URL segment. */
  section: string;
  categoryId: string;
  /** Set when the category is a sub-category. */
  parentCategory?: { id: string; title: string; href: string };
  authors: AuthorSummary[];
  tags: TagLink[];
  body: BodyNode[];
  video?: Video;
  updatedAt?: string;
  correction?: string;
  seo: Seo;
}

export interface Category {
  id: string;
  title: string;
  slug: string;
  href: string;
  description?: string;
  parent?: { id: string; title: string; slug: string; href: string };
  seo: Seo;
}

export interface Show {
  id: string;
  name: string;
  href: string;
  image: MediaImage;
}

export interface ShowDetail extends Show {
  slug: string;
  description?: string;
}

export interface Page {
  id: string;
  title: string;
  slug: string;
  href: string;
  body: BodyNode[];
  seo: Seo;
}

export interface NavItem {
  label: string;
  /** Absent when `comingSoon` is true. */
  href?: string;
  external?: boolean;
  /** Opens the "Coming soon" popup instead of navigating. */
  comingSoon?: boolean;
  children: NavItem[];
}

export type SocialPlatform = 'instagram' | 'tiktok' | 'facebook' | 'youtube' | 'x';

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
}

export interface SiteSettings {
  name: string;
  tagline: string;
  nav: NavItem[];
  social: SocialLink[];
}

export interface Homepage {
  lead: StorySummary;
  secondary: StorySummary[];
  trending: StorySummary[];
  shows: Show[];
  latest: StorySummary[];
  videos: VideoSummary[];
}

export interface ContentSource {
  getSiteSettings(): Promise<SiteSettings>;
  getHomepage(): Promise<Homepage>;
  /** All published articles, newest first. */
  getArticles(): Promise<Article[]>;
  getCategories(): Promise<Category[]>;
  getTags(): Promise<Tag[]>;
  getAuthors(): Promise<Author[]>;
  /** All published videos, newest first. */
  getVideos(): Promise<Video[]>;
  getShows(): Promise<ShowDetail[]>;
  getPages(): Promise<Page[]>;
}
