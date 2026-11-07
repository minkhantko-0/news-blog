/**
 * Made-up sample content for development. Every person, event and quote here
 * is fictional; photos are random placeholders and video links are fake.
 * Do not replace with real people or real news.
 */

export const site = { name: 'HollywoodPest', tagline: 'Social-First Media Company' };

/** Top-level sections and their sub-categories, in menu order. */
export const sections = [
  { title: 'News', slug: 'news', children: [['Crime & Courts', 'crime-courts'], ['Politics', 'politics'], ['World', 'world']] },
  { title: 'Celebs', slug: 'celebs', children: [['Music', 'music'], ['Movies & TV', 'movies-tv'], ['Relationships', 'relationships'], ['Style', 'style']] },
  { title: 'Shows', slug: 'shows', children: [['Reality TV', 'reality-tv'], ['Streaming', 'streaming'], ['Late Night', 'late-night']] },
  { title: 'Sports', slug: 'sports', children: [['Basketball', 'basketball'], ['Football', 'football'], ['Combat Sports', 'combat-sports'], ['Soccer', 'soccer']] },
  { title: 'Lifestyle', slug: 'lifestyle', children: [['Health', 'health'], ['Money', 'money'], ['Travel', 'travel'], ['Food', 'food']] },
  { title: 'HP Asia', slug: 'hp-asia', children: [['K-Pop', 'k-pop'], ['Bollywood', 'bollywood'], ['Asia News', 'asia-news']] },
] as const;

/** Main menu. `section` items link to a category; Videos is a site path. */
export const menu = [
  { label: 'News', section: 'news' },
  { label: 'Celebs', section: 'celebs' },
  { label: 'Shows', section: 'shows' },
  { label: 'Sports', section: 'sports' },
  { label: 'Videos', url: '/videos/' },
  { label: 'Lifestyle', section: 'lifestyle' },
  { label: 'HP Asia', section: 'hp-asia' },
  { label: 'HP Publishing', comingSoon: true },
  { label: 'Shop', comingSoon: true },
] as const;

export const authors = [
  {
    slug: 'jordan-reyes',
    name: 'Jordan Reyes',
    role: 'Senior Entertainment Reporter',
    bio: 'Jordan covers music, celebrity and pop culture, from tour announcements to backstage feuds. (Sample author for development.)',
  },
  {
    slug: 'tasha-bell',
    name: 'Tasha Bell',
    role: 'Crime & Courts Reporter',
    bio: 'Tasha covers celebrity court cases and legal news, reading the filings so you don\'t have to. (Sample author for development.)',
  },
  {
    slug: 'marcus-lee',
    name: 'Marcus Lee',
    role: 'Sports & Culture Writer',
    bio: 'Marcus writes about the moments where sports and celebrity collide. (Sample author for development.)',
  },
];

export const tags = [
  ['Court Cases', 'court-cases'],
  ['Concerts', 'concerts'],
  ['Feuds', 'feuds'],
  ['Reality TV', 'reality-tv-tag'],
  ['Breakups', 'breakups'],
  ['Record Deals', 'record-deals'],
  ['Elections', 'elections'],
  ['Viral', 'viral'],
] as const;

export const shows = [
  ['HP News', 'hp-news', 'hp-show-globe'],
  ['HP Investigates', 'hp-investigates', 'hp-show-camera'],
  ['HP Mom Patrol', 'hp-mom-patrol', 'hp-show-silhouette'],
  ['HP Couples Patrol', 'hp-couples-patrol', 'hp-show-hearts'],
  ['HP Sports', 'hp-sports', 'hp-show-field'],
  ['HP Asia', 'hp-asia', 'hp-show-skyline'],
] as const;

export const videos = [
  { slug: 'fans-swarm-pop-up-concert', title: 'Fans Swarm the Stage at Surprise Pop-Up Concert Downtown', duration: '2:14', seed: 'hp-video-crowd', show: 'hp-news', category: 'music', hoursAgo: 1 },
  { slug: 'dog-runs-into-motorcycle', title: 'Dog Runs Into Motorcycle, Then the Owner Makes a Demand', duration: '1:38', seed: 'hp-video-street', show: 'hp-investigates', category: 'news', hoursAgo: 3 },
  { slug: 'helicopters-clip-rotors', title: 'Two Helicopters Clip Rotors While Landing at Mountain Base', duration: '1:52', seed: 'hp-video-mountain', show: 'hp-news', category: 'world', hoursAgo: 5 },
  { slug: 'red-carpet-mishap', title: 'Red Carpet Mishap Goes Viral at Film Premiere', duration: '0:58', seed: 'hp-video-premiere', show: 'hp-couples-patrol', category: 'movies-tv', hoursAgo: 8 },
];

