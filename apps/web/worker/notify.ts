/**
 * Emails the editors about new form submissions.
 *
 * Needs a domain with Cloudflare Email Routing and a `send_email` binding
 * named SEND_EMAIL (see wrangler.jsonc). Until then it only logs, and
 * submissions are still saved in D1.
 */
import { EmailMessage } from 'cloudflare:email';

type EnvWithEmail = Env & { SEND_EMAIL?: SendEmail };

const oneLine = (s: string) => s.replace(/[\r\n]+/g, ' ').trim();

/** RFC 2047 encoded-word, so subjects can contain any characters. */
const encodeHeader = (s: string) => `=?UTF-8?B?${btoa(String.fromCharCode(...new TextEncoder().encode(oneLine(s))))}?=`;

export async function notifyEditors(env: Env, subject: string, lines: string[]): Promise<void> {
  const { SEND_EMAIL } = env as EnvWithEmail;
  const from = String(env.NOTIFY_FROM);
  const to = String(env.NOTIFY_TO);

  if (!SEND_EMAIL || !from || !to) {
    console.log(`[notify] email not configured; saved only: ${subject}`);
    return;
  }

  const raw = [
    `From: HollywoodPest Website <${from}>`,
    `To: <${to}>`,
    `Subject: ${encodeHeader(subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@${from.split('@')[1] ?? 'localhost'}>`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    lines.join('\r\n'),
  ].join('\r\n');

  try {
    await SEND_EMAIL.send(new EmailMessage(from, to, raw));
  } catch (err) {
    console.error('[notify] email failed', err);
  }
}
