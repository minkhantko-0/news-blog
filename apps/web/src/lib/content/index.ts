import { sanitySource } from './sanity';
import type { ContentSource } from './types';

export type * from './types';

/**
 * In production builds every page shares one fetch per query (each list is
 * needed by many pages). In dev, always fetch fresh so CMS edits show up.
 */
function memoize(source: ContentSource): ContentSource {
  const cache = new Map<string, Promise<unknown>>();
  return Object.fromEntries(
    Object.entries(source).map(([name, fn]) => [
      name,
      () => {
        if (!cache.has(name)) cache.set(name, (fn as () => Promise<unknown>)());
        return cache.get(name);
      },
    ]),
  ) as unknown as ContentSource;
}

export const content: ContentSource = import.meta.env.PROD ? memoize(sanitySource) : sanitySource;
