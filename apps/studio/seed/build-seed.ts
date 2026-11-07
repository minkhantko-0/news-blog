/**
 * Builds sample.ndjson for `sanity dataset import` from ./sample-content.ts.
 *
 * Usage (from the repo root):
 *   pnpm seed:build
 *   pnpm seed:import   (replaces documents with the same IDs)
 */
import * as sample from './sample-content.ts';

type Doc = Record<string, unknown> & { _id: string; _type: string };

const HOUR = 60 * 60 * 1000;
const hoursAgo = (h: number) => new Date(Date.now() - h * HOUR).toISOString();

let keyCounter = 0;
const key = () => `k${(++keyCounter).toString(36).padStart(6, '0')}`;
const ref = (id: string) => ({ _type: 'reference', _ref: id });
const keyedRef = (id: string) => ({ _key: key(), ...ref(id) });
const slug = (current: string) => ({ _type: 'slug', current });

const image = (seed: string, alt: string) => ({
  _type: 'mediaImage',
  _sanityAsset: `image@https://picsum.photos/seed/${encodeURIComponent(seed)}/1600/1000.jpg`,
  alt,
  credit: 'Placeholder photo (Lorem Picsum)',
});

const block = (text: string, style = 'normal') => ({
  _type: 'block',
  _key: key(),
  style,
  markDefs: [],
  children: [{ _type: 'span', _key: key(), text, marks: [] }],
});

const id = {
  category: (s: string) => `category-${s}`,
  author: (s: string) => `author-${s}`,
  tag: (s: string) => `tag-${s}`,
  show: (s: string) => `show-${s}`,
  video: (s: string) => `video-${s}`,
  article: (s: string) => `article-${s}`,
  page: (s: string) => `page-${s}`,
};

const docs: Doc[] = [];

// ---------- Categories ----------
sample.sections.forEach((section, i) => {
  docs.push({ _id: id.category(section.slug), _type: 'category', title: section.title, slug: slug(section.slug), order: i * 10 });
  section.children.forEach(([title, s], j) =>
    docs.push({
      _id: id.category(s),
      _type: 'category',
      title,
      slug: slug(s),
      parent: ref(id.category(section.slug)),
      order: j * 10,
    }),
  );
});

// ---------- Authors, tags, shows ----------
sample.authors.forEach((a, i) =>
  docs.push({ _id: id.author(a.slug), _type: 'author', ...a, slug: slug(a.slug), photo: image(`hp-author-${i}`, a.name) }),
);
sample.tags.forEach(([title, s]) => docs.push({ _id: id.tag(s), _type: 'tag', title, slug: slug(s) }));
sample.shows.forEach(([name, s, seed], i) =>
  docs.push({
    _id: id.show(s),
    _type: 'show',
    name,
    slug: slug(s),
    cardImage: image(seed, `${name} show artwork`),
    description: `${name} is a HollywoodPest Original. (Sample show description.)`,
    order: i * 10,
  }),
);

// ---------- Videos ----------
sample.videos.forEach((v, i) =>
  docs.push({
    _id: id.video(v.slug),
    _type: 'video',
    title: v.title,
    slug: slug(v.slug),
    // Placeholder link: replace with the real YouTube upload.
    youtubeUrl: `https://www.youtube.com/watch?v=sample0000${i}`,
    duration: v.duration,
    thumbnail: image(v.seed, v.title),
    description: 'Sample video for development. The link is a placeholder.',
    show: ref(id.show(v.show)),
    category: ref(id.category(v.category)),
    publishAt: hoursAgo(v.hoursAgo),
  }),
);

// ---------- Articles ----------
const standardParagraphs = [
  'This is a sample story for building and testing the site. The people and events in it are made up.',
  'Real stories will have the full reporting here: what happened, who was involved, what they said, and what comes next.',
];

const extraBlock = (extra: sample.Extra) => {
  if ('h2' in extra) return block(extra.h2, 'h2');
  if ('p' in extra) return block(extra.p);
  if ('quote' in extra) return { _type: 'pullQuote', _key: key(), quote: extra.quote, attribution: extra.by };
  if ('embed' in extra) return { _type: 'socialEmbed', _key: key(), url: extra.embed };
  return { _type: 'relatedArticle', _key: key(), article: ref(id.article(extra.related)) };
};

for (const a of sample.articles) {
  docs.push({
    _id: id.article(a.slug),
    _type: 'article',
    title: a.title,
    slug: slug(a.slug),
    dek: a.dek,
    ...(a.label ? { label: a.label } : {}),
    category: ref(id.category(a.category)),
    heroImage: image(a.seed, a.title),
    ...(a.video ? { video: ref(id.video(a.video)) } : {}),
    body: [...standardParagraphs.map((p) => block(p)), ...(a.body ?? []).map(extraBlock)],
    authors: [keyedRef(id.author(a.author))],
    tags: (a.tags ?? []).map((t) => keyedRef(id.tag(t))),
    publishAt: hoursAgo(a.hoursAgo),
    ...(a.updatedHoursAgo !== undefined ? { updatedAt: hoursAgo(a.updatedHoursAgo) } : {}),
    ...(a.correction ? { correction: a.correction } : {}),
  });
}

// ---------- Pages ----------
sample.pages.forEach((p) =>
  docs.push({ _id: id.page(p.slug), _type: 'page', title: p.title, slug: slug(p.slug), body: p.paragraphs.map((t) => block(t)) }),
);

// ---------- Singletons ----------
docs.push({
  _id: 'homepage',
  _type: 'homepage',
  lead: ref(id.article(sample.homepage.lead)),
  secondary: sample.homepage.secondary.map((s) => keyedRef(id.article(s))),
  trending: sample.homepage.trending.map((s) => keyedRef(id.article(s))),
});

const menuItem = (item: (typeof sample.menu)[number]) => {
  const base = { _key: key(), label: item.label };
  if ('comingSoon' in item) return { ...base, kind: 'comingSoon' };
  if ('url' in item) return { ...base, kind: 'url', url: item.url };
  return { ...base, kind: 'category', category: ref(id.category(item.section)) };
};

docs.push({
  _id: 'siteSettings',
  _type: 'siteSettings',
  ...sample.site,
  nav: sample.menu.map((item) => {
    const section = 'section' in item ? sample.sections.find((s) => s.slug === item.section) : undefined;
    return {
      _type: 'navItem',
      ...menuItem(item),
      children: (section?.children ?? []).map(([title, s]) => ({
        _type: 'navLink',
        _key: key(),
        label: title,
        kind: 'category',
        category: ref(id.category(s)),
      })),
    };
  }),
  // Placeholder profile links: replace with the real accounts.
  social: (['instagram', 'tiktok', 'facebook', 'youtube', 'x'] as const).map((platform) => ({
    _key: key(),
    _type: 'socialLink',
    platform,
    url: `https://www.${platform}.com/`,
  })),
});

process.stdout.write(docs.map((d) => JSON.stringify(d)).join('\n') + '\n');
