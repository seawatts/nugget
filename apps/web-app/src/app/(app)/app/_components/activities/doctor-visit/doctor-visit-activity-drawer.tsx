'use client';

import type { Activities } from '@nugget/db/schema';
import { Button } from '@nugget/ui/button';
import { DatePicker } from '@nugget/ui/custom/date-picker';
import { Label } from '@nugget/ui/label';
import { cn } from '@nugget/ui/lib/utils';
import { Stethoscope, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useOptimisticActivitiesStore } from '~/stores/optimistic-activities';
import { useActivityMutations } from '../use-activity-mutations';
import type { DoctorVisitFormData } from './doctor-visit-drawer';
import { DoctorVisitDrawerContent } from './doctor-visit-drawer';

interface DoctorVisitActivityDrawerProps {
  existingActivity?: typeof Activities.$inferSelect | null;
  isOpen: boolean;
  onClose: () => void;
  babyId?: string;
}

/**
 * Complete, self-contained doctor visit activity drawer
 * Manages all doctor visit-specific state and logic internally
 */
export function DoctorVisitActivityDrawer({
  existingActivity,
  isOpen,
  onClose,
  babyId: _babyId,
}: DoctorVisitActivityDrawerProps) {
  const { createActivity, updateActivity, isCreating, isUpdating } =
    useActivityMutations();
  const addOptimisticActivity = useOptimisticActivitiesStore(
    (state) => state.addActivity,
  );

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
          babyId: 'temp',
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
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <DoctorVisitDrawerContent onDataChange={setFormData} />

        {/* Date Section */}
        <div className="space-y-3 min-w-0">
          <Label className="text-sm font-medium text-muted-foreground">
            Visit Date
          </Label>
          <DatePicker
            date={startTime}
            setDate={(date) => date && setStartTime(date)}
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
