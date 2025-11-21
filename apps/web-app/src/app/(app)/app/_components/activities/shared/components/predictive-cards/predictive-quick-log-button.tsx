'use client';

import { Icons } from '@nugget/ui/custom/icons';
import { Zap } from 'lucide-react';

interface PredictiveQuickLogButtonProps {
  onQuickLog: (e: React.MouseEvent) => void;
  isCreating: boolean;
  disabled?: boolean;
}

export function PredictiveQuickLogButton({
  onQuickLog,
  isCreating,
  disabled = false,
}: PredictiveQuickLogButtonProps) {
  return (
    <button
      className="p-1.5 rounded-full hover:bg-black/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={disabled || isCreating}
      onClick={onQuickLog}
      title="Quick log with smart defaults"
      type="button"
    >
      {isCreating ? (
        <Icons.Spinner className="animate-spin opacity-70 size-5" />
      ) : (
        <Zap className="size-5 opacity-70" />
      )}
    </button>
  );
}
