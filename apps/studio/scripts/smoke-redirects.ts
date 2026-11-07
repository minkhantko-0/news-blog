/**
 * Smoke test for the redirect-on-publish logic (actions/redirects.ts) against
 * the real dataset. Creates temporary "smoke-" documents and removes them.
 *
 *   pnpm exec sanity exec scripts/smoke-redirects.ts --with-user-token
 */
import { getCliClient } from 'sanity/cli';
import { createRedirectIfMoved, type RedirectClient } from '../actions/redirects';

const client = getCliClient({ apiVersion: '2026-11-01' });
const rc = client as unknown as RedirectClient;
const ID = 'smoke-redirect-article';
const base = { _type: 'article', title: 'Smoke test (temporary)', category: { _type: 'reference', _ref: 'category-crime-courts' } };
const slug = (s: string) => ({ _type: 'slug', current: s });

async function setVersions(publishedSlug: string, draftSlug: string) {
  await client.transaction()
    .createOrReplace({ _id: ID, ...base, slug: slug(publishedSlug) })
    .createOrReplace({ _id: `drafts.${ID}`, ...base, slug: slug(draftSlug) })
    .commit();
}

const redirects = () => client.fetch<{ from: string; to: string }[]>(`*[_type == "redirect" && from match "/news/smoke-*"] | order(from asc){ from, to }`);
const fail = (msg: string) => { throw new Error(msg); };

try {
  // 1. Slug changes a → b
  await setVersions('smoke-a', 'smoke-b');
  const first = await createRedirectIfMoved(rc, ID);
  if (first?.from !== '/news/smoke-a/' || first?.to !== '/news/smoke-b/') fail(`step 1: ${JSON.stringify(first)}`);

  // 2. Published as b, slug changes b → c: a→b must be re-pointed to c (no chains)
  await setVersions('smoke-b', 'smoke-c');
  await createRedirectIfMoved(rc, ID);
  let r = await redirects();
  if (JSON.stringify(r) !== JSON.stringify([{ from: '/news/smoke-a/', to: '/news/smoke-c/' }, { from: '/news/smoke-b/', to: '/news/smoke-c/' }]))
    fail(`step 2: ${JSON.stringify(r)}`);

  // 3. Moved back to a: the redirect *from* a must go (it would loop)
  await setVersions('smoke-c', 'smoke-a');
  await createRedirectIfMoved(rc, ID);
  r = await redirects();
  if (JSON.stringify(r) !== JSON.stringify([{ from: '/news/smoke-b/', to: '/news/smoke-a/' }, { from: '/news/smoke-c/', to: '/news/smoke-a/' }]))
    fail(`step 3: ${JSON.stringify(r)}`);

  // 4. Unchanged URL: no redirect
  await setVersions('smoke-a', 'smoke-a');
  if ((await createRedirectIfMoved(rc, ID)) !== undefined) fail('step 4: expected no redirect');

  console.log('PASS redirects: a→b, chain re-pointing, loop removal, unchanged URL');
} finally {
  const ids = await client.fetch<string[]>(`*[_id in [$id, $draft] || (_type == "redirect" && (from match "/news/smoke-*" || to match "/news/smoke-*"))]._id`, { id: ID, draft: `drafts.${ID}` });
  const tx = client.transaction();
  ids.forEach((id) => tx.delete(id));
  await tx.commit();
  console.log(`cleaned up ${ids.length} temporary documents`);
}
