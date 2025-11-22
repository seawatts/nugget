'use client';

import { Button } from '@nugget/ui/button';
import { Card } from '@nugget/ui/card';
import { Icons } from '@nugget/ui/custom/icons';
import { H3, P } from '@nugget/ui/custom/typography';
import { Input } from '@nugget/ui/input';
import { Label } from '@nugget/ui/label';
import { Switch } from '@nugget/ui/switch';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { ActivityType } from '~/app/(app)/app/_components/shared/overdue-thresholds';
import { getOverdueThreshold } from '~/app/(app)/app/_components/shared/overdue-thresholds';
import { updateAlarmPreferencesAction } from '../actions';

interface AlarmSettingsProps {
  initialSettings: {
    alarmFeedingEnabled: boolean;
    alarmSleepEnabled: boolean;
    alarmDiaperEnabled: boolean;
    alarmPumpingEnabled: boolean;
    alarmFeedingThreshold: number | null;
    alarmSleepThreshold: number | null;
    alarmDiaperThreshold: number | null;
    alarmPumpingThreshold: number | null;
  };
  babyAgeDays: number | null;
}

interface ActivityConfig {
  key: ActivityType;
  label: string;
  icon: keyof typeof Icons;
  description: string;
  enabledKey:
    | 'alarmFeedingEnabled'
    | 'alarmSleepEnabled'
    | 'alarmDiaperEnabled'
    | 'alarmPumpingEnabled';
  thresholdKey:
    | 'alarmFeedingThreshold'
    | 'alarmSleepThreshold'
    | 'alarmDiaperThreshold'
    | 'alarmPumpingThreshold';
}

const activityConfigs: ActivityConfig[] = [
  {
    description: 'Get notified when feeding is overdue',
    enabledKey: 'alarmFeedingEnabled',
    icon: 'Baby',
    key: 'feeding',
    label: 'Feeding',
    thresholdKey: 'alarmFeedingThreshold',
  },
  {
    description: 'Get notified when sleep time is overdue',
    enabledKey: 'alarmSleepEnabled',
    icon: 'Moon',
    key: 'sleep',
    label: 'Sleep',
    thresholdKey: 'alarmSleepThreshold',
  },
  {
    description: 'Get notified when diaper change is overdue',
    enabledKey: 'alarmDiaperEnabled',
    icon: 'Baby',
    key: 'diaper',
    label: 'Diaper',
    thresholdKey: 'alarmDiaperThreshold',
  },
  {
    description: 'Get notified when pumping session is overdue',
    enabledKey: 'alarmPumpingEnabled',
    icon: 'Heart',
    key: 'pumping',
    label: 'Pumping',
    thresholdKey: 'alarmPumpingThreshold',
  },
];

