/**
 * Local sample content, used when no Sanity project is configured.
 *
 * Everything here is made up: names, events and quotes are fictional, and
 * images are random placeholder photos. Do not replace them with real people
 * or real news.
 */
import type {
  CategoryLink,
  ContentSource,
  Homepage,
  MediaImage,
  NavItem,
  Show,
  SiteSettings,
  StorySummary,
  VideoSummary,
} from './types';

const HOUR = 60 * 60 * 1000;
const hoursAgo = (h: number) => new Date(Date.now() - h * HOUR).toISOString();

const placeholder = (seed: string, alt: string): MediaImage => ({
  alt,
  credit: 'Placeholder image',
  source: { placeholder: seed },
});

const cat = (title: string, path: string): CategoryLink => ({ title, href: `/${path}/` });

const C = {
  news: cat('News', 'news'),
  crime: cat('Crime & Courts', 'news/crime-courts'),
  politics: cat('Politics', 'news/politics'),
  world: cat('World', 'news/world'),
  celebs: cat('Celebs', 'celebs'),
  music: cat('Music', 'celebs/music'),
  relationships: cat('Relationships', 'celebs/relationships'),
  shows: cat('Shows', 'shows'),
  reality: cat('Reality TV', 'shows/reality-tv'),
  sports: cat('Sports', 'sports'),
  basketball: cat('Basketball', 'sports/basketball'),
  football: cat('Football', 'sports/football'),
  combat: cat('Combat Sports', 'sports/combat-sports'),
  lifestyle: cat('Lifestyle', 'lifestyle'),
  asia: cat('HP Asia', 'hp-asia'),
  kpop: cat('K-Pop', 'hp-asia/k-pop'),
};

let n = 0;
const story = (
  title: string,
  category: CategoryLink,
  opts: Partial<Omit<StorySummary, 'id' | 'title' | 'category' | 'href'>> & { slug: string; seed: string },
): StorySummary => ({
  id: `sample-${++n}`,
  title,
  // Article URLs use the top-level section only, so moving a story between
  // sub-categories never changes its URL.
  href: `/${category.href.split('/')[1]}/${opts.slug}/`,
  category,
  label: opts.label,
  dek: opts.dek,
  image: placeholder(opts.seed, title),
  hasVideo: opts.hasVideo ?? false,
  publishedAt: opts.publishedAt ?? hoursAgo(n),
});

// ---------- Stories ----------

const lead = story('Reality Star Kiana Vale Misses Court Date as Two Cases Stack Up', C.crime, {
  slug: 'kiana-vale-misses-court-date',
  seed: 'hp-lead-courthouse',
  label: 'breaking',
  hasVideo: true,
  dek: 'Vale did not appear for a scheduled hearing on Thursday, and the judge has set a new date for next week.',
  publishedAt: hoursAgo(0.4),
});

const secondary = [
  story("Dre Lamont and Jace Rivers' Atlanta Show Starts Late, Ends Early as Fans Question the Feud", C.music, {
    slug: 'dre-lamont-jace-rivers-atlanta-show',
    seed: 'hp-concert-stage',
    hasVideo: true,
    publishedAt: hoursAgo(1),
  }),
  story('Bus Driver Escapes Through Window After Armed Passenger Orders Her to Keep Driving', C.news, {
    slug: 'bus-driver-escapes-through-window',
    seed: 'hp-city-bus-night',
    hasVideo: true,
    publishedAt: hoursAgo(1.5),
  }),
];

const trending = [
  story("Rapper Lil Tavo's Hospital Stay Sparks Questions After Album Preview Leaks", C.music, {
    slug: 'lil-tavo-hospital-stay',
    seed: 'hp-studio-mic',
    publishedAt: hoursAgo(3),
  }),
  story('Pro Fighter Arrested After Gym Brawl, Released Within Hours', C.combat, {
    slug: 'pro-fighter-arrested-gym-brawl',
    seed: 'hp-boxing-gym',
    publishedAt: hoursAgo(4),
  }),
  story('College Kicker Scores for the Wrong Team in Final Seconds', C.football, {
    slug: 'college-kicker-scores-wrong-team',
    seed: 'hp-stadium-lights',
    publishedAt: hoursAgo(5),
  }),
  story('Bank Shutdown Sparks Massive Street Protests Overseas', C.world, {
    slug: 'bank-shutdown-street-protests',
    seed: 'hp-protest-crowd',
    publishedAt: hoursAgo(6),
  }),
  story('Actor Rowan Pike Sentenced After Months-Long Trial', C.crime, {
    slug: 'rowan-pike-sentenced',
    seed: 'hp-gavel',
    publishedAt: hoursAgo(7),
  }),
];

