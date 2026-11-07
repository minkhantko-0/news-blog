import { defineArrayMember, defineField, defineType } from 'sanity';
import { CogIcon } from '@sanity/icons/Cog';
import { HomeIcon } from '@sanity/icons/Home';

export const homepage = defineType({
  name: 'homepage',
  title: 'Homepage',
  type: 'document',
  icon: HomeIcon,
  description: 'Pick the top stories. Any empty slot fills automatically with the newest stories.',
  fields: [
    defineField({
      name: 'lead',
      title: 'Lead story',
      type: 'reference',
      to: [{ type: 'article' }],
      description: 'The big story at the top.',
    }),
    defineField({
      name: 'secondary',
      title: 'Next to the lead',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'article' }] })],
      validation: (rule) => rule.max(2).unique(),
    }),
    defineField({
      name: 'trending',
      title: 'Trending Now',
      type: 'array',
      description: 'Up to 5, in order. Drag to reorder.',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'article' }] })],
      validation: (rule) => rule.max(5).unique(),
    }),
  ],
  preview: { prepare: () => ({ title: 'Homepage' }) },
});

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  icon: CogIcon,
  fields: [
    defineField({ name: 'name', title: 'Site name', type: 'string', initialValue: 'HollywoodPest', validation: (rule) => rule.required() }),
    defineField({ name: 'tagline', type: 'string', initialValue: 'Social-First Media Company' }),
    defineField({
      name: 'nav',
      title: 'Main menu',
      type: 'array',
      of: [defineArrayMember({ type: 'navItem' })],
      description: 'Top-level menu items, in order. Each can have dropdown links.',
    }),
    defineField({
      name: 'social',
      title: 'Social accounts',
      type: 'array',
      of: [defineArrayMember({ type: 'socialLink' })],
      description: 'Shown in the header and footer, and told to Google as your official profiles.',
    }),
    defineField({
      name: 'defaultShareImage',
      title: 'Default share image',
      type: 'mediaImage',
      description: 'Shown when a page without its own image is shared on social media. 1200×630. Leave empty to use the built-in branded image.',
    }),
    defineField({
      name: 'aiTraining',
      title: 'Allow AI training crawlers',
      type: 'boolean',
      initialValue: false,
      description:
        'AI search and answer engines (ChatGPT search, Perplexity, Claude, Google AI Overviews) can always read and cite our stories. This switch is only about letting AI companies copy stories to train their models (GPTBot, ClaudeBot, Google-Extended, CCBot…). Takes effect on the next publish.',
    }),
  ],
  preview: { prepare: () => ({ title: 'Site settings' }) },
});

export const SINGLETON_TYPES = new Set(['homepage', 'siteSettings']);
