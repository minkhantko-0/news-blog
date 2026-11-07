/**
 * News tip and advertising forms.
 *
 * Plain HTML form posts (they work without JavaScript). On success the reader
 * is redirected to a thank-you page; on a problem, back to the form with
 * ?error=<code>, which the page explains.
 */
import { notifyEditors } from './notify';
import { signedFileUrl } from './tip-files';
import { verifyTurnstile } from './turnstile';

export const LIMITS = {
  tipChars: 10_000,
  messageChars: 5_000,
  shortChars: 200,
  files: 4,
  /** Whole request. The Worker reads the upload into memory, so keep this well under its 128MB. */
  totalBytes: 50 * 1024 * 1024,
};

type ErrorCode = 'captcha' | 'missing' | 'toolarge' | 'toomany' | 'filetype' | 'server';

const backTo = (request: Request, path: string, code: ErrorCode) =>
  Response.redirect(new URL(`${path}?error=${code}#form`, request.url).href, 303);

const done = (request: Request, path: string) => Response.redirect(new URL(path, request.url).href, 303);

/** Trimmed text field, or '' when missing. */
const text = (form: FormData, name: string, max: number) => {
  const value = form.get(name);
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
};

/** Hidden field real people never fill in. */
const isBot = (form: FormData) => text(form, 'website', 200) !== '';

const safeName = (name: string) =>
  name
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '_')
    .slice(-80) || 'file';

export async function handleTip(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const page = '/news-tip/';
  if (Number(request.headers.get('content-length') ?? 0) > LIMITS.totalBytes) return backTo(request, page, 'toolarge');

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return backTo(request, page, 'server');
  }
  if (isBot(form)) return done(request, '/news-tip/thanks/');
  if (!(await verifyTurnstile(form.get('cf-turnstile-response'), env.TURNSTILE_SECRET))) return backTo(request, page, 'captcha');

  const tip = text(form, 'tip', LIMITS.tipChars);
  if (!tip) return backTo(request, page, 'missing');

  const files = form.getAll('files').filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > LIMITS.files) return backTo(request, page, 'toomany');
  if (files.some((f) => !/^(image|video)\//.test(f.type))) return backTo(request, page, 'filetype');
  if (files.reduce((sum, f) => sum + f.size, 0) > LIMITS.totalBytes) return backTo(request, page, 'toolarge');

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const name = text(form, 'name', LIMITS.shortChars);
  const contact = text(form, 'contact', LIMITS.shortChars);
  const anonymous = form.get('anonymous') === 'yes';

  try {
    const stored = [];
    for (const [i, file] of files.entries()) {
      const key = `tips/${createdAt.slice(0, 10)}/${id}/${i + 1}-${safeName(file.name)}`;
      await env.TIP_FILES.put(key, file, { httpMetadata: { contentType: file.type } });
      stored.push({ key, name: file.name, size: file.size, type: file.type });
    }

    await env.DB.prepare('INSERT INTO tips (id, created_at, tip, name, contact, anonymous, files) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(id, createdAt, tip, name || null, contact || null, anonymous ? 1 : 0, JSON.stringify(stored))
      .run();

    const origin = new URL(request.url).origin;
    const links = await Promise.all(stored.map((f) => signedFileUrl(origin, f.key, env.LINK_SECRET)));
    ctx.waitUntil(
      notifyEditors(env, `New news tip${anonymous ? ' (anonymous)' : ''}`, [
        tip,
        '',
        `Name: ${name || '-'}`,
        `Contact: ${contact || '-'}`,
        `Wants to stay anonymous: ${anonymous ? 'YES' : 'no'}`,
        '',
        ...(stored.length
          ? ['Files (links work for 14 days):', ...stored.map((f, i) => `- ${f.name} (${Math.ceil(f.size / 1024)} KB): ${links[i]}`)]
          : ['No files.']),
        '',
        `Tip ID: ${id}`,
      ]),
    );
  } catch (err) {
    console.error('tip failed', err);
    return backTo(request, page, 'server');
  }

  return done(request, '/news-tip/thanks/');
}

export async function handleAdvertise(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const page = '/advertise/';
  if (Number(request.headers.get('content-length') ?? 0) > 100_000) return backTo(request, page, 'toolarge');

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return backTo(request, page, 'server');
  }
  if (isBot(form)) return done(request, '/advertise/thanks/');
  if (!(await verifyTurnstile(form.get('cf-turnstile-response'), env.TURNSTILE_SECRET))) return backTo(request, page, 'captcha');

  const name = text(form, 'name', LIMITS.shortChars);
  const email = text(form, 'email', LIMITS.shortChars);
  const message = text(form, 'message', LIMITS.messageChars);
  const company = text(form, 'company', LIMITS.shortChars);
  const budget = text(form, 'budget', 50);
  if (!name || !message || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return backTo(request, page, 'missing');

  const id = crypto.randomUUID();
  try {
    await env.DB.prepare(
      'INSERT INTO ad_enquiries (id, created_at, name, company, email, budget, message) VALUES (?, ?, ?, ?, ?, ?, ?)',
    )
      .bind(id, new Date().toISOString(), name, company || null, email, budget || null, message)
      .run();
    ctx.waitUntil(
      notifyEditors(env, `Advertising enquiry from ${company || name}`, [
        `Name: ${name}`,
        `Company: ${company || '-'}`,
        `Email: ${email}`,
        `Budget: ${budget || '-'}`,
        '',
        message,
        '',
        `Enquiry ID: ${id}`,
      ]),
    );
  } catch (err) {
    console.error('advertise failed', err);
    return backTo(request, page, 'server');
  }

  return done(request, '/advertise/thanks/');
}
