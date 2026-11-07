/** Helpers for the XML files (sitemaps, RSS). */

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function xmlResponse(body: string, contentType = 'application/xml'): Response {
  return new Response(body, { headers: { 'Content-Type': `${contentType}; charset=utf-8` } });
}

export function textResponse(body: string): Response {
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
