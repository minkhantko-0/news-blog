# news-blog (HollywoodPest)

Celebrity and entertainment news site. See [PLAN.md](PLAN.md) for the full plan.

| App | What | Local URL |
|---|---|---|
| `apps/web` | Public site: Astro, built to static HTML, hosted on Cloudflare | http://localhost:4321 |
| `apps/studio` | Admin: Sanity Studio | http://localhost:3333 |

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
| `/news-tip/`, `/advertise/` | Forms (the submit endpoints arrive in phase 3) |

## Content

- All content comes from Sanity (`apps/web/src/lib/content/sanity.ts`). Set `PUBLIC_SANITY_PROJECT_ID` in `apps/web/.env`.
- Components only use the shapes in `apps/web/src/lib/content/types.ts`, so the design doesn't depend on the CMS.
- `pnpm seed:build && pnpm seed:import` loads the made-up sample content (`apps/studio/seed/sample-content.ts`) into Sanity, replacing documents with the same IDs.

All sample content is fictional: made-up people and events, placeholder photos and placeholder video links.
