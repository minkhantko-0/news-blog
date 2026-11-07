import { defineArrayMember, defineField, defineType, type SlugOptions } from 'sanity';
import { BlockquoteIcon } from '@sanity/icons/Blockquote';
import { DocumentTextIcon } from '@sanity/icons/DocumentText';
import { ImageIcon } from '@sanity/icons/Image';
import { ImagesIcon } from '@sanity/icons/Images';
import { LinkIcon } from '@sanity/icons/Link';
import { PlayIcon } from '@sanity/icons/Play';

/** URL-safe slug: lowercase, apostrophes dropped, max 96 chars. */
export const slugOptions: SlugOptions = {
  source: 'title',
  maxLength: 96,
  slugify: (input) =>
    input
      .toLowerCase()
      .replace(/['’]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 96),
};

/** First path segments the site itself uses. Categories and pages can't take these. */
export const RESERVED_SLUGS = [
  'videos',
  'originals',
  'search',
  'tag',
  'author',
  'news-tip',
  'advertise',
  'coming-soon',
  'api',
  'page',
  'pagefind',
  'rss',
  'sitemap',
];

/**
 * Validates a slug that becomes part of a URL shared with other document
 * types: blocks reserved words and slugs already used by `clashTypes`.
 * (Categories and pages share /<slug>/; articles and sub-categories share /<section>/<slug>/.)
 */
export const urlSlug =
  (clashTypes: string[]) =>
  async (value: { current?: string } | undefined, context: { getClient: (o: { apiVersion: string }) => { fetch: <T>(q: string, p: Record<string, unknown>) => Promise<T> } }) => {
    const current = value?.current;
    if (!current) return true;
    if (RESERVED_SLUGS.includes(current)) return `"${current}" is used by the site itself. Pick another URL.`;
    const clash = await context
      .getClient({ apiVersion: '2026-11-01' })
      .fetch<string | null>('*[_type in $types && slug.current == $slug][0]._type', { types: clashTypes, slug: current });
    return clash ? `A ${clash} already uses this URL. Pick another.` : true;
  };

/** Image with the fields every published image needs. */
export const mediaImage = defineType({
  name: 'mediaImage',
  title: 'Image',
  type: 'image',
  icon: ImageIcon,
  options: { hotspot: true },
  fields: [
    defineField({
      name: 'alt',
      title: 'Alt text',
      type: 'string',
      description: 'Describe the image for screen readers and search engines, e.g. "Singer on stage in Atlanta".',
      validation: (rule) => rule.required().max(160),
    }),
    defineField({
      name: 'caption',
      type: 'string',
    }),
    defineField({
      name: 'credit',
      type: 'string',
      description: 'Photographer / agency, e.g. "Getty Images". Required for licensed photos.',
    }),
  ],
});

export const seo = defineType({
  name: 'seo',
  title: 'SEO & sharing',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({
      name: 'title',
      title: 'Search title',
      type: 'string',
      description: 'Shown in Google. Defaults to the headline. Aim for 70 characters or fewer.',
      validation: (rule) => rule.max(70).warning('Google usually cuts titles longer than ~70 characters.'),
    }),
    defineField({
      name: 'description',
      title: 'Search description',
      type: 'text',
      rows: 3,
      description: 'Shown in Google under the title. Defaults to the dek. Aim for 120–160 characters.',
      validation: (rule) => rule.max(160).warning('Google usually cuts descriptions longer than ~160 characters.'),
    }),
    defineField({
      name: 'shareImage',
      title: 'Social share image',
      type: 'mediaImage',
      description: 'Used for Facebook, X and Google Discover. Defaults to the hero image. At least 1200px wide.',
    }),
    defineField({
      name: 'noindex',
      title: 'Hide from search engines',
      type: 'boolean',
      initialValue: false,
    }),
  ],
});

export const socialLink = defineType({
  name: 'socialLink',
  title: 'Social link',
  type: 'object',
  fields: [
    defineField({
      name: 'platform',
      type: 'string',
      options: {
        list: [
          { title: 'Instagram', value: 'instagram' },
          { title: 'TikTok', value: 'tiktok' },
          { title: 'Facebook', value: 'facebook' },
          { title: 'YouTube', value: 'youtube' },
          { title: 'X', value: 'x' },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'url', title: 'URL', type: 'url', validation: (rule) => rule.required() }),
  ],
  preview: { select: { title: 'platform', subtitle: 'url' } },
});

const EMBED_HOSTS = ['instagram.com', 'tiktok.com', 'x.com', 'twitter.com', 'youtube.com', 'youtu.be', 'facebook.com'];

export const socialEmbed = defineType({
  name: 'socialEmbed',
  title: 'Social post',
  type: 'object',
  icon: PlayIcon,
  description: 'Paste the link to an Instagram, TikTok, X, YouTube or Facebook post.',
  fields: [
    defineField({
      name: 'url',
      title: 'Post URL',
      type: 'url',
      validation: (rule) =>
        rule.required().custom((url) => {
          if (!url) return true;
          try {
            const host = new URL(url).hostname.replace(/^www\./, '');
            return EMBED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))
              ? true
              : 'Use a link from Instagram, TikTok, X, YouTube or Facebook.';
          } catch {
            return 'Not a valid URL.';
          }
        }),
    }),
  ],
  preview: { select: { title: 'url' }, prepare: ({ title }) => ({ title: title ?? 'Social post', subtitle: 'Social post' }) },
});

export const pullQuote = defineType({
  name: 'pullQuote',
  title: 'Pull quote',
  type: 'object',
  icon: BlockquoteIcon,
  fields: [
    defineField({ name: 'quote', type: 'text', rows: 3, validation: (rule) => rule.required() }),
    defineField({ name: 'attribution', type: 'string' }),
  ],
  preview: { select: { title: 'quote', subtitle: 'attribution' } },
});

export const gallery = defineType({
  name: 'gallery',
  title: 'Photo gallery',
  type: 'object',
  icon: ImagesIcon,
  fields: [
    defineField({
      name: 'images',
      type: 'array',
      of: [defineArrayMember({ type: 'mediaImage' })],
      options: { layout: 'grid' },
      validation: (rule) => rule.required().min(2),
    }),
  ],
  preview: {
    select: { images: 'images', image: 'images.0' },
    prepare: ({ images, image }) => ({
      title: `Gallery (${Object.keys(images ?? {}).length} photos)`,
      media: image,
    }),
  },
});

export const relatedArticle = defineType({
  name: 'relatedArticle',
  title: 'Related story',
  type: 'object',
  icon: DocumentTextIcon,
  fields: [defineField({ name: 'article', type: 'reference', to: [{ type: 'article' }], validation: (rule) => rule.required() })],
  preview: {
    select: { title: 'article.title' },
    prepare: ({ title }) => ({ title: title ?? 'Related story', subtitle: 'Related story' }),
  },
});

const linkAnnotation = defineArrayMember({
  name: 'link',
  type: 'object',
  title: 'Link',
  icon: LinkIcon,
  fields: [
    defineField({
      name: 'href',
      title: 'URL',
      type: 'url',
      validation: (rule) => rule.required().uri({ allowRelative: true, scheme: ['http', 'https', 'mailto'] }),
    }),
  ],
});

/** Rich text for article bodies. */
export const articleBody = defineType({
  name: 'articleBody',
  title: 'Body',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        { title: 'Normal', value: 'normal' },
        { title: 'Heading', value: 'h2' },
        { title: 'Subheading', value: 'h3' },
      ],
      lists: [
        { title: 'Bullets', value: 'bullet' },
        { title: 'Numbered', value: 'number' },
      ],
      marks: {
        decorators: [
          { title: 'Bold', value: 'strong' },
          { title: 'Italic', value: 'em' },
        ],
        annotations: [linkAnnotation],
      },
    }),
    defineArrayMember({ type: 'mediaImage' }),
    defineArrayMember({ type: 'socialEmbed' }),
    defineArrayMember({ type: 'pullQuote' }),
    defineArrayMember({ type: 'gallery' }),
    defineArrayMember({ type: 'relatedArticle' }),
  ],
});

