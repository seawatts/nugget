import type { ReactNode } from 'react';
import { BottomNav } from './_components/bottom-nav';
import { Header } from './_components/header';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">{children}</main>
      <BottomNav />
    </div>
  );
}
