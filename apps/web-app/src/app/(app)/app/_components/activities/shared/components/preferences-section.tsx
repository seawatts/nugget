'use client';

import { api } from '@nugget/api/react';
import type { BabyCustomPreferences } from '@nugget/db';
import { Button } from '@nugget/ui/button';
import { Icons } from '@nugget/ui/custom/icons';
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
import { Settings, Undo2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { InfoCard } from '../../../shared/info-card';

// Helper functions for unit conversion
function mlToOz(ml: number): number {
  return Math.round((ml / 29.5735) * 2) / 2; // Round to nearest 0.5oz
}

function ozToMl(oz: number): number {
  return Math.round(oz * 29.5735);
}

interface PreferencesSectionProps {
  activityType: 'feeding' | 'pumping';
  babyId: string;
  currentPreferences: BabyCustomPreferences | null | undefined;
  onSave?: () => void;
  unit?: 'ML' | 'OZ';
  color: string;
  bgColor: string;
  borderColor: string;
}

export function PreferencesSection({
  activityType,
  babyId,
  currentPreferences,
  onSave,
  unit,
  color,
  bgColor,
  borderColor,
}: PreferencesSectionProps) {
  const { data: currentUser } = api.user.current.useQuery();
  const preferredUnit =
    unit || (currentUser?.measurementUnit === 'imperial' ? 'OZ' : 'ML');
  const isImperial = preferredUnit === 'OZ';
  const volumeUnit = isImperial ? 'oz' : 'ml';

  const updatePreferences = api.babies.updateCustomPreferences.useMutation();
  const utils = api.useUtils();

  const [preferences, setPreferences] = useState<BabyCustomPreferences>(
    currentPreferences || {},
  );

  // Local state for display values (in user's preferred unit)
  const [displayAmount, setDisplayAmount] = useState<string>('');

  // Load preferences and convert to display units
  useEffect(() => {
    if (currentPreferences) {
      setPreferences(currentPreferences);

      // Convert amounts to display unit
      if (activityType === 'feeding') {
        if (currentPreferences.feeding?.bottleAmountMl) {
          const displayValue = isImperial
            ? mlToOz(currentPreferences.feeding.bottleAmountMl)
            : currentPreferences.feeding.bottleAmountMl;
          setDisplayAmount(displayValue.toString());
        } else {
          setDisplayAmount('');
        }
      } else if (activityType === 'pumping') {
        if (currentPreferences.pumping?.amountMl) {
          const displayValue = isImperial
            ? mlToOz(currentPreferences.pumping.amountMl)
            : currentPreferences.pumping.amountMl;
          setDisplayAmount(displayValue.toString());
        } else {
          setDisplayAmount('');
        }
      }
    } else {
      setPreferences({});
      setDisplayAmount('');
    }
  }, [currentPreferences, isImperial, activityType]);

  const handleSave = async () => {
    try {
      // Convert display values back to ml before saving
      const preferencesToSave: BabyCustomPreferences = {
        ...preferences,
      };

      if (activityType === 'feeding') {
        preferencesToSave.feeding = preferences.feeding
          ? {
              ...preferences.feeding,
              bottleAmountMl: displayAmount
                ? isImperial
                  ? ozToMl(Number.parseFloat(displayAmount))
                  : Number.parseFloat(displayAmount)
                : undefined,
            }
          : undefined;
      } else if (activityType === 'pumping') {
        preferencesToSave.pumping = preferences.pumping
          ? {
              ...preferences.pumping,
              amountMl: displayAmount
                ? isImperial
                  ? ozToMl(Number.parseFloat(displayAmount))
                  : Number.parseFloat(displayAmount)
                : undefined,
            }
          : undefined;
      }

      await updatePreferences.mutateAsync({
        babyId,
        customPreferences: preferencesToSave,
      });

      // Invalidate baby data and activity queries
      await utils.babies.getByIdLight.invalidate({ id: babyId });
      await utils.babies.getById.invalidate({ id: babyId });
      await utils.activities.getUpcomingFeeding.invalidate({ babyId });
      await utils.activities.getUpcomingPumping.invalidate({ babyId });

      toast.success('Preferences saved successfully!');
      onSave?.();
    } catch (error) {
      toast.error('Failed to save preferences', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleReset = () => {
    setPreferences({});
    setDisplayAmount('');
  };

  // Check if there are changes
  const hasChanges = (() => {
    if (!currentPreferences && !displayAmount) {
      if (activityType === 'feeding') {
        return !!(
          preferences.feeding?.nursingDurationMinutes ||
          preferences.feeding?.preferredType ||
          preferences.feeding?.bottleType ||
          preferences.feeding?.preferenceWeight
        );
      }
      return !!(
        preferences.pumping?.durationMinutes ||
        preferences.pumping?.preferenceWeight
      );
    }

    const savedAmount =
      activityType === 'feeding'
        ? currentPreferences?.feeding?.bottleAmountMl
        : currentPreferences?.pumping?.amountMl;

    const savedDisplayAmount = savedAmount
      ? isImperial
        ? mlToOz(savedAmount).toString()
        : savedAmount.toString()
      : '';

    if (displayAmount !== savedDisplayAmount) {
      return true;
    }

    if (activityType === 'feeding') {
      return (
        JSON.stringify({
          bottleType: preferences.feeding?.bottleType,
          nursingDurationMinutes: preferences.feeding?.nursingDurationMinutes,
          preferenceWeight: preferences.feeding?.preferenceWeight,
          preferredType: preferences.feeding?.preferredType,
        }) !==
        JSON.stringify({
          bottleType: currentPreferences?.feeding?.bottleType,
          nursingDurationMinutes:
            currentPreferences?.feeding?.nursingDurationMinutes,
          preferenceWeight: currentPreferences?.feeding?.preferenceWeight,
          preferredType: currentPreferences?.feeding?.preferredType,
        })
      );
    }
    return (
      JSON.stringify({
        durationMinutes: preferences.pumping?.durationMinutes,
        preferenceWeight: preferences.pumping?.preferenceWeight,
      }) !==
      JSON.stringify({
        durationMinutes: currentPreferences?.pumping?.durationMinutes,
        preferenceWeight: currentPreferences?.pumping?.preferenceWeight,
      })
    );
  })();

  const activityName =
    activityType.charAt(0).toUpperCase() + activityType.slice(1);
  const currentWeight =
    activityType === 'feeding'
      ? (preferences.feeding?.preferenceWeight ?? 0.4)
      : (preferences.pumping?.preferenceWeight ?? 0.4);

  return (
    <InfoCard
      bgColor={bgColor}
      borderColor={borderColor}
      color={color}
      icon={Settings}
      title={`${activityName} Preferences`}
    >
      <p className="text-sm text-muted-foreground">
        Customize default values for quick action buttons. These preferences
        will be blended with recent activity data and age-based guidelines.
      </p>

      <div className="space-y-4 pt-2">
        {activityType === 'feeding' && (
          <>
            {/* Preferred Feeding Type */}
            <div>
              <Label className="text-sm">Preferred Feeding Method</Label>
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
            </div>

            {/* Bottle Amount */}
            <div>
              <Label className="text-sm">
                Default Bottle Amount ({volumeUnit})
              </Label>
              <Input
                className="mt-2"
                onChange={(e) => {
                  setDisplayAmount(e.target.value);
                }}
                placeholder="Auto (based on age & history)"
                step={isImperial ? '0.5' : '10'}
                type="number"
                value={displayAmount}
              />
            </div>

            {/* Bottle Type */}
            <div>
              <Label className="text-sm">Preferred Bottle Type</Label>
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
              <Label className="text-sm">
                Default Nursing Duration (minutes)
              </Label>
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
            </div>
          </>
        )}

        {activityType === 'pumping' && (
          <>
            {/* Pumping Amount */}
            <div>
              <Label className="text-sm">
                Default Pumping Amount ({volumeUnit})
              </Label>
              <Input
                className="mt-2"
                onChange={(e) => {
                  setDisplayAmount(e.target.value);
                }}
                placeholder="Auto (based on age & history)"
                step={isImperial ? '0.5' : '10'}
                type="number"
                value={displayAmount}
              />
            </div>

            {/* Pumping Duration */}
            <div>
              <Label className="text-sm">
                Default Pumping Duration (minutes)
              </Label>
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
            </div>
          </>
        )}

        {/* Preference Weight Slider */}
        <div>
          <Label className="text-sm">
            Custom Preference Weight ({Math.round(currentWeight * 100)}%)
          </Label>
          <p className="text-xs text-muted-foreground mt-1 mb-3">
            Controls how much to use your custom values vs. automatic
            predictions:
          </p>
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
              if (activityType === 'feeding') {
                setPreferences({
                  ...preferences,
                  feeding: {
                    ...preferences.feeding,
                    preferenceWeight: values[0],
                  },
                });
              } else {
                setPreferences({
                  ...preferences,
                  pumping: {
                    ...preferences.pumping,
                    preferenceWeight: values[0],
                  },
                });
              }
            }}
            step={0.1}
            value={[currentWeight]}
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>Auto (0%)</span>
            <span>Balanced (40%)</span>
            <span>Custom Only (100%)</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end pt-4 border-t border-border/50">
        <Button
          disabled={!hasChanges}
          onClick={handleReset}
          size="sm"
          variant="outline"
        >
          <Undo2 className="mr-2 size-4" />
          Reset
        </Button>
        <Button
          disabled={!hasChanges || updatePreferences.isPending}
          onClick={handleSave}
          size="sm"
        >
          {updatePreferences.isPending && (
            <Icons.Spinner className="mr-2 size-4 animate-spin" />
          )}
          Save Preferences
        </Button>
      </div>
    </InfoCard>
  );
}