/** Simpler rich text for static pages (About, Privacy...). */
export const pageBody = defineType({
  name: 'pageBody',
  title: 'Body',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        { title: 'Normal', value: 'normal' },
        { title: 'Heading', value: 'h2' },
        { title: 'Subheading', value: 'h3' },
      ],
      marks: {
        decorators: [
          { title: 'Bold', value: 'strong' },
          { title: 'Italic', value: 'em' },
        ],
        annotations: [linkAnnotation],
      },
    }),
    defineArrayMember({ type: 'mediaImage' }),
  ],
});

/** Shared by nav items and their dropdown children. */
const navLinkFields = [
  defineField({ name: 'label', type: 'string', validation: (rule) => rule.required() }),
  defineField({
    name: 'kind',
    title: 'Links to',
    type: 'string',
    initialValue: 'category',
    options: {
      list: [
        { title: 'Category', value: 'category' },
        { title: 'Page', value: 'page' },
        { title: 'Web address', value: 'url' },
        { title: '"Coming soon" popup', value: 'comingSoon' },
      ],
      layout: 'radio',
      direction: 'horizontal',
    },
    validation: (rule) => rule.required(),
  }),
  defineField({
    name: 'category',
    type: 'reference',
    to: [{ type: 'category' }],
    hidden: ({ parent }) => parent?.kind !== 'category',
    validation: (rule) =>
      rule.custom((value, ctx) => ((ctx.parent as { kind?: string })?.kind === 'category' && !value ? 'Pick a category' : true)),
  }),
  defineField({
    name: 'page',
    type: 'reference',
    to: [{ type: 'page' }],
    hidden: ({ parent }) => parent?.kind !== 'page',
    validation: (rule) =>
      rule.custom((value, ctx) => ((ctx.parent as { kind?: string })?.kind === 'page' && !value ? 'Pick a page' : true)),
  }),
  defineField({
    name: 'url',
    title: 'Web address',
    type: 'url',
    description: 'A path on this site (e.g. /videos/) or a full link to another site (opens in a new tab).',
    hidden: ({ parent }) => parent?.kind !== 'url',
    validation: (rule) => [
      rule.uri({ allowRelative: true, scheme: ['http', 'https'] }),
      rule.custom((value, ctx) => ((ctx.parent as { kind?: string })?.kind === 'url' && !value ? 'Enter a web address' : true)),
    ],
  }),
];

const navPreview = {
  select: { title: 'label', kind: 'kind', category: 'category.title', page: 'page.title', url: 'url' },
  prepare: ({ title, kind, category, page, url }: Record<string, string | undefined>) => ({
    title,
    subtitle: kind === 'comingSoon' ? 'Coming soon popup' : (category ?? page ?? url ?? ''),
  }),
};

export const navLink = defineType({
  name: 'navLink',
  title: 'Dropdown link',
  type: 'object',
  fields: navLinkFields,
  preview: navPreview,
});

export const navItem = defineType({
  name: 'navItem',
  title: 'Menu item',
  type: 'object',
  fields: [
    ...navLinkFields,
    defineField({
      name: 'children',
      title: 'Dropdown links',
      type: 'array',
      of: [defineArrayMember({ type: 'navLink' })],
    }),
  ],
  preview: navPreview,
});

export const objectTypes = [
  mediaImage,
  seo,
  socialLink,
  socialEmbed,
  pullQuote,
  gallery,
  relatedArticle,
  articleBody,
  pageBody,
  navLink,
  navItem,
];
