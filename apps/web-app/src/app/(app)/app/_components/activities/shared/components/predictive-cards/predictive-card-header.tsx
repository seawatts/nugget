'use client';

import { Icons } from '@nugget/ui/custom/icons';
import type { LucideIcon } from 'lucide-react';
import { Info, Zap } from 'lucide-react';
import type { ReactNode } from 'react';

interface PredictiveCardHeaderProps {
  title: string;
  icon: LucideIcon;
  isFetching?: boolean;
  onInfoClick: (e: React.MouseEvent) => void;
  onQuickLog?: (e: React.MouseEvent) => void;
  isCreatingQuickLog?: boolean;
  quickLogEnabled?: boolean;
  children?: ReactNode;
}

export function PredictiveCardHeader({
  title,
  icon: Icon,
  isFetching,
  onInfoClick,
  onQuickLog,
  isCreatingQuickLog,
  quickLogEnabled = true,
  children,
}: PredictiveCardHeaderProps) {
  return (
    <div className="flex items-start gap-4 min-w-0 overflow-hidden">
      <div className="opacity-30 shrink-0">
        <Icon className="h-12 w-12" strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold truncate">{title}</h2>
          <div className="flex items-center gap-1 shrink-0">
            {isFetching && (
              <Icons.Spinner className="animate-spin opacity-70" size="xs" />
            )}
            {quickLogEnabled && onQuickLog && (
              <button
                className="p-1.5 rounded-full hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isCreatingQuickLog}
                onClick={onQuickLog}
                title="Quick log with smart defaults"
                type="button"
              >
                {isCreatingQuickLog ? (
                  <Icons.Spinner className="animate-spin opacity-70 size-5" />
                ) : (
                  <Zap className="size-5 opacity-70" />
                )}
              </button>
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