const latest = [
  story('Singer Amara Cole Announces Surprise Stadium Tour', C.music, {
    slug: 'amara-cole-stadium-tour',
    seed: 'hp-arena-crowd',
    label: 'exclusive',
    publishedAt: hoursAgo(2),
  }),
  story('Senator Admits Voters Turned on Party in Midterm Loss', C.politics, {
    slug: 'senator-admits-midterm-loss',
    seed: 'hp-capitol',
    publishedAt: hoursAgo(4),
  }),
  story('Mayor Dana Whitfield Makes History With Landslide Win', C.politics, {
    slug: 'dana-whitfield-landslide-win',
    seed: 'hp-podium',
    publishedAt: hoursAgo(6),
  }),
  story('Reality Couple Confirms Split on Live Season Finale', C.reality, {
    slug: 'reality-couple-confirms-split',
    seed: 'hp-tv-set',
    hasVideo: true,
    publishedAt: hoursAgo(8),
  }),
  story('Point Guard Signs Record Deal Hours Before Deadline', C.basketball, {
    slug: 'point-guard-record-deal',
    seed: 'hp-basketball-court',
    label: 'developing',
    publishedAt: hoursAgo(9),
  }),
  story('K-Pop Group NOVA9 Breaks Streaming Record in 24 Hours', C.kpop, {
    slug: 'nova9-streaming-record',
    seed: 'hp-neon-city',
    publishedAt: hoursAgo(11),
  }),
];

// ---------- Videos ----------

const video = (title: string, slug: string, seed: string, duration: string, h: number): VideoSummary => ({
  id: `video-${slug}`,
  title,
  href: `/videos/${slug}/`,
  image: placeholder(seed, title),
  duration,
  publishedAt: hoursAgo(h),
});

const videos = [
  video('Fans Swarm the Stage at Surprise Pop-Up Concert Downtown', 'fans-swarm-pop-up-concert', 'hp-video-crowd', '2:14', 1),
  video('Dog Runs Into Motorcycle, Then the Owner Makes a Demand', 'dog-runs-into-motorcycle', 'hp-video-street', '1:38', 3),
  video('Two Helicopters Clip Rotors While Landing at Mountain Base', 'helicopters-clip-rotors', 'hp-video-mountain', '1:52', 5),
  video('Red Carpet Mishap Goes Viral at Film Premiere', 'red-carpet-mishap', 'hp-video-premiere', '0:58', 8),
];

// ---------- Originals ----------

const show = (name: string, slug: string, seed: string): Show => ({
  id: `show-${slug}`,
  name,
  href: `/originals/${slug}/`,
  image: placeholder(seed, `${name} show artwork`),
});

const shows = [
  show('HP News', 'hp-news', 'hp-show-globe'),
  show('HP Investigates', 'hp-investigates', 'hp-show-camera'),
  show('HP Mom Patrol', 'hp-mom-patrol', 'hp-show-silhouette'),
  show('HP Couples Patrol', 'hp-couples-patrol', 'hp-show-hearts'),
  show('HP Sports', 'hp-sports', 'hp-show-field'),
  show('HP Asia', 'hp-asia', 'hp-show-skyline'),
];

// ---------- Site settings ----------

const navLink = (label: string, href: string, children: NavItem[] = []): NavItem => ({ label, href, children });
const sub = (c: CategoryLink): NavItem => navLink(c.title, c.href);

const nav: NavItem[] = [
  navLink('News', '/news/', [sub(C.crime), sub(C.politics), sub(C.world)]),
  navLink('Celebs', '/celebs/', [
    sub(C.music),
    sub(cat('Movies & TV', 'celebs/movies-tv')),
    sub(C.relationships),
    sub(cat('Style', 'celebs/style')),
  ]),
  navLink('Shows', '/shows/', [sub(C.reality), sub(cat('Streaming', 'shows/streaming')), sub(cat('Late Night', 'shows/late-night'))]),
  navLink('Sports', '/sports/', [sub(C.basketball), sub(C.football), sub(C.combat), sub(cat('Soccer', 'sports/soccer'))]),
  navLink('Videos', '/videos/'),
  navLink('Lifestyle', '/lifestyle/', [
    sub(cat('Health', 'lifestyle/health')),
    sub(cat('Money', 'lifestyle/money')),
    sub(cat('Travel', 'lifestyle/travel')),
    sub(cat('Food', 'lifestyle/food')),
  ]),
  navLink('HP Asia', '/hp-asia/', [sub(C.kpop), sub(cat('Bollywood', 'hp-asia/bollywood')), sub(cat('Asia News', 'hp-asia/asia-news'))]),
  { label: 'HP Publishing', comingSoon: true, children: [] },
  { label: 'Shop', comingSoon: true, children: [] },
];

const siteSettings: SiteSettings = {
  name: 'HollywoodPest',
  tagline: 'Social-First Media Company',
  nav,
  // Placeholder URLs until the real accounts are linked in Sanity.
  social: [
    { platform: 'instagram', url: '#' },
    { platform: 'tiktok', url: '#' },
    { platform: 'facebook', url: '#' },
    { platform: 'youtube', url: '#' },
    { platform: 'x', url: '#' },
  ],
};

const homepage: Homepage = { lead, secondary, trending, shows, latest, videos };

export const fixtureSource: ContentSource = {
  getSiteSettings: async () => siteSettings,
  getHomepage: async () => homepage,
};
