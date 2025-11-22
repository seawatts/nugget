'use client';

import { api } from '@nugget/api/react';
import { Button } from '@nugget/ui/button';
import { Label } from '@nugget/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@nugget/ui/select';
import { SettingToggle } from '@nugget/ui/setting-toggle';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function DashboardSettingsPage() {
  const [selectedBabyId, setSelectedBabyId] = useState<string | null>(null);

  const { data: babies, isLoading: babiesLoading } = api.babies.list.useQuery();
  const { data: baby, isLoading: babyLoading } =
    api.babies.getByIdLight.useQuery(
      { id: selectedBabyId ?? '' },
      { enabled: !!selectedBabyId },
    );
  const updatePreferences = api.babies.updateDashboardPreferences.useMutation();
  const utils = api.useUtils();

  const [preferences, setPreferences] = useState({
    showActivityTimeline: true,
    showDiaperCard: true,
    showDoctorVisitCard: true,
    showFeedingCard: true,
    showPumpingCard: true,
    showSleepCard: true,
  });

  // Set first baby as default when babies load
  useEffect(() => {
    if (babies && babies.length > 0 && !selectedBabyId) {
      setSelectedBabyId(babies[0]?.id ?? null);
    }
  }, [babies, selectedBabyId]);

  // Load preferences from baby data
  useEffect(() => {
    if (baby) {
      setPreferences({
        showActivityTimeline: baby.showActivityTimeline ?? true,
        showDiaperCard: baby.showDiaperCard ?? true,
        showDoctorVisitCard: baby.showDoctorVisitCard ?? true,
        showFeedingCard: baby.showFeedingCard ?? true,
        showPumpingCard: baby.showPumpingCard ?? true,
        showSleepCard: baby.showSleepCard ?? true,
      });
    }
  }, [baby]);

  const handlePreferenceChange = async (
    key:
      | 'showFeedingCard'
      | 'showSleepCard'
      | 'showDiaperCard'
      | 'showPumpingCard'
      | 'showDoctorVisitCard'
      | 'showActivityTimeline',
    value: boolean,
  ) => {
    if (!selectedBabyId) {
      toast.error('No baby selected');
      return;
    }

    // Optimistic update
    setPreferences((prev) => ({ ...prev, [key]: value }));

    try {
      await updatePreferences.mutateAsync({
        id: selectedBabyId,
        [key]: value,
      });

      // Invalidate queries to refetch updated data
      await utils.babies.getByIdLight.invalidate({ id: selectedBabyId });
      await utils.babies.list.invalidate();

      toast.success('Dashboard preferences saved');
    } catch (error) {
      // Revert on error
      if (baby) {
        setPreferences({
          showActivityTimeline: baby.showActivityTimeline ?? true,
          showDiaperCard: baby.showDiaperCard ?? true,
          showDoctorVisitCard: baby.showDoctorVisitCard ?? true,
          showFeedingCard: baby.showFeedingCard ?? true,
          showPumpingCard: baby.showPumpingCard ?? true,
          showSleepCard: baby.showSleepCard ?? true,
        });
      }
      toast.error('Failed to save preferences');
      console.error('Failed to save preferences:', error);
    }
  };

  if (babiesLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-card border border-border rounded-2xl p-6">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!babies || babies.length === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-card border border-border rounded-2xl p-6">
          <p className="text-muted-foreground">
            No babies found. Add a baby first to customize dashboard
            preferences.
          </p>
          <Button
            className="mt-4"
            onClick={() => {
              window.location.href = '/app/babies';
            }}
          >
            Go to Babies
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Dashboard Preferences</h2>
          <p className="text-sm text-muted-foreground">
            Customize which cards appear on the home screen for each baby
          </p>
        </div>

        {/* Baby Selector */}
        <div className="space-y-2">
          <Label>Select Baby</Label>
          <Select
            onValueChange={setSelectedBabyId}
            value={selectedBabyId || ''}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a baby" />
            </SelectTrigger>
            <SelectContent>
              {babies.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.firstName} {b.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {babyLoading ? (
        <div className="bg-card border border-border rounded-2xl p-6">
          <p className="text-muted-foreground">Loading preferences...</p>
        </div>
      ) : (
        <>
          {/* Activity Cards Section */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Activity Cards</h3>
              <p className="text-sm text-muted-foreground">
                Choose which activity cards to show on the home screen
              </p>
            </div>

            <div className="space-y-4">
              <SettingToggle
                checked={preferences.showFeedingCard}
                description="Display feeding predictions and quick log"
                label="Show Feeding"
                onCheckedChange={(checked) =>
                  handlePreferenceChange('showFeedingCard', checked)
                }
              />

              <SettingToggle
                checked={preferences.showSleepCard}
                description="Display sleep predictions and quick log"
                label="Show Sleep"
                onCheckedChange={(checked) =>
                  handlePreferenceChange('showSleepCard', checked)
                }
              />

              <SettingToggle
                checked={preferences.showDiaperCard}
                description="Display diaper predictions and quick log"
                label="Show Diaper"
                onCheckedChange={(checked) =>
                  handlePreferenceChange('showDiaperCard', checked)
                }
              />

              <SettingToggle
                checked={preferences.showPumpingCard}
                description="Display pumping predictions and quick log"
                label="Show Pumping"
                onCheckedChange={(checked) =>
                  handlePreferenceChange('showPumpingCard', checked)
                }
              />

              <SettingToggle
                checked={preferences.showDoctorVisitCard}
                description="Display doctor visit reminders and quick log"
                label="Show Doctor Visit"
                onCheckedChange={(checked) =>
                  handlePreferenceChange('showDoctorVisitCard', checked)
                }
              />
            </div>
          </div>

          {/* Timeline Section */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Timeline</h3>
              <p className="text-sm text-muted-foreground">
                Control activity timeline visibility
              </p>
            </div>

            <SettingToggle
              checked={preferences.showActivityTimeline}
              description="Display the full activity history timeline"
              label="Show Activity Timeline"
              onCheckedChange={(checked) =>
                handlePreferenceChange('showActivityTimeline', checked)
              }
            />
          </div>
        </>
      )}
    </div>
  );
}
