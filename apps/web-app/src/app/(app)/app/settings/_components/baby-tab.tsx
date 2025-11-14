'use client';

import { api } from '@nugget/api/react';
import { Button } from '@nugget/ui/button';
import { Input } from '@nugget/ui/input';
import { Label } from '@nugget/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@nugget/ui/select';
import { AlertTriangle, Baby, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { DeleteBabyDialog } from './delete-baby-dialog';

interface BabyFormData {
  firstName: string;
  lastName: string;
  middleName: string;
  birthDate: string;
  dueDate: string;
  gender: string;
  journeyStage: string;
  ttcMethod: string;
  birthWeightOz: string;
  currentWeightOz: string;
  feedIntervalHours: string;
  pumpsPerDay: string;
  mlPerPump: string;
}

export function BabyTab() {
  const { data: baby, isLoading, error } = api.babies.getMostRecent.useQuery();
  const updateBaby = api.babies.update.useMutation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [formData, setFormData] = useState<BabyFormData>({
    birthDate: '',
    birthWeightOz: '',
    currentWeightOz: '',
    dueDate: '',
    feedIntervalHours: '',
    firstName: '',
    gender: '',
    journeyStage: '',
    lastName: '',
    middleName: '',
    mlPerPump: '',
    pumpsPerDay: '',
    ttcMethod: '',
  });

  // Populate form with baby data
  useEffect(() => {
    if (baby) {
      setFormData({
        birthDate: baby.birthDate
          ? (new Date(baby.birthDate).toISOString().split('T')[0] ?? '')
          : '',
        birthWeightOz: baby.birthWeightOz?.toString() || '',
        currentWeightOz: baby.currentWeightOz?.toString() || '',
        dueDate: baby.dueDate
          ? (new Date(baby.dueDate).toISOString().split('T')[0] ?? '')
          : '',
        feedIntervalHours: baby.feedIntervalHours?.toString() || '2.5',
        firstName: baby.firstName || '',
        gender: baby.gender || '',
        journeyStage: baby.journeyStage || '',
        lastName: baby.lastName || '',
        middleName: baby.middleName || '',
        mlPerPump: baby.mlPerPump?.toString() || '24',
        pumpsPerDay: baby.pumpsPerDay?.toString() || '6',
        ttcMethod: baby.ttcMethod || '',
      });
    }
  }, [baby]);

  const handleSave = async () => {
    if (!baby?.id) {
      toast.error('No baby profile found');
      return;
    }

    try {
      await updateBaby.mutateAsync({
        birthDate: formData.birthDate
          ? new Date(formData.birthDate)
          : undefined,
        birthWeightOz: formData.birthWeightOz
          ? Number.parseInt(formData.birthWeightOz, 10)
          : undefined,
        currentWeightOz: formData.currentWeightOz
          ? Number.parseInt(formData.currentWeightOz, 10)
          : undefined,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        feedIntervalHours: formData.feedIntervalHours
          ? Number.parseFloat(formData.feedIntervalHours)
          : undefined,
        firstName: formData.firstName || undefined,
        gender: formData.gender || undefined,
        id: baby.id,
        journeyStage: formData.journeyStage
          ? (formData.journeyStage as 'ttc' | 'pregnant' | 'born')
          : undefined,
        lastName: formData.lastName || undefined,
        middleName: formData.middleName || undefined,
        mlPerPump: formData.mlPerPump
          ? Number.parseInt(formData.mlPerPump, 10)
          : undefined,
        pumpsPerDay: formData.pumpsPerDay
          ? Number.parseInt(formData.pumpsPerDay, 10)
          : undefined,
        ttcMethod: formData.ttcMethod
          ? (formData.ttcMethod as 'natural' | 'ivf' | 'other')
          : undefined,
      });

      toast.success('Baby profile updated successfully');
    } catch (error) {
      console.error('Failed to update baby:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update baby profile',
      );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-card border border-border rounded-2xl p-6">
          <p className="text-muted-foreground">Loading baby information...</p>
        </div>
      </div>
    );
  }

  if (error || !baby) {
    return (
      <div className="space-y-4">
        <div className="bg-card border border-border rounded-2xl p-6">
          <p className="text-muted-foreground">
            No baby profile found. Please complete onboarding.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Basic Information */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Basic Information</h2>
          <p className="text-sm text-muted-foreground">
            Your baby's basic details
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
              placeholder="Enter first name"
              value={formData.firstName}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="middleName">Middle Name (Optional)</Label>
            <Input
              id="middleName"
              onChange={(e) =>
                setFormData({ ...formData, middleName: e.target.value })
              }
              placeholder="Enter middle name"
              value={formData.middleName}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name (Optional)</Label>
            <Input
              id="lastName"
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              placeholder="Enter last name"
              value={formData.lastName}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Gender (Optional)</Label>
            <Select
              onValueChange={(value) =>
                setFormData({ ...formData, gender: value })
              }
              value={formData.gender}
            >
              <SelectTrigger id="gender">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="prefer_not_to_say">
                  Prefer not to say
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Journey & Dates */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Journey Stage</h2>
          <p className="text-sm text-muted-foreground">
            Track your pregnancy or parenting journey
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="journeyStage">Journey Stage</Label>
            <Select
              onValueChange={(value) =>
                setFormData({ ...formData, journeyStage: value })
              }
              value={formData.journeyStage}
            >
              <SelectTrigger id="journeyStage">
                <SelectValue placeholder="Select journey stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ttc">Trying to Conceive</SelectItem>
                <SelectItem value="pregnant">Pregnant</SelectItem>
                <SelectItem value="born">Baby Born</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.journeyStage === 'ttc' && (
            <div className="space-y-2">
              <Label htmlFor="ttcMethod">TTC Method</Label>
              <Select
                onValueChange={(value) =>
                  setFormData({ ...formData, ttcMethod: value })
                }
                value={formData.ttcMethod}
              >
                <SelectTrigger id="ttcMethod">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="natural">Natural</SelectItem>
                  <SelectItem value="ivf">IVF</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="dueDate">
              Due Date {formData.journeyStage !== 'born' && '(if pregnant/TTC)'}
            </Label>
            <Input
              id="dueDate"
              onChange={(e) =>
                setFormData({ ...formData, dueDate: e.target.value })
              }
              type="date"
              value={formData.dueDate}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthDate">
              Birth Date {formData.journeyStage !== 'born' && '(if born)'}
            </Label>
            <Input
              id="birthDate"
              onChange={(e) =>
                setFormData({ ...formData, birthDate: e.target.value })
              }
              type="date"
              value={formData.birthDate}
            />
          </div>
        </div>
      </div>

      {/* Growth Metrics */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Growth Metrics</h2>
          <p className="text-sm text-muted-foreground">
            Track weight and growth milestones
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="birthWeightOz">Birth Weight (oz)</Label>
            <Input
              id="birthWeightOz"
              onChange={(e) =>
                setFormData({ ...formData, birthWeightOz: e.target.value })
              }
              placeholder="e.g., 120"
              type="number"
              value={formData.birthWeightOz}
            />
            <p className="text-xs text-muted-foreground">
              {formData.birthWeightOz &&
                `≈ ${(Number.parseInt(formData.birthWeightOz, 10) / 16).toFixed(2)} lbs`}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currentWeightOz">Current Weight (oz)</Label>
            <Input
              id="currentWeightOz"
              onChange={(e) =>
                setFormData({ ...formData, currentWeightOz: e.target.value })
              }
              placeholder="e.g., 180"
              type="number"
              value={formData.currentWeightOz}
            />
            <p className="text-xs text-muted-foreground">
              {formData.currentWeightOz &&
                `≈ ${(Number.parseInt(formData.currentWeightOz, 10) / 16).toFixed(2)} lbs`}
            </p>
          </div>
        </div>
      </div>

      {/* Feeding Settings */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Feeding Settings</h2>
          <p className="text-sm text-muted-foreground">
            Customize feeding and pumping preferences
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="feedIntervalHours">Feed Interval (hours)</Label>
            <Input
              id="feedIntervalHours"
              onChange={(e) =>
                setFormData({ ...formData, feedIntervalHours: e.target.value })
              }
              placeholder="e.g., 2.5"
              step="0.5"
              type="number"
              value={formData.feedIntervalHours}
            />
            <p className="text-xs text-muted-foreground">
              Time between scheduled feedings
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pumpsPerDay">Pumps Per Day</Label>
            <Input
              id="pumpsPerDay"
              onChange={(e) =>
                setFormData({ ...formData, pumpsPerDay: e.target.value })
              }
              placeholder="e.g., 6"
              type="number"
              value={formData.pumpsPerDay}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mlPerPump">ML Per Pump Session</Label>
            <Input
              id="mlPerPump"
              onChange={(e) =>
                setFormData({ ...formData, mlPerPump: e.target.value })
              }
              placeholder="e.g., 24"
              type="number"
              value={formData.mlPerPump}
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <Button
        className="w-full"
        disabled={updateBaby.isPending}
        onClick={handleSave}
        size="lg"
      >
        {updateBaby.isPending ? 'Saving...' : 'Save Changes'}
      </Button>

      {/* Danger Zone */}
      <div className="bg-card border border-destructive rounded-2xl p-6 space-y-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="size-5 text-destructive mt-0.5" />
          <div>
            <h2 className="text-xl font-semibold text-destructive">
              Danger Zone
            </h2>
            <p className="text-sm text-muted-foreground">
              Irreversible baby profile actions
            </p>
          </div>
        </div>

        <div className="p-4 rounded-lg border border-border bg-muted/30">
          <div className="flex items-start gap-3 mb-3">
            <Baby className="size-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium">Delete Baby Profile</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Permanently delete {baby.firstName || 'this baby'}'s profile and
                all associated data (activities, supply tracking, medical
                records, etc.). This cannot be undone.
              </p>
            </div>
          </div>
          <Button
            className="w-full"
            onClick={() => setShowDeleteDialog(true)}
            variant="destructive"
          >
            <Trash2 className="mr-2 size-4" />
            Delete Baby Profile
          </Button>
        </div>
      </div>

      {/* Delete Baby Dialog */}
      <DeleteBabyDialog
        babyId={baby.id}
        babyName={baby.firstName || 'Baby'}
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
      />
    </div>
  );
}
