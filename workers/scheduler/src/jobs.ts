/**
 * Scheduler jobs. Plain functions taking a Sanity client, so they can be
 * tested outside the Worker (see apps/studio/scripts/smoke-scheduler.ts).
 */
import type { SanityClient } from '@sanity/client';

/** Fields a story needs before it can go live without an editor checking it. */
const READY = 'defined(slug.current) && defined(category) && defined(heroImage.asset)';

export interface DueStory {
  _id: string;
  title?: string;
}

/**
 * Publishes article drafts that have "Publish automatically" ticked and a
 * publish time that has passed. The tick is cleared first, so a later edit of
 * the published story isn't auto-published by accident.
 */
export async function publishDueDrafts(client: SanityClient, now: Date): Promise<{ published: DueStory[]; skipped: DueStory[] }> {
  const due = await client.fetch<(DueStory & { ready: boolean })[]>(
    `*[_type == "article" && _id in path("drafts.**") && scheduled == true && defined(publishAt) && publishAt <= $now]{
      _id, title, "ready": ${READY}
    }`,
    { now: now.toISOString() },
    { perspective: 'raw' },
  );

  const published: DueStory[] = [];
  const skipped: DueStory[] = [];
  for (const story of due) {
    if (!story.ready) {
      skipped.push(story);
      continue;
    }
    const publishedId = story._id.replace(/^drafts\./, '');
    await client.patch(story._id).set({ scheduled: false }).commit();
    await client.action({ actionType: 'sanity.action.document.publish', draftId: story._id, publishedId });
    published.push(story);
  }
  return { published, skipped };
}

/**
 * Stories published early with a future time only appear on the site once
 * their time passes, which needs a rebuild. Counts those whose time fell in
 * the window (since, until].
 */
export async function countWentLive(client: SanityClient, since: Date, until: Date): Promise<number> {
  return client.fetch<number>(
    `count(*[_type in ["article", "video"] && !(_id in path("drafts.**")) && publishAt > $since && publishAt <= $until])`,
    { since: since.toISOString(), until: until.toISOString() },
    { perspective: 'raw' },
  );
}

export interface BackupTarget {
  put(key: string, value: string, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
  list(options: { prefix: string }): Promise<{ objects: { key: string; uploaded: Date }[] }>;
  delete(keys: string[]): Promise<unknown>;
}

/**
 * Exports every document in the dataset (NDJSON, the same format
 * `sanity dataset import` reads) and keeps the last `keepDays` days.
 * Images stay in Sanity; the export references them by asset ID.
 */
export async function backupDataset(
  opts: { projectId: string; dataset: string; token: string; keepDays: number },
  target: BackupTarget,
  now = new Date(),
): Promise<{ key: string; bytes: number; deleted: number }> {
  const res = await fetch(`https://${opts.projectId}.api.sanity.io/v2021-06-07/data/export/${opts.dataset}`, {
    headers: { Authorization: `Bearer ${opts.token}` },
  });
  if (!res.ok) throw new Error(`Export failed: ${res.status} ${await res.text()}`);
  // Read fully: fine while the dataset is small (tens of MB). Switch to a
  // multipart upload if it grows past ~100MB.
  const body = await res.text();

  const prefix = `sanity/${opts.dataset}/`;
  const key = `${prefix}${now.toISOString().slice(0, 10)}.ndjson`;
  await target.put(key, body, { httpMetadata: { contentType: 'application/x-ndjson' } });

  const cutoff = now.getTime() - opts.keepDays * 86_400_000;
  const { objects } = await target.list({ prefix });
  const old = objects.filter((o) => o.uploaded.getTime() < cutoff).map((o) => o.key);
  if (old.length) await target.delete(old);

  return { key, bytes: body.length, deleted: old.length };
}
