# news-blog (HollywoodPest)

Celebrity and entertainment news site. See [PLAN.md](PLAN.md) for the full plan.

| App | What | Local URL |
|---|---|---|
| `apps/web` | Public site: Astro, built to static HTML, hosted on Cloudflare | http://localhost:4321 |
| `apps/studio` | Admin: Sanity Studio | http://localhost:3333 |

## Run it

```sh
pnpm install
pnpm dev          # public site (uses the made-up sample content until Sanity is connected)
pnpm dev:studio   # admin (needs apps/studio/.env, see .env.example)
pnpm check        # type checks for both apps
pnpm build        # production build of the site into apps/web/dist
```

## Content

- Without `PUBLIC_SANITY_PROJECT_ID` in `apps/web/.env`, the site uses the local sample content in `apps/web/src/lib/content/fixtures.ts`.
- With it set, the site reads published content from Sanity (`apps/web/src/lib/content/sanity.ts`).
- Components only use the shapes in `apps/web/src/lib/content/types.ts`, so the design doesn't depend on the CMS.
- `pnpm seed:build && pnpm seed:import` loads the same sample content into Sanity.

All sample content is fictional: made-up people and events, placeholder photos and placeholder video links.
