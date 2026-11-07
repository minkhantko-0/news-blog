import { article } from './documents/article';
import { author, category, page, redirect, show, tag, video } from './documents/others';
import { objectTypes } from './objects/shared';
import { homepage, siteSettings } from './singletons/singletons';

export { SINGLETON_TYPES } from './singletons/singletons';

export const schemaTypes = [
  // Documents
  article,
  video,
  show,
  category,
  tag,
  author,
  page,
  redirect,
  // Singletons
  homepage,
  siteSettings,
  // Objects
  ...objectTypes,
];
