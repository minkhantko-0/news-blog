// Sends the pages changed in this build to IndexNow (Bing, Yandex, Seznam, Naver…).
// Run right after `wrangler deploy`, so engines only fetch pages that are live.
// Reads .indexnow/urls.json, written by integrations/edge-files.mjs.
import { readFile } from 'node:fs/promises';

const file = new URL('../.indexnow/urls.json', import.meta.url);
let data;
try {
  data = JSON.parse(await readFile(file, 'utf8'));
} catch {
  console.log('IndexNow: nothing to send (no INDEXNOW_KEY, indexing off, or no build output).');
  process.exit(0);
}

const { key, urls } = data;
if (!urls.length) {
  console.log('IndexNow: no changed pages in this build.');
  process.exit(0);
}

const host = new URL(urls[0]).host;
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host, key, keyLocation: `https://${host}/${key}.txt`, urlList: urls }),
});
// 200/202 = accepted. Never fail the deploy over this.
console.log(`IndexNow: sent ${urls.length} URLs → ${res.status} ${res.statusText}`);
