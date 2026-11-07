# Going live: deploy runbook

Everything below happens once, at launch. Until then the whole stack runs locally (see the README). Steps are in order; each says where to do it.

**You'll need:** the domain, your Cloudflare and Sanity logins, and this repo on GitHub (`minkhantko-0/news-blog`).

---

## 1. Domain

1. Cloudflare dashboard → **Domain Registration → Register** (sold at cost, about $11/year for a .com).
2. Note the domain. Below it's written as `<domain>`.

## 2. Storage for the forms and backups

Run from `apps/web/`:

```sh
pnpm exec wrangler d1 create news-blog
```

Copy the `database_id` it prints into `apps/web/wrangler.jsonc` (under `d1_databases`), then:

```sh
pnpm exec wrangler d1 migrations apply news-blog --remote
pnpm exec wrangler r2 bucket create news-blog-tip-files
pnpm exec wrangler r2 bucket create news-blog-backups
```

Both buckets stay **private**. Don't enable public access.

## 3. Spam protection (Turnstile)

1. Cloudflare dashboard → **Turnstile → Add widget**. Hostname: `<domain>`. Mode: *Managed*.
2. Keep the **site key** for step 5 (`PUBLIC_TURNSTILE_SITE_KEY`).
3. Store the **secret key** on the site Worker:

```sh
cd apps/web
pnpm exec wrangler secret put TURNSTILE_SECRET
pnpm exec wrangler secret put LINK_SECRET    # paste a long random string, e.g. from `openssl rand -hex 32`
```

## 4. Tip emails (needs the domain)

1. Cloudflare dashboard → `<domain>` → **Email → Email Routing**: enable it and add the editors' inbox as a **destination address** (verify it).
2. In `apps/web/wrangler.jsonc`, add the binding and fill in the vars:

```jsonc
"send_email": [{ "name": "SEND_EMAIL", "destination_address": "<editors-inbox>" }],
"vars": { "NOTIFY_FROM": "tips@<domain>", "NOTIFY_TO": "<editors-inbox>" }
```

Until this is done, tips are still saved. To read the latest ones:

```sh
pnpm exec wrangler d1 execute news-blog --remote --command "select created_at, tip, name, contact, anonymous, files from tips order by created_at desc limit 20"
```

## 5. The site (Workers Builds)

1. Cloudflare dashboard → **Workers & Pages → Create → Import a repository** → `minkhantko-0/news-blog`.
2. Settings:
   - **Root directory:** `/` (repo root)
   - **Build command:** `pnpm install --frozen-lockfile && pnpm --filter web build`
   - **Deploy command:** `cd apps/web && pnpm exec wrangler deploy && node scripts/indexnow.mjs`
   - **Build variables:**
     - `PUBLIC_SANITY_PROJECT_ID=bgva358g`
     - `PUBLIC_SANITY_DATASET=production`
     - `PUBLIC_SITE_URL=https://<domain>`
     - `PUBLIC_TURNSTILE_SITE_KEY=<from step 3>`
     - `PUBLIC_ALLOW_INDEXING=true`: opens the site to search engines. Without it every page says "noindex" and robots.txt blocks everything, which is what you want for previews.
     - `INDEXNOW_KEY=<random>` (e.g. `openssl rand -hex 16`): lets the deploy tell Bing and others about new stories right away.
3. Worker → **Settings → Domains & Routes → Add custom domain** → `<domain>` (and `www.<domain>` redirecting to it).
4. Worker → **Settings → Builds → Deploy Hooks → Create** (branch `main`, name `sanity-publish`). Copy the URL: it's a secret.

## 6. Rebuild on publish (Sanity webhook)

sanity.io/manage → project **Hollywood Pest** → **API → Webhooks → Create webhook**:

| Field | Value |
|---|---|
| URL | the deploy hook URL from step 5 |
| Dataset | `production` |
| Trigger on | Create, Update, Delete |
| Filter | `_type in ["article", "video", "show", "category", "tag", "author", "page", "homepage", "siteSettings", "redirect"]` |
| Drafts | off |
| HTTP method | POST |

Publishing anything now rebuilds the site in about 1–3 minutes. Rapid edits are merged into one build.

## 7. Scheduler (auto-publish + nightly backups)

1. sanity.io/manage → **API → Tokens → Add API token**: name `Scheduler`, permissions **Editor**. Copy it.
2. Then:

```sh
cd workers/scheduler
pnpm exec wrangler secret put SANITY_WRITE_TOKEN   # the token
pnpm exec wrangler secret put DEPLOY_HOOK_URL      # the deploy hook from step 5
pnpm exec wrangler deploy
```

It has no public address; it only runs on its timers.

## 8. The admin (Sanity Studio)

```sh
cd apps/studio
pnpm exec sanity deploy      # → https://hollywoodpest.sanity.studio
```

Invite editors at sanity.io/manage → **Members**. On the free plan everyone who can edit is an Administrator.

## 9. Search engines and AI search

1. **Google Search Console** (search.google.com/search-console): add a *Domain* property for `<domain>`. Cloudflare can add the verification record for you. Then **Sitemaps → add** `https://<domain>/sitemap-index.xml`.
2. **Bing Webmaster Tools** (bing.com/webmasters): *Import from Google Search Console*. Bing also powers ChatGPT search results, and IndexNow (step 5) keeps it updated within minutes.
3. **Google Publisher Center** (publishercenter.google.com): add the publication. The name must be exactly **HollywoodPest** (it matches the News sitemap). Add the site URL and the sections.
4. **Cloudflare → AI Crawl Control** (for `<domain>`): new domains block AI crawlers by default, which would undo the GEO work.
   - **Allow** the AI search crawlers: OAI-SearchBot, ChatGPT-User, PerplexityBot, Perplexity-User, Claude-SearchBot, Claude-User, DuckAssistBot.
   - **Training crawlers** (GPTBot, ClaudeBot, CCBot, Google-Extended, Applebot-Extended, Meta-ExternalAgent, Bytespider): match the **Allow AI training crawlers** switch in Sanity → Site settings (off by default, so block them).
   - Leave **Managed robots.txt** off: the site publishes its own `robots.txt`.
5. Replace the placeholder social links in Sanity → **Site settings → Social accounts**. Real profile links are what tell Google and AI search engines which accounts are officially HollywoodPest.

## 10. Check it works

- [ ] Homepage, an article, a category page and search load on `https://<domain>`.
- [ ] Publish a small edit in the Studio: the site updates within ~3 minutes.
- [ ] Schedule a test story 10 minutes ahead (draft + "Publish automatically"): it appears on its own.
- [ ] Send a test tip with a photo: the email arrives, and the file link opens.
- [ ] Change a published story's URL: the old URL redirects after the rebuild.
- [ ] Next morning: a backup exists in the `news-blog-backups` bucket.
- [ ] `https://<domain>/robots.txt` shows the full rules (not "Pre-launch"), and `/sitemap-index.xml`, `/sitemap-news.xml`, `/rss.xml`, `/llms.txt` load.
- [ ] Google's **Rich Results Test** on an article URL finds a valid *NewsArticle* and *Breadcrumb*.
- [ ] Paste an article link into the **Facebook Sharing Debugger** (or a WhatsApp chat): the preview shows the photo, headline and summary.

## Limits to keep in mind (free plans)

- Workers: 100,000 Worker requests/day. Only forms, the scheduler and unknown URLs count; pages are free and unlimited.
- Workers Builds: 3,000 build minutes/month.
- `_redirects`: 2,000 rules (each redirect uses 2). Past that, move redirects into the Worker.
- Tip uploads: 4 files, 50MB total per tip (the Worker reads uploads into memory).