/** Extra body content, added after the standard paragraphs. */
export type Extra =
  | { h2: string }
  | { p: string }
  | { quote: string; by?: string }
  | { embed: string }
  | { related: string };

export interface SampleArticle {
  slug: string;
  title: string;
  dek: string;
  category: string;
  author: string;
  seed: string;
  hoursAgo: number;
  label?: 'breaking' | 'exclusive' | 'developing';
  video?: string;
  tags?: string[];
  body?: Extra[];
  updatedHoursAgo?: number;
  correction?: string;
}

export const articles: SampleArticle[] = [
  {
    slug: 'kiana-vale-misses-court-date',
    title: 'Reality Star Kiana Vale Misses Court Date as Two Cases Stack Up',
    dek: 'Vale did not appear for a scheduled hearing on Thursday, and the judge set a new date for next week.',
    category: 'crime-courts',
    author: 'tasha-bell',
    seed: 'hp-lead-courthouse',
    hoursAgo: 0.4,
    label: 'breaking',
    video: 'fans-swarm-pop-up-concert',
    tags: ['court-cases'],
    updatedHoursAgo: 0.1,
    body: [
      { p: 'Vale\'s attorney told the court his client was "dealing with a scheduling conflict" and asked for a short delay. The judge agreed, but warned that a second missed date could lead to a warrant.' },
      { h2: 'What the two cases are about' },
      { p: 'The first case stems from an incident at a nightclub in the spring. The second was filed last month by a former assistant. Vale has denied the claims in both.' },
      { quote: 'We expect to resolve both matters quickly and quietly.', by: 'Vale\'s attorney (sample quote)' },
      { p: 'Vale is due back in court next Thursday. HollywoodPest has reached out to her representatives for comment.' },
      { related: 'rowan-pike-sentenced' },
    ],
  },
  {
    slug: 'dre-lamont-jace-rivers-atlanta-show',
    title: "Dre Lamont and Jace Rivers' Atlanta Show Starts Late, Ends Early as Fans Question the Feud",
    dek: 'The co-headlined show started 90 minutes late and wrapped after 40 minutes, fueling rumors of a rift between the two stars.',
    category: 'music',
    author: 'jordan-reyes',
    seed: 'hp-concert-stage',
    hoursAgo: 1,
    video: 'fans-swarm-pop-up-concert',
    tags: ['concerts', 'feuds'],
    body: [{ embed: 'https://www.instagram.com/p/SAMPLEPOST01/' }],
  },
  {
    slug: 'bus-driver-escapes-through-window',
    title: 'Bus Driver Escapes Through Window After Armed Passenger Orders Her to Keep Driving',
    dek: 'The driver climbed out of a side window at a red light. Police say no passengers were hurt.',
    category: 'news',
    author: 'tasha-bell',
    seed: 'hp-city-bus-night',
    hoursAgo: 1.5,
    video: 'dog-runs-into-motorcycle',
    tags: ['viral'],
  },
  {
    slug: 'lil-tavo-hospital-stay',
    title: "Rapper Lil Tavo's Hospital Stay Sparks Questions After Album Preview Leaks",
    dek: 'The rapper was admitted over the weekend, days after unreleased songs surfaced online.',
    category: 'music',
    author: 'jordan-reyes',
    seed: 'hp-studio-mic',
    hoursAgo: 3,
    tags: ['record-deals'],
  },
  {
    slug: 'pro-fighter-arrested-gym-brawl',
    title: 'Pro Fighter Arrested After Gym Brawl, Released Within Hours',
    dek: 'The fighter was booked on a misdemeanor charge and released without bail.',
    category: 'combat-sports',
    author: 'marcus-lee',
    seed: 'hp-boxing-gym',
    hoursAgo: 4,
    tags: ['court-cases'],
  },
  {
    slug: 'college-kicker-scores-wrong-team',
    title: 'College Kicker Scores for the Wrong Team in Final Seconds',
    dek: 'A mix-up on the final play handed the opponent a stunning win.',
    category: 'football',
    author: 'marcus-lee',
    seed: 'hp-stadium-lights',
    hoursAgo: 5,
    tags: ['viral'],
  },
  {
    slug: 'bank-shutdown-street-protests',
    title: 'Bank Shutdown Sparks Massive Street Protests Overseas',
    dek: 'Thousands gathered after a major bank froze withdrawals without warning.',
    category: 'world',
    author: 'tasha-bell',
    seed: 'hp-protest-crowd',
    hoursAgo: 6,
  },
  {
    slug: 'rowan-pike-sentenced',
    title: 'Actor Rowan Pike Sentenced After Months-Long Trial',
    dek: 'Pike received an 18-month sentence and was ordered to pay restitution.',
    category: 'crime-courts',
    author: 'tasha-bell',
    seed: 'hp-gavel',
    hoursAgo: 7,
    tags: ['court-cases'],
    correction: 'An earlier version of this sample story misstated the length of the trial.',
  },
  {
    slug: 'amara-cole-stadium-tour',
    title: 'Singer Amara Cole Announces Surprise Stadium Tour',
    dek: 'The 30-date tour starts in the spring, with tickets on sale Friday.',
    category: 'music',
    author: 'jordan-reyes',
    seed: 'hp-arena-crowd',
    hoursAgo: 2,
    label: 'exclusive',
    tags: ['concerts'],
  },
  {
    slug: 'senator-admits-midterm-loss',
    title: 'Senator Admits Voters Turned on Party in Midterm Loss',
    dek: 'In a rare admission, the senator said the party "stopped listening."',
    category: 'politics',
    author: 'tasha-bell',
    seed: 'hp-capitol',
    hoursAgo: 4.5,
    tags: ['elections'],
  },
  {
    slug: 'dana-whitfield-landslide-win',
    title: 'Mayor Dana Whitfield Makes History With Landslide Win',
    dek: 'Whitfield won more than 60% of the vote, a record for the city.',
    category: 'politics',
    author: 'tasha-bell',
    seed: 'hp-podium',
    hoursAgo: 6.5,
    tags: ['elections'],
  },
  {
    slug: 'reality-couple-confirms-split',
    title: 'Reality Couple Confirms Split on Live Season Finale',
    dek: 'The pair announced the breakup during the live reunion, stunning the studio audience.',
    category: 'reality-tv',
    author: 'jordan-reyes',
    seed: 'hp-tv-set',
    hoursAgo: 8,
    video: 'red-carpet-mishap',
    tags: ['reality-tv-tag', 'breakups'],
  },
  {
    slug: 'point-guard-record-deal',
    title: 'Point Guard Signs Record Deal Hours Before Deadline',
    dek: 'The five-year extension makes him the highest-paid player in team history.',
    category: 'basketball',
    author: 'marcus-lee',
    seed: 'hp-basketball-court',
    hoursAgo: 9,
    label: 'developing',
    tags: ['record-deals'],
  },
  {
    slug: 'nova9-streaming-record',
    title: 'K-Pop Group NOVA9 Breaks Streaming Record in 24 Hours',
    dek: 'The group\'s new single passed 40 million streams on its first day.',
    category: 'k-pop',
    author: 'jordan-reyes',
    seed: 'hp-neon-city',
    hoursAgo: 11,
    tags: ['record-deals'],
  },
];

