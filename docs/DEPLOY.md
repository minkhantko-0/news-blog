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
   - **Deploy command:** `cd apps/web && pnpm exec wrangler deploy`
   - **Build variables:** `PUBLIC_SANITY_PROJECT_ID=bgva358g`, `PUBLIC_SANITY_DATASET=production`, `PUBLIC_SITE_URL=https://<domain>`, `PUBLIC_TURNSTILE_SITE_KEY=<from step 3>`
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

## 9. Check it works

- [ ] Homepage, an article, a category page and search load on `https://<domain>`.
- [ ] Publish a small edit in the Studio: the site updates within ~3 minutes.
- [ ] Schedule a test story 10 minutes ahead (draft + "Publish automatically"): it appears on its own.
- [ ] Send a test tip with a photo: the email arrives, and the file link opens.
- [ ] Change a published story's URL: the old URL redirects after the rebuild.
- [ ] Next morning: a backup exists in the `news-blog-backups` bucket.

## Limits to keep in mind (free plans)

- Workers: 100,000 Worker requests/day. Only forms, the scheduler and unknown URLs count; pages are free and unlimited.
- Workers Builds: 3,000 build minutes/month.
- `_redirects`: 2,000 rules (each redirect uses 2). Past that, move redirects into the Worker.
- Tip uploads: 4 files, 50MB total per tip (the Worker reads uploads into memory).
