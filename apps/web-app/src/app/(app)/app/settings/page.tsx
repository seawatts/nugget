'use client';

import { useUser } from '@clerk/nextjs';
import { api } from '@nugget/api/react';
import { Button } from '@nugget/ui/button';
// import { Input } from '@nugget/ui/input';
import { Label } from '@nugget/ui/label';
// import { Switch } from '@nugget/ui/switch';
import {
  // Bell,
  Calendar,
  ChevronRight,
  LogOut,
  Mail,
  Moon,
  // Phone,
  Shield,
  Sun,
  Trash2,
  User,
  UserCircle,
  Users,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { SignOutButton } from '~/components/sign-out-button';
import { BabyTab } from './_components/baby-tab';
import { DeleteAccountDialog } from './_components/delete-account-dialog';
import { FamilyTab } from './_components/family-tab';

type Tab =
  | 'baby'
  | 'family'
  // | 'notifications'
  // | 'contacts'
  | 'account'
  | 'preferences';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('baby');
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch for theme
  useEffect(() => {
    setMounted(true);
  }, []);

  const tabs = [
    { icon: User, id: 'baby' as Tab, label: 'Baby' },
    { icon: Users, id: 'family' as Tab, label: 'Family' },
    // { icon: Bell, id: 'notifications' as Tab, label: 'Notifications' },
    // { icon: Phone, id: 'contacts' as Tab, label: 'Contacts' },
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
        {activeTab === 'baby' && <BabyTab />}
        {activeTab === 'family' && <FamilyTab />}
        {/* {activeTab === 'notifications' && <NotificationsTab />} */}
        {/* {activeTab === 'contacts' && <ContactsTab />} */}
        {activeTab === 'account' && <AccountTab />}
        {activeTab === 'preferences' && mounted && (
          <PreferencesTab currentTheme={theme} setTheme={setTheme} />
        )}
      </div>
    </main>
  );
}

// function NotificationsTab() {
//   const [notifications, setNotifications] = useState({
//     activityReminders: true,
//     dailyInsights: true,
//     feedingReminders: true,
//     milestoneAlerts: true,
//     pushNotifications: true,
//     sleepReminders: true,
//     weeklyReports: false,
//   });

//   return (
//     <div className="space-y-4">
//       <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
//         <div>
//           <h2 className="text-xl font-semibold">Push Notifications</h2>
//           <p className="text-sm text-muted-foreground">
//             Manage your notification preferences
//           </p>
//         </div>

//         <div className="space-y-4">
//           <div className="flex items-center justify-between py-2">
//             <div className="space-y-0.5">
//               <Label>Enable Push Notifications</Label>
//               <p className="text-sm text-muted-foreground">
//                 Receive notifications on this device
//               </p>
//             </div>
//             <Switch
//               checked={notifications.pushNotifications}
//               onCheckedChange={(checked) =>
//                 setNotifications({
//                   ...notifications,
//                   pushNotifications: checked,
//                 })
//               }
//             />
//           </div>

//           <div className="flex items-center justify-between py-2">
//             <div className="space-y-0.5">
//               <Label>Feeding Reminders</Label>
//               <p className="text-sm text-muted-foreground">
//                 Get reminded when it's time to feed
//               </p>
//             </div>
//             <Switch
//               checked={notifications.feedingReminders}
//               onCheckedChange={(checked) =>
//                 setNotifications({
//                   ...notifications,
//                   feedingReminders: checked,
//                 })
//               }
//             />
//           </div>

//           <div className="flex items-center justify-between py-2">
//             <div className="space-y-0.5">
//               <Label>Sleep Reminders</Label>
//               <p className="text-sm text-muted-foreground">
//                 Get reminded about nap times
//               </p>
//             </div>
//             <Switch
//               checked={notifications.sleepReminders}
//               onCheckedChange={(checked) =>
//                 setNotifications({ ...notifications, sleepReminders: checked })
//               }
//             />
//           </div>

