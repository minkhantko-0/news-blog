/**
 * news-blog scheduler (Cloudflare Worker with cron triggers).
 *
 * - Every 5 minutes: publish scheduled article drafts that are due, and
 *   trigger a site rebuild when a story went live.
 * - Daily: back up the Sanity dataset to R2.
 *
 * Test locally: `pnpm dev`, then
 *   curl "http://localhost:8788/__scheduled?cron=*%2F5+*+*+*+*"
 *   curl "http://localhost:8788/__scheduled?cron=15+7+*+*+*"
 */
import { createClient } from '@sanity/client';
import { backupDataset, countWentLive, publishDueDrafts } from './jobs';

const BACKUP_CRON = '15 7 * * *';
/** A little longer than the 5-minute interval, so no story falls between two runs. */
const WINDOW_MS = 6 * 60 * 1000;

export default {
  // No public endpoints: cron triggers only.
  fetch: () => new Response('Not found', { status: 404 }),

  async scheduled(controller, env, ctx) {
    if (!env.SANITY_WRITE_TOKEN) {
      console.warn('SANITY_WRITE_TOKEN is not set: nothing to do.');
      return;
    }

    if (controller.cron === BACKUP_CRON) {
      const result = await backupDataset(
        {
          projectId: env.SANITY_PROJECT_ID,
          dataset: env.SANITY_DATASET,
          token: env.SANITY_WRITE_TOKEN,
          keepDays: Number(env.BACKUP_KEEP_DAYS) || 30,
        },
        env.BACKUPS,
      );
      console.log(`Backup saved: ${result.key} (${result.bytes} bytes), removed ${result.deleted} old backups.`);
      return;
    }

    const client = createClient({
      projectId: env.SANITY_PROJECT_ID,
      dataset: env.SANITY_DATASET,
      apiVersion: '2026-11-01',
      token: env.SANITY_WRITE_TOKEN,
      useCdn: false,
    });

    const now = new Date(controller.scheduledTime);
    const { published, skipped } = await publishDueDrafts(client, now);
    for (const s of published) console.log(`Published scheduled story: ${s.title ?? s._id}`);
    for (const s of skipped) {
      console.warn(`Not published, missing URL, category or main image: ${s.title ?? s._id}`);
    }

    const wentLive = await countWentLive(client, new Date(now.getTime() - WINDOW_MS), now);
    if (published.length === 0 && wentLive === 0) return;

    // Publishing also fires Sanity's webhook, which rebuilds the site. Calling the
    // deploy hook here covers stories that were published early with a future
    // time. Duplicate requests are merged by Cloudflare.
    if (env.DEPLOY_HOOK_URL) {
      ctx.waitUntil(
        fetch(env.DEPLOY_HOOK_URL, { method: 'POST' }).then((r) => console.log(`Rebuild requested: ${r.status}`)),
      );
    } else {
      console.log('DEPLOY_HOOK_URL is not set: skipping rebuild request.');
    }
  },
} satisfies ExportedHandler<Env>;
