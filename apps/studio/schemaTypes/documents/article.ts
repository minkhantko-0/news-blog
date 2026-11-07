import { defineArrayMember, defineField, defineType } from 'sanity';
import { DocumentTextIcon } from '@sanity/icons/DocumentText';
import { slugOptions } from '../objects/shared';

const LABELS = { breaking: 'Breaking', exclusive: 'Exclusive', developing: 'Developing' } as const;

export const article = defineType({
  name: 'article',
  title: 'Article',
  type: 'document',
  icon: DocumentTextIcon,
  groups: [
    { name: 'story', title: 'Story', default: true },
    { name: 'publishing', title: 'Publishing' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Headline',
      type: 'string',
      group: 'story',
      validation: (rule) => [
        rule.required(),
        rule.max(110).warning('Long headlines get cut off on cards and in Google.'),
      ],
    }),
    defineField({
      name: 'slug',
      title: 'URL',
      type: 'slug',
      group: 'story',
      options: slugOptions,
      description: 'Generated from the headline. Avoid changing it after publishing: the old link will break.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'dek',
      title: 'Summary (dek)',
      type: 'text',
      rows: 2,
      group: 'story',
      description:
        'One sentence with the key facts: who, what, when. Shown under the headline and used by Google and AI search when quoting the story.',
      validation: (rule) => [rule.required(), rule.max(200)],
    }),
    defineField({
      name: 'label',
      type: 'string',
      group: 'story',
      description: 'Optional gold tag on cards. Shows the category when empty.',
      options: {
        list: Object.entries(LABELS).map(([value, title]) => ({ title, value })),
        layout: 'radio',
        direction: 'horizontal',
      },
    }),
    defineField({
      name: 'category',
      type: 'reference',
      to: [{ type: 'category' }],
      group: 'story',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'heroImage',
      title: 'Main image',
      type: 'mediaImage',
      group: 'story',
      validation: (rule) =>
        rule.required().custom((img: { asset?: unknown; credit?: string } | undefined) =>
          img?.asset && !img.credit ? 'Add a photo credit (who owns this photo).' : true,
        ),
    }),
    defineField({
      name: 'video',
      title: 'Lead video',
      type: 'reference',
      to: [{ type: 'video' }],
      group: 'story',
      description: 'Optional. Shows the play button on cards and the player at the top of the story.',
    }),
    defineField({
      name: 'body',
      type: 'articleBody',
      group: 'story',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'authors',
      title: 'Byline',
      type: 'array',
      group: 'story',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'author' }] })],
      validation: (rule) => rule.required().min(1).unique(),
    }),
    defineField({
      name: 'tags',
      type: 'array',
      group: 'story',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'tag' }] })],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'publishAt',
      title: 'Publish time',
      type: 'datetime',
      group: 'publishing',
      description:
        'Leave empty to use the time you press Publish. To schedule: set a future time and keep the story as a draft (don\'t press Publish). It goes live automatically within 5 minutes of that time.',
    }),
    defineField({
      name: 'updatedAt',
      title: 'Last meaningful update',
      type: 'datetime',
      group: 'publishing',
      description: 'Set only when you add new facts. Leave alone for typo fixes, so readers and Google see honest "Updated" times.',
    }),
    defineField({
      name: 'correction',
      title: 'Correction note',
      type: 'text',
      rows: 2,
      group: 'publishing',
      description: 'Shown at the end of the story, e.g. "An earlier version misstated the date of the hearing."',
    }),
    defineField({ name: 'seo', type: 'seo', group: 'seo' }),
  ],
  orderings: [
    {
      title: 'Newest first',
      name: 'publishAtDesc',
      by: [
        { field: 'publishAt', direction: 'desc' },
        { field: '_createdAt', direction: 'desc' },
      ],
    },
  ],
  preview: {
    select: { title: 'title', category: 'category.title', label: 'label', media: 'heroImage', publishAt: 'publishAt' },
    prepare: ({ title, category, label, media, publishAt }) => ({
      title,
      media,
      subtitle: [
        label ? LABELS[label as keyof typeof LABELS] : null,
        category,
        publishAt ? new Date(publishAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : null,
      ]
        .filter(Boolean)
        .join(' · '),
    }),
  },
});
