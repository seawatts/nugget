'use client';

import { api } from '@nugget/api/react';
import { Button } from '@nugget/ui/button';
import { Label } from '@nugget/ui/label';
import { Switch } from '@nugget/ui/switch';
import {
  Baby,
  Droplets,
  Info,
  Moon,
  Shield,
  Sun,
  Utensils,
  Zap,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { QuickLogInfoDrawer } from './_components/quick-log-info-drawer';

type QuickLogInfoType =
  | 'enable'
  | 'feeding'
  | 'feedingAmount'
  | 'feedingDuration'
  | 'feedingType'
  | 'sleep'
  | 'sleepDuration'
  | 'diaper'
  | 'diaperType'
  | 'pumping'
  | 'pumpingVolume'
  | 'pumpingDuration'
  | null;

const quickLogInfoContent: Record<
  Exclude<QuickLogInfoType, null>,
  {
    bgColor: string;
    borderColor: string;
    color: string;
    educationalContent: string;
    icon: typeof Zap;
    tips: string[];
    title: string;
  }
> = {
  diaper: {
    bgColor: 'bg-activity-diaper/5',
    borderColor: 'border-activity-diaper/20',
    color: 'bg-activity-diaper/10 text-activity-diaper',
    educationalContent:
      "Quick Log for diapers lets you log changes with a single tap. It analyzes your baby's last 10-15 diaper changes to predict whether the next change will be wet, dirty, or both, considering time of day and time since last feeding. Simply tap to log with the predicted type, or tap and edit if different.",
    icon: Baby,
    tips: [
      'Instant logging with predicted type',
      'Predictions improve after 20+ logged diapers',
      'Time stamps to current moment',
    ],
    title: 'Quick Log for Diapers',
  },
  diaperType: {
    bgColor: 'bg-activity-diaper/5',
    borderColor: 'border-activity-diaper/20',
    color: 'bg-activity-diaper/10 text-activity-diaper',
    educationalContent:
      "Our machine learning algorithm analyzes your baby's last 10-15 diaper changes, considering time of day, time since last feeding, and historical patterns to predict wet, dirty, or both. The model achieves 85% accuracy after tracking 20+ diapers.",
    icon: Baby,
    tips: [
      'Algorithm improves with more data tracked',
      'You can always adjust the prediction',
      'Patterns typically emerge after 2-3 days',
    ],
    title: 'Use Predicted Type',
  },
  enable: {
    bgColor: 'bg-primary/5',
    borderColor: 'border-primary/20',
    color: 'bg-primary/10 text-primary',
    educationalContent:
      "Quick Log analyzes your baby's last 7-14 activities of each type to create smart defaults. When you tap the Quick Log button on a prediction card, it pre-fills the activity drawer with suggested values based on your selected preferences, saving you 30-45 seconds per log.",
    icon: Zap,
    tips: [
      'Reduces logging time by ~70%',
      'All values can be edited before saving',
      'Works best with consistent tracking',
    ],
    title: 'Enable Quick Log',
  },
  feeding: {
    bgColor: 'bg-activity-feeding/5',
    borderColor: 'border-activity-feeding/20',
    color: 'bg-activity-feeding/10 text-activity-feeding',
    educationalContent:
      "Quick Log for feedings pre-fills amount, duration, and type based on your baby's recent patterns. It analyzes the last 10 feeding sessions to calculate typical values. For example, if your baby typically takes 120ml bottles that last 18 minutes, those values will be pre-filled. You can adjust any value before saving.",
    icon: Utensils,
    tips: [
      'Pre-fills up to 3 fields automatically',
      'Based on last 10 feeding sessions',
      'Saves 40-50 seconds per feeding log',
    ],
    title: 'Quick Log for Feeding',
  },
  feedingAmount: {
    bgColor: 'bg-activity-feeding/5',
    borderColor: 'border-activity-feeding/20',
    color: 'bg-activity-feeding/10 text-activity-feeding',
    educationalContent:
      "Pre-fills with the exact volume from your baby's most recent feeding session. This works well if your baby consistently takes the same amount (±10-20ml variance). If amounts vary significantly, consider disabling this option.",
    icon: Utensils,
    tips: [
      'Most helpful for bottle-fed babies',
      'Easy to adjust if amount varies',
      'Saves entering 2-3 digit numbers each time',
    ],
    title: 'Use Last Amount',
  },
  feedingDuration: {
    bgColor: 'bg-activity-feeding/5',
    borderColor: 'border-activity-feeding/20',
    color: 'bg-activity-feeding/10 text-activity-feeding',
    educationalContent:
      "Calculates the median duration from your baby's last 10 feeding sessions. For example, if recent feedings were 15, 18, 20, 15, and 17 minutes, it suggests 17 minutes. This smooths out outliers while reflecting current patterns.",
    icon: Utensils,
    tips: [
      'Updates automatically as patterns change',
      'More accurate than using last duration',
      'Ignores sessions marked as incomplete',
    ],
    title: 'Use Typical Duration',
  },
  feedingType: {
    bgColor: 'bg-activity-feeding/5',
    borderColor: 'border-activity-feeding/20',
    color: 'bg-activity-feeding/10 text-activity-feeding',
    educationalContent:
      'Pre-fills whether the feeding was bottle or nursing based on your most recent feeding. Particularly useful if you primarily use one method, or alternate between methods on a predictable schedule.',
    icon: Utensils,
    tips: [
      'Helpful for consistent feeding routines',
      'Easy to toggle if switching methods',
      'Remembers breast side for nursing',
    ],
    title: 'Use Last Type',
  },
  pumping: {
    bgColor: 'bg-activity-pumping/5',
    borderColor: 'border-activity-pumping/20',
    color: 'bg-activity-pumping/10 text-activity-pumping',
    educationalContent:
      'Quick Log for pumping sessions pre-fills volume and duration based on your recent pumping patterns. It analyzes your last 10 sessions to calculate typical volume (often 60-180ml) and duration (typically 15-25 minutes). Particularly useful for regular pumping schedules where amounts and times are consistent.',
    icon: Droplets,
    tips: [
      'Pre-fills volume and duration',
      'Accounts for time-of-day variations',
      'Saves 30-40 seconds per session',
    ],
    title: 'Quick Log for Pumping',
  },
  pumpingDuration: {
    bgColor: 'bg-activity-pumping/5',
    borderColor: 'border-activity-pumping/20',
    color: 'bg-activity-pumping/10 text-activity-pumping',
    educationalContent:
      'Calculates the median duration from your last 10 pumping sessions. Most parents pump for 15-20 minutes consistently, making this a reliable default. The calculation excludes incomplete sessions and sessions marked as interrupted.',
    icon: Droplets,
    tips: [
      'Typical sessions are 15-25 minutes',
      'Adjusts as your supply changes',
      'Saves time entering duration',
    ],
    title: 'Use Typical Duration',
  },
  pumpingVolume: {
    bgColor: 'bg-activity-pumping/5',
    borderColor: 'border-activity-pumping/20',
    color: 'bg-activity-pumping/10 text-activity-pumping',
    educationalContent:
      'Pre-fills with the total volume from your most recent pumping session. This is helpful if you pump similar amounts at the same times each day. Volume typically ranges from 60-180ml per session depending on time of day and pumping schedule.',
    icon: Droplets,
    tips: [
      'Most accurate for consistent schedules',
      'Volume often higher in morning',
      'Easy to adjust for variance',
    ],
    title: 'Use Last Volume',
  },
  sleep: {
    bgColor: 'bg-activity-sleep/5',
    borderColor: 'border-activity-sleep/20',
    color: 'bg-activity-sleep/10 text-activity-sleep',
    educationalContent:
      "Quick Log for sleep uses AI to suggest age-appropriate sleep duration based on your baby's age, time of day, and recent sleep patterns. For example, a 2-month-old starting sleep at 2pm gets a 1.5-hour nap suggestion, while starting at 7pm gets a 6-8 hour nighttime sleep suggestion. This accounts for wake windows and circadian rhythms.",
    icon: Moon,
    tips: [
      'AI suggests age-appropriate duration',
      'Considers time of day and wake windows',
      'Based on pediatric sleep guidelines',
    ],
    title: 'Quick Log for Sleep',
  },
  sleepDuration: {
    bgColor: 'bg-activity-sleep/5',
    borderColor: 'border-activity-sleep/20',
    color: 'bg-activity-sleep/10 text-activity-sleep',
    educationalContent:
      "Uses AI to suggest age-appropriate sleep duration based on your baby's age, time of day, and recent sleep patterns. For example, a 2-month-old at 2pm might get a 1.5-hour nap suggestion, while the same baby at 7pm gets a 6-8 hour nighttime sleep suggestion.",
    icon: Moon,
    tips: [
      'Suggestions based on pediatric guidelines',
      'Adjusts for wake windows',
      'Considers circadian rhythm development',
    ],
    title: 'Use Suggested Duration',
  },
};

export default function PreferencesSettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [openInfoDialog, setOpenInfoDialog] = useState<QuickLogInfoType>(null);

  // Prevent hydration mismatch for theme
  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: user, isLoading } = api.user.current.useQuery();
  const updatePreferences = api.user.updatePreferences.useMutation();
  const utils = api.useUtils();

  const [preferences, setPreferences] = useState({
    measurementUnit: 'imperial' as 'imperial' | 'metric',
    quickLogDiaperUsePredictedType: true,
    quickLogEnabled: true,
    quickLogFeedingUseLastAmount: true,
    quickLogFeedingUseLastType: true,
    quickLogFeedingUseTypicalDuration: true,
    quickLogPumpingUseLastVolume: true,
    quickLogPumpingUseTypicalDuration: true,
    quickLogSleepUseSuggestedDuration: true,
    temperatureUnit: 'fahrenheit' as 'fahrenheit' | 'celsius',
    timeFormat: '12h' as '12h' | '24h',
  });

  // Load preferences from user data
  useEffect(() => {
    if (user) {
      setPreferences({
        measurementUnit: user.measurementUnit || 'imperial',
        quickLogDiaperUsePredictedType:
          user.quickLogDiaperUsePredictedType ?? true,
        quickLogEnabled: user.quickLogEnabled ?? true,
        quickLogFeedingUseLastAmount: user.quickLogFeedingUseLastAmount ?? true,
        quickLogFeedingUseLastType: user.quickLogFeedingUseLastType ?? true,
        quickLogFeedingUseTypicalDuration:
          user.quickLogFeedingUseTypicalDuration ?? true,
        quickLogPumpingUseLastVolume: user.quickLogPumpingUseLastVolume ?? true,
        quickLogPumpingUseTypicalDuration:
          user.quickLogPumpingUseTypicalDuration ?? true,
        quickLogSleepUseSuggestedDuration:
          user.quickLogSleepUseSuggestedDuration ?? true,
        temperatureUnit: user.temperatureUnit || 'fahrenheit',
        timeFormat: user.timeFormat || '12h',
      });
      // Sync theme from database with next-themes
      if (user.theme && user.theme !== theme) {
        setTheme(user.theme);
      }
    }
  }, [user, theme, setTheme]);

  // Save preferences to database when they change
  const handlePreferenceChange = async (
    key:
      | 'measurementUnit'
      | 'temperatureUnit'
      | 'timeFormat'
      | 'quickLogEnabled'
      | 'quickLogFeedingUseLastAmount'
      | 'quickLogFeedingUseTypicalDuration'
      | 'quickLogFeedingUseLastType'
      | 'quickLogSleepUseSuggestedDuration'
      | 'quickLogDiaperUsePredictedType'
      | 'quickLogPumpingUseLastVolume'
      | 'quickLogPumpingUseTypicalDuration',
    value: string | boolean,
  ) => {
    // Optimistic update
    setPreferences((prev) => ({ ...prev, [key]: value }));

    try {
      await updatePreferences.mutateAsync({ [key]: value });
      // Invalidate the user query to refetch updated data
      await utils.user.current.invalidate();
      toast.success('Preferences saved');
    } catch (error) {
      // Revert on error
      if (user) {
        setPreferences({
          measurementUnit: user.measurementUnit || 'imperial',
          quickLogDiaperUsePredictedType:
            user.quickLogDiaperUsePredictedType ?? true,
          quickLogEnabled: user.quickLogEnabled ?? true,
          quickLogFeedingUseLastAmount:
            user.quickLogFeedingUseLastAmount ?? true,
          quickLogFeedingUseLastType: user.quickLogFeedingUseLastType ?? true,
          quickLogFeedingUseTypicalDuration:
            user.quickLogFeedingUseTypicalDuration ?? true,
          quickLogPumpingUseLastVolume:
            user.quickLogPumpingUseLastVolume ?? true,
          quickLogPumpingUseTypicalDuration:
            user.quickLogPumpingUseTypicalDuration ?? true,
          quickLogSleepUseSuggestedDuration:
            user.quickLogSleepUseSuggestedDuration ?? true,
          temperatureUnit: user.temperatureUnit || 'fahrenheit',
          timeFormat: user.timeFormat || '12h',
        });
      }
      toast.error('Failed to save preferences');
      console.error('Failed to save preferences:', error);
    }
  };

  // Save theme preference to database
  const handleThemeChange = async (theme: 'light' | 'dark' | 'system') => {
    // Update next-themes immediately for instant UI feedback
    setTheme(theme);

    try {
      await updatePreferences.mutateAsync({ theme });
      // Invalidate the user query to refetch updated data
      await utils.user.current.invalidate();
      toast.success('Theme saved');
    } catch (error) {
      // Revert on error
      if (user?.theme) {
        setTheme(user.theme);
      }
      toast.error('Failed to save theme');
      console.error('Failed to save theme:', error);
    }
  };

  if (isLoading || !mounted) {
    return (
      <div className="space-y-4">
        <div className="bg-card border border-border rounded-2xl p-6">
          <p className="text-muted-foreground">Loading preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Appearance</h2>
          <p className="text-sm text-muted-foreground">
            Customize how the app looks
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Theme</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                className="flex flex-col items-center gap-2 h-auto py-4"
                onClick={() => handleThemeChange('light')}
                variant={theme === 'light' ? 'default' : 'outline'}
              >
                <Sun className="h-5 w-5" />
                <span className="text-sm">Light</span>
              </Button>
              <Button
                className="flex flex-col items-center gap-2 h-auto py-4"
                onClick={() => handleThemeChange('dark')}
                variant={theme === 'dark' ? 'default' : 'outline'}
              >
                <Moon className="h-5 w-5" />
                <span className="text-sm">Dark</span>
              </Button>
              <Button
                className="flex flex-col items-center gap-2 h-auto py-4"
                onClick={() => handleThemeChange('system')}
                variant={theme === 'system' ? 'default' : 'outline'}
              >
                <Shield className="h-5 w-5" />
                <span className="text-sm">System</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Units & Formats</h2>
          <p className="text-sm text-muted-foreground">
            Choose your preferred units
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Measurement System</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() =>
                  handlePreferenceChange('measurementUnit', 'imperial')
                }
                variant={
                  preferences.measurementUnit === 'imperial'
                    ? 'default'
                    : 'outline'
                }
              >
                Imperial (lb, oz)
              </Button>
              <Button
                onClick={() =>
                  handlePreferenceChange('measurementUnit', 'metric')
                }
                variant={
                  preferences.measurementUnit === 'metric'
                    ? 'default'
                    : 'outline'
                }
              >
                Metric (kg, g)
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Temperature Unit</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() =>
                  handlePreferenceChange('temperatureUnit', 'fahrenheit')
                }
                variant={
                  preferences.temperatureUnit === 'fahrenheit'
                    ? 'default'
                    : 'outline'
                }
              >
                Fahrenheit (°F)
              </Button>
              <Button
                onClick={() =>
                  handlePreferenceChange('temperatureUnit', 'celsius')
                }
                variant={
                  preferences.temperatureUnit === 'celsius'
                    ? 'default'
                    : 'outline'
                }
              >
                Celsius (°C)
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Time Format</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => handlePreferenceChange('timeFormat', '12h')}
                variant={
                  preferences.timeFormat === '12h' ? 'default' : 'outline'
                }
              >
                12-hour
              </Button>
              <Button
                onClick={() => handlePreferenceChange('timeFormat', '24h')}
                variant={
                  preferences.timeFormat === '24h' ? 'default' : 'outline'
                }
              >
                24-hour
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Log Settings */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Log Settings
          </h2>
          <p className="text-sm text-muted-foreground">
            Customize smart defaults for quick logging activities
          </p>
        </div>

        {/* Master Toggle */}
        <div className="flex items-center justify-between py-2 border-b">
          <div>
            <div className="flex items-center gap-1.5">
              <Label>Enable Quick Log</Label>
              <Button
                className="size-4 p-0"
                onClick={() => setOpenInfoDialog('enable')}
                type="button"
                variant="ghost"
              >
                <Info className="size-3.5 text-muted-foreground hover:text-foreground transition-colors" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Show quick log button on prediction cards
            </p>
          </div>
          <Switch
            checked={preferences.quickLogEnabled}
            onCheckedChange={(checked) =>
              handlePreferenceChange('quickLogEnabled', checked)
            }
          />
        </div>

        {/* Feeding Settings */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 font-medium">
            <Droplets className="h-4 w-4" />
            <span>Feeding</span>
            <Button
              className="size-4 p-0"
              onClick={() => setOpenInfoDialog('feeding')}
              type="button"
              variant="ghost"
            >
              <Info className="size-3.5 text-muted-foreground hover:text-foreground transition-colors" />
            </Button>
          </div>
          <div className="space-y-2 pl-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Label className="font-normal">Use last amount</Label>
                <Button
                  className="size-4 p-0"
                  onClick={() => setOpenInfoDialog('feedingAmount')}
                  type="button"
                  variant="ghost"
                >
                  <Info className="size-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                </Button>
              </div>
              <Switch
                checked={preferences.quickLogFeedingUseLastAmount}
                disabled={!preferences.quickLogEnabled}
                onCheckedChange={(checked) =>
                  handlePreferenceChange(
                    'quickLogFeedingUseLastAmount',
                    checked,
                  )
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Label className="font-normal">Use typical duration</Label>
                <Button
                  className="size-4 p-0"
                  onClick={() => setOpenInfoDialog('feedingDuration')}
                  type="button"
                  variant="ghost"
                >
                  <Info className="size-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                </Button>
              </div>
              <Switch
                checked={preferences.quickLogFeedingUseTypicalDuration}
                disabled={!preferences.quickLogEnabled}
                onCheckedChange={(checked) =>
                  handlePreferenceChange(
                    'quickLogFeedingUseTypicalDuration',
                    checked,
                  )
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Label className="font-normal">
                  Use last type (bottle/nursing)
                </Label>
                <Button
                  className="size-4 p-0"
                  onClick={() => setOpenInfoDialog('feedingType')}
                  type="button"
                  variant="ghost"
                >
                  <Info className="size-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                </Button>
              </div>
              <Switch
                checked={preferences.quickLogFeedingUseLastType}
                disabled={!preferences.quickLogEnabled}
                onCheckedChange={(checked) =>
                  handlePreferenceChange('quickLogFeedingUseLastType', checked)
                }
              />
            </div>
          </div>
        </div>

        {/* Sleep Settings */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 font-medium">
            <Moon className="h-4 w-4" />
            <span>Sleep</span>
            <Button
              className="size-4 p-0"
              onClick={() => setOpenInfoDialog('sleep')}
              type="button"
              variant="ghost"
            >
              <Info className="size-3.5 text-muted-foreground hover:text-foreground transition-colors" />
            </Button>
          </div>
          <div className="space-y-2 pl-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Label className="font-normal">Use suggested duration</Label>
                <Button
                  className="size-4 p-0"
                  onClick={() => setOpenInfoDialog('sleepDuration')}
                  type="button"
                  variant="ghost"
                >
                  <Info className="size-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                </Button>
              </div>
              <Switch
                checked={preferences.quickLogSleepUseSuggestedDuration}
                disabled={!preferences.quickLogEnabled}
                onCheckedChange={(checked) =>
                  handlePreferenceChange(
                    'quickLogSleepUseSuggestedDuration',
                    checked,
                  )
                }
              />
            </div>
          </div>
        </div>

        {/* Diaper Settings */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 font-medium">
            <Baby className="h-4 w-4" />
            <span>Diaper</span>
            <Button
              className="size-4 p-0"
              onClick={() => setOpenInfoDialog('diaper')}
              type="button"
              variant="ghost"
            >
              <Info className="size-3.5 text-muted-foreground hover:text-foreground transition-colors" />
            </Button>
          </div>
          <div className="space-y-2 pl-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Label className="font-normal">Use predicted type</Label>
                <Button
                  className="size-4 p-0"
                  onClick={() => setOpenInfoDialog('diaperType')}
                  type="button"
                  variant="ghost"
                >
                  <Info className="size-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                </Button>
              </div>
              <Switch
                checked={preferences.quickLogDiaperUsePredictedType}
                disabled={!preferences.quickLogEnabled}
                onCheckedChange={(checked) =>
                  handlePreferenceChange(
                    'quickLogDiaperUsePredictedType',
                    checked,
                  )
                }
              />
            </div>
          </div>
        </div>

        {/* Pumping Settings */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 font-medium">
            <Droplets className="h-4 w-4" />
            <span>Pumping</span>
            <Button
              className="size-4 p-0"
              onClick={() => setOpenInfoDialog('pumping')}
              type="button"
              variant="ghost"
            >
              <Info className="size-3.5 text-muted-foreground hover:text-foreground transition-colors" />
            </Button>
          </div>
          <div className="space-y-2 pl-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Label className="font-normal">Use last volume</Label>
                <Button
                  className="size-4 p-0"
                  onClick={() => setOpenInfoDialog('pumpingVolume')}
                  type="button"
                  variant="ghost"
                >
                  <Info className="size-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                </Button>
              </div>
              <Switch
                checked={preferences.quickLogPumpingUseLastVolume}
                disabled={!preferences.quickLogEnabled}
                onCheckedChange={(checked) =>
                  handlePreferenceChange(
                    'quickLogPumpingUseLastVolume',
                    checked,
                  )
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Label className="font-normal">Use typical duration</Label>
                <Button
                  className="size-4 p-0"
                  onClick={() => setOpenInfoDialog('pumpingDuration')}
                  type="button"
                  variant="ghost"
                >
                  <Info className="size-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                </Button>
              </div>
              <Switch
                checked={preferences.quickLogPumpingUseTypicalDuration}
                disabled={!preferences.quickLogEnabled}
                onCheckedChange={(checked) =>
                  handlePreferenceChange(
                    'quickLogPumpingUseTypicalDuration',
                    checked,
                  )
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* Info Drawer */}
      {openInfoDialog && (
        <QuickLogInfoDrawer
          bgColor={quickLogInfoContent[openInfoDialog].bgColor}
          borderColor={quickLogInfoContent[openInfoDialog].borderColor}
          color={quickLogInfoContent[openInfoDialog].color}
          educationalContent={
            quickLogInfoContent[openInfoDialog].educationalContent
          }
          icon={quickLogInfoContent[openInfoDialog].icon}
          onOpenChange={(open) => !open && setOpenInfoDialog(null)}
          open={!!openInfoDialog}
          tips={quickLogInfoContent[openInfoDialog].tips}
          title={quickLogInfoContent[openInfoDialog].title}
        />
      )}
    </div>
  );
}
