import { fixtureSource } from './fixtures';
import type { ContentSource } from './types';

export type * from './types';

/**
 * The content source used by every page.
 *
 * Until a Sanity project is connected (PUBLIC_SANITY_PROJECT_ID), pages render
 * the local sample content so the design can be built and checked offline.
 */
async function resolveSource(): Promise<ContentSource> {
  if (import.meta.env.PUBLIC_SANITY_PROJECT_ID) {
    const { sanitySource } = await import('./sanity');
    return sanitySource;
  }
  return fixtureSource;
}

const once = <T>(fn: () => Promise<T>) => {
  let pending: Promise<T> | undefined;
  return () => (pending ??= fn());
};

const source = await resolveSource();

/**
 * In production builds every page shares one fetch per query (settings are
 * needed by every page). In dev, always fetch fresh so edits show up.
 */
export const content: ContentSource = import.meta.env.PROD
  ? { getSiteSettings: once(source.getSiteSettings), getHomepage: once(source.getHomepage) }
  : source;
