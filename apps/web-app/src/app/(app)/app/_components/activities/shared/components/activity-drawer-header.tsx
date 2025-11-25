'use client';

/**
 * Reusable activity drawer header
 * Standardized header with icon, title, and close button
 */

import { cn } from '@nugget/ui/lib/utils';
import { X } from 'lucide-react';
import { type ActivityType, getActivityTheme } from '../activity-theme-config';

interface ActivityDrawerHeaderProps {
  activityType: ActivityType;
  onClose: () => void;
  /** Custom title override */
  customTitle?: string;
}

// Map activity types to their background color classes for Tailwind
const ACTIVITY_BG_CLASSES: Record<ActivityType, string> = {
  bath: 'bg-activity-bath',
  bottle: 'bg-activity-feeding',
  diaper: 'bg-activity-diaper',
  doctor_visit: 'bg-activity-doctor-visit',
  feeding: 'bg-activity-feeding',
  growth: 'bg-activity-growth',
  medicine: 'bg-activity-medicine',
  nail_trimming: 'bg-activity-nail-trimming',
  nursing: 'bg-activity-feeding',
  potty: 'bg-activity-potty',
  pumping: 'bg-activity-pumping',
  sleep: 'bg-activity-sleep',
  solids: 'bg-activity-solids',
  temperature: 'bg-activity-temperature',
  tummy_time: 'bg-activity-tummy-time',
  vitamin_d: 'bg-activity-medicine',
};

export function ActivityDrawerHeader({
  activityType,
  onClose,
  customTitle,
}: ActivityDrawerHeaderProps) {
  const theme = getActivityTheme(activityType);
  const Icon = theme.icon;
  const title = customTitle || theme.label;
  const bgClass = ACTIVITY_BG_CLASSES[activityType];

  return (
    <div className={cn('p-6 pb-4', bgClass)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Icon className={cn('size-8', theme.textColor)} strokeWidth={1.5} />
          <h2 className={cn('text-2xl font-bold', theme.textColor)}>{title}</h2>
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
    </div>
  );
}
