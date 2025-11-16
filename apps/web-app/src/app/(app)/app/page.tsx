import { createCaller, createTRPCContext } from '@nugget/api';
import { redirect } from 'next/navigation';

export default async function Home() {
  // Get the primary baby and redirect to their page
  const ctx = await createTRPCContext();
  const caller = createCaller(ctx);

  const baby = await caller.babies.getMostRecent();

  if (baby) {
    redirect(`/app/${baby.id}`);
  }

  // If no baby exists, redirect to onboarding
  redirect('/app/onboarding');
}