export function AlarmSettings({
  initialSettings,
  babyAgeDays,
}: AlarmSettingsProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>('default');
  const [supportsPeriodicSync, setSupportsPeriodicSync] = useState(false);

  useEffect(() => {
    // Check notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    // Check for Periodic Background Sync support
    if (
      'serviceWorker' in navigator &&
      'periodicSync' in ServiceWorkerRegistration.prototype
    ) {
      setSupportsPeriodicSync(true);
    }
  }, []);

  const handleToggle = async (key: keyof typeof settings) => {
    const newValue = !settings[key];
    setSettings({ ...settings, [key]: newValue });

    try {
      await updateAlarmPreferencesAction({ [key]: newValue });
      toast.success('Alarm preference updated');
    } catch (_error) {
      toast.error('Failed to update alarm preference');
      // Revert on error
      setSettings({ ...settings, [key]: !newValue });
    }
  };

  const handleThresholdChange = async (
    key: keyof typeof settings,
    value: string,
  ) => {
    const numValue = value === '' ? null : Number.parseInt(value, 10);

    if (numValue !== null && (Number.isNaN(numValue) || numValue <= 0)) {
      toast.error('Please enter a valid positive number');
      return;
    }

    setSettings({ ...settings, [key]: numValue });

    try {
      await updateAlarmPreferencesAction({ [key]: numValue });
      toast.success('Custom threshold updated');
    } catch (_error) {
      toast.error('Failed to update threshold');
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Notifications are not supported in this browser');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === 'granted') {
        toast.success('Notifications enabled!');

        // Register periodic sync if supported
        if ('serviceWorker' in navigator && supportsPeriodicSync) {
          const registration = await navigator.serviceWorker.ready;
          try {
            // @ts-expect-error - periodicSync is not in types yet
            await registration.periodicSync.register(
              'check-overdue-activities',
              {
                minInterval: 15 * 60 * 1000, // 15 minutes
              },
            );
            toast.success('Background sync registered');
          } catch (error) {
            console.error('Failed to register periodic sync:', error);
          }
        }
      } else {
        toast.error('Notification permission denied');
      }
    } catch (_error) {
      toast.error('Failed to request notification permission');
    }
  };

  const testNotification = async () => {
    if (notificationPermission !== 'granted') {
      toast.error('Please enable notifications first');
      return;
    }

    try {
      // Send a message to the service worker to check immediately
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        registration.active?.postMessage({ type: 'CHECK_OVERDUE_NOW' });
        toast.success('Checking for overdue activities...');
      }
    } catch (_error) {
      toast.error('Failed to trigger check');
    }
  };

  const getDefaultThreshold = (activityType: ActivityType): number => {
    return getOverdueThreshold(activityType, babyAgeDays);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <H3>Activity Alarms</H3>
        <P className="text-muted-foreground">
          Get notified when activities are overdue based on your baby's schedule
        </P>
      </div>

      {/* Notification Permission Card */}
      <Card className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Label className="text-base font-medium">
                Notification Permission
              </Label>
              <P className="text-muted-foreground text-sm">
                {notificationPermission === 'granted' &&
                  'Notifications are enabled ✓'}
                {notificationPermission === 'denied' &&
                  'Notifications are blocked. Please enable them in your browser settings.'}
                {notificationPermission === 'default' &&
                  'Click to enable notifications'}
              </P>
              {!supportsPeriodicSync && (
                <P className="text-warning text-sm mt-2">
                  ⚠️ Your browser doesn't support background sync. Notifications
                  will only work while the app is open or install the PWA.
                </P>
              )}
            </div>
            {notificationPermission !== 'granted' && (
              <Button onClick={requestNotificationPermission} size="sm">
                Enable
              </Button>
            )}
          </div>

          {notificationPermission === 'granted' && (
            <div className="flex gap-2">
              <Button onClick={testNotification} size="sm" variant="outline">
                <Icons.Bell size="sm" />
                Test Notification
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Activity Alarms */}
      {activityConfigs.map((config) => {
        const Icon = Icons[config.icon];
        const isEnabled = settings[config.enabledKey];
        const threshold = settings[config.thresholdKey];
        const defaultThreshold = getDefaultThreshold(config.key);

        return (
          <Card className="p-4" key={config.key}>
            <div className="flex flex-col gap-4">
              {/* Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon size="default" variant="primary" />
                  <div>
                    <Label className="text-base font-medium">
                      {config.label}
                    </Label>
                    <P className="text-muted-foreground text-sm">
                      {config.description}
                    </P>
                  </div>
                </div>
                <Switch
                  checked={isEnabled}
                  onCheckedChange={() => handleToggle(config.enabledKey)}
                />
              </div>

              {/* Custom Threshold */}
              {isEnabled && (
                <div className="flex flex-col gap-2 pl-11">
                  <Label
                    className="text-sm"
                    htmlFor={`threshold-${config.key}`}
                  >
                    Custom Threshold (minutes)
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      className="max-w-[200px]"
                      id={`threshold-${config.key}`}
                      min="1"
                      onChange={(e) =>
                        handleThresholdChange(
                          config.thresholdKey,
                          e.target.value,
                        )
                      }
                      placeholder={`Default: ${defaultThreshold} min`}
                      type="number"
                      value={threshold ?? ''}
                    />
                    <P className="text-muted-foreground text-sm">
                      (Default: {defaultThreshold} min)
                    </P>
                  </div>
                  <P className="text-muted-foreground text-xs">
                    Leave empty to use age-appropriate defaults
                  </P>
                </div>
              )}
            </div>
          </Card>
        );
      })}

      {/* Info Card */}
      <Card className="bg-muted/50 p-4">
        <div className="flex gap-3">
          <Icons.Info className="text-muted-foreground mt-0.5" size="sm" />
          <div className="flex-1">
            <P className="text-sm font-medium">How it works</P>
            <P className="text-muted-foreground text-xs mt-1">
              • Alarms check for overdue activities every 15-30 minutes
              <br />• Works best with an installed PWA (Add to Home Screen)
              <br />• Requires notification permission to be granted
              <br />• May not work in low battery mode on some devices
            </P>
          </div>
        </div>
      </Card>
    </div>
  );
}
