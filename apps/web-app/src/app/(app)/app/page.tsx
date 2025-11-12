import { ActivityCards } from '~/app/(app)/app/_components/activity-cards';
import { BottomNav } from '~/app/(app)/app/_components/bottom-nav';
import { Header } from '~/app/(app)/app/_components/header';
import { SweetSpotBanner } from '~/app/(app)/app/_components/sweet-spot-banner';

export default function Home() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      <main className="px-4 pt-4">
        <SweetSpotBanner />
        <ActivityCards />
      </main>
      <BottomNav />
    </div>
  );
}
