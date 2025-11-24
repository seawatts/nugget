'use client';

import { api } from '@nugget/api/react';
import type { BabyCustomPreferences } from '@nugget/db';
import { Button } from '@nugget/ui/button';
import { Card } from '@nugget/ui/card';
import { Icons } from '@nugget/ui/custom/icons';
import { H2, H3, P } from '@nugget/ui/custom/typography';
import { Input } from '@nugget/ui/input';
import { Label } from '@nugget/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@nugget/ui/select';
import { Slider } from '@nugget/ui/slider';
import { Droplets, Milk, Moon, Undo2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

// Helper functions for unit conversion
function mlToOz(ml: number): number {
  return Math.round((ml / 29.5735) * 2) / 2; // Round to nearest 0.5oz
}

function ozToMl(oz: number): number {
  return Math.round(oz * 29.5735);
}

export default function BabyPreferencesPage() {
  const router = useRouter();
  const { data: babies = [] } = api.babies.list.useQuery();
  const { data: currentUser } = api.user.current.useQuery();
  const [selectedBabyId, setSelectedBabyId] = useState<string | undefined>();

  // Get user's measurement unit preference
  const userUnit = currentUser?.measurementUnit || 'metric';
  const isImperial = userUnit === 'imperial';
  const volumeUnit = isImperial ? 'oz' : 'ml';

  // Use the first baby as default or the selected one
  const babyId = selectedBabyId || babies[0]?.id;
  const { data: baby, isLoading } = api.babies.getByIdLight.useQuery(
    { id: babyId || '' },
    { enabled: !!babyId },
  );

  const updatePreferences = api.babies.updateCustomPreferences.useMutation();

  const utils = api.useUtils();

  // Set the selected baby ID when babies load
  useEffect(() => {
    if (babies.length > 0 && !selectedBabyId) {
      setSelectedBabyId(babies[0]?.id);
    }
  }, [babies, selectedBabyId]);

  const [preferences, setPreferences] = useState<BabyCustomPreferences>({});

  // Local state for display values (in user's preferred unit)
  const [displayBottleAmount, setDisplayBottleAmount] = useState<string>('');
  const [displayPumpingAmount, setDisplayPumpingAmount] = useState<string>('');

  // Load baby preferences and convert to display units
  useEffect(() => {
    if (baby?.customPreferences) {
      setPreferences(baby.customPreferences);

      // Convert amounts to display unit
      if (baby.customPreferences.feeding?.bottleAmountMl) {
        const displayValue = isImperial
          ? mlToOz(baby.customPreferences.feeding.bottleAmountMl)
          : baby.customPreferences.feeding.bottleAmountMl;
        setDisplayBottleAmount(displayValue.toString());
      } else {
        setDisplayBottleAmount('');
      }

      if (baby.customPreferences.pumping?.amountMl) {
        const displayValue = isImperial
          ? mlToOz(baby.customPreferences.pumping.amountMl)
          : baby.customPreferences.pumping.amountMl;
        setDisplayPumpingAmount(displayValue.toString());
      } else {
        setDisplayPumpingAmount('');
      }
    } else {
      setPreferences({});
      setDisplayBottleAmount('');
      setDisplayPumpingAmount('');
    }
  }, [baby, isImperial]);

  const handleSave = async () => {
    if (!babyId) return;

    try {
      // Convert display values back to ml before saving
      const preferencesToSave: BabyCustomPreferences = {
        ...preferences,
        feeding: preferences.feeding
          ? {
              ...preferences.feeding,
              bottleAmountMl: displayBottleAmount
                ? isImperial
                  ? ozToMl(Number.parseFloat(displayBottleAmount))
                  : Number.parseFloat(displayBottleAmount)
                : undefined,
            }
          : undefined,
        pumping: preferences.pumping
          ? {
              ...preferences.pumping,
              amountMl: displayPumpingAmount
                ? isImperial
                  ? ozToMl(Number.parseFloat(displayPumpingAmount))
                  : Number.parseFloat(displayPumpingAmount)
                : undefined,
            }
          : undefined,
      };

      await updatePreferences.mutateAsync({
        babyId,
        customPreferences: preferencesToSave,
      });

      // Invalidate baby data and activity queries to refetch with new preferences
      await utils.babies.getByIdLight.invalidate({ id: babyId });
      await utils.babies.getById.invalidate({ id: babyId });
      await utils.activities.getUpcomingFeeding.invalidate({ babyId });
      await utils.activities.getUpcomingPumping.invalidate({ babyId });

      // Force router refresh to update all pages
      router.refresh();

      toast.success('Preferences saved successfully!');
    } catch (error) {
      toast.error('Failed to save preferences', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleReset = () => {
    setPreferences({});
    setDisplayBottleAmount('');
    setDisplayPumpingAmount('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Icons.Spinner className="animate-spin" />
      </div>
    );
  }

  if (!baby) {
    return (
      <div className="p-8">
        <P>No baby found. Please add a baby first.</P>
      </div>
    );
  }

  // Check if there are changes by comparing current display values with saved values
  const hasChanges = (() => {
    if (
      !baby?.customPreferences &&
      !displayBottleAmount &&
      !displayPumpingAmount &&
      !preferences.feeding?.nursingDurationMinutes &&
      !preferences.feeding?.preferredType &&
      !preferences.feeding?.bottleType &&
      !preferences.pumping?.durationMinutes &&
      !preferences.preferenceWeight
    ) {
      return false;
    }

    const savedBottleAmount = baby?.customPreferences?.feeding?.bottleAmountMl
      ? isImperial
        ? mlToOz(baby.customPreferences.feeding.bottleAmountMl).toString()
        : baby.customPreferences.feeding.bottleAmountMl.toString()
      : '';
    const savedPumpingAmount = baby?.customPreferences?.pumping?.amountMl
      ? isImperial
        ? mlToOz(baby.customPreferences.pumping.amountMl).toString()
        : baby.customPreferences.pumping.amountMl.toString()
      : '';

    return (
      displayBottleAmount !== savedBottleAmount ||
      displayPumpingAmount !== savedPumpingAmount ||
      JSON.stringify({
        feeding: {
          bottleType: preferences.feeding?.bottleType,
          nursingDurationMinutes: preferences.feeding?.nursingDurationMinutes,
          preferredType: preferences.feeding?.preferredType,
        },
        preferenceWeight: preferences.preferenceWeight,
        pumping: {
          durationMinutes: preferences.pumping?.durationMinutes,
        },
      }) !==
        JSON.stringify({
          feeding: {
            bottleType: baby?.customPreferences?.feeding?.bottleType,
            nursingDurationMinutes:
              baby?.customPreferences?.feeding?.nursingDurationMinutes,
            preferredType: baby?.customPreferences?.feeding?.preferredType,
          },
          preferenceWeight: baby?.customPreferences?.preferenceWeight,
          pumping: {
            durationMinutes: baby?.customPreferences?.pumping?.durationMinutes,
          },
        })
    );
  })();

  return (
    <div className="space-y-6 p-6">
      <div>
        <H2>Quick Button Preferences</H2>
        <P className="text-muted-foreground mt-2">
          Customize default values for quick action buttons. These preferences
          will be blended with recent activity data and age-based guidelines.
        </P>
      </div>

      {/* Baby Selector */}
      {babies.length > 1 && (
        <Card className="p-4">
          <Label>Select Baby</Label>
          <Select onValueChange={setSelectedBabyId} value={babyId}>
            <SelectTrigger className="w-full mt-2">
              <SelectValue placeholder="Select a baby" />
            </SelectTrigger>
            <SelectContent>
              {babies.map((b: (typeof babies)[0]) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.firstName} {b.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>
      )}

      {/* Feeding Preferences */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Droplets className="h-5 w-5 text-activity-feeding" />
          <H3>Feeding Preferences</H3>
        </div>

        <div className="space-y-4">
          {/* Preferred Feeding Type */}
          <div>
            <Label>Preferred Feeding Method</Label>
            <Select
              onValueChange={(value) => {
                setPreferences({
                  ...preferences,
                  feeding: {
                    ...preferences.feeding,
                    preferredType:
                      value === 'none'
                        ? undefined
                        : (value as 'bottle' | 'nursing'),
                  },
                });
              }}
              value={preferences.feeding?.preferredType || 'none'}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Auto (based on history)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Auto (based on history)</SelectItem>
                <SelectItem value="bottle">Bottle</SelectItem>
                <SelectItem value="nursing">Nursing</SelectItem>
              </SelectContent>
            </Select>
            <P className="text-xs text-muted-foreground mt-1">
              Quick buttons will prioritize this feeding method
            </P>
          </div>

          {/* Bottle Amount */}
          <div>
            <Label>Default Bottle Amount ({volumeUnit})</Label>
            <Input
              className="mt-2"
              onChange={(e) => {
                const value = e.target.value;
                setDisplayBottleAmount(value);
                // Don't update preferences.feeding.bottleAmountMl here - we'll convert on save
              }}
              placeholder="Auto (based on age & history)"
              step={isImperial ? '0.5' : '10'}
              type="number"
              value={displayBottleAmount}
            />
            <P className="text-xs text-muted-foreground mt-1">
              Leave empty to use automatic suggestions
            </P>
          </div>

          {/* Bottle Type */}
          <div>
            <Label>Preferred Bottle Type</Label>
            <Select
              onValueChange={(value) => {
                setPreferences({
                  ...preferences,
                  feeding: {
                    ...preferences.feeding,
                    bottleType:
                      value === 'none'
                        ? undefined
                        : (value as 'formula' | 'pumped'),
                  },
                });
              }}
              value={preferences.feeding?.bottleType || 'none'}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Auto (based on history)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Auto (based on history)</SelectItem>
                <SelectItem value="formula">Formula</SelectItem>
                <SelectItem value="pumped">Pumped Breast Milk</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Nursing Duration */}
          <div>
            <Label>Default Nursing Duration (minutes)</Label>
            <Input
              className="mt-2"
              onChange={(e) => {
                const value = e.target.value;
                setPreferences({
                  ...preferences,
                  feeding: {
                    ...preferences.feeding,
                    nursingDurationMinutes: value
                      ? Number.parseInt(value, 10)
                      : undefined,
                  },
                });
              }}
              placeholder="Auto (based on age)"
              type="number"
              value={preferences.feeding?.nursingDurationMinutes || ''}
            />
            <P className="text-xs text-muted-foreground mt-1">
              Typical duration for nursing sessions
            </P>
          </div>
        </div>
      </Card>

      {/* Pumping Preferences */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Milk className="h-5 w-5 text-activity-pumping" />
          <H3>Pumping Preferences</H3>
        </div>

        <div className="space-y-4">
          {/* Pumping Amount */}
          <div>
            <Label>Default Pumping Amount ({volumeUnit})</Label>
            <Input
              className="mt-2"
              onChange={(e) => {
                const value = e.target.value;
                setDisplayPumpingAmount(value);
                // Don't update preferences.pumping.amountMl here - we'll convert on save
              }}
              placeholder="Auto (based on age & history)"
              step={isImperial ? '0.5' : '10'}
              type="number"
              value={displayPumpingAmount}
            />
            <P className="text-xs text-muted-foreground mt-1">
              Total amount per session (both breasts)
            </P>
          </div>

          {/* Pumping Duration */}
          <div>
            <Label>Default Pumping Duration (minutes)</Label>
            <Input
              className="mt-2"
              onChange={(e) => {
                const value = e.target.value;
                setPreferences({
                  ...preferences,
                  pumping: {
                    ...preferences.pumping,
                    durationMinutes: value
                      ? Number.parseInt(value, 10)
                      : undefined,
                  },
                });
              }}
              placeholder="Auto (based on age)"
              type="number"
              value={preferences.pumping?.durationMinutes || ''}
            />
            <P className="text-xs text-muted-foreground mt-1">
              Typical duration for pumping sessions
            </P>
          </div>
        </div>
      </Card>

      {/* Advanced Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Moon className="h-5 w-5" />
          <H3>Advanced Settings</H3>
        </div>

        <div className="space-y-4">
          <div>
            <Label>
              Custom Preference Weight (
              {Math.round((preferences.preferenceWeight ?? 0.4) * 100)}%)
            </Label>
            <P className="text-xs text-muted-foreground mt-1 mb-3">
              Controls how much to use your custom values vs. automatic
              predictions:
            </P>
            <ul className="text-xs text-muted-foreground space-y-1 mb-3 ml-4 list-disc">
              <li>
                <strong>0%</strong> - Use only automatic (age + recent activity)
              </li>
              <li>
                <strong>40%</strong> (Default) - Balanced blend of all sources
              </li>
              <li>
                <strong>100%</strong> - Use only your custom values
              </li>
            </ul>
            <Slider
              className="mt-2"
              max={1}
              min={0}
              onValueChange={(values) => {
                setPreferences({
                  ...preferences,
                  preferenceWeight: values[0],
                });
              }}
              step={0.1}
              value={[preferences.preferenceWeight ?? 0.4]}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>Auto (0%)</span>
              <span>Balanced (40%)</span>
              <span>Custom Only (100%)</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end">
        <Button disabled={!hasChanges} onClick={handleReset} variant="outline">
          <Undo2 className="mr-2 size-4" />
          Reset
        </Button>
        <Button
          disabled={!hasChanges || updatePreferences.isPending}
          onClick={handleSave}
        >
          {updatePreferences.isPending && (
            <Icons.Spinner className="mr-2 size-4 animate-spin" />
          )}
          Save Preferences
        </Button>
      </div>
    </div>
  );
}
