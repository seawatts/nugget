import type { ReactNode } from 'react';
import { InstallPrompt } from '~/components/install-prompt';
import { IosInstallPrompt } from '~/components/ios-install-prompt';
import { PWAFirstLaunchHandler } from '~/components/pwa-first-launch-handler';
import { ServiceWorkerUpdatePrompt } from '~/components/sw-update-prompt';
import { BottomNav } from './_components/bottom-nav';
import { ScrollProvider } from './_components/scroll-provider';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <ScrollProvider>
      <PWAFirstLaunchHandler />
      <div className="flex min-h-screen flex-col bg-background">
        <div className="mx-auto w-full max-w-3xl">
          <main className="flex-1 pb-24">{children}</main>
          <BottomNav />
        </div>
        <InstallPrompt />
        <IosInstallPrompt />
        <ServiceWorkerUpdatePrompt />
      </div>
    </ScrollProvider>
  );
}
