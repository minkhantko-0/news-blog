/**
 * View models used by the components.
 *
 * Components only know these shapes, never raw Sanity documents. This keeps the
 * design independent of the CMS: a content source (Sanity or the local sample
 * content) maps its data into these types.
 */

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
   * thumbnail), or a placeholder seed for local sample content.
   */
  source: { sanity: SanityImageSource } | { url: string } | { placeholder: string };
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

export interface VideoSummary {
  id: string;
  title: string;
  href: string;
  image: MediaImage;
  /** e.g. "1:38" */
  duration: string;
  publishedAt: string;
}

export interface Show {
  id: string;
  name: string;
  href: string;
  image: MediaImage;
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
}
