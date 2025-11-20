import { revalidatePath } from 'next/cache';

/**
 * Revalidates all app-related paths after data mutations.
 * This ensures that all baby dashboards, family dashboards, and related pages are updated.
 */
export function revalidateAppPaths() {
  // Revalidate the app root and all nested paths
  revalidatePath('/app', 'layout');

  // Revalidate specific high-traffic paths
  revalidatePath('/app/babies', 'page');
  revalidatePath('/app/timeline', 'page');
  revalidatePath('/app/activities', 'page');
}
