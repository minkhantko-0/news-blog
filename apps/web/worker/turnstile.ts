/** Checks a Cloudflare Turnstile token (the "I'm human" check on the forms). */
export async function verifyTurnstile(token: string | File | null, secret: string): Promise<boolean> {
  if (typeof token !== 'string' || !token || !secret) return false;
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({ secret, response: token }),
    });
    const data = await res.json<{ success: boolean }>();
    return data.success === true;
  } catch (err) {
    console.error('turnstile check failed', err);
    return false;
  }
}
