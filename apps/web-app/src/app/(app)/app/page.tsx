import { ActivityCards } from '~/app/(app)/app/_components/activity-cards';
import { SweetSpotBanner } from '~/app/(app)/app/_components/sweet-spot-banner';

export default function Home() {
  return (
    <main className="px-4 pt-4">
      <SweetSpotBanner />
      <ActivityCards />
    </main>
  );
}
