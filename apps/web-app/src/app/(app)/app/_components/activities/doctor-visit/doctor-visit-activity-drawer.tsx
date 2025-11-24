'use client';

import { api } from '@nugget/api/react';
import type { Activities } from '@nugget/db/schema';
import { Button } from '@nugget/ui/button';
import { cn } from '@nugget/ui/lib/utils';
import { startOfDay, subDays } from 'date-fns';
import { Stethoscope, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useOptimisticActivitiesStore } from '~/stores/optimistic-activities';
import { TimeInput } from '../shared/components/time-input';
import { useActivityMutations } from '../use-activity-mutations';
import type { DoctorVisitFormData } from './doctor-visit-drawer';
import { DoctorVisitDrawerContent } from './doctor-visit-drawer';
import { extractVaccinesFromHistory } from './vaccine-utils';

interface DoctorVisitActivityDrawerProps {
  existingActivity?: typeof Activities.$inferSelect | null;
  isOpen: boolean;
  onClose: () => void;
  babyId: string;
}

/**
 * Complete, self-contained doctor visit activity drawer
 * Manages all doctor visit-specific state and logic internally
 */
export function DoctorVisitActivityDrawer({
  existingActivity,
  isOpen,
  onClose,
  babyId,
}: DoctorVisitActivityDrawerProps) {
  const { createActivity, updateActivity, isCreating, isUpdating } =
    useActivityMutations();
  const addOptimisticActivity = useOptimisticActivitiesStore(
    (state) => state.addActivity,
  );

  // Query baby information to get birth date
  const { data: baby } = api.babies.getByIdLight.useQuery(
    { id: babyId ?? '' },
    { enabled: Boolean(babyId) && isOpen },
  );

  // Query doctor visit activities to get vaccination history (last 2 years)
  const twoYearsAgo = useMemo(() => startOfDay(subDays(new Date(), 730)), []);
  const { data: doctorVisitActivities = [] } = api.activities.list.useQuery(
    {
      activityTypes: ['doctor_visit'],
      babyId: babyId ?? '',
      limit: 1000,
      since: twoYearsAgo,
    },
    { enabled: Boolean(babyId) && isOpen },
  );

  // Extract vaccination history from activities
  const vaccinationHistory = useMemo(() => {
    return extractVaccinesFromHistory(
      [], // No medical records for now
      doctorVisitActivities.map((activity) => ({
        details: activity.details as {
          vaccinations?: string[];
        } | null,
      })),
    );
  }, [doctorVisitActivities]);

  // Calculate baby age in days
  const babyAgeDays = useMemo(() => {
    if (!baby?.birthDate) return null;
    const now = new Date();
    const birthDate = new Date(baby.birthDate);
    const diffTime = now.getTime() - birthDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }, [baby?.birthDate]);

  // Doctor visit-specific state
  const [startTime, setStartTime] = useState(new Date());
  const [formData, setFormData] = useState<DoctorVisitFormData>({
    doctorName: '',
    headCircumferenceCm: '',
    lengthCm: '',
    location: '',
    notes: '',
    vaccinations: [],
    visitType: null,
    weightKg: '',
  });

  const isPending = isCreating || isUpdating;
  const isEditing = Boolean(existingActivity);

  // Update state when existingActivity changes
  useEffect(() => {
    if (existingActivity?.startTime) {
      const start = new Date(existingActivity.startTime);
      setStartTime(start);
    } else {
      const now = new Date();
      setStartTime(now);
    }

    // Initialize doctor visit-specific fields from existing activity
    if (existingActivity) {
      if (existingActivity.notes) {
        setFormData((prev) => ({
          ...prev,
          notes: existingActivity.notes || '',
        }));
      }
      // Parse doctor visit details from details field
      if (existingActivity.details) {
        const details = existingActivity.details as {
          doctorName?: string;
          visitType?: 'well-baby' | 'sick' | 'follow-up' | 'other';
          location?: string;
          weightKg?: string;
          lengthCm?: string;
          headCircumferenceCm?: string;
          vaccinations?: string[];
        };
        setFormData({
          doctorName: details.doctorName || '',
          headCircumferenceCm: details.headCircumferenceCm || '',
          lengthCm: details.lengthCm || '',
          location: details.location || '',
          notes: existingActivity.notes || '',
          vaccinations: details.vaccinations || [],
          visitType: details.visitType || null,
          weightKg: details.weightKg || '',
        });
      }
    }

    // Reset form data when drawer opens for new activity
    if (!existingActivity) {
      const now = new Date();
      setStartTime(now);
      setFormData({
        doctorName: '',
        headCircumferenceCm: '',
        lengthCm: '',
        location: '',
        notes: '',
        vaccinations: [],
        visitType: null,
        weightKg: '',
      });
    }
  }, [existingActivity]);

  // Reset state when drawer closes - delay to allow closing animation to complete
  useEffect(() => {
    if (!isOpen) {
      // Delay state reset to prevent flash during drawer closing animation
      const timeoutId = setTimeout(() => {
        const now = new Date();
        setStartTime(now);
        setFormData({
          doctorName: '',
          headCircumferenceCm: '',
          lengthCm: '',
          location: '',
          notes: '',
          vaccinations: [],
          visitType: null,
          weightKg: '',
        });
      }, 300); // Standard drawer animation duration

      return () => clearTimeout(timeoutId);
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!formData.visitType) {
      console.error('No visit type selected');
      return;
    }

    try {
      // Close drawer immediately for better UX
      onClose();

      // Create details object
      const doctorVisitDetails = {
        doctorName: formData.doctorName || undefined,
        headCircumferenceCm: formData.headCircumferenceCm || undefined,
        lengthCm: formData.lengthCm || undefined,
        location: formData.location || undefined,
        type: 'doctor_visit' as const,
        vaccinations:
          formData.vaccinations.length > 0 ? formData.vaccinations : undefined,
        visitType: formData.visitType,
        weightKg: formData.weightKg || undefined,
      };

      // Only add optimistic activity for new activities (not updates)
      if (!existingActivity) {
        // Create optimistic activity for immediate UI feedback
        const optimisticActivity = {
          amountMl: null,
          assignedUserId: null,
          babyId: babyId, // Use real babyId instead of 'temp' for timeline filtering
          createdAt: startTime,
          details: doctorVisitDetails,
          duration: null,
          endTime: null,
          familyId: 'temp',
          familyMemberId: null,
          feedingSource: null,
          id: `optimistic-doctor-visit-${Date.now()}`,
          isScheduled: false,
          notes: formData.notes || null,
          startTime,
          subjectType: 'baby' as const,
          type: 'doctor_visit' as const,
          updatedAt: startTime,
          userId: 'temp',
        } as typeof Activities.$inferSelect;

        addOptimisticActivity(optimisticActivity);
      }

      if (existingActivity) {
        // Update existing activity
        await updateActivity({
          details: doctorVisitDetails,
          id: existingActivity.id,
          notes: formData.notes || undefined,
          startTime,
        });
      } else {
        // Create new activity
        await createActivity({
          activityType: 'doctor_visit',
          babyId,
          details: doctorVisitDetails,
          notes: formData.notes || undefined,
          startTime,
        });
      }
    } catch (error) {
      console.error('Failed to save doctor visit:', error);
    }
  };

  // Determine if save button should be disabled
  const isSaveDisabled = isPending || !formData.visitType;

  return (
    <>
      {/* Custom Header with Activity Color */}
      <div className="p-6 pb-4 bg-activity-doctor-visit">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Stethoscope
              className="size-8 text-activity-doctor-visit-foreground"
              strokeWidth={1.5}
            />
            <h2 className="text-2xl font-bold text-activity-doctor-visit-foreground">
              Doctor Visit
            </h2>
          </div>
          <button
            className="p-2 rounded-full hover:bg-black/10 transition-colors text-activity-doctor-visit-foreground"
            onClick={onClose}
            type="button"
          >
            <X className="size-6" />
          </button>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6">
        <DoctorVisitDrawerContent
          babyAgeDays={babyAgeDays}
          onDataChange={setFormData}
          vaccinationHistory={vaccinationHistory}
        />

        {/* Date & Time Section */}
        <div className="space-y-3 min-w-0">
          <h3 className="text-sm font-medium text-muted-foreground">
            When was the visit?
          </h3>
          <div className="grid grid-cols-3 gap-3 mb-3">
            {[
              { label: 'Just now', minutes: 0 },
              { label: '1 hour ago', minutes: 60 },
              { label: 'Earlier today', minutes: 180 },
            ].map((option) => (
              <Button
                className="h-12 bg-transparent"
                key={option.label}
                onClick={() => {
                  const newTime = new Date();
                  newTime.setMinutes(newTime.getMinutes() - option.minutes);
                  setStartTime(newTime);
                }}
                variant="outline"
              >
                {option.label}
              </Button>
            ))}
          </div>
          <TimeInput
            id="doctor-visit-date-time"
            label="Or select custom date & time"
            onChange={setStartTime}
            showQuickOptions={false}
            value={startTime}
          />
        </div>
      </div>

      {/* Footer with Actions */}
      <div className="p-6 pt-4 border-t border-border">
        <div className="flex gap-3">
          <Button
            className="flex-1 h-12 text-base bg-transparent"
            onClick={onClose}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            className={cn(
              'flex-1 h-12 text-base font-semibold',
              'bg-activity-doctor-visit text-activity-doctor-visit-foreground',
            )}
            disabled={isSaveDisabled}
            onClick={handleSave}
          >
            {isPending ? 'Saving...' : isEditing ? 'Update' : 'Save'}
          </Button>
        </div>
      </div>
    </>
  );
}