//           <div className="flex items-center justify-between py-2">
//             <div className="space-y-0.5">
//               <Label>Activity Reminders</Label>
//               <p className="text-sm text-muted-foreground">
//                 Get reminded to log activities
//               </p>
//             </div>
//             <Switch
//               checked={notifications.activityReminders}
//               onCheckedChange={(checked) =>
//                 setNotifications({
//                   ...notifications,
//                   activityReminders: checked,
//                 })
//               }
//             />
//           </div>

//           <div className="flex items-center justify-between py-2">
//             <div className="space-y-0.5">
//               <Label>Milestone Alerts</Label>
//               <p className="text-sm text-muted-foreground">
//                 Get notified about developmental milestones
//               </p>
//             </div>
//             <Switch
//               checked={notifications.milestoneAlerts}
//               onCheckedChange={(checked) =>
//                 setNotifications({ ...notifications, milestoneAlerts: checked })
//               }
//             />
//           </div>

//           <div className="flex items-center justify-between py-2">
//             <div className="space-y-0.5">
//               <Label>Daily Insights</Label>
//               <p className="text-sm text-muted-foreground">
//                 Receive daily summaries and insights
//               </p>
//             </div>
//             <Switch
//               checked={notifications.dailyInsights}
//               onCheckedChange={(checked) =>
//                 setNotifications({ ...notifications, dailyInsights: checked })
//               }
//             />
//           </div>

//           <div className="flex items-center justify-between py-2">
//             <div className="space-y-0.5">
//               <Label>Weekly Reports</Label>
//               <p className="text-sm text-muted-foreground">
//                 Get weekly progress reports
//               </p>
//             </div>
//             <Switch
//               checked={notifications.weeklyReports}
//               onCheckedChange={(checked) =>
//                 setNotifications({ ...notifications, weeklyReports: checked })
//               }
//             />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// function ContactsTab() {
//   const [contacts, setContacts] = useState({
//     emergencyContact: '',
//     emergencyName: '',
//     partnerPhone: '',
//     pediatricianName: '',
//     pediatricianPhone: '',
//   });

//   return (
//     <div className="space-y-4">
//       <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
//         <div>
//           <h2 className="text-xl font-semibold">Emergency Contacts</h2>
//           <p className="text-sm text-muted-foreground">
//             Important contacts for quick access
//           </p>
//         </div>

//         <div className="space-y-4">
//           <div className="space-y-2">
//             <Label htmlFor="emergencyName">Emergency Contact Name</Label>
//             <Input
//               id="emergencyName"
//               onChange={(e) =>
//                 setContacts({ ...contacts, emergencyName: e.target.value })
//               }
//               placeholder="e.g., Grandma, Neighbor"
//               value={contacts.emergencyName}
//             />
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="emergencyContact">Emergency Contact Number</Label>
//             <Input
//               id="emergencyContact"
//               onChange={(e) =>
//                 setContacts({ ...contacts, emergencyContact: e.target.value })
//               }
//               placeholder="(555) 123-4567"
//               type="tel"
//               value={contacts.emergencyContact}
//             />
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="partnerPhone">Partner Phone Number</Label>
//             <Input
//               id="partnerPhone"
//               onChange={(e) =>
//                 setContacts({ ...contacts, partnerPhone: e.target.value })
//               }
//               placeholder="(555) 123-4567"
//               type="tel"
//               value={contacts.partnerPhone}
//             />
//           </div>
//         </div>
//       </div>

//       <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
//         <div>
//           <h2 className="text-xl font-semibold">Healthcare Providers</h2>
//           <p className="text-sm text-muted-foreground">
//             Your baby's healthcare team
//           </p>
//         </div>

//         <div className="space-y-4">
//           <div className="space-y-2">
//             <Label htmlFor="pediatricianName">Pediatrician Name</Label>
//             <Input
//               id="pediatricianName"
//               onChange={(e) =>
//                 setContacts({ ...contacts, pediatricianName: e.target.value })
//               }
//               placeholder="Dr. Smith"
//               value={contacts.pediatricianName}
//             />
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="pediatricianPhone">Pediatrician Phone</Label>
//             <Input
//               id="pediatricianPhone"
//               onChange={(e) =>
//                 setContacts({ ...contacts, pediatricianPhone: e.target.value })
//               }
//               placeholder="(555) 555-1234"
//               type="tel"
//               value={contacts.pediatricianPhone}
//             />
//           </div>
//         </div>
//       </div>

