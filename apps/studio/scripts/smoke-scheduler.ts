/**
 * Smoke test for the scheduler jobs (workers/scheduler/src/jobs.ts) against the
 * real dataset. Creates temporary "smoke-" drafts and removes them.
 *
 *   pnpm exec sanity exec scripts/smoke-scheduler.ts --with-user-token
 */
import { getCliClient } from 'sanity/cli';
import { countWentLive, publishDueDrafts } from '../../../workers/scheduler/src/jobs';

const client = getCliClient({ apiVersion: '2026-11-01' });
const now = new Date();
const minutes = (m: number) => new Date(now.getTime() + m * 60_000).toISOString();

// Reuse an existing image asset so the "ready" check passes.
const heroImage = await client.fetch(`*[_type == "article" && defined(heroImage.asset)][0].heroImage`);
const base = (slugText: string) => ({
  _type: 'article',
  title: `Smoke test ${slugText} (temporary)`,
  slug: { _type: 'slug', current: slugText },
  category: { _type: 'reference', _ref: 'category-crime-courts' },
  heroImage,
});

const docs = {
  due: { _id: 'drafts.smoke-sched-due', ...base('smoke-sched-due'), scheduled: true, publishAt: minutes(-2) },
  future: { _id: 'drafts.smoke-sched-future', ...base('smoke-sched-future'), scheduled: true, publishAt: minutes(60) },
  notTicked: { _id: 'drafts.smoke-sched-not-ticked', ...base('smoke-sched-not-ticked'), scheduled: false, publishAt: minutes(-2) },
  notReady: { _id: 'drafts.smoke-sched-not-ready', _type: 'article', title: 'Smoke test not ready (temporary)', scheduled: true, publishAt: minutes(-2) },
};
const fail = (msg: string) => { throw new Error(msg); };

try {
  const tx = client.transaction();
  Object.values(docs).forEach((d) => tx.createOrReplace(d));
  await tx.commit();

  const { published, skipped } = await publishDueDrafts(client, now);
  const ids = (list: { _id: string }[]) => list.map((s) => s._id).filter((id) => id.includes('smoke-')).sort();
  if (JSON.stringify(ids(published)) !== JSON.stringify(['drafts.smoke-sched-due'])) fail(`published: ${JSON.stringify(ids(published))}`);
  if (JSON.stringify(ids(skipped)) !== JSON.stringify(['drafts.smoke-sched-not-ready'])) fail(`skipped: ${JSON.stringify(ids(skipped))}`);

  const state = await client.fetch(
    `{ "pub": *[_id == "smoke-sched-due"][0]{ scheduled }, "draftGone": !defined(*[_id == "drafts.smoke-sched-due"][0]),
       "futureStillDraft": defined(*[_id == "drafts.smoke-sched-future"][0]), "notTickedStillDraft": defined(*[_id == "drafts.smoke-sched-not-ticked"][0]) }`,
    {},
    { perspective: 'raw' },
  );
  if (state.pub?.scheduled !== false || !state.draftGone || !state.futureStillDraft || !state.notTickedStillDraft) fail(`state: ${JSON.stringify(state)}`);

  const live = await countWentLive(client, new Date(now.getTime() - 6 * 60_000), now);
  if (live < 1) fail(`countWentLive: ${live}`);

  console.log('PASS scheduler: due draft published (tick cleared); future, unticked and incomplete drafts left alone; rebuild detected');
} finally {
  const ids = await client.fetch<string[]>(`*[_id match "smoke-sched-*" || _id match "drafts.smoke-sched-*"]._id`, {}, { perspective: 'raw' });
  const tx = client.transaction();
  ids.forEach((id) => tx.delete(id));
  await tx.commit();
  console.log(`cleaned up ${ids.length} temporary documents`);
}
