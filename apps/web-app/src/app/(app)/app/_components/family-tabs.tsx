'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@nugget/ui/avatar';
import { NuggetAvatar } from '@nugget/ui/custom/nugget-avatar';
import { cn } from '@nugget/ui/lib/utils';
import { Skeleton } from '@nugget/ui/skeleton';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  type FamilyTabMember,
  getFamilyTabsDataAction,
} from './family-tabs.actions';

export function FamilyTabs() {
  const params = useParams();
  // Check for babyId (new structure) or userId (fallback for family members)
  const activeUserId =
    (params.babyId as string | undefined) ||
    (params.userId as string | undefined);
  const [tabs, setTabs] = useState<FamilyTabMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTabs() {
      try {
        const result = await getFamilyTabsDataAction();
        if (result?.data) {
          setTabs(result.data);
        }
      } catch (error) {
        console.error('Failed to load family tabs:', error);
      } finally {
        setLoading(false);
      }
    }

    loadTabs();
  }, []);

  if (loading) {
    return (
      <div className="border-b border-border bg-background">
        <div className="flex gap-4 overflow-x-auto px-4 py-3 scrollbar-hide">
          {[1, 2, 3].map((i) => (
            <div className="flex flex-col items-center gap-2 shrink-0" key={i}>
              <Skeleton className="size-12 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tabs.length === 0) {
    return null;
  }

  return (
    <div className="border-b border-border bg-background sticky top-0 z-10">
      <div className="flex gap-4 overflow-x-auto px-4 py-3 scrollbar-hide">
        {tabs.map((tab) => {
          const isActive = activeUserId === tab.userId;
          const displayName = tab.firstName;
          const initials = displayName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

          const route =
            tab.type === 'baby'
              ? `/app/babies/${tab.userId}`
              : `/app/family/${tab.userId}`;

          return (
            <Link
              className={cn(
                'flex flex-col items-center gap-1.5 shrink-0 transition-all rounded-2xl p-2',
                isActive ? 'bg-primary/10' : 'hover:bg-muted/50',
              )}
              href={route}
              key={tab.id}
            >
              <div className="flex items-center justify-center">
                {tab.type === 'baby' ? (
                  <NuggetAvatar
                    backgroundColor={tab.avatarBackgroundColor || undefined}
                    image={
                      !tab.avatarBackgroundColor && tab.avatarUrl
                        ? tab.avatarUrl
                        : undefined
                    }
                    name={displayName}
                    size="sm"
                  />
                ) : (
                  <Avatar className="size-8">
                    <AvatarImage alt={displayName} src={tab.avatarUrl || ''} />
                    <AvatarFallback className="text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
              <span
                className={cn(
                  'text-xs font-medium truncate max-w-[72px]',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {displayName}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
