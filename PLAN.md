# news-blog — Build Plan

A celebrity and entertainment news site, styled after [docs/design/homepage-desktop.jpg](docs/design/homepage-desktop.jpg) (brand in the mockup: **HollywoodPest**). It must work well on phones and load fast. It must also rank in search and be easy for AI answer engines (ChatGPT, Perplexity and others) to read and cite, which this plan calls GEO. It costs **$0 to run at launch**; the only paid item is the domain (about $11 a year).

---

## 1. Stack

| Part | Choice | Version |
|---|---|---|
| Public site | Astro, built to static HTML | 7.x |
| Styling | Tailwind CSS | 4.x |
| Admin / CMS | Sanity Studio, on the free plan | 6.x |
| Images | Sanity image CDN, which resizes on the fly | — |
| Hosting | Cloudflare Workers. Plain HTML and CSS files are served free with no request limit; Cloudflare's servers run code only for small API endpoints | wrangler 4.x |
| Builds | Cloudflare Workers Builds, started by a deploy hook (a URL that triggers a rebuild) | 3,000 build minutes a month free |
| Search | Pagefind: an index built with the site, searched in the browser, no server | 1.x |
| Video at launch | YouTube embeds, shown as a lightweight preview until clicked | — |
| Forms (news tips) | Cloudflare Worker + D1 (database) + private R2 (file storage) + Turnstile (spam check) | free tiers |
| Analytics | Cloudflare Web Analytics | free |
| Package manager | pnpm workspaces, i.e. one repo holding several apps | — |

## 2. Architecture

```
Editors ──► Sanity Studio (admin.<domain> or <name>.sanity.studio)
                 │ Publish
                 ▼
           Sanity (content + images) ──webhook──► Cloudflare deploy hook
                                                        │
                                          Workers Builds: astro build + pagefind
                                                        │ deploy
                                                        ▼
Readers / Google / AI bots ──► <domain>  (static HTML, free and unlimited)
                                   │  /api/* only
                                   ▼
                         Worker: news-tip form → D1 + private R2 → email to tips inbox

Cron Worker (every 5 min) ──► publishes scheduled drafts that are due → webhook → rebuild
Nightly job ──► full Sanity export → private R2 (backup)
After each deploy ──► IndexNow ping with the changed URLs
```

### Repo layout

```
news-blog/
  apps/
    web/        Astro site; static pages plus /api/tip
    studio/     Sanity Studio: schemas, desk layout, custom inputs
  workers/
    scheduler/  cron: publish scheduled drafts, nightly backup
  packages/
    shared/     Sanity query types (from `sanity typegen`), shared constants
  docs/design/  mockups
```

## 3. Content model (Sanity)

| Type | Key fields |
|---|---|
| **article** | title, slug (locked once published), dek (one-sentence summary), category, tags, authors, label (Breaking / Exclusive / Developing), hero image (alt, caption and credit **required**) *or* hero video, body (rich text with image, social embed, pull quote, gallery and related-link blocks), publishAt, "updated" date (set by hand for real updates only), corrections note, SEO (title, description, social image, noindex) |
| **video** | title, slug, YouTube URL, duration, thumbnail, show, category, description, publishAt |
| **show** (Originals) | name, slug, card art, description, order. Examples: HP News, HP Investigates, HP Mom Patrol |
| **category** | title, slug, parent category (for the nav dropdowns), order, description |
| **tag** | title, slug, noindex switch |
| **author** | name, slug, photo, role, bio, social links |
| **homepage** (one only) | lead story, 2 secondary stories, Trending Now (5, ordered). Any empty slot fills with the latest story |
| **siteSettings** (one only) | nav menu and dropdowns (including external links such as Shop), social links, contact emails, default share image |
| **page** | About, Advertise, Editorial Standards, Corrections Policy, Privacy, Terms |
| **redirect** | from → to. Created automatically when a published slug changes |

