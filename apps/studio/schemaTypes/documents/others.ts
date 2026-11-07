import { defineArrayMember, defineField, defineType } from 'sanity';
import { DocumentIcon } from '@sanity/icons/Document';
import { FolderIcon } from '@sanity/icons/Folder';
import { PlayIcon } from '@sanity/icons/Play';
import { TagIcon } from '@sanity/icons/Tag';
import { TransferIcon } from '@sanity/icons/Transfer';
import { UserIcon } from '@sanity/icons/User';
import { VideoIcon } from '@sanity/icons/Video';
import { slugOptions, urlSlug } from '../objects/shared';

const YOUTUBE = /(?:youtu\.be\/|[?&]v=|\/(?:shorts|embed|live)\/)([\w-]{11})/;

export const video = defineType({
  name: 'video',
  title: 'Video',
  type: 'document',
  icon: VideoIcon,
  fields: [
    defineField({ name: 'title', type: 'string', validation: (rule) => [rule.required(), rule.max(110)] }),
    defineField({ name: 'slug', title: 'URL', type: 'slug', options: slugOptions, validation: (rule) => rule.required() }),
    defineField({
      name: 'youtubeUrl',
      title: 'YouTube link',
      type: 'url',
      validation: (rule) =>
        rule.required().custom((url) => (!url || YOUTUBE.test(url) ? true : 'Paste a YouTube video or Shorts link.')),
    }),
    defineField({
      name: 'duration',
      type: 'string',
      description: 'Shown on the thumbnail, e.g. 1:38',
      validation: (rule) => rule.required().regex(/^\d{1,2}:\d{2}(:\d{2})?$/, { name: 'm:ss' }),
    }),
    defineField({
      name: 'thumbnail',
      type: 'mediaImage',
      description: "Optional. Uses YouTube's thumbnail when empty.",
    }),
    defineField({ name: 'description', type: 'text', rows: 3 }),
    defineField({ name: 'show', title: 'Original show', type: 'reference', to: [{ type: 'show' }] }),
    defineField({ name: 'category', type: 'reference', to: [{ type: 'category' }] }),
    defineField({ name: 'publishAt', title: 'Publish time', type: 'datetime' }),
  ],
  orderings: [{ title: 'Newest first', name: 'publishAtDesc', by: [{ field: 'publishAt', direction: 'desc' }] }],
  preview: { select: { title: 'title', subtitle: 'duration', media: 'thumbnail' } },
});

export const show = defineType({
  name: 'show',
  title: 'Original show',
  type: 'document',
  icon: PlayIcon,
  fields: [
    defineField({ name: 'name', type: 'string', validation: (rule) => rule.required() }),
    defineField({
      name: 'slug',
      title: 'URL',
      type: 'slug',
      options: { ...slugOptions, source: 'name' },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'cardImage', title: 'Card artwork', type: 'mediaImage', validation: (rule) => rule.required() }),
    defineField({ name: 'description', type: 'text', rows: 3 }),
    defineField({ name: 'order', title: 'Position in the Originals row', type: 'number', initialValue: 10 }),
  ],
  orderings: [{ title: 'Position', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] }],
  preview: { select: { title: 'name', media: 'cardImage' } },
});

export const category = defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  icon: FolderIcon,
  fields: [
    defineField({ name: 'title', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'slug', title: 'URL', type: 'slug', options: slugOptions, validation: (rule) => rule.required().custom(urlSlug(['page', 'article'])) }),
    defineField({
      name: 'parent',
      title: 'Parent section',
      type: 'reference',
      to: [{ type: 'category' }],
      description: 'Leave empty for a top-level section (News, Celebs…). Set it for a sub-category (Music under Celebs).',
      options: {
        // Only top-level sections can be parents, and never the category itself.
        filter: ({ document }) => {
          const id = document._id.replace(/^drafts\./, '');
          return { filter: '!defined(parent) && !(_id in [$id, $draftId])', params: { id, draftId: `drafts.${id}` } };
        },
      },
    }),
    defineField({ name: 'description', type: 'text', rows: 2, description: 'Shown on the category page and in Google.' }),
    defineField({ name: 'order', type: 'number', initialValue: 10 }),
    defineField({ name: 'seo', type: 'seo' }),
  ],
  orderings: [{ title: 'Order', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    select: { title: 'title', parent: 'parent.title' },
    prepare: ({ title, parent }) => ({ title, subtitle: parent ? `in ${parent}` : 'Top-level section' }),
  },
});

export const tag = defineType({
  name: 'tag',
  title: 'Tag',
  type: 'document',
  icon: TagIcon,
  fields: [
    defineField({ name: 'title', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'slug', title: 'URL', type: 'slug', options: slugOptions, validation: (rule) => rule.required() }),
    defineField({
      name: 'noindex',
      title: 'Hide from search engines',
      type: 'boolean',
      initialValue: false,
      description: 'Tag pages with only a few stories are hidden automatically. Use this to always hide this one.',
    }),
  ],
});

export const author = defineType({
  name: 'author',
  title: 'Author',
  type: 'document',
  icon: UserIcon,
  fields: [
    defineField({ name: 'name', type: 'string', validation: (rule) => rule.required() }),
    defineField({
      name: 'slug',
      title: 'URL',
      type: 'slug',
      options: { ...slugOptions, source: 'name' },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'role', type: 'string', description: 'e.g. Senior Entertainment Reporter' }),
    defineField({ name: 'photo', type: 'mediaImage' }),
    defineField({
      name: 'bio',
      type: 'text',
      rows: 4,
      description: 'A few sentences on their beat and experience. Google and AI search use this to judge credibility.',
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'social', title: 'Social profiles', type: 'array', of: [defineArrayMember({ type: 'socialLink' })] }),
  ],
  preview: { select: { title: 'name', subtitle: 'role', media: 'photo' } },
});

export const page = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  icon: DocumentIcon,
  fields: [
    defineField({ name: 'title', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'slug', title: 'URL', type: 'slug', options: slugOptions, validation: (rule) => rule.required().custom(urlSlug(['category'])) }),
    defineField({ name: 'body', type: 'pageBody' }),
    defineField({ name: 'seo', type: 'seo' }),
  ],
});

const startsWithSlash = (v: string | undefined) => (!v || v.startsWith('/') ? true : 'Must start with /');

export const redirect = defineType({
  name: 'redirect',
  title: 'Redirect',
  type: 'document',
  icon: TransferIcon,
  description: 'Sends an old URL to a new one. Created automatically when a published story URL changes.',
  fields: [
    defineField({ name: 'from', type: 'string', description: 'Old path, e.g. /news/old-headline/', validation: (rule) => rule.required().custom(startsWithSlash) }),
    defineField({ name: 'to', type: 'string', description: 'New path, e.g. /news/new-headline/', validation: (rule) => rule.required().custom(startsWithSlash) }),
    defineField({ name: 'permanent', type: 'boolean', initialValue: true }),
  ],
  preview: {
    select: { from: 'from', to: 'to' },
    prepare: ({ from, to }) => ({ title: `${from ?? '?'} → ${to ?? '?'}` }),
  },
});
