'use client';

import { Button } from '@nugget/ui/button';
import { Input } from '@nugget/ui/input';
import { Label } from '@nugget/ui/label';
import { Switch } from '@nugget/ui/switch';
import {
  Bell,
  ChevronRight,
  Moon,
  Phone,
  Shield,
  Sun,
  User,
  UserCircle,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

type Tab = 'profile' | 'notifications' | 'contacts' | 'account' | 'preferences';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch for theme
  useEffect(() => {
    setMounted(true);
  }, []);

  const tabs = [
    { icon: User, id: 'profile' as Tab, label: 'Profile' },
    { icon: Bell, id: 'notifications' as Tab, label: 'Notifications' },
    { icon: Phone, id: 'contacts' as Tab, label: 'Contacts' },
    { icon: UserCircle, id: 'account' as Tab, label: 'Account' },
    { icon: Shield, id: 'preferences' as Tab, label: 'Preferences' },
  ];

  return (
    <main className="px-4 pt-4 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-balance">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account and app preferences
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                className="flex items-center gap-2 whitespace-nowrap"
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                variant={activeTab === tab.id ? 'default' : 'outline'}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'notifications' && <NotificationsTab />}
        {activeTab === 'contacts' && <ContactsTab />}
        {activeTab === 'account' && <AccountTab />}
        {activeTab === 'preferences' && mounted && (
          <PreferencesTab currentTheme={theme} setTheme={setTheme} />
        )}
      </div>
    </main>
  );
}

function ProfileTab() {
  const [formData, setFormData] = useState({
    babyName: '',
    birthDate: '',
    dueDate: '',
    parentName: '',
  });

  useEffect(() => {
    const data = localStorage.getItem('onboardingData');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        setFormData({
          babyName: parsed.firstName || parsed.babyName || '',
          birthDate: parsed.birthDate || '',
          dueDate: parsed.dueDate || '',
          parentName: parsed.parentName || '',
        });
      } catch (e) {
        console.error('Error parsing onboarding data:', e);
      }
    }
  }, []);

  const handleSave = () => {
    const existingData = localStorage.getItem('onboardingData');
    let parsed = {};
    if (existingData) {
      try {
        parsed = JSON.parse(existingData);
      } catch (e) {
        console.error('Error parsing onboarding data:', e);
      }
    }

    localStorage.setItem(
      'onboardingData',
      JSON.stringify({
        ...parsed,
        babyName: formData.babyName,
        birthDate: formData.birthDate,
        dueDate: formData.dueDate,
        firstName: formData.babyName,
        parentName: formData.parentName,
      }),
    );

    // Reload the page to update the header
    window.location.reload();
  };

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Baby Information</h2>
          <p className="text-sm text-muted-foreground">
            Update your baby's details
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="babyName">Baby's Name</Label>
            <Input
              id="babyName"
              onChange={(e) =>
                setFormData({ ...formData, babyName: e.target.value })
              }
              placeholder="Enter baby's name"
              value={formData.babyName}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthDate">Birth Date</Label>
            <Input
              id="birthDate"
              onChange={(e) =>
                setFormData({ ...formData, birthDate: e.target.value })
              }
              type="date"
              value={formData.birthDate}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date (if pregnant)</Label>
            <Input
              id="dueDate"
              onChange={(e) =>
                setFormData({ ...formData, dueDate: e.target.value })
              }
              type="date"
              value={formData.dueDate}
            />
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Parent Information</h2>
          <p className="text-sm text-muted-foreground">Your personal details</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="parentName">Your Name</Label>
            <Input
              id="parentName"
              onChange={(e) =>
                setFormData({ ...formData, parentName: e.target.value })
              }
              placeholder="Enter your name"
              value={formData.parentName}
            />
          </div>
        </div>
      </div>

      <Button className="w-full" onClick={handleSave} size="lg">
        Save Changes
      </Button>
    </div>
  );
}

