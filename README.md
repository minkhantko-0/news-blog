# news-blog (HollywoodPest)

Celebrity and entertainment news site. See [PLAN.md](PLAN.md) for the full plan.

| App | What | Local URL |
|---|---|---|
| `apps/web` | Public site: Astro, built to static HTML, hosted on Cloudflare | http://localhost:4321 |
| `apps/studio` | Admin: Sanity Studio | http://localhost:3333 |
| `apps/web/worker` | Small Worker for the forms (`/api/*` only) | http://localhost:8787 |
| `workers/scheduler` | Cron Worker: auto-publish scheduled stories, nightly backups | (no address) |

## Run it

```sh
pnpm install
pnpm dev          # public site (reads content from Sanity)
pnpm dev:studio   # admin (needs apps/studio/.env, see .env.example)
pnpm check        # type checks for both apps
pnpm build        # production build of the site into apps/web/dist
```

## Pages

| URL | What |
|---|---|
| `/` | Homepage |
| `/<section>/` | Top-level category (News, Celebs…), or a page (About, Privacy…) |
| `/<section>/<slug>/` | Sub-category, or an article |
| `…/page/<n>/` | Further pages of a category, tag or author |
| `/tag/<slug>/`, `/author/<slug>/` | Tag and author pages |
| `/videos/`, `/videos/<slug>/` | Videos |
| `/originals/`, `/originals/<slug>/` | Original shows |
| `/search/` | Search (Pagefind; works after `pnpm build`, try `pnpm preview`) |
| `/news-tip/`, `/advertise/` | Forms, handled by `apps/web/worker` |

## Content

- All content comes from Sanity (`apps/web/src/lib/content/sanity.ts`). Set `PUBLIC_SANITY_PROJECT_ID` in `apps/web/.env`.
- Components only use the shapes in `apps/web/src/lib/content/types.ts`, so the design doesn't depend on the CMS.
- `pnpm seed:build && pnpm seed:import` loads the made-up sample content (`apps/studio/seed/sample-content.ts`) into Sanity, replacing documents with the same IDs.

All sample content is fictional: made-up people and events, placeholder photos and placeholder video links.

## Forms, scheduling, redirects (phase 3)

- **Try the forms locally:** `pnpm preview:worker` builds the site and serves it with the form Worker at http://localhost:8787, using a local database and file store. It needs `apps/web/.dev.vars` (copy `.dev.vars.example`). Read what was submitted:
  `cd apps/web && pnpm exec wrangler d1 execute news-blog --local --command "select * from tips"`
- **Scheduling:** in an article, set *Publish time*, tick *Publish automatically*, and leave it as a draft. The scheduler publishes it within 5 minutes of that time.
- **Redirects:** publishing an article whose URL changed creates a redirect automatically; the build turns redirects into Cloudflare's `_redirects` file.
- **Scheduler locally:** needs a Sanity token with the Editor role in `workers/scheduler/.dev.vars` (copy `.dev.vars.example`), then `pnpm --filter scheduler dev` and fire a run with `curl "http://localhost:8788/__scheduled?cron=*%2F5+*+*+*+*"`.
- **Smoke tests:** `pnpm smoke` checks redirects, scheduling and backups against the real dataset using your Sanity CLI login. It creates temporary `smoke-` documents and deletes them.
- **Going live:** [docs/DEPLOY.md](docs/DEPLOY.md).
