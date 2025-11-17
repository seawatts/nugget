'use client';

import { api } from '@nugget/api/react';
import { Button } from '@nugget/ui/button';
import { Label } from '@nugget/ui/label';
import { Moon, Shield, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function PreferencesSettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch for theme
  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: user, isLoading } = api.user.current.useQuery();
  const updatePreferences = api.user.updatePreferences.useMutation();
  const utils = api.useUtils();

  const [preferences, setPreferences] = useState({
    measurementUnit: 'imperial' as 'imperial' | 'metric',
    temperatureUnit: 'fahrenheit' as 'fahrenheit' | 'celsius',
    timeFormat: '12h' as '12h' | '24h',
  });

  // Load preferences from user data
  useEffect(() => {
    if (user) {
      setPreferences({
        measurementUnit: user.measurementUnit || 'imperial',
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
    key: 'measurementUnit' | 'temperatureUnit' | 'timeFormat',
    value: string,
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
    </div>
  );
}