function NotificationsTab() {
  const [notifications, setNotifications] = useState({
    activityReminders: true,
    dailyInsights: true,
    feedingReminders: true,
    milestoneAlerts: true,
    pushNotifications: true,
    sleepReminders: true,
    weeklyReports: false,
  });

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Push Notifications</h2>
          <p className="text-sm text-muted-foreground">
            Manage your notification preferences
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label>Enable Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications on this device
              </p>
            </div>
            <Switch
              checked={notifications.pushNotifications}
              onCheckedChange={(checked) =>
                setNotifications({
                  ...notifications,
                  pushNotifications: checked,
                })
              }
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label>Feeding Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Get reminded when it's time to feed
              </p>
            </div>
            <Switch
              checked={notifications.feedingReminders}
              onCheckedChange={(checked) =>
                setNotifications({
                  ...notifications,
                  feedingReminders: checked,
                })
              }
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label>Sleep Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Get reminded about nap times
              </p>
            </div>
            <Switch
              checked={notifications.sleepReminders}
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, sleepReminders: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label>Activity Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Get reminded to log activities
              </p>
            </div>
            <Switch
              checked={notifications.activityReminders}
              onCheckedChange={(checked) =>
                setNotifications({
                  ...notifications,
                  activityReminders: checked,
                })
              }
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label>Milestone Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about developmental milestones
              </p>
            </div>
            <Switch
              checked={notifications.milestoneAlerts}
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, milestoneAlerts: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label>Daily Insights</Label>
              <p className="text-sm text-muted-foreground">
                Receive daily summaries and insights
              </p>
            </div>
            <Switch
              checked={notifications.dailyInsights}
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, dailyInsights: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label>Weekly Reports</Label>
              <p className="text-sm text-muted-foreground">
                Get weekly progress reports
              </p>
            </div>
            <Switch
              checked={notifications.weeklyReports}
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, weeklyReports: checked })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactsTab() {
  const [contacts, setContacts] = useState({
    emergencyContact: '',
    emergencyName: '',
    partnerPhone: '',
    pediatricianName: '',
    pediatricianPhone: '',
  });

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Emergency Contacts</h2>
          <p className="text-sm text-muted-foreground">
            Important contacts for quick access
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="emergencyName">Emergency Contact Name</Label>
            <Input
              id="emergencyName"
              onChange={(e) =>
                setContacts({ ...contacts, emergencyName: e.target.value })
              }
              placeholder="e.g., Grandma, Neighbor"
              value={contacts.emergencyName}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergencyContact">Emergency Contact Number</Label>
            <Input
              id="emergencyContact"
              onChange={(e) =>
                setContacts({ ...contacts, emergencyContact: e.target.value })
              }
              placeholder="(555) 123-4567"
              type="tel"
              value={contacts.emergencyContact}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="partnerPhone">Partner Phone Number</Label>
            <Input
              id="partnerPhone"
              onChange={(e) =>
                setContacts({ ...contacts, partnerPhone: e.target.value })
              }
              placeholder="(555) 123-4567"
              type="tel"
              value={contacts.partnerPhone}
            />
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Healthcare Providers</h2>
          <p className="text-sm text-muted-foreground">
            Your baby's healthcare team
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pediatricianName">Pediatrician Name</Label>
            <Input
              id="pediatricianName"
              onChange={(e) =>
                setContacts({ ...contacts, pediatricianName: e.target.value })
              }
              placeholder="Dr. Smith"
              value={contacts.pediatricianName}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pediatricianPhone">Pediatrician Phone</Label>
            <Input
              id="pediatricianPhone"
              onChange={(e) =>
                setContacts({ ...contacts, pediatricianPhone: e.target.value })
              }
              placeholder="(555) 555-1234"
              type="tel"
              value={contacts.pediatricianPhone}
            />
          </div>
        </div>
      </div>

      <Button className="w-full" size="lg">
        Save Contacts
      </Button>
    </div>
  );
}

function AccountTab() {
  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Account Settings</h2>
          <p className="text-sm text-muted-foreground">
            Manage your account information
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              disabled
              id="email"
              placeholder="your.email@example.com"
              type="email"
            />
            <p className="text-xs text-muted-foreground">
              Email management coming soon
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="flex gap-2">
              <Input disabled id="password" type="password" value="••••••••" />
              <Button disabled variant="outline">
                Change
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Password management coming soon
            </p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-destructive">
            Danger Zone
          </h2>
          <p className="text-sm text-muted-foreground">
            Irreversible account actions
          </p>
        </div>

        <div className="space-y-3">
          <Button className="w-full" variant="outline">
            Export My Data
          </Button>
          <Button className="w-full" variant="destructive">
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
}

function PreferencesTab({
  currentTheme,
  setTheme,
}: {
  currentTheme: string | undefined;
  setTheme: (theme: string) => void;
}) {
  const [preferences, setPreferences] = useState({
    measurementUnit: 'imperial',
    temperatureUnit: 'fahrenheit',
    timeFormat: '12h',
  });

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
                onClick={() => setTheme('light')}
                variant={currentTheme === 'light' ? 'default' : 'outline'}
              >
                <Sun className="h-5 w-5" />
                <span className="text-sm">Light</span>
              </Button>
              <Button
                className="flex flex-col items-center gap-2 h-auto py-4"
                onClick={() => setTheme('dark')}
                variant={currentTheme === 'dark' ? 'default' : 'outline'}
              >
                <Moon className="h-5 w-5" />
                <span className="text-sm">Dark</span>
              </Button>
              <Button
                className="flex flex-col items-center gap-2 h-auto py-4"
                onClick={() => setTheme('system')}
                variant={currentTheme === 'system' ? 'default' : 'outline'}
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
                  setPreferences({
                    ...preferences,
                    measurementUnit: 'imperial',
                  })
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
                  setPreferences({ ...preferences, measurementUnit: 'metric' })
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
                  setPreferences({
                    ...preferences,
                    temperatureUnit: 'fahrenheit',
                  })
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
                  setPreferences({ ...preferences, temperatureUnit: 'celsius' })
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
                onClick={() =>
                  setPreferences({ ...preferences, timeFormat: '12h' })
                }
                variant={
                  preferences.timeFormat === '12h' ? 'default' : 'outline'
                }
              >
                12-hour
              </Button>
              <Button
                onClick={() =>
                  setPreferences({ ...preferences, timeFormat: '24h' })
                }
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

      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Privacy & Data</h2>
          <p className="text-sm text-muted-foreground">
            Control your data and privacy
          </p>
        </div>

        <div className="space-y-3">
          <button
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
            type="button"
          >
            <div>
              <p className="font-medium">Privacy Policy</p>
              <p className="text-sm text-muted-foreground">
                Read our privacy policy
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>

          <button
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
            type="button"
          >
            <div>
              <p className="font-medium">Terms of Service</p>
              <p className="text-sm text-muted-foreground">
                Read our terms of service
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>

          <button
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
            type="button"
          >
            <div>
              <p className="font-medium">Data Usage</p>
              <p className="text-sm text-muted-foreground">
                Learn how we use your data
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}
