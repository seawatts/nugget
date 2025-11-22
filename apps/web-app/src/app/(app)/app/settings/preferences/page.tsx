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
import { differenceInDays } from 'date-fns';
import {
  Baby,
  Clock,
  Droplets,
  Info,
  LayoutDashboard,
  Moon,
  Shield,
  Sun,
  User as UserIcon,
  Utensils,
  Zap,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { predictNextDiaper } from '../../_components/activities/diaper/prediction';
import { predictNextFeeding } from '../../_components/activities/feeding/prediction';
import { predictNextPumping } from '../../_components/activities/pumping/prediction';
import { predictNextSleep } from '../../_components/activities/sleep/prediction';
import { AlarmSettings } from './_components/alarm-settings';
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
  | 'predictiveTimes'
  | 'activityGoals'
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
  activityGoals: {
    bgColor: 'bg-primary/5',
    borderColor: 'border-primary/20',
    color: 'bg-primary/10 text-primary',
    educationalContent:
      "Activity goal displays show daily progress trackers on prediction cards, like '4/7 feedings today' or '6/8 diaper changes'. These help you track whether you're meeting age-appropriate daily targets. When disabled, cards show a cleaner, simpler view focused just on the most recent activity.",
    icon: Clock,
    tips: [
      'Hides daily progress indicators like "4/7 feedings"',
      'Shows cleaner, more minimal card design',
      'All tracking data is still recorded',
      'Useful if you prefer less visual information',
    ],
    title: 'Show Activity Goals',
  },
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
    title: 'Auto-fill predicted type',
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
    title: 'Auto-fill from last feeding',
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
    title: 'Auto-fill average duration',
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
    title: 'Auto-fill feeding method',
  },
  predictiveTimes: {
    bgColor: 'bg-primary/5',
    borderColor: 'border-primary/20',
    color: 'bg-primary/10 text-primary',
    educationalContent:
      "Predictive times show when your baby's next activity is expected based on recent patterns and age-appropriate intervals. When enabled, cards display 'Next in 2h 30m • 3:45 PM' and highlight overdue activities. When disabled, cards only show the last activity time, giving you a cleaner view without predictions or overdue warnings.",
    icon: Clock,
    tips: [
      'Hides prediction times and overdue warnings',
      'Still shows last activity information',
      'Quick log buttons remain available',
      'Useful if you prefer tracking without time pressure',
    ],
    title: 'Show Predictive Times',
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
    title: 'Auto-fill average duration',
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
    title: 'Auto-fill from last session',
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
    title: 'Auto-fill age-based duration',
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
  const { data: babies } = api.babies.list.useQuery();
  const { data: familyMembers } = api.familyMembers.all.useQuery();
  const updatePreferences = api.user.updatePreferences.useMutation();
  const updateHomeScreenPreference =
    api.user.updateHomeScreenPreference.useMutation();
  const updateDashboardPreferences =
    api.babies.updateDashboardPreferences.useMutation();
  const utils = api.useUtils();

  // Dashboard preferences state
  const [selectedBabyId, setSelectedBabyId] = useState<string | null>(null);
  const { data: selectedBaby, isLoading: selectedBabyLoading } =
    api.babies.getByIdLight.useQuery(
      { id: selectedBabyId ?? '' },
      { enabled: !!selectedBabyId },
    );

  // Get the current baby (first baby or from home screen preference)
  const currentBabyId = babies?.[0]?.id;

  // Fetch prediction data for showing stats in info dialogs
  const { data: feedingData } = api.activities.getUpcomingFeeding.useQuery(
    { babyId: currentBabyId ?? '' },
    {
      enabled:
        Boolean(currentBabyId) &&
        (openInfoDialog === 'feeding' ||
          openInfoDialog === 'feedingAmount' ||
          openInfoDialog === 'feedingDuration' ||
          openInfoDialog === 'feedingType'),
    },
  );

  const { data: diaperData } = api.activities.getUpcomingDiaper.useQuery(
    { babyId: currentBabyId ?? '' },
    {
      enabled:
        Boolean(currentBabyId) &&
        (openInfoDialog === 'diaper' || openInfoDialog === 'diaperType'),
    },
  );

  const { data: sleepData } = api.activities.getUpcomingSleep.useQuery(
    { babyId: currentBabyId ?? '' },
    {
      enabled:
        Boolean(currentBabyId) &&
        (openInfoDialog === 'sleep' || openInfoDialog === 'sleepDuration'),
    },
  );

  const { data: pumpingData } = api.activities.getUpcomingPumping.useQuery(
    { babyId: currentBabyId ?? '' },
    {
      enabled:
        Boolean(currentBabyId) &&
        (openInfoDialog === 'pumping' ||
          openInfoDialog === 'pumpingVolume' ||
          openInfoDialog === 'pumpingDuration'),
    },
  );

  // Calculate predictions from API data (predictions are computed client-side)
  const feedingPrediction = useMemo(() => {
    if (!feedingData) return null;
    return predictNextFeeding(
      feedingData.recentActivities,
      feedingData.babyBirthDate,
      feedingData.feedIntervalHours,
    );
  }, [feedingData]);

  const diaperPrediction = useMemo(() => {
    if (!diaperData) return null;
    return predictNextDiaper(
      diaperData.recentActivities,
      diaperData.babyBirthDate,
    );
  }, [diaperData]);

  const sleepPrediction = useMemo(() => {
    if (!sleepData) return null;
    return predictNextSleep(
      sleepData.recentActivities,
      sleepData.babyBirthDate,
    );
  }, [sleepData]);

  const pumpingPrediction = useMemo(() => {
    if (!pumpingData) return null;
    return predictNextPumping(
      pumpingData.recentActivities,
      pumpingData.babyBirthDate,
    );
  }, [pumpingData]);

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
    showActivityGoals: true,
    showPredictiveTimes: true,
    temperatureUnit: 'fahrenheit' as 'fahrenheit' | 'celsius',
    timeFormat: '12h' as '12h' | '24h',
  });

  const [homeScreenPreference, setHomeScreenPreference] = useState<{
    type: 'baby' | 'user';
    id: string;
  }>({
    id: '',
    type: 'baby',
  });

  const [dashboardPreferences, setDashboardPreferences] = useState({
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

  // Load dashboard preferences from baby data
  useEffect(() => {
    if (selectedBaby) {
      setDashboardPreferences({
        showActivityTimeline: selectedBaby.showActivityTimeline ?? true,
        showDiaperCard: selectedBaby.showDiaperCard ?? true,
        showDoctorVisitCard: selectedBaby.showDoctorVisitCard ?? true,
        showFeedingCard: selectedBaby.showFeedingCard ?? true,
        showPumpingCard: selectedBaby.showPumpingCard ?? true,
        showSleepCard: selectedBaby.showSleepCard ?? true,
      });
    }
  }, [selectedBaby]);

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
        showActivityGoals: user.showActivityGoals ?? true,
        showPredictiveTimes: user.showPredictiveTimes ?? true,
        temperatureUnit: user.temperatureUnit || 'fahrenheit',
        timeFormat: user.timeFormat || '12h',
      });
      // Sync theme from database with next-themes
      if (user.theme && user.theme !== theme) {
        setTheme(user.theme);
      }
      // Load home screen preference
      if (user.defaultHomeScreenType && user.defaultHomeScreenId) {
        setHomeScreenPreference({
          id: user.defaultHomeScreenId,
          type: user.defaultHomeScreenType as 'baby' | 'user',
        });
      } else if (babies && babies.length > 0) {
        // Default to first baby if no preference set
        setHomeScreenPreference({
          id: babies[0]?.id ?? '',
          type: 'baby',
        });
      }
    }
  }, [user, theme, setTheme, babies]);

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
      | 'quickLogPumpingUseTypicalDuration'
      | 'showActivityGoals'
      | 'showPredictiveTimes',
    value: string | boolean,
  ) => {
    // Optimistic update
    setPreferences((prev) => ({ ...prev, [key]: value }));

    try {
      await updatePreferences.mutateAsync({ [key]: value });
      // Invalidate the user query to refetch updated data
      await utils.user.current.invalidate();
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
          showActivityGoals: user.showActivityGoals ?? true,
          showPredictiveTimes: user.showPredictiveTimes ?? true,
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
    } catch (error) {
      // Revert on error
      if (user?.theme) {
        setTheme(user.theme);
      }
      toast.error('Failed to save theme');
      console.error('Failed to save theme:', error);
    }
  };

  // Save home screen preference to database
  const handleHomeScreenChange = async (type: 'baby' | 'user', id: string) => {
    // Optimistic update
    const previousPreference = { ...homeScreenPreference };
    setHomeScreenPreference({ id, type });

    try {
      await updateHomeScreenPreference.mutateAsync({
        defaultHomeScreenId: id,
        defaultHomeScreenType: type,
      });
      // Invalidate the user query to refetch updated data
      await utils.user.current.invalidate();
    } catch (error) {
      // Revert on error
      setHomeScreenPreference(previousPreference);
      toast.error('Failed to save home screen preference');
      console.error('Failed to save home screen preference:', error);
    }
  };

  // Save dashboard preference to database
  const handleDashboardPreferenceChange = async (
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
    setDashboardPreferences((prev) => ({ ...prev, [key]: value }));

    try {
      await updateDashboardPreferences.mutateAsync({
        id: selectedBabyId,
        [key]: value,
      });

      // Invalidate queries to refetch updated data
      await utils.babies.getByIdLight.invalidate({ id: selectedBabyId });
      await utils.babies.list.invalidate();

      toast.success('Dashboard preferences saved');
    } catch (error) {
      // Revert on error
      if (selectedBaby) {
        setDashboardPreferences({
          showActivityTimeline: selectedBaby.showActivityTimeline ?? true,
          showDiaperCard: selectedBaby.showDiaperCard ?? true,
          showDoctorVisitCard: selectedBaby.showDoctorVisitCard ?? true,
          showFeedingCard: selectedBaby.showFeedingCard ?? true,
          showPumpingCard: selectedBaby.showPumpingCard ?? true,
          showSleepCard: selectedBaby.showSleepCard ?? true,
        });
      }
      toast.error('Failed to save dashboard preferences');
      console.error('Failed to save dashboard preferences:', error);
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
          <h2 className="text-xl font-semibold">Default Home Screen</h2>
          <p className="text-sm text-muted-foreground">
            Choose which page to show when you open the app
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Home Screen Type</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                className="flex flex-col items-center gap-2 h-auto py-4"
                onClick={() => {
                  const firstBaby = babies?.[0];
                  if (firstBaby) {
                    handleHomeScreenChange('baby', firstBaby.id);
                  }
                }}
                variant={
                  homeScreenPreference.type === 'baby' ? 'default' : 'outline'
                }
              >
                <Baby className="h-5 w-5" />
                <span className="text-sm">Baby Dashboard</span>
              </Button>
              <Button
                className="flex flex-col items-center gap-2 h-auto py-4"
                onClick={() => {
                  const currentUser = familyMembers?.find(
                    (m) => m.userId === user?.id,
                  );
                  if (currentUser?.userId) {
                    handleHomeScreenChange('user', currentUser.userId);
                  }
                }}
                variant={
                  homeScreenPreference.type === 'user' ? 'default' : 'outline'
                }
              >
                <UserIcon className="h-5 w-5" />
                <span className="text-sm">User Dashboard</span>
              </Button>
            </div>
          </div>

          {homeScreenPreference.type === 'baby' &&
            babies &&
            babies.length > 0 && (
              <div className="space-y-2">
                <Label>Select Baby</Label>
                <Select
                  onValueChange={(value) =>
                    handleHomeScreenChange('baby', value)
                  }
                  value={homeScreenPreference.id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a baby" />
                  </SelectTrigger>
                  <SelectContent>
                    {babies.map((baby) => (
                      <SelectItem key={baby.id} value={baby.id}>
                        {baby.firstName} {baby.lastName || ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

          {homeScreenPreference.type === 'user' && familyMembers && (
            <div className="space-y-2">
              <Label>Select User</Label>
              <Select
                onValueChange={(value) => handleHomeScreenChange('user', value)}
                value={homeScreenPreference.id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {familyMembers.map((member) => (
                    <SelectItem key={member.userId} value={member.userId}>
                      {member.user?.firstName} {member.user?.lastName || ''}{' '}
                      {member.userId === user?.id ? '(You)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
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
      <div className="bg-card border border-border rounded-2xl p-4 md:p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Log Settings
            <Button
              className="size-4 p-0"
              onClick={() => setOpenInfoDialog('enable')}
              type="button"
              variant="ghost"
            >
              <Info className="size-3.5 text-muted-foreground hover:text-foreground transition-colors" />
            </Button>
          </h2>
          <p className="text-sm text-muted-foreground">
            Customize smart defaults for quick logging activities
          </p>
        </div>

        {/* Master Toggle */}
        <SettingToggle
          checked={preferences.quickLogEnabled}
          description="Show quick log button on prediction cards"
          label="Enable Quick Log"
          onCheckedChange={(checked) =>
            handlePreferenceChange('quickLogEnabled', checked)
          }
        />

        {/* Predictive Times Toggle */}
        <SettingToggle
          checked={preferences.showPredictiveTimes}
          description="Show predicted times and overdue warnings on activity cards"
          label="Show predictive times"
          labelAction={
            <Button
              className="size-4 p-0"
              onClick={(e) => {
                e.stopPropagation();
                setOpenInfoDialog('predictiveTimes');
              }}
              type="button"
              variant="ghost"
            >
              <Info className="size-3.5 text-muted-foreground hover:text-foreground transition-colors" />
            </Button>
          }
          onCheckedChange={(checked) =>
            handlePreferenceChange('showPredictiveTimes', checked)
          }
        />

        {/* Activity Goals Toggle */}
        <SettingToggle
          checked={preferences.showActivityGoals}
          description="Show daily progress indicators like '4/7 feedings today'"
          label="Show activity goals"
          labelAction={
            <Button
              className="size-4 p-0"
              onClick={(e) => {
                e.stopPropagation();
                setOpenInfoDialog('activityGoals');
              }}
              type="button"
              variant="ghost"
            >
              <Info className="size-3.5 text-muted-foreground hover:text-foreground transition-colors" />
            </Button>
          }
          onCheckedChange={(checked) =>
            handlePreferenceChange('showActivityGoals', checked)
          }
        />

        {/* Feeding Settings */}
        <div className="space-y-2 pt-2">
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
          <div className="space-y-1.5 pl-4">
            <SettingToggle
              checked={preferences.quickLogFeedingUseLastAmount}
              className="py-2"
              disabled={!preferences.quickLogEnabled}
              label="Auto-fill from last feeding"
              labelAction={
                <Button
                  className="size-4 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenInfoDialog('feedingAmount');
                  }}
                  type="button"
                  variant="ghost"
                >
                  <Info className="size-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                </Button>
              }
              labelClassName="font-normal"
              onCheckedChange={(checked) =>
                handlePreferenceChange('quickLogFeedingUseLastAmount', checked)
              }
            />
            <SettingToggle
              checked={preferences.quickLogFeedingUseTypicalDuration}
              className="py-2"
              disabled={!preferences.quickLogEnabled}
              label="Auto-fill average duration"
              labelAction={
                <Button
                  className="size-4 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenInfoDialog('feedingDuration');
                  }}
                  type="button"
                  variant="ghost"
                >
                  <Info className="size-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                </Button>
              }
              labelClassName="font-normal"
              onCheckedChange={(checked) =>
                handlePreferenceChange(
                  'quickLogFeedingUseTypicalDuration',
                  checked,
                )
              }
            />
            <SettingToggle
              checked={preferences.quickLogFeedingUseLastType}
              className="py-2"
              disabled={!preferences.quickLogEnabled}
              label="Auto-fill feeding method"
              labelAction={
                <Button
                  className="size-4 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenInfoDialog('feedingType');
                  }}
                  type="button"
                  variant="ghost"
                >
                  <Info className="size-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                </Button>
              }
              labelClassName="font-normal"
              onCheckedChange={(checked) =>
                handlePreferenceChange('quickLogFeedingUseLastType', checked)
              }
            />
          </div>
        </div>

        {/* Sleep Settings */}
        <div className="space-y-2 pt-2">
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
          <div className="space-y-1.5 pl-4">
            <SettingToggle
              checked={preferences.quickLogSleepUseSuggestedDuration}
              className="py-2"
              disabled={!preferences.quickLogEnabled}
              label="Auto-fill age-based duration"
              labelAction={
                <Button
                  className="size-4 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenInfoDialog('sleepDuration');
                  }}
                  type="button"
                  variant="ghost"
                >
                  <Info className="size-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                </Button>
              }
              labelClassName="font-normal"
              onCheckedChange={(checked) =>
                handlePreferenceChange(
                  'quickLogSleepUseSuggestedDuration',
                  checked,
                )
              }
            />
          </div>
        </div>

        {/* Diaper Settings */}
        <div className="space-y-2 pt-2">
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
          <div className="space-y-1.5 pl-4">
            <SettingToggle
              checked={preferences.quickLogDiaperUsePredictedType}
              className="py-2"
              disabled={!preferences.quickLogEnabled}
              label="Auto-fill predicted type"
              labelAction={
                <Button
                  className="size-4 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenInfoDialog('diaperType');
                  }}
                  type="button"
                  variant="ghost"
                >
                  <Info className="size-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                </Button>
              }
              labelClassName="font-normal"
              onCheckedChange={(checked) =>
                handlePreferenceChange(
                  'quickLogDiaperUsePredictedType',
                  checked,
                )
              }
            />
          </div>
        </div>

        {/* Pumping Settings */}
        <div className="space-y-2 pt-2">
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
          <div className="space-y-1.5 pl-4">
            <SettingToggle
              checked={preferences.quickLogPumpingUseLastVolume}
              className="py-2"
              disabled={!preferences.quickLogEnabled}
              label="Auto-fill from last session"
              labelAction={
                <Button
                  className="size-4 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenInfoDialog('pumpingVolume');
                  }}
                  type="button"
                  variant="ghost"
                >
                  <Info className="size-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                </Button>
              }
              labelClassName="font-normal"
              onCheckedChange={(checked) =>
                handlePreferenceChange('quickLogPumpingUseLastVolume', checked)
              }
            />
            <SettingToggle
              checked={preferences.quickLogPumpingUseTypicalDuration}
              className="py-2"
              disabled={!preferences.quickLogEnabled}
              label="Auto-fill average duration"
              labelAction={
                <Button
                  className="size-4 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenInfoDialog('pumpingDuration');
                  }}
                  type="button"
                  variant="ghost"
                >
                  <Info className="size-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                </Button>
              }
              labelClassName="font-normal"
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

      {/* Dashboard Customization */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5" />
            Dashboard Customization
          </h2>
          <p className="text-sm text-muted-foreground">
            Customize which cards appear on the home screen for each baby
          </p>
        </div>

        {/* Baby Selector */}
        {babies && babies.length > 0 ? (
          <>
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

            {selectedBabyLoading ? (
              <div className="text-sm text-muted-foreground">
                Loading preferences...
              </div>
            ) : (
              <>
                {/* Activity Cards Section */}
                <div className="space-y-3 pt-2">
                  <div>
                    <h3 className="text-base font-semibold">Activity Cards</h3>
                    <p className="text-sm text-muted-foreground">
                      Choose which activity cards to show on the home screen
                    </p>
                  </div>

                  <div className="space-y-3">
                    <SettingToggle
                      checked={dashboardPreferences.showFeedingCard}
                      description="Display feeding predictions and quick log"
                      label="Show Feeding"
                      onCheckedChange={(checked) =>
                        handleDashboardPreferenceChange(
                          'showFeedingCard',
                          checked,
                        )
                      }
                    />

                    <SettingToggle
                      checked={dashboardPreferences.showSleepCard}
                      description="Display sleep predictions and quick log"
                      label="Show Sleep"
                      onCheckedChange={(checked) =>
                        handleDashboardPreferenceChange(
                          'showSleepCard',
                          checked,
                        )
                      }
                    />

                    <SettingToggle
                      checked={dashboardPreferences.showDiaperCard}
                      description="Display diaper predictions and quick log"
                      label="Show Diaper"
                      onCheckedChange={(checked) =>
                        handleDashboardPreferenceChange(
                          'showDiaperCard',
                          checked,
                        )
                      }
                    />

                    <SettingToggle
                      checked={dashboardPreferences.showPumpingCard}
                      description="Display pumping predictions and quick log"
                      label="Show Pumping"
                      onCheckedChange={(checked) =>
                        handleDashboardPreferenceChange(
                          'showPumpingCard',
                          checked,
                        )
                      }
                    />

                    <SettingToggle
                      checked={dashboardPreferences.showDoctorVisitCard}
                      description="Display doctor visit reminders and quick log"
                      label="Show Doctor Visit"
                      onCheckedChange={(checked) =>
                        handleDashboardPreferenceChange(
                          'showDoctorVisitCard',
                          checked,
                        )
                      }
                    />
                  </div>
                </div>

                {/* Timeline Section */}
                <div className="space-y-3 pt-2">
                  <div>
                    <h3 className="text-base font-semibold">Timeline</h3>
                    <p className="text-sm text-muted-foreground">
                      Control activity timeline visibility
                    </p>
                  </div>

                  <SettingToggle
                    checked={dashboardPreferences.showActivityTimeline}
                    description="Display the full activity history timeline"
                    label="Show Activity Timeline"
                    onCheckedChange={(checked) =>
                      handleDashboardPreferenceChange(
                        'showActivityTimeline',
                        checked,
                      )
                    }
                  />
                </div>
              </>
            )}
          </>
        ) : (
          <div className="text-sm text-muted-foreground">
            No babies found. Add a baby first to customize dashboard
            preferences.
          </div>
        )}
      </div>

      {/* Alarm Settings */}
      {user && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <AlarmSettings
            babyAgeDays={
              babies?.[0]?.birthDate
                ? differenceInDays(new Date(), babies[0].birthDate)
                : null
            }
            initialSettings={{
              alarmDiaperEnabled: user.alarmDiaperEnabled ?? false,
              alarmDiaperThreshold: user.alarmDiaperThreshold ?? null,
              alarmFeedingEnabled: user.alarmFeedingEnabled ?? false,
              alarmFeedingThreshold: user.alarmFeedingThreshold ?? null,
              alarmPumpingEnabled: user.alarmPumpingEnabled ?? false,
              alarmPumpingThreshold: user.alarmPumpingThreshold ?? null,
              alarmSleepEnabled: user.alarmSleepEnabled ?? false,
              alarmSleepThreshold: user.alarmSleepThreshold ?? null,
            }}
          />
        </div>
      )}

      {/* Info Drawer */}
      {openInfoDialog && (
        <QuickLogInfoDrawer
          activityName={
            openInfoDialog === 'feeding' ||
            openInfoDialog === 'feedingAmount' ||
            openInfoDialog === 'feedingDuration' ||
            openInfoDialog === 'feedingType'
              ? 'feeding'
              : openInfoDialog === 'diaper' || openInfoDialog === 'diaperType'
                ? 'diaper'
                : openInfoDialog === 'sleep' ||
                    openInfoDialog === 'sleepDuration'
                  ? 'sleep'
                  : openInfoDialog === 'pumping' ||
                      openInfoDialog === 'pumpingVolume' ||
                      openInfoDialog === 'pumpingDuration'
                    ? 'pumping session'
                    : undefined
          }
          bgColor={quickLogInfoContent[openInfoDialog].bgColor}
          borderColor={quickLogInfoContent[openInfoDialog].borderColor}
          calculationDetails={
            openInfoDialog === 'feeding' ||
            openInfoDialog === 'feedingAmount' ||
            openInfoDialog === 'feedingDuration' ||
            openInfoDialog === 'feedingType'
              ? feedingPrediction?.calculationDetails
              : openInfoDialog === 'diaper' || openInfoDialog === 'diaperType'
                ? diaperPrediction?.calculationDetails
                : openInfoDialog === 'sleep' ||
                    openInfoDialog === 'sleepDuration'
                  ? sleepPrediction?.calculationDetails
                  : openInfoDialog === 'pumping' ||
                      openInfoDialog === 'pumpingVolume' ||
                      openInfoDialog === 'pumpingDuration'
                    ? pumpingPrediction?.calculationDetails
                    : null
          }
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
