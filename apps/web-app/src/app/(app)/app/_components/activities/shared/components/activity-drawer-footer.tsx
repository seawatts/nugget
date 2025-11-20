'use client';

/**
 * Reusable activity drawer footer
 * Standardized footer with cancel and save/update buttons
 */

import { Button } from '@nugget/ui/button';
import { cn } from '@nugget/ui/lib/utils';
import { type ActivityType, getActivityTheme } from '../activity-theme-config';

interface ActivityDrawerFooterProps {
  activityType: ActivityType;
  onCancel: () => void;
  onSave: () => void;
  isSaving?: boolean;
  isEditing?: boolean;
  saveDisabled?: boolean;
  /** Custom save button text */
  saveText?: string;
  /** Custom cancel button text */
  cancelText?: string;
  /** Show stop button instead of save (for in-progress activities) */
  showStop?: boolean;
  onStop?: () => void;
}

export function ActivityDrawerFooter({
  activityType,
  onCancel,
  onSave,
  isSaving = false,
  isEditing = false,
  saveDisabled = false,
  saveText,
  cancelText = 'Cancel',
  showStop = false,
  onStop,
}: ActivityDrawerFooterProps) {
  const theme = getActivityTheme(activityType);

  const defaultSaveText = isSaving
    ? 'Saving...'
    : isEditing
      ? 'Update'
      : 'Save';

  return (
    <div className="p-6 pt-4 border-t border-border">
      <div className="flex gap-3">
        <Button
          className="flex-1 h-12 text-base bg-transparent"
          disabled={isSaving}
          onClick={onCancel}
          variant="outline"
        >
          {cancelText}
        </Button>
        {showStop && onStop ? (
          <Button
            className="flex-1 h-12 text-base font-semibold bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            disabled={isSaving}
            onClick={onStop}
          >
            Stop
          </Button>
        ) : (
          <Button
            className={cn(
              'flex-1 h-12 text-base font-semibold',
              `bg-[${theme.color}] ${theme.textColor}`,
            )}
            disabled={saveDisabled || isSaving}
            onClick={onSave}
          >
            {saveText || defaultSaveText}
          </Button>
        )}
      </div>
    </div>
  );
}
