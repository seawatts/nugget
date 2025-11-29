'use client';

import { buttonVariants } from '@nugget/ui/components/button';
import { Drawer, DrawerContent, DrawerTrigger } from '@nugget/ui/drawer';
import { cn } from '@nugget/ui/lib/utils';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import { siteConfig } from '~/app/(marketing)/_lib/config';

export function MobileDrawer() {
  return (
    <Drawer>
      <DrawerTrigger>
        <Menu className="text-2xl" />
      </DrawerTrigger>
      <DrawerContent>
        <div className="px-6 py-4">
          <Link
            className="relative mr-6 flex items-center space-x-2 mb-4"
            href="/"
            title="brand-logo"
          >
            <span className="text-2xl">🐣</span>
            <span className="font-bold text-xl">{siteConfig.name}</span>
          </Link>
          <Link
            className={cn(
              buttonVariants({ variant: 'default' }),
              'text-white rounded-full group w-full',
            )}
            href="/app"
          >
            {siteConfig.cta}
          </Link>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
