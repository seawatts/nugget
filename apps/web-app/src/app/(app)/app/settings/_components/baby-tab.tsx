'use client';

import { api } from '@nugget/api/react';
import { Button } from '@nugget/ui/button';
import { Card } from '@nugget/ui/card';
import { DatePicker } from '@nugget/ui/custom/date-picker';
import { DateTimePicker } from '@nugget/ui/custom/date-time-picker';
import { Input } from '@nugget/ui/input';
import { Label } from '@nugget/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@nugget/ui/select';
import { getFullBabyName, parseBabyName } from '@nugget/utils';
import { Baby, Minus, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { DeleteBabyDialog } from './delete-baby-dialog';
import { ProfilePictureUpload } from './profile-picture-upload';

interface BabyFormData {
  fullName: string;
  birthDate?: Date;
  dueDate?: Date;
  gender: string;
  journeyStage: string;
  ttcMethod: string;
  birthWeightLbs: string;
  birthWeightOz: string;
  currentWeightLbs: string;
  currentWeightOz: string;
  feedIntervalHours: string;
  pumpsPerDay: string;
  mlPerPump: string;
}

export function BabyTab() {
  const utils = api.useUtils();
  const { data: babies = [] } = api.babies.list.useQuery();
  const [selectedBabyId, setSelectedBabyId] = useState<string | undefined>();

  // Use the first baby as default or the selected one
  const babyId = selectedBabyId || babies[0]?.id;
  const {
    data: baby,
    isLoading,
    error,
  } = api.babies.getById.useQuery({ id: babyId || '' }, { enabled: !!babyId });

  const updateBaby = api.babies.update.useMutation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Set the selected baby ID when babies load
  useEffect(() => {
    if (babies.length > 0 && !selectedBabyId) {
      setSelectedBabyId(babies[0]?.id);
    }
  }, [babies, selectedBabyId]);

  const [formData, setFormData] = useState<BabyFormData>({
    birthDate: undefined,
    birthWeightLbs: '',
    birthWeightOz: '',
    currentWeightLbs: '',
    currentWeightOz: '',
    dueDate: undefined,
    feedIntervalHours: '',
    fullName: '',
    gender: '',
    journeyStage: '',
    mlPerPump: '',
    pumpsPerDay: '',
    ttcMethod: '',
  });

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  // Populate form with baby data
  useEffect(() => {
    if (baby) {
      // Convert total oz to lbs and oz
      const birthTotalOz = baby.birthWeightOz || 0;
      const birthLbs = Math.floor(birthTotalOz / 16);
      const birthOz = birthTotalOz % 16;

      const currentTotalOz = baby.currentWeightOz || 0;
      const currentLbs = Math.floor(currentTotalOz / 16);
      const currentOz = currentTotalOz % 16;

      // Combine name parts into full name
      const fullName = getFullBabyName({
        firstName: baby.firstName || '',
        lastName: baby.lastName,
        middleName: baby.middleName,
      });

      setFormData({
        birthDate: baby.birthDate ? new Date(baby.birthDate) : undefined,
        birthWeightLbs: birthLbs > 0 ? birthLbs.toString() : '',
        birthWeightOz: birthOz > 0 ? birthOz.toString() : '',
        currentWeightLbs: currentLbs > 0 ? currentLbs.toString() : '',
        currentWeightOz: currentOz > 0 ? currentOz.toString() : '',
        dueDate: baby.dueDate ? new Date(baby.dueDate) : undefined,
        feedIntervalHours: baby.feedIntervalHours?.toString() || '2.5',
        fullName,
        gender: baby.gender || '',
        journeyStage: baby.journeyStage || '',
        mlPerPump: baby.mlPerPump?.toString() || '24',
        pumpsPerDay: baby.pumpsPerDay?.toString() || '6',
        ttcMethod: baby.ttcMethod || '',
      });

      // Reset initial mount flag when baby changes
      isInitialMount.current = true;
      // Set it back to false after a short delay to allow the form to populate
      setTimeout(() => {
        isInitialMount.current = false;
      }, 100);
    }
  }, [baby]);

  const handleSave = useCallback(
    async (showToast = true) => {
      if (!baby?.id) return;

      try {
        // Convert lbs and oz to total oz
        const birthWeightLbs =
          Number.parseInt(formData.birthWeightLbs, 10) || 0;
        const birthWeightOz = Number.parseInt(formData.birthWeightOz, 10) || 0;
        const birthTotalOz = birthWeightLbs * 16 + birthWeightOz;

        const currentWeightLbs =
          Number.parseInt(formData.currentWeightLbs, 10) || 0;
        const currentWeightOz =
          Number.parseInt(formData.currentWeightOz, 10) || 0;
        const currentTotalOz = currentWeightLbs * 16 + currentWeightOz;

        // Parse full name into parts
        const { firstName, middleName, lastName } = parseBabyName(
          formData.fullName,
        );

        await updateBaby.mutateAsync({
          birthDate: formData.birthDate,
          birthWeightOz: birthTotalOz > 0 ? birthTotalOz : undefined,
          currentWeightOz: currentTotalOz > 0 ? currentTotalOz : undefined,
          dueDate: formData.dueDate,
          feedIntervalHours: formData.feedIntervalHours
            ? Number.parseFloat(formData.feedIntervalHours)
            : undefined,
          firstName: firstName || undefined,
          gender: formData.gender || undefined,
          id: baby.id,
          journeyStage: formData.journeyStage
            ? (formData.journeyStage as 'ttc' | 'pregnant' | 'born')
            : undefined,
          lastName: lastName || undefined,
          middleName: middleName || undefined,
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

        if (showToast) {
          toast.success('Baby profile updated');
        }
      } catch (error) {
        console.error('Failed to update baby:', error);
        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to update baby profile',
        );
      }
    },
    [baby?.id, formData, updateBaby],
  );

  // Auto-save with debounce
  useEffect(() => {
    // Skip auto-save on initial mount
    if (isInitialMount.current) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save (1 second debounce)
    saveTimeoutRef.current = setTimeout(() => {
      handleSave(false); // Don't show toast for auto-save
    }, 1000);

    // Cleanup
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [handleSave]);

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
      {/* Baby Selector */}
      {babies.length > 1 && (
        <Card className="p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Baby Profile</h2>
            <p className="text-sm text-muted-foreground">
              Select which baby profile you want to manage
            </p>
          </div>

          <Select
            onValueChange={(value) => {
              setSelectedBabyId(value);
              // Invalidate the current baby query to force refetch
              void utils.babies.getById.invalidate();
            }}
            value={selectedBabyId || babies[0]?.id}
          >
            <SelectTrigger className="w-full" id="baby-select">
              <div className="flex items-center gap-2">
                <Baby className="size-4 text-muted-foreground" />
                <SelectValue placeholder="Select a baby" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {babies.map((babyItem) => (
                <SelectItem key={babyItem.id} value={babyItem.id}>
                  {getFullBabyName({
                    firstName: babyItem.firstName || '',
                    lastName: babyItem.lastName,
                    middleName: babyItem.middleName,
                  }) || 'Unnamed Baby'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>
      )}

      {/* Basic Information */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Basic Information</h2>
          <p className="text-sm text-muted-foreground">
            Your baby's basic details
          </p>
        </div>

        {/* Profile Picture Upload */}
        {baby && (
          <ProfilePictureUpload
            babyId={baby.id}
            babyName={
              getFullBabyName({
                firstName: baby.firstName || '',
                lastName: baby.lastName,
                middleName: baby.middleName,
              }) || 'Baby'
            }
            currentBackgroundColor={baby.avatarBackgroundColor}
            currentPhotoUrl={baby.photoUrl}
          />
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Baby&apos;s Name (Optional)</Label>
            <Input
              id="fullName"
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              placeholder="e.g., Emma Grace Smith"
              value={formData.fullName}
            />
            <p className="text-xs text-muted-foreground">
              We&apos;ll automatically split it into first, middle, and last
              names.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Gender (Optional)</Label>
            <Select
              onValueChange={(value) =>
                setFormData({ ...formData, gender: value })
              }
              value={formData.gender}
            >
              <SelectTrigger className="w-full" id="gender">
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
              <SelectTrigger className="w-full" id="journeyStage">
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
                <SelectTrigger className="w-full" id="ttcMethod">
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
            <DatePicker
              date={formData.dueDate}
              setDate={(date) => setFormData({ ...formData, dueDate: date })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthDate">
              Birth Date & Time{' '}
              {formData.journeyStage !== 'born' && '(if born)'}
            </Label>
            <DateTimePicker
              date={formData.birthDate}
              placeholder="Pick birth date and time"
              setDate={(date) => setFormData({ ...formData, birthDate: date })}
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

        <div className="space-y-6">
          {/* Birth Weight */}
          <div className="space-y-3">
            <Label>Birth Weight</Label>
            <div className="bg-muted/30 rounded-2xl p-6">
              <div className="grid grid-cols-2 gap-4">
                {/* Pounds */}
                <div className="space-y-2">
                  <Label
                    className="text-xs text-muted-foreground"
                    htmlFor="birthWeightLbs"
                  >
                    Pounds
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      className="size-10 rounded-full bg-transparent"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          birthWeightLbs: Math.max(
                            0,
                            (Number.parseInt(formData.birthWeightLbs, 10) ||
                              0) - 1,
                          ).toString(),
                        })
                      }
                      size="icon"
                      type="button"
                      variant="outline"
                    >
                      <Minus className="size-4" />
                    </Button>
                    <Input
                      className="text-center text-2xl font-bold"
                      id="birthWeightLbs"
                      min="0"
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          birthWeightLbs: e.target.value,
                        })
                      }
                      placeholder="0"
                      type="number"
                      value={formData.birthWeightLbs}
                    />
                    <Button
                      className="size-10 rounded-full bg-transparent"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          birthWeightLbs: (
                            (Number.parseInt(formData.birthWeightLbs, 10) ||
                              0) + 1
                          ).toString(),
                        })
                      }
                      size="icon"
                      type="button"
                      variant="outline"
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                </div>

                {/* Ounces */}
                <div className="space-y-2">
                  <Label
                    className="text-xs text-muted-foreground"
                    htmlFor="birthWeightOz"
                  >
                    Ounces
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      className="size-10 rounded-full bg-transparent"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          birthWeightOz: Math.max(
                            0,
                            (Number.parseInt(formData.birthWeightOz, 10) || 0) -
                              1,
                          ).toString(),
                        })
                      }
                      size="icon"
                      type="button"
                      variant="outline"
                    >
                      <Minus className="size-4" />
                    </Button>
                    <Input
                      className="text-center text-2xl font-bold"
                      id="birthWeightOz"
                      max="15"
                      min="0"
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          birthWeightOz: e.target.value,
                        })
                      }
                      placeholder="0"
                      type="number"
                      value={formData.birthWeightOz}
                    />
                    <Button
                      className="size-10 rounded-full bg-transparent"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          birthWeightOz: Math.min(
                            15,
                            (Number.parseInt(formData.birthWeightOz, 10) || 0) +
                              1,
                          ).toString(),
                        })
                      }
                      size="icon"
                      type="button"
                      variant="outline"
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Select for Birth Weight */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Quick Select
              </p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { lbs: 5, oz: 8 },
                  { lbs: 6, oz: 0 },
                  { lbs: 7, oz: 0 },
                  { lbs: 8, oz: 0 },
                ].map((weight) => (
                  <Button
                    className="h-12 bg-transparent"
                    key={`${weight.lbs}-${weight.oz}`}
                    onClick={() =>
                      setFormData({
                        ...formData,
                        birthWeightLbs: weight.lbs.toString(),
                        birthWeightOz: weight.oz.toString(),
                      })
                    }
                    type="button"
                    variant="outline"
                  >
                    {weight.lbs}lb {weight.oz}oz
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Current Weight */}
          <div className="space-y-3">
            <Label>Current Weight</Label>
            <div className="bg-muted/30 rounded-2xl p-6">
              <div className="grid grid-cols-2 gap-4">
                {/* Pounds */}
                <div className="space-y-2">
                  <Label
                    className="text-xs text-muted-foreground"
                    htmlFor="currentWeightLbs"
                  >
                    Pounds
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      className="size-10 rounded-full bg-transparent"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          currentWeightLbs: Math.max(
                            0,
                            (Number.parseInt(formData.currentWeightLbs, 10) ||
                              0) - 1,
                          ).toString(),
                        })
                      }
                      size="icon"
                      type="button"
                      variant="outline"
                    >
                      <Minus className="size-4" />
                    </Button>
                    <Input
                      className="text-center text-2xl font-bold"
                      id="currentWeightLbs"
                      min="0"
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          currentWeightLbs: e.target.value,
                        })
                      }
                      placeholder="0"
                      type="number"
                      value={formData.currentWeightLbs}
                    />
                    <Button
                      className="size-10 rounded-full bg-transparent"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          currentWeightLbs: (
                            (Number.parseInt(formData.currentWeightLbs, 10) ||
                              0) + 1
                          ).toString(),
                        })
                      }
                      size="icon"
                      type="button"
                      variant="outline"
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                </div>

                {/* Ounces */}
                <div className="space-y-2">
                  <Label
                    className="text-xs text-muted-foreground"
                    htmlFor="currentWeightOz"
                  >
                    Ounces
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      className="size-10 rounded-full bg-transparent"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          currentWeightOz: Math.max(
                            0,
                            (Number.parseInt(formData.currentWeightOz, 10) ||
                              0) - 1,
                          ).toString(),
                        })
                      }
                      size="icon"
                      type="button"
                      variant="outline"
                    >
                      <Minus className="size-4" />
                    </Button>
                    <Input
                      className="text-center text-2xl font-bold"
                      id="currentWeightOz"
                      max="15"
                      min="0"
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          currentWeightOz: e.target.value,
                        })
                      }
                      placeholder="0"
                      type="number"
                      value={formData.currentWeightOz}
                    />
                    <Button
                      className="size-10 rounded-full bg-transparent"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          currentWeightOz: Math.min(
                            15,
                            (Number.parseInt(formData.currentWeightOz, 10) ||
                              0) + 1,
                          ).toString(),
                        })
                      }
                      size="icon"
                      type="button"
                      variant="outline"
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Select for Current Weight */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Quick Select
              </p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { lbs: 8, oz: 0 },
                  { lbs: 10, oz: 0 },
                  { lbs: 12, oz: 0 },
                  { lbs: 15, oz: 0 },
                ].map((weight) => (
                  <Button
                    className="h-12 bg-transparent"
                    key={`${weight.lbs}-${weight.oz}`}
                    onClick={() =>
                      setFormData({
                        ...formData,
                        currentWeightLbs: weight.lbs.toString(),
                        currentWeightOz: weight.oz.toString(),
                      })
                    }
                    type="button"
                    variant="outline"
                  >
                    {weight.lbs}lb {weight.oz}oz
                  </Button>
                ))}
              </div>
            </div>
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

      {/* Delete Baby Profile */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <Baby className="size-5 text-muted-foreground mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-lg">Delete Baby Profile</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Permanently delete {baby.firstName || 'this baby'}'s profile and
              all associated data (activities, supply tracking, medical records,
              etc.). This cannot be undone.
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
