/**
 * Helper function to trigger achievement update workflow
 *
 * This function invokes the Vercel workflow asynchronously without blocking
 * the calling operation. Errors are logged but don't throw to avoid disrupting
 * the main operation.
 */

/**
 * Trigger achievement update workflow for a baby
 *
 * This is a fire-and-forget operation - we don't wait for the workflow to complete.
 * The workflow will run in the background and update achievements.
 *
 * According to Vercel Workflow docs: workflows compile into API routes automatically.
 * When you call a workflow function, the framework handles durable execution.
 *
 * @param babyId - The ID of the baby whose achievements should be updated
 */
export async function triggerAchievementUpdate(babyId: string): Promise<void> {
  try {
    // Server-side only function - workflows only run on the server

    // Import the workflow function dynamically
    // The workflow framework will handle execution when deployed on Vercel
    const workflowModule = await import(
      '../../../../apps/web-app/src/workflows/update-achievements'
    ).catch(() => {
      return null;
    });

    if (!workflowModule?.updateAchievements) {
      // In non-production or if workflow isn't available, silently continue
      // Achievement updates will work via the fallback calculation in the drawer
      return;
    }

    // Invoke the workflow
    // The workflow framework intercepts this call and executes it durably
    // Fire and forget - don't await to avoid blocking
    const workflowPromise = workflowModule.updateAchievements({ babyId });
    if (workflowPromise && typeof workflowPromise.catch === 'function') {
      workflowPromise.catch((error: unknown) => {
        console.error('Failed to invoke achievement update workflow:', error);
      });
    }
  } catch (error) {
    // Log error but don't throw - we don't want to break activity operations
    // if achievement updates fail
    console.error('Error triggering achievement update workflow:', error);
  }
}
