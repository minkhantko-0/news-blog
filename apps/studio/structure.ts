import type { StructureResolver } from 'sanity/structure';
import { CogIcon } from '@sanity/icons/Cog';
import { HomeIcon } from '@sanity/icons/Home';

/** Left-hand menu of the admin. */
export const structure: StructureResolver = (S) =>
  S.list()
    .title('HollywoodPest')
    .items([
      S.listItem()
        .title('Homepage')
        .id('homepage')
        .icon(HomeIcon)
        .child(S.document().schemaType('homepage').documentId('homepage').title('Homepage')),
      S.divider(),
      S.documentTypeListItem('article').title('Articles'),
      S.documentTypeListItem('video').title('Videos'),
      S.documentTypeListItem('show').title('Originals'),
      S.divider(),
      S.documentTypeListItem('category').title('Categories'),
      S.documentTypeListItem('tag').title('Tags'),
      S.documentTypeListItem('author').title('Authors'),
      S.documentTypeListItem('page').title('Pages'),
      S.documentTypeListItem('redirect').title('Redirects'),
      S.divider(),
      S.listItem()
        .title('Site settings')
        .id('siteSettings')
        .icon(CogIcon)
        .child(S.document().schemaType('siteSettings').documentId('siteSettings').title('Site settings')),
    ]);
