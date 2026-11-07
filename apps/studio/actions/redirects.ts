/**
 * Keeps old article links working when a published story's URL changes
 * (new slug, or moved to another section).
 *
 * Runs just before Publish: compares the published version's URL with the
 * draft's, and if they differ, creates a redirect old → new. Existing
 * redirects that pointed at the old URL are re-pointed (no chains), and a
 * redirect *from* the new URL is removed (moving a story back to an old URL
 * would otherwise loop).
 *
 * Plain function with a minimal client type so it can be tested outside the Studio.
 */

export interface RedirectClient {
  fetch<T>(query: string, params: Record<string, unknown>, options?: { perspective?: 'raw' }): Promise<T>;
  transaction(): {
    createOrReplace(doc: Record<string, unknown> & { _id: string; _type: string }): unknown;
    patch(id: string, patch: { set: Record<string, unknown> }): unknown;
    delete(id: string): unknown;
    commit(): Promise<unknown>;
  };
}

interface UrlParts {
  slug?: string;
  section?: string;
}

const urlFields = `{ "slug": slug.current, "section": coalesce(category->parent->slug.current, category->slug.current) }`;

export const articlePath = (p: UrlParts) => (p.slug && p.section ? `/${p.section}/${p.slug}/` : undefined);

/** Deterministic, valid document ID for a redirect from `path`. */
export const redirectId = (path: string) => `redirect-${path.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '')}`.slice(0, 120);

/** Returns the created redirect ({ from, to }) or undefined when the URL didn't change. */
export async function createRedirectIfMoved(client: RedirectClient, documentId: string) {
  const publishedId = documentId.replace(/^drafts\./, '');
  const { published, draft } = await client.fetch<{ published?: UrlParts; draft?: UrlParts }>(
    `{ "published": *[_id == $publishedId][0]${urlFields}, "draft": *[_id == $draftId][0]${urlFields} }`,
    { publishedId, draftId: `drafts.${publishedId}` },
    { perspective: 'raw' },
  );

  const from = published && articlePath(published);
  const to = draft && articlePath(draft);
  if (!from || !to || from === to) return undefined;

  const { chained, loops } = await client.fetch<{ chained: string[]; loops: string[] }>(
    `{ "chained": *[_type == "redirect" && to == $from]._id, "loops": *[_type == "redirect" && from == $to]._id }`,
    { from, to },
  );

  const tx = client.transaction();
  tx.createOrReplace({ _id: redirectId(from), _type: 'redirect', from, to, permanent: true });
  chained.forEach((id) => tx.patch(id, { set: { to } }));
  loops.forEach((id) => tx.delete(id));
  await tx.commit();
  return { from, to };
}
