/**
 * Private links to files sent with tips. The bucket is never public: editors
 * get time-limited links signed with LINK_SECRET (HMAC-SHA256).
 */
const encoder = new TextEncoder();
const LINK_DAYS = 14;

const toBase64Url = (bytes: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const fromBase64Url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

const hmacKey = (secret: string) =>
  crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);

export async function signedFileUrl(origin: string, key: string, secret: string, days = LINK_DAYS): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + days * 86_400;
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(secret), encoder.encode(`${key}|${exp}`));
  return `${origin}/api/tip-file/${encodeURIComponent(key)}?exp=${exp}&sig=${toBase64Url(sig)}`;
}

export async function handleTipFile(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const key = decodeURIComponent(url.pathname.slice('/api/tip-file/'.length));
  const exp = Number(url.searchParams.get('exp'));
  const sig = url.searchParams.get('sig') ?? '';

  const denied = new Response('This link is invalid or has expired.', { status: 403 });
  if (!key.startsWith('tips/') || !exp || exp < Date.now() / 1000 || !sig) return denied;

  let valid = false;
  try {
    // crypto.subtle.verify compares in constant time.
    valid = await crypto.subtle.verify('HMAC', await hmacKey(env.LINK_SECRET), fromBase64Url(sig), encoder.encode(`${key}|${exp}`));
  } catch {
    valid = false;
  }
  if (!valid) return denied;

  const object = await env.TIP_FILES.get(key);
  if (!object) return new Response('File not found.', { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('Cache-Control', 'private, no-store');
  headers.set('X-Robots-Tag', 'noindex, nofollow');
  headers.set('Content-Disposition', `inline; filename="${key.split('/').pop()?.replace(/"/g, '') ?? 'file'}"`);
  return new Response(object.body, { headers });
}
