/** Site-wide SEO settings. */
import type { MediaImage, SocialLink } from '../content';
import { imageUrl } from '../images';

/** Absolute site URL, from `site` in astro.config (PUBLIC_SITE_URL). */
export const SITE_URL = (import.meta.env.SITE ?? 'https://hollywoodpest.example').replace(/\/$/, '');

/** Publication name, exactly as registered in Google Publisher Center. */
export const PUBLICATION_NAME = 'HollywoodPest';
export const LANGUAGE = 'en';
export const LOCALE = 'en_US';

/**
 * Search engines may index the site only when PUBLIC_ALLOW_INDEXING=true
 * (set at launch). Previews and local builds stay out of search results.
 */
export const ALLOW_INDEXING = import.meta.env.PUBLIC_ALLOW_INDEXING === 'true';

export const absolute = (path: string) => new URL(path, `${SITE_URL}/`).href;

/** Built-in placeholder brand images in /public: replace them with the real logo files when available. */
export const DEFAULT_SHARE_IMAGE = { url: absolute('/og-default.png'), width: 1200, height: 630 };
export const LOGO = { url: absolute('/logo-512.png'), width: 512, height: 512 };

/** Share-image URL at 1200×630, the size Facebook, X and LinkedIn expect. */
export function shareImage(image: MediaImage | undefined): { url: string; width: number; height: number; alt: string } {
  if (!image || 'placeholder' in image.source) return { ...DEFAULT_SHARE_IMAGE, alt: PUBLICATION_NAME };
  return { url: imageUrl(image, 1200, 630), width: 1200, height: 630, alt: image.alt };
}

/**
 * Social profiles that really are ours: drops placeholder links that point at
 * a platform's home page rather than an account.
 */
export function officialProfiles(links: SocialLink[]): string[] {
  return links
    .map((l) => l.url)
    .filter((url) => {
      try {
        return new URL(url).pathname.replace(/\/+$/, '') !== '';
      } catch {
        return false;
      }
    });
}

/** "@handle" from an x.com / twitter.com profile link, for twitter:site. */
export function xHandle(links: SocialLink[]): string | undefined {
  const x = links.find((l) => l.platform === 'x');
  const handle = x?.url.match(/(?:x|twitter)\.com\/@?([A-Za-z0-9_]{1,15})\/?$/)?.[1];
  return handle ? `@${handle}` : undefined;
}
