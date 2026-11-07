import { createImageUrlBuilder } from '@sanity/image-url';
import type { MediaImage } from './content/types';

const builder = createImageUrlBuilder({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID || 'placeholder',
  dataset: import.meta.env.PUBLIC_SANITY_DATASET || 'production',
});

/**
 * The fixed set of widths every image is served at. Keeping this list short
 * keeps the number of distinct image variants (and CDN usage) low.
 */
export const IMAGE_WIDTHS = [400, 800, 1200, 1600] as const;

/** URL for one rendition of an image, cropped to the given size. */
export function imageUrl(image: MediaImage, width: number, height: number): string {
  if ('placeholder' in image.source) {
    return `https://picsum.photos/seed/${encodeURIComponent(image.source.placeholder)}/${width}/${height}.webp`;
  }
  if ('url' in image.source) {
    return image.source.url;
  }
  // Sanity serves AVIF/WebP automatically with auto('format').
  return builder
    .image(image.source.sanity)
    .width(width)
    .height(height)
    .fit('crop')
    .auto('format')
    .quality(75)
    .url();
}

export interface ResponsiveImage {
  src: string;
  srcset: string;
  width: number;
  height: number;
}

/**
 * Builds src/srcset for an image at a fixed aspect ratio, capped at `maxWidth`.
 */
export function responsiveImage(image: MediaImage, aspect: [number, number], maxWidth = 1600): ResponsiveImage {
  const [aw, ah] = aspect;
  const widths = IMAGE_WIDTHS.filter((w) => w <= maxWidth);
  const height = (w: number) => Math.round((w * ah) / aw);
  const largest = widths[widths.length - 1] ?? IMAGE_WIDTHS[0];
  return {
    src: imageUrl(image, largest, height(largest)),
    srcset: widths.map((w) => `${imageUrl(image, w, height(w))} ${w}w`).join(', '),
    width: largest,
    height: height(largest),
  };
}
