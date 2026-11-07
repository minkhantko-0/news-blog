import { useToast } from '@sanity/ui/toast';
import { useClient, type DocumentActionComponent } from 'sanity';
import { createRedirectIfMoved, type RedirectClient } from './redirects';

/**
 * Wraps the standard Publish button: before publishing an article, creates a
 * redirect if its URL changed. Publishing continues even if that step fails.
 */
export function withRedirectOnUrlChange(publish: DocumentActionComponent): DocumentActionComponent {
  const PublishWithRedirect: DocumentActionComponent = (props) => {
    const client = useClient({ apiVersion: '2026-11-01' });
    const toast = useToast();
    const original = publish(props);
    if (!original) return original;

    return {
      ...original,
      onHandle: async () => {
        try {
          const moved = await createRedirectIfMoved(client as unknown as RedirectClient, props.id);
          if (moved) {
            toast.push({ status: 'info', title: 'Old link redirected', description: `${moved.from} now sends readers to ${moved.to}` });
          }
        } catch (err) {
          console.error('Redirect step failed', err);
          toast.push({ status: 'warning', title: "Couldn't create a redirect", description: 'The old link may stop working.' });
        }
        original.onHandle?.();
      },
    };
  };
  PublishWithRedirect.action = publish.action;
  return PublishWithRedirect;
}
