'use client';

import { api } from '@nugget/api/react';
import type { Activities } from '@nugget/db/schema';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@nugget/ui/alert-dialog';
import { Button } from '@nugget/ui/button';
import { cn } from '@nugget/ui/lib/utils';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useActivityMutations } from '../../use-activity-mutations';
import type { SimpleActivityConfig } from '../activity-config-registry';
import { getActivityTheme } from '../activity-theme-config';
import { ClickableTimeDisplay } from './clickable-time-display';

interface GenericSimpleActivityTimelineDrawerProps {
  existingActivity: typeof Activities.$inferSelect;
  config: SimpleActivityConfig;
  isOpen: boolean;
  onClose: () => void;
  babyId?: string;
}

export function GenericSimpleActivityTimelineDrawer({
  existingActivity,
  config,
  isOpen: _isOpen,
  onClose,
  babyId: _babyId,
}: GenericSimpleActivityTimelineDrawerProps) {
  const { updateActivity, deleteActivity, isUpdating, isDeleting } =
    useActivityMutations();

  const { data: user } = api.user.current.useQuery();
  const timeFormat = user?.timeFormat || '12h';

  const theme = getActivityTheme(config.type);
  const Icon = theme.icon;

  const [startTime, setStartTime] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Store optional field values
  const [optionalFields, setOptionalFields] = useState<
    Record<string, string | null>
  >({});

  const isPending = isUpdating || isDeleting;

  useEffect(() => {
    if (existingActivity?.startTime) {
      const start = new Date(existingActivity.startTime);
      setStartTime(start);
    }

    if (existingActivity) {
      setNotes(existingActivity.notes || '');

      if (existingActivity.details) {
        const details = existingActivity.details as Record<
          string,
          string | null
        >;

        // Initialize optional fields from existing activity
        if (config.optionalFields) {
          const fields: Record<string, string | null> = {};
          for (const field of config.optionalFields) {
            fields[field.key] = details[field.key] || null;
          }
          setOptionalFields(fields);
        }
      }
    }
  }, [existingActivity, config.optionalFields]);

  const handleSave = async () => {
    try {
      // Build details object with type and any optional fields that have values
      const details: Record<string, string | null> = { type: config.type };
      if (config.optionalFields) {
        for (const field of config.optionalFields) {
          const value = optionalFields[field.key];
          if (value !== null && value !== undefined) {
            details[field.key] = value;
          }
        }
      }

      await updateActivity({
        details,
        id: existingActivity.id,
        notes: notes || undefined,
        startTime,
      });

      onClose();
    } catch (error) {
      console.error(`Failed to update ${config.type}:`, error);
    }
  };

  const handleDelete = async () => {
    try {
      setShowDeleteConfirmation(false);
      onClose();
      await deleteActivity(existingActivity.id);
    } catch (error) {
      console.error('Failed to delete activity:', error);
    }
  };

  const updateOptionalField = (key: string, value: string | null) => {
    setOptionalFields((prev) => {
      const current = prev[key];
      // Toggle if clicking the same value
      if (current === value) {
        const newFields = { ...prev };
        delete newFields[key];
        return newFields;
      }
      return { ...prev, [key]: value };
    });
  };

  const bgClass = `bg-activity-${config.type.replace(/_/g, '-')}`;

  return (
    <>
      {/* Custom Header with Activity Color */}
      <div className={cn('p-6 pb-4', bgClass)}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Icon className={cn('size-8', theme.textColor)} strokeWidth={1.5} />
            <h2 className={cn('text-2xl font-bold', theme.textColor)}>
              Edit {config.title}
            </h2>
          </div>
          <button
            className={cn(
              'p-2 rounded-full hover:bg-black/10 transition-colors',
              theme.textColor,
            )}
            onClick={onClose}
            type="button"
          >
            <X className="size-6" />
          </button>
        </div>
        <div className="ml-11">
          <ClickableTimeDisplay
            className={theme.textColor}
            mode="single"
            onStartTimeChange={setStartTime}
            startTime={startTime}
            timeFormat={timeFormat}
          />
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6">
        {/* Optional Fields */}
        {config.optionalFields?.map((field) => (
          <div className="space-y-3" key={field.key}>
            <p className="text-sm font-medium text-muted-foreground">
              {field.label} (optional)
            </p>
            <div
              className={cn(
                'grid gap-3',
                field.options.length === 2
                  ? 'grid-cols-2'
                  : field.options.length === 3
                    ? 'grid-cols-3'
                    : 'grid-cols-2',
              )}
            >
              {field.options.map((option) => {
                const isSelected = optionalFields[field.key] === option.value;
                return (
                  <Button
                    className={cn(
                      'h-12',
                      isSelected
                        ? `${bgClass} ${theme.textColor} hover:${bgClass}/90`
                        : 'bg-transparent',
                    )}
                    key={option.value}
                    onClick={() => updateOptionalField(field.key, option.value)}
                    type="button"
                    variant={isSelected ? 'default' : 'outline'}
                  >
                    {option.label}
                  </Button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Notes */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            Notes (optional)
          </p>
          <textarea
            className={cn(
              'w-full min-h-[100px] p-3 rounded-lg border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2',
              `focus:ring-${theme.color}`,
            )}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={`Add any notes about this ${config.title.toLowerCase()}...`}
            value={notes}
          />
        </div>
      </div>

      {/* Footer with Actions */}
      <div className="p-6 pt-4 border-t border-border">
        <div className="flex gap-3">
          <Button
            className="h-12 text-base"
            disabled={isPending}
            onClick={() => setShowDeleteConfirmation(true)}
            variant="destructive"
          >
            Delete
          </Button>
          <Button
            className="h-12 text-base bg-transparent"
            disabled={isPending}
            onClick={onClose}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            className={cn(
              'flex-1 h-12 text-base font-semibold',
              `${bgClass} ${theme.textColor}`,
            )}
            disabled={isPending}
            onClick={handleSave}
          >
            {isPending ? 'Updating...' : 'Update'}
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        onOpenChange={setShowDeleteConfirmation}
        open={showDeleteConfirmation}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {config.title} Activity?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this {config.title.toLowerCase()}{' '}
              activity. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