//       <Button className="w-full" size="lg">
//         Save Contacts
//       </Button>
//     </div>
//   );
// }

function AccountTab() {
  const { user, isLoaded: userLoaded } = useUser();
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);

  if (!userLoaded) {
    return (
      <div className="space-y-4">
        <div className="bg-card border border-border rounded-2xl p-6">
          <p className="text-muted-foreground">
            Loading account information...
          </p>
        </div>
      </div>
    );
  }

  const primaryEmail = user?.primaryEmailAddress?.emailAddress;
  const createdAt = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Unknown';

  const externalAccounts = user?.externalAccounts || [];
  const connectedProviders = externalAccounts.map((account) => ({
    id: account.id,
    provider: account.provider,
    username: account.username || account.emailAddress,
  }));

  return (
    <div className="space-y-4">
      {/* Account Information */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Account Information</h2>
          <p className="text-sm text-muted-foreground">
            Your account details and settings
          </p>
        </div>

        <div className="space-y-4">
          {/* Email */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1 min-w-0">
              <Label className="text-sm font-medium">Email Address</Label>
              <p className="text-sm text-muted-foreground break-all">
                {primaryEmail || 'No email address'}
              </p>
            </div>
          </div>

          {/* Account Created */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <Label className="text-sm font-medium">Member Since</Label>
              <p className="text-sm text-muted-foreground">{createdAt}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Connected Accounts */}
      {connectedProviders.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Connected Accounts</h2>
            <p className="text-sm text-muted-foreground">
              Accounts you've connected to sign in
            </p>
          </div>

          <div className="space-y-2">
            {connectedProviders.map((account) => (
              <div
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                key={account.id}
              >
                <div className="flex-1">
                  <p className="text-sm font-medium capitalize">
                    {account.provider}
                  </p>
                  {account.username && (
                    <p className="text-xs text-muted-foreground">
                      {account.username}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sign Out */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Session</h2>
          <p className="text-sm text-muted-foreground">
            Sign out of your account
          </p>
        </div>

        <SignOutButton>
          <Button className="w-full" variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </SignOutButton>
      </div>

      {/* Privacy & Data */}
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

      {/* Delete Account */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <UserCircle className="size-5 text-muted-foreground mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-lg">Delete Account</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Permanently delete your account and ALL data including all baby
              profiles, activities, and settings. This action is final and
              cannot be undone.
            </p>
          </div>
        </div>
        <Button
          className="w-full"
          onClick={() => setShowDeleteAccountDialog(true)}
          variant="destructive"
        >
          <Trash2 className="mr-2 size-4" />
          Delete Account Permanently
        </Button>
      </div>

      {/* Delete Account Dialog */}
      {user && (
        <DeleteAccountDialog
          isOpen={showDeleteAccountDialog}
          onClose={() => setShowDeleteAccountDialog(false)}
          userId={user.id}
        />
      )}
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
      if (user.theme && user.theme !== currentTheme) {
        setTheme(user.theme);
      }
    }
  }, [user, currentTheme, setTheme]);

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

  if (isLoading) {
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
                variant={currentTheme === 'light' ? 'default' : 'outline'}
              >
                <Sun className="h-5 w-5" />
                <span className="text-sm">Light</span>
              </Button>
              <Button
                className="flex flex-col items-center gap-2 h-auto py-4"
                onClick={() => handleThemeChange('dark')}
                variant={currentTheme === 'dark' ? 'default' : 'outline'}
              >
                <Moon className="h-5 w-5" />
                <span className="text-sm">Dark</span>
              </Button>
              <Button
                className="flex flex-col items-center gap-2 h-auto py-4"
                onClick={() => handleThemeChange('system')}
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
