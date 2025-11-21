'use client';

import { Button } from '@nugget/ui/button';
import { LayoutDashboard, Shield, User, UserCircle, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/app/settings/baby', icon: User, label: 'Baby' },
  { href: '/app/settings/family', icon: Users, label: 'Family' },
  { href: '/app/settings/account', icon: UserCircle, label: 'Account' },
  { href: '/app/settings/preferences', icon: Shield, label: 'Preferences' },
  {
    href: '/app/settings/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
  },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <main className="px-4 pt-4 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-balance">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account and app preferences
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href;
            return (
              <Link href={tab.href} key={tab.href}>
                <Button
                  className="flex items-center gap-2 whitespace-nowrap"
                  variant={isActive ? 'default' : 'outline'}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </Button>
              </Link>
            );
          })}
        </div>

        {/* Tab Content */}
        {children}
      </div>
    </main>
  );
}
