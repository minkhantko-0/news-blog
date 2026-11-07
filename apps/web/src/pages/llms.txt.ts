/**
 * llms.txt (llmstxt.org): a plain-language guide to the site for AI models:
 * what HollywoodPest is, its sections, policies and latest stories.
 */
import type { APIRoute } from 'astro';
import { content } from '~/lib/content';
import { absolute } from '~/lib/seo/site';
import { indexableArticles } from '~/lib/seo/urls';
import { textResponse } from '~/lib/seo/xml';

const oneLine = (s: string) => s.replace(/\s+/g, ' ').trim();

export const GET: APIRoute = async () => {
  const [settings, categories, articles, pages] = await Promise.all([
    content.getSiteSettings(),
    content.getCategories(),
    indexableArticles(),
    content.getPages(),
  ]);
  const page = (slug: string) => pages.find((p) => p.slug === slug);
  const policyLinks = ['about', 'editorial-standards', 'corrections', 'contact']
    .map(page)
    .filter((p) => p !== undefined)
    .map((p) => `- [${p.title}](${absolute(p.href)})`);

  const lines = [
    `# ${settings.name}`,
    '',
    `> ${settings.name} is a ${settings.tagline.toLowerCase()} covering celebrity, entertainment, sports and viral news.`,
    '',
    'Every story has a byline, a publish time and, when facts change, an "updated" time. Corrections are noted at the end of the story. Each story starts with a one-sentence summary of the key facts.',
    '',
    '## Sections',
    ...categories.filter((c) => !c.parent).map((c) => `- [${c.title}](${absolute(c.href)})${c.description ? `: ${oneLine(c.description)}` : ''}`),
    `- [Videos](${absolute('/videos/')})`,
    `- [Originals](${absolute('/originals/')}): original video shows`,
    '',
    '## Latest stories',
    ...articles.slice(0, 30).map((a) => `- [${oneLine(a.title)}](${absolute(a.href)})${a.dek ? `: ${oneLine(a.dek)}` : ''}`),
    '',
    '## About and policies',
    ...policyLinks,
    '',
    '## Feeds',
    `- [RSS: latest stories](${absolute('/rss.xml')})`,
    `- [Sitemap](${absolute('/sitemap-index.xml')})`,
    '',
  ];
  return textResponse(lines.join('\n'));
};
