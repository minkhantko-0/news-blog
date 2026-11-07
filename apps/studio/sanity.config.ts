import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes, SINGLETON_TYPES } from './schemaTypes';
import { structure } from './structure';
import { withRedirectOnUrlChange } from './actions/publishWithRedirect';

const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
if (!projectId) {
  throw new Error('Set SANITY_STUDIO_PROJECT_ID in apps/studio/.env (see .env.example).');
}

export default defineConfig({
  name: 'default',
  title: 'HollywoodPest Admin',
  projectId,
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',

  plugins: [structureTool({ structure }), visionTool()],

  schema: {
    types: schemaTypes,
    // Homepage and Site settings exist once: hide them from "Create new".
    templates: (templates) => templates.filter(({ schemaType }) => !SINGLETON_TYPES.has(schemaType)),
  },

  document: {
    // Singletons can't be duplicated or deleted.
    actions: (actions, { schemaType }) => {
      if (SINGLETON_TYPES.has(schemaType)) {
        return actions.filter(({ action }) => action && ['publish', 'discardChanges', 'restore'].includes(action));
      }
      if (schemaType === 'article') {
        // Publishing an article whose URL changed creates a redirect from the old URL.
        return actions.map((action) => (action.action === 'publish' ? withRedirectOnUrlChange(action) : action));
      }
      return actions;
    },
    newDocumentOptions: (items) => items.filter(({ templateId }) => !SINGLETON_TYPES.has(templateId)),
  },
});
