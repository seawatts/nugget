'use client';

import { Icons } from '@nugget/ui/custom/icons';
import type { LucideIcon } from 'lucide-react';
import { Info } from 'lucide-react';
import type { ReactNode } from 'react';

interface PredictiveCardHeaderProps {
  title: string;
  icon: LucideIcon;
  isFetching?: boolean;
  onInfoClick: (e: React.MouseEvent) => void;
  children?: ReactNode;
}

export function PredictiveCardHeader({
  title,
  icon: Icon,
  isFetching,
  onInfoClick,
  children,
}: PredictiveCardHeaderProps) {
  return (
    <div className="flex items-start gap-4">
      <div className="opacity-30">
        <Icon className="h-12 w-12" strokeWidth={1.5} />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold">{title}</h2>
          <div className="flex items-center gap-1">
            {isFetching && (
              <Icons.Spinner className="animate-spin opacity-70" size="xs" />
            )}
            <button
              className="p-1.5 rounded-full hover:bg-white/10 transition-colors -mr-1.5"
              onClick={onInfoClick}
              type="button"
            >
              <Info className="size-5 opacity-70" />
            </button>
          </div>
        </div>
        {children && <div className="space-y-1">{children}</div>}
      </div>
    </div>
  );
}
