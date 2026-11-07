/**
 * Smoke test for the backup job (workers/scheduler/src/jobs.ts): exports the
 * dataset into an in-memory store and checks retention. Writes nothing to Sanity.
 *
 *   pnpm exec sanity exec scripts/smoke-backup.ts --with-user-token
 */
import { getCliClient } from 'sanity/cli';
import { backupDataset, type BackupTarget } from '../../../workers/scheduler/src/jobs';

const client = getCliClient({ apiVersion: '2026-11-01' });
const { projectId, dataset, token } = client.config();
if (!projectId || !dataset || !token) throw new Error('Run with --with-user-token');

const store = new Map<string, { value: string; uploaded: Date }>();
// An old backup that should be pruned, and a recent one that should stay.
store.set(`sanity/${dataset}/2000-01-01.ndjson`, { value: '', uploaded: new Date('2000-01-01') });
store.set(`sanity/${dataset}/recent.ndjson`, { value: '', uploaded: new Date() });

const target: BackupTarget = {
  put: async (key, value) => void store.set(key, { value, uploaded: new Date() }),
  list: async ({ prefix }) => ({ objects: [...store].filter(([k]) => k.startsWith(prefix)).map(([key, v]) => ({ key, uploaded: v.uploaded })) }),
  delete: async (keys) => keys.forEach((k) => store.delete(k)),
};

const result = await backupDataset({ projectId, dataset, token, keepDays: 30 }, target);
const lines = store.get(result.key)!.value.trim().split('\n');
const types = new Set(lines.map((l) => JSON.parse(l)._type));
if (lines.length < 50 || !types.has('article') || !types.has('siteSettings')) throw new Error(`export looks wrong: ${lines.length} lines`);
if (result.deleted !== 1 || store.has(`sanity/${dataset}/2000-01-01.ndjson`) || !store.has(`sanity/${dataset}/recent.ndjson`)) {
  throw new Error(`retention wrong: ${JSON.stringify(result)}`);
}
console.log(`PASS backup: ${lines.length} documents exported to ${result.key} (${Math.round(result.bytes / 1024)} KB); old backup pruned, recent kept`);
