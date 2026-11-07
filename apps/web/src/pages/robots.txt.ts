/**
 * robots.txt
 *
 * Before launch (PUBLIC_ALLOW_INDEXING not "true"): everything blocked.
 * After launch:
 *  - search engines and AI search/answer engines may crawl, so stories can be
 *    found and cited (GEO);
 *  - AI *training* crawlers follow the "Allow AI training crawlers" switch in
 *    Sanity → Site settings.
 *
 * Cloudflare can also block AI crawlers at the network level: keep its
 * "AI Crawl Control" settings in line with this file (docs/DEPLOY.md).
 */
import type { APIRoute } from 'astro';
import { content } from '~/lib/content';
import { absolute, ALLOW_INDEXING } from '~/lib/seo/site';
import { textResponse } from '~/lib/seo/xml';

/** Crawlers that fetch pages to answer or cite in AI search results. */
const AI_SEARCH = [
  'OAI-SearchBot',
  'ChatGPT-User',
  'PerplexityBot',
  'Perplexity-User',
  'Claude-SearchBot',
  'Claude-User',
  'DuckAssistBot',
  'MistralAI-User',
];

/** Crawlers and opt-out tokens that collect content to train AI models. */
const AI_TRAINING = [
  'GPTBot',
  'ClaudeBot',
  'anthropic-ai',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
  'Meta-ExternalAgent',
  'Bytespider',
  'Amazonbot',
  'cohere-training-data-crawler',
];

const PRIVATE = ['/api/', '/search/', '/coming-soon/', '/news-tip/thanks/', '/advertise/thanks/'];

export const GET: APIRoute = async () => {
  if (!ALLOW_INDEXING) {
    return textResponse('# Pre-launch: not open to search engines yet.\nUser-agent: *\nDisallow: /\n');
  }
  const { allowAiTraining } = await content.getSiteSettings();
  const group = (agents: string[], rules: string[]) => [...agents.map((a) => `User-agent: ${a}`), ...rules].join('\n');
  const privateRules = PRIVATE.map((p) => `Disallow: ${p}`);

  return textResponse(
    [
      '# HollywoodPest',
      group(['*'], [...privateRules, 'Allow: /']),
      '# AI search and answer engines: allowed, so they can find and cite our stories.',
      group(AI_SEARCH, [...privateRules, 'Allow: /']),
      `# AI model training: ${allowAiTraining ? 'allowed' : 'not allowed'} (Sanity: Site settings → Allow AI training crawlers).`,
      group(AI_TRAINING, allowAiTraining ? [...privateRules, 'Allow: /'] : ['Disallow: /']),
      `Sitemap: ${absolute('/sitemap-index.xml')}`,
      '',
    ].join('\n\n'),
  );
};