export const homepage = {
  lead: 'kiana-vale-misses-court-date',
  secondary: ['dre-lamont-jace-rivers-atlanta-show', 'bus-driver-escapes-through-window'],
  trending: [
    'lil-tavo-hospital-stay',
    'pro-fighter-arrested-gym-brawl',
    'college-kicker-scores-wrong-team',
    'bank-shutdown-street-protests',
    'rowan-pike-sentenced',
  ],
};

const DRAFT = '[Draft placeholder: replace this text before launch.]';

export const pages = [
  {
    slug: 'about',
    title: 'About HollywoodPest',
    paragraphs: [
      DRAFT,
      'HollywoodPest is a social-first media company covering celebrity, entertainment, sports and viral news.',
      'Have a story? Send us a news tip. Want to reach our audience? Advertise with us.',
    ],
  },
  {
    slug: 'editorial-standards',
    title: 'Editorial Standards',
    paragraphs: [
      DRAFT,
      'Describe how stories are sourced and verified, how anonymous sources are handled, and who reviews stories before publishing.',
    ],
  },
  {
    slug: 'corrections',
    title: 'Corrections Policy',
    paragraphs: [
      DRAFT,
      'Describe how readers can report errors, how quickly corrections are made, and how they are noted on stories.',
    ],
  },
  {
    slug: 'contact',
    title: 'Contact',
    paragraphs: [DRAFT, 'List the contact emails for news tips, advertising, and general questions.'],
  },
  {
    slug: 'privacy',
    title: 'Privacy Policy',
    paragraphs: [DRAFT, 'Needs a real privacy policy covering analytics, cookies, advertising partners and the news-tip form.'],
  },
  {
    slug: 'terms',
    title: 'Terms of Use',
    paragraphs: [DRAFT, 'Needs real terms of use.'],
  },
];
