import { Button } from '@nugget/ui/button';
import { Icons } from '@nugget/ui/custom/icons';
import { cn } from '@nugget/ui/lib/utils';
import { Milk } from 'lucide-react';

interface FeedingActionButtonsProps {
  creatingType: 'bottle' | 'nursing-left' | 'nursing-right' | null;
  feedingTheme: { textColor: string };
  onBottleClick: (e: React.MouseEvent) => void;
  onNursingLeftClick: (e: React.MouseEvent) => void;
  onNursingRightClick: (e: React.MouseEvent) => void;
  suggestedAmount: string;
  suggestedDuration: number;
}

export function FeedingActionButtons({
  creatingType,
  feedingTheme,
  onBottleClick,
  onNursingLeftClick,
  onNursingRightClick,
  suggestedAmount,
  suggestedDuration,
}: FeedingActionButtonsProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <Button
        className={cn(
          'flex flex-col items-center justify-center h-auto py-3 gap-1',
          'bg-white/20 hover:bg-white/30 active:bg-white/40',
          feedingTheme.textColor,
        )}
        disabled={creatingType !== null}
        onClick={onBottleClick}
        variant="ghost"
      >
        {creatingType === 'bottle' ? (
          <Icons.Spinner className="size-5" />
        ) : (
          <Milk className="size-5" />
        )}
        <span className="text-xs font-medium">Bottle</span>
        <span className="text-xs opacity-80">({suggestedAmount})</span>
      </Button>

      <Button
        aria-label="Log nursing left"
        className={cn(
          'flex flex-col items-center justify-center h-auto py-3 gap-1',
          'bg-white/20 hover:bg-white/30 active:bg-white/40',
          feedingTheme.textColor,
        )}
        disabled={creatingType !== null}
        onClick={onNursingLeftClick}
        variant="ghost"
      >
        {creatingType === 'nursing-left' ? (
          <Icons.Spinner className="size-5" />
        ) : (
          <div
            aria-hidden="true"
            className="flex items-center justify-center size-8 rounded-full bg-white/25 text-base font-semibold"
          >
            &lt;
          </div>
        )}
        <span className="text-xs font-medium">Nursing</span>
        <span className="text-xs opacity-80">({suggestedDuration} min)</span>
      </Button>

      <Button
        aria-label="Log nursing right"
        className={cn(
          'flex flex-col items-center justify-center h-auto py-3 gap-1',
          'bg-white/20 hover:bg-white/30 active:bg-white/40',
          feedingTheme.textColor,
        )}
        disabled={creatingType !== null}
        onClick={onNursingRightClick}
        variant="ghost"
      >
        {creatingType === 'nursing-right' ? (
          <Icons.Spinner className="size-5" />
        ) : (
          <div
            aria-hidden="true"
            className="flex items-center justify-center size-8 rounded-full bg-white/25 text-base font-semibold"
          >
            &gt;
          </div>
        )}
        <span className="text-xs font-medium">Nursing</span>
        <span className="text-xs opacity-80">({suggestedDuration} min)</span>
      </Button>
    </div>
  );
}
