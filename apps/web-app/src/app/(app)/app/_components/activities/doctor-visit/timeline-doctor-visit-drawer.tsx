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
import { Stethoscope, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { TimeInput } from '../shared/components/time-input';
import { useActivityMutations } from '../use-activity-mutations';
import type { DoctorVisitFormData } from './doctor-visit-drawer';
import { DoctorVisitDrawerContent } from './doctor-visit-drawer';
import { extractVaccinesFromHistory } from './vaccine-utils';

interface TimelineDoctorVisitDrawerProps {
  existingActivity: typeof Activities.$inferSelect;
  isOpen: boolean;
  onClose: () => void;
  babyId?: string;
}

/**
 * Timeline-specific doctor visit drawer for editing past activities
 * No timer functionality - just edit fields and delete button
 */
export function TimelineDoctorVisitDrawer({
  existingActivity,
  isOpen,
  onClose,
  babyId,
}: TimelineDoctorVisitDrawerProps) {
  const { updateActivity, deleteActivity, isUpdating, isDeleting } =
    useActivityMutations();

  // Query baby information to get birth date
  const { data: baby } = api.babies.getByIdLight.useQuery(
    { id: babyId ?? '' },
    { enabled: Boolean(babyId) && isOpen },
  );

  // Query doctor visit activities to get vaccination history
  const { data: doctorVisitActivities = [] } = api.activities.list.useQuery(
    {
      activityTypes: ['doctor_visit'],
      babyId: babyId ?? '',
      limit: 100,
    },
    { enabled: Boolean(babyId) && isOpen },
  );

  // Extract vaccination history from activities (excluding current activity being edited)
  const vaccinationHistory = useMemo(() => {
    return extractVaccinesFromHistory(
      [], // No medical records for now
      doctorVisitActivities
        .filter((activity) => activity.id !== existingActivity.id)
        .map((activity) => ({
          details: activity.details as {
            vaccinations?: string[];
          } | null,
        })),
    );
  }, [doctorVisitActivities, existingActivity.id]);

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
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const isPending = isUpdating || isDeleting;

  // Load existing activity data
  useEffect(() => {
    if (existingActivity?.startTime) {
      const start = new Date(existingActivity.startTime);
      setStartTime(start);
    }

    // Initialize doctor visit-specific fields from existing activity
    if (existingActivity) {
      const details = existingActivity.details as {
        visitType?: 'well-baby' | 'sick' | 'follow-up' | 'other';
        doctorName?: string;
        location?: string;
        weightKg?: string;
        lengthCm?: string;
        headCircumferenceCm?: string;
        vaccinations?: string[];
      } | null;

      setFormData({
        doctorName: details?.doctorName || '',
        headCircumferenceCm: details?.headCircumferenceCm || '',
        lengthCm: details?.lengthCm || '',
        location: details?.location || '',
        notes: existingActivity.notes || '',
        vaccinations: details?.vaccinations || [],
        visitType: details?.visitType || null,
        weightKg: details?.weightKg || '',
      });
    }
  }, [existingActivity]);

  const handleSave = async () => {
    if (!formData.visitType) {
      console.error('No visit type selected');
      return;
    }

    try {
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

      // Update existing activity
      await updateActivity({
        details: doctorVisitDetails,
        id: existingActivity.id,
        notes: formData.notes || undefined,
        startTime,
      });

      onClose();
    } catch (error) {
      console.error('Failed to update doctor visit:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteActivity(existingActivity.id);
      setShowDeleteConfirmation(false);
      onClose();
    } catch (error) {
      console.error('Failed to delete activity:', error);
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
              Edit Doctor Visit
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
        <DoctorVisitDrawerContent
          babyAgeDays={babyAgeDays}
          initialData={formData}
          onDataChange={setFormData}
          vaccinationHistory={vaccinationHistory}
        />

        {/* Time & Date Section */}
        <div className="space-y-3 min-w-0">
          <h3 className="text-sm font-medium text-muted-foreground">
            Time & Date
          </h3>
          <TimeInput
            id="doctor-visit-time"
            label="Time"
            onChange={setStartTime}
            value={startTime}
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
              'bg-activity-doctor-visit text-activity-doctor-visit-foreground',
            )}
            disabled={isSaveDisabled}
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
            <AlertDialogTitle>Delete Doctor Visit?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this doctor visit activity. This
              action cannot be undone.
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
