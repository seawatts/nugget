'use client';

import { api } from '@nugget/api/react';
import { Button } from '@nugget/ui/button';
import { useEffect, useState } from 'react';
import { TimeSelectionMode } from '../shared/components/time-selection-mode';

export interface VitaminDFormData {
  method: 'drops' | 'spray' | null;
}

interface VitaminDDrawerContentProps {
  onDataChange?: (data: VitaminDFormData) => void;
  initialData?: Partial<VitaminDFormData>;
  duration?: number;
  setDuration?: (duration: number) => void;
  startTime?: Date;
  setStartTime?: (date: Date) => void;
  endTime?: Date;
  setEndTime?: (date: Date) => void;
}

export function VitaminDDrawerContent({
  onDataChange,
  initialData,
  duration: externalDuration,
  setDuration,
  startTime: externalStartTime,
  setStartTime,
  endTime: externalEndTime,
  setEndTime,
}: VitaminDDrawerContentProps) {
  const [method, setMethod] = useState<'drops' | 'spray' | null>(
    initialData?.method ?? null,
  );

  // Local state for time selection if not provided via props
  const [localStartTime, setLocalStartTime] = useState(new Date());
  const [localEndTime, setLocalEndTime] = useState(new Date());
  const [localDuration, setLocalDuration] = useState(0);

  // Use props if available, otherwise use local state
  const startTime = externalStartTime ?? localStartTime;
  const handleSetStartTime = setStartTime ?? setLocalStartTime;
  const endTime = externalEndTime ?? localEndTime;
  const handleSetEndTime = setEndTime ?? setLocalEndTime;
  const duration = externalDuration ?? localDuration;
  const handleSetDuration = setDuration ?? setLocalDuration;

  // Fetch user preferences for time format
  const { data: user } = api.user.current.useQuery();

  // Call onDataChange whenever form data changes
  useEffect(() => {
    onDataChange?.({
      method,
    });
  }, [method, onDataChange]);

  return (
    <div className="space-y-6">
      {/* Time Selection Mode */}
      <TimeSelectionMode
        activityColor="bg-activity-vitamin-d"
        activityTextColor="text-activity-vitamin-d-foreground"
        duration={duration}
        endTime={endTime}
        quickDurationOptions={[
          { label: '5 min', seconds: 5 * 60 },
          { label: '10 min', seconds: 10 * 60 },
          { label: '15 min', seconds: 15 * 60 },
        ]}
        setDuration={handleSetDuration}
        setEndTime={handleSetEndTime}
        setStartTime={handleSetStartTime}
        showDurationOptions={false}
        startTime={startTime}
        timeFormat={user?.timeFormat ?? '12h'}
      />

      {/* Method Selector (Optional) */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">
          Method (optional)
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Button
            className={`h-12 ${
              method === 'drops'
                ? 'bg-activity-vitamin-d text-activity-vitamin-d-foreground hover:bg-activity-vitamin-d/90'
                : 'bg-transparent'
            }`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMethod('drops');
            }}
            type="button"
            variant={method === 'drops' ? 'default' : 'outline'}
          >
            Drops
          </Button>
          <Button
            className={`h-12 ${
              method === 'spray'
                ? 'bg-activity-vitamin-d text-activity-vitamin-d-foreground hover:bg-activity-vitamin-d/90'
                : 'bg-transparent'
            }`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMethod('spray');
            }}
            type="button"
            variant={method === 'spray' ? 'default' : 'outline'}
          >
            Spray
          </Button>
        </div>
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <p className="text-sm text-muted-foreground">
          Track your baby's daily vitamin D supplement. Most pediatricians
          recommend 400 IU daily for breastfed infants.
        </p>
      </div>
    </div>
  );
}
