/**
 * The site's Worker. Only /api/* reaches it (see `run_worker_first` in
 * wrangler.jsonc); every page is a static file served free by Cloudflare.
 */
import { handleAdvertise, handleTip } from './forms';
import { handleTipFile } from './tip-files';

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname === '/api/tip' && request.method === 'POST') return handleTip(request, env, ctx);
    if (pathname === '/api/advertise' && request.method === 'POST') return handleAdvertise(request, env, ctx);
    if (pathname.startsWith('/api/tip-file/') && request.method === 'GET') return handleTipFile(request, env);
    if (pathname.startsWith('/api/')) return new Response('Not found', { status: 404 });

    // Anything else that reaches the Worker is a static asset request.
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
