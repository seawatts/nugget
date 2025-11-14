'use client';

import { Button } from '@nugget/ui/button';
import { NuggetAvatar } from '@nugget/ui/custom/nugget-avatar';
import { AlertTriangle, Mail, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export function Header() {
  const pathname = usePathname();
  const isOnboarding = pathname?.startsWith('/app/onboarding');
  const [babyName, setBabyName] = useState('Baby');

  useEffect(() => {
    const data = localStorage.getItem('onboardingData');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        // Get just the first name
        const firstName = parsed.firstName || parsed.babyName || 'Baby';
        setBabyName(firstName);
      } catch (e) {
        console.error('Error parsing onboarding data:', e);
      }
    }
  }, []);

  if (isOnboarding) return null;

  return (
    <header className="flex items-center justify-between px-4 py-6">
      <div className="flex items-center gap-3">
        <NuggetAvatar name={babyName} size="md" />
        <span className="font-semibold text-lg">{babyName}</span>
      </div>

      <div className="flex items-center gap-1">
        <Link href="/app/emergency">
          <Button
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            size="icon"
            variant="ghost"
          >
            <AlertTriangle className="h-6 w-6" />
          </Button>
        </Link>
        <Button className="text-muted-foreground" size="icon" variant="ghost">
          <Mail className="h-6 w-6" />
        </Button>
        <Link href="/app/settings">
          <Button className="text-muted-foreground" size="icon" variant="ghost">
            <Settings className="h-6 w-6" />
          </Button>
        </Link>
      </div>
    </header>
  );
}