> News tips are **not** stored in Sanity. Free-plan Sanity data can be read publicly through its API, and tips can expose sources, so they go to a private D1 database and R2 bucket instead.

## 4. Pages

| Page | Notes |
|---|---|
| Home | Built to match the mockup: hero (lead + 2 secondary + Trending), Originals strip, Latest News, Videos |
| Article | Hero image or video, byline, time, body with embeds, share buttons, tags, related stories, author box |
| Category and subcategory | Lead story plus a paginated list |
| Tag, Author | Paginated lists. Author pages carry the bio and social links, which help Google judge expertise and trust (E-E-A-T) |
| Videos hub, video page | Featured video plus a list with durations |
| Originals / show page | Show art plus its episodes |
| Search | Pagefind |
| News Tip, Advertise | Forms (Turnstile-protected) |
| Static pages | About, Editorial Standards, Corrections, Privacy, Terms |
| 404 | With latest stories |

### Design system (from the mockup)

- **Colours:** ink `#111`, paper `#fff`, black strip `#0b0b0b`, gold gradient around `#d4a72c → #f3d27a`, muted grey for timestamps. Final values will be matched to the mockup.
- **Type:** heavy condensed uppercase for headlines, nav and section titles; Barlow Condensed (800/900, with italics for "TRENDING NOW" and "LATEST NEWS") is the closest match. A clean sans such as Inter for body text. Fonts are self-hosted, with no calls to Google Fonts.
- **Components:** category label (gold tag), story card (large, medium, small and list variants), play badge with duration, numbered trending item, section heading with gold rule, Originals carousel, header and footer.

### Mobile layout

```
┌──────────────────────────┐
│ ☰    HOLLYWOODPEST    🔍 │  sticky, shrinks on scroll
│ NEWS CELEBS SHOWS SPO… → │  swipeable category strip
├──────────────────────────┤
│ [ lead story image     ] │
│ BREAKING NEWS            │
│ BIG HEADLINE             │
├──────────────────────────┤
│ [img] secondary story 1  │
│ [img] secondary story 2  │
├──────────────────────────┤
│ TRENDING NOW  1 … 5      │
├──────────────────────────┤
│ ORIGINALS   ← swipe →    │
├──────────────────────────┤
│ LATEST NEWS (list rows)  │
├──────────────────────────┤
│ VIDEOS                   │
└──────────────────────────┘
☰ drawer: full menu + dropdowns, socials, News Tip, Advertise
```

Breakpoints: phone first. Tablet (768px and up) shows a 2-column hero. Desktop (1024px and up) matches the mockup.

## 5. Publishing workflow

- **Publish:** the editor clicks Publish, Sanity's webhook calls the deploy hook, and the site rebuilds and goes live in about 1–3 minutes. If several edits arrive close together, Cloudflare runs one rebuild instead of several.
- **Scheduled posts:** the story stays a **draft** with a `publishAt` time. Drafts are private on Sanity's free plan, so embargoed scoops can't leak through the API. Every 5 minutes the cron worker publishes any draft that is due, which triggers a rebuild.
- **Slug change:** a redirect is created automatically, so old links and search ranking keep working.
- **Takedown:** unpublish, rebuild, and the page returns 410 Gone.
- **Backups:** a full export of the Sanity content every night, kept in R2. This matters because the free plan keeps only 3 days of history.

## 6. Performance rules

- No JavaScript by default. Small interactive pieces load their own script: menu drawer, carousel, search, forms.
- Images: fixed widths (400 / 800 / 1200 / 1600), AVIF or WebP picked automatically, `width` and `height` always set so the layout doesn't jump, lazy-loading below the fold, and the lead image loaded first.
- Embeds (YouTube, Instagram, TikTok, X): show a static preview, and load the real embed only when it scrolls into view or is clicked.
- Fonts: 2 families, trimmed to Latin characters, the headline font preloaded, `font-display: swap`.
- Target on phones: Lighthouse performance ≥ 90, LCP < 2.5 s, CLS < 0.1.
- Space for ads will be reserved in the layout now, though ads start later.

