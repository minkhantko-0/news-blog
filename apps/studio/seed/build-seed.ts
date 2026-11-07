/**
 * Builds sample.ndjson for `sanity dataset import` from the web app's local
 * sample content (apps/web/src/lib/content/fixtures.ts), so the admin starts
 * with the same made-up stories the site shows offline.
 *
 * Usage (from apps/studio):
 *   node seed/build-seed.ts > seed/sample.ndjson
 *   pnpm exec sanity dataset import seed/sample.ndjson production --replace
 *
 * Everything is fictional. Images are placeholder photos from picsum.photos;
 * video links are placeholders to replace with real YouTube links.
 */
import { fixtureSource } from '../../web/src/lib/content/fixtures.ts';

type Doc = Record<string, unknown> & { _id: string; _type: string };

const settings = await fixtureSource.getSiteSettings();
const home = await fixtureSource.getHomepage();

let keyCounter = 0;
const key = () => `k${(++keyCounter).toString(36).padStart(6, '0')}`;
const ref = (id: string) => ({ _type: 'reference', _ref: id });
const keyedRef = (id: string) => ({ _key: key(), ...ref(id) });
const lastSegment = (path: string) => path.split('/').filter(Boolean).pop() ?? '';
const slug = (current: string) => ({ _type: 'slug', current });

const image = (seed: string, alt: string) => ({
  _type: 'mediaImage',
  _sanityAsset: `image@https://picsum.photos/seed/${encodeURIComponent(seed)}/1600/1000.jpg`,
  alt,
  credit: 'Placeholder photo (Lorem Picsum)',
});
const seedOf = (img: { source: object }) => ('placeholder' in img.source ? String(img.source.placeholder) : 'hp');

const block = (text: string) => ({
  _type: 'block',
  _key: key(),
  style: 'normal',
  markDefs: [],
  children: [{ _type: 'span', _key: key(), text, marks: [] }],
});

const docs: Doc[] = [];

// ---------- Categories (from the menu) ----------
const categoryId = (s: string) => `category-${s}`;
settings.nav.forEach((item, i) => {
  if (!item.href || item.comingSoon || item.href === '/videos/') return;
  const parentSlug = lastSegment(item.href);
  docs.push({ _id: categoryId(parentSlug), _type: 'category', title: item.label, slug: slug(parentSlug), order: i * 10 });
  item.children.forEach((child, j) => {
    const childSlug = lastSegment(child.href ?? '');
    docs.push({
      _id: categoryId(childSlug),
      _type: 'category',
      title: child.label,
      slug: slug(childSlug),
      parent: ref(categoryId(parentSlug)),
      order: j * 10,
    });
  });
});

// ---------- Authors ----------
const authors = [
  { _id: 'author-jordan-reyes', name: 'Jordan Reyes', role: 'Senior Entertainment Reporter', bio: 'Jordan covers music, celebrity and pop culture for HollywoodPest. (Sample author.)' },
  { _id: 'author-tasha-bell', name: 'Tasha Bell', role: 'Crime & Courts Reporter', bio: 'Tasha covers celebrity court cases and legal news for HollywoodPest. (Sample author.)' },
];
authors.forEach((a, i) =>
  docs.push({ ...a, _type: 'author', slug: slug(lastSegment(a._id.replace('author-', '/'))), photo: image(`hp-author-${i}`, a.name) }),
);

// ---------- Videos ----------
const videoIds = home.videos.map((v, i) => {
  const id = `video-${lastSegment(v.href)}`;
  docs.push({
    _id: id,
    _type: 'video',
    title: v.title,
    slug: slug(lastSegment(v.href)),
    // Placeholder link: replace with the real YouTube upload.
    youtubeUrl: `https://www.youtube.com/watch?v=sample0000${i}`,
    duration: v.duration,
    thumbnail: image(seedOf(v.image), v.title),
    publishAt: v.publishedAt,
  });
  return id;
});

// ---------- Original shows ----------
home.shows.forEach((s, i) =>
  docs.push({
    _id: `show-${lastSegment(s.href)}`,
    _type: 'show',
    name: s.name,
    slug: slug(lastSegment(s.href)),
    cardImage: image(seedOf(s.image), `${s.name} show artwork`),
    order: i * 10,
  }),
);

// ---------- Articles ----------
const stories = [home.lead, ...home.secondary, ...home.trending, ...home.latest];
const articleId = (href: string) => `article-${lastSegment(href)}`;
let videoCursor = 0;
for (const [i, s] of stories.entries()) {
  docs.push({
    _id: articleId(s.href),
    _type: 'article',
    title: s.title,
    slug: slug(lastSegment(s.href)),
    dek: s.dek ?? `${s.title}. Here's what we know so far.`,
    ...(s.label ? { label: s.label } : {}),
    category: ref(categoryId(lastSegment(s.category.href))),
    heroImage: image(seedOf(s.image), s.title),
    ...(s.hasVideo ? { video: ref(videoIds[videoCursor++ % videoIds.length]) } : {}),
    body: [
      block('This is a sample story for building and testing the site. The people and events in it are made up.'),
      block('Real stories will have the full reporting here: what happened, who was involved, what they said, and what comes next.'),
      block('Editors can add photos, social posts, pull quotes, galleries and links to related stories in this area.'),
    ],
    authors: [keyedRef(authors[i % authors.length]._id)],
    publishAt: s.publishedAt,
  });
}

// ---------- Singletons ----------
docs.push({
  _id: 'homepage',
  _type: 'homepage',
  lead: ref(articleId(home.lead.href)),
  secondary: home.secondary.map((s) => keyedRef(articleId(s.href))),
  trending: home.trending.map((s) => keyedRef(articleId(s.href))),
});

const navLink = (item: (typeof settings.nav)[number]) => {
  const base = { _key: key(), label: item.label };
  if (item.comingSoon) return { ...base, kind: 'comingSoon' };
  if (item.href === '/videos/') return { ...base, kind: 'url', url: '/videos/' };
  return { ...base, kind: 'category', category: ref(categoryId(lastSegment(item.href ?? ''))) };
};

docs.push({
  _id: 'siteSettings',
  _type: 'siteSettings',
  name: settings.name,
  tagline: settings.tagline,
  nav: settings.nav.map((item) => ({
    _type: 'navItem',
    ...navLink(item),
    children: item.children.map((c) => ({ _type: 'navLink', ...navLink(c) })),
  })),
  // Placeholder profile links: replace with the real accounts.
  social: (['instagram', 'tiktok', 'facebook', 'youtube', 'x'] as const).map((platform) => ({
    _key: key(),
    _type: 'socialLink',
    platform,
    url: `https://www.${platform === 'x' ? 'x' : platform}.com/`,
  })),
});

process.stdout.write(docs.map((d) => JSON.stringify(d)).join('\n') + '\n');