## 7. SEO and GEO

**On every page, generated automatically:**
- canonical URL, link-preview tags for social sites (Open Graph and X), `max-image-preview:large` (needed for Google Discover)
- structured data for Google: `NewsArticle`, `VideoObject`, `Person`, `Organization` (with links to the brand's social profiles), `BreadcrumbList`

**Generated on every build:**
- sitemap index, a Google News sitemap covering the last 48 hours, RSS (whole site and per category), `robots.txt`, `llms.txt`

**Other SEO work:**
- IndexNow ping after each deploy finishes, never before
- tag pages with only a few stories are hidden from search automatically
- article URLs: `/<category>/<slug>`, fixed once published

**GEO:**
- In Cloudflare, allow the AI search crawlers (OAI-SearchBot, ChatGPT-User, PerplexityBot, Claude-SearchBot), which are blocked by default. Whether to allow the crawlers that collect training data is a separate decision.
- Article template puts the facts first: the dek and first paragraph answer who, what and when.
- Visible bylines and published and updated times, plus Editorial Standards and Corrections pages.

**At launch:** Google Search Console, Bing Webmaster Tools, Google Publisher Center.

## 8. Free-plan limits to watch

| Limit | Where it bites | Next step when reached |
|---|---|---|
| Sanity: 100GB of image delivery a month | roughly 200–300k page views a month | Sanity Growth (about $15 per seat a month) or serve images through Cloudflare |
| Sanity: 10k documents (drafts count, images don't) | about 2+ years at 10 posts a day | Sanity Growth |
| Sanity: only Admin and Viewer roles | when freelancers join | Sanity Growth (adds Editor and Contributor roles) |
| Workers Builds: 3,000 minutes a month | about 1,000+ rebuilds a month | Workers Paid ($5) |
| Static files: 20,000 per deploy | about 15k+ articles | Workers Paid, switching to pages built on request and cached |
| Rebuild delay of 1–3 minutes | breaking news | Workers Paid, switching to pages built on request and cached |

## 9. Phases

1. **Foundation:** monorepo, Sanity project and schemas, Studio desk layout, Astro and Cloudflare config, design tokens and fonts, header, nav, footer and story cards, made-up seed content.
2. **Pages:** home (desktop and mobile), article, category, tag, author, videos, show, search, static pages, 404.
3. **Publishing:** webhook to deploy hook, scheduler worker, redirects, takedowns, nightly backups, news-tip form.
4. **SEO and GEO:** structured data, sitemaps and news sitemap, RSS, `llms.txt`, robots and crawler settings, social preview images, IndexNow.
5. **Launch:** domain, analytics, Lighthouse and accessibility checks on mobile, legal pages, search console sign-ups, go live.

**After launch:** draft preview for editors, automatic Trending (from analytics), newsletter, ads, our own video hosting (Cloudflare Stream), push alerts, reader comments, HP Asia edition.

## 10. Decisions (confirmed 2026-11-08)

- Brand is **HollywoodPest**. Until a real logo file (SVG) exists, the logo is built from text and CSS.
- **HP Asia** starts as a normal category in English, not a separate edition or language.
- **Shop** and **HP Publishing** open a "Coming soon" popup for now. Each nav item has a type (category / page / link / coming soon) that can be changed in siteSettings without touching code.
- Launch videos live on YouTube.
- Launch editors are you plus a few trusted people. On the free plan everyone is an admin.
- Seed and demo content is **made up**, with no real people or real photos. The mockup's celebrity photos and headlines are not reused.

## 11. Accounts you'll need

- **Cloudflare** (free). Workers, D1, R2, Turnstile and Web Analytics. R2 may ask for a card on file even though usage stays free.
- **Sanity** (free).
- **GitHub**: a private repo for news-blog, which Workers Builds deploys from.
- **Domain**, about $11 a year, bought through Cloudflare Registrar.
