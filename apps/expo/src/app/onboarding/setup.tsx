import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type JourneyStage = 'ttc' | 'pregnant' | 'born';

type SetupTask = {
  id: string;
  title: string;
  description: string;
  icon: ComponentProps<typeof Feather>['name'];
  link: string;
  completed: boolean;
};

const STORAGE_KEYS = {
  budget: 'budgetData',
  caregiver: 'caregiverGuide',
  medical: 'medicalRecords',
  onboarding: 'onboardingData',
  settings: 'settingsData',
} as const;

export default function OnboardingSetupScreen() {
  const router = useRouter();
  const [journeyStage, setJourneyStage] = useState<JourneyStage | null>(null);
  const [tasks, setTasks] = useState<SetupTask[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadTasks = useCallback(async () => {
    setIsLoading(true);

    const [onboardingRaw, settingsRaw, medicalRaw, budgetRaw, caregiverRaw] =
      await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.onboarding),
        AsyncStorage.getItem(STORAGE_KEYS.settings),
        AsyncStorage.getItem(STORAGE_KEYS.medical),
        AsyncStorage.getItem(STORAGE_KEYS.budget),
        AsyncStorage.getItem(STORAGE_KEYS.caregiver),
      ]);

    const onboardingData = safeParse(onboardingRaw) as {
      journeyStage?: JourneyStage;
    } | null;
    const settingsData = safeParse(settingsRaw) as {
      emergencyContact?: unknown;
    } | null;
    const medicalData = safeParse(medicalRaw) as {
      vaccinations?: unknown[];
    } | null;
    const budgetData = safeParse(budgetRaw) as {
      monthlyBudget?: number;
    } | null;
    const caregiverData = safeParse(caregiverRaw) as {
      babyName?: string;
    } | null;

    setJourneyStage(onboardingData?.journeyStage ?? null);

    const hasContacts = Boolean(settingsData?.emergencyContact);
    const hasMedical = Array.isArray(medicalData?.vaccinations)
      ? (medicalData?.vaccinations ?? []).length > 0
      : false;
    const hasBudget = Boolean(budgetData?.monthlyBudget);
    const hasCaregiver = Boolean(caregiverData?.babyName);

    setTasks([
      {
        completed: false,
        description: "Add baby's details, birth information, and preferences",
        icon: 'file-text',
        id: 'profile',
        link: '/(tabs)',
        title: 'Complete Baby Profile',
      },
      {
        completed: hasContacts,
        description:
          'Pediatrician, hospital, emergency contacts, and caregivers',
        icon: 'phone-call',
        id: 'contacts',
        link: '/(tabs)',
        title: 'Add Emergency Contacts',
      },
      {
        completed: hasMedical,
        description: 'Vaccinations, allergies, medications, and insurance info',
        icon: 'activity',
        id: 'medical',
        link: '/(tabs)',
        title: 'Set Up Medical Records',
      },
      {
        completed: hasBudget,
        description: 'Track expenses and plan for baby-related costs',
        icon: 'dollar-sign',
        id: 'budget',
        link: '/(tabs)',
        title: 'Create Your Budget',
      },
      {
        completed: hasCaregiver,
        description: 'Create instructions for babysitters and family members',
        icon: 'users',
        id: 'caregiver',
        link: '/(tabs)',
        title: 'Prepare Caregiver Guide',
      },
      {
        completed: false,
        description: 'Notifications, reminders, and personalization options',
        icon: 'settings',
        id: 'preferences',
        link: '/(tabs)',
        title: 'Configure App Settings',
      },
    ]);

    setIsLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const run = async () => {
        if (!active) return;
        await loadTasks();
      };

      void run();

      return () => {
        active = false;
      };
    }, [loadTasks]),
  );

  const completedCount = useMemo(
    () => tasks.filter((task) => task.completed).length,
    [tasks],
  );

  const progress = useMemo(() => {
    if (tasks.length === 0) return 0;
    return Math.round((completedCount / tasks.length) * 100);
  }, [completedCount, tasks.length]);

  const handleSkip = useCallback(() => {
    if (journeyStage === 'ttc') {
      router.replace('/(tabs)');
    } else if (journeyStage === 'pregnant') {
      router.replace('/(tabs)');
    } else {
      router.replace('/(tabs)');
    }
  }, [journeyStage, router]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen
        options={{
          headerLargeTitle: true,
          headerTitle: 'Finish Setup',
        }}
      />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View className="bg-primary px-6 py-8">
          <Text className="text-sm font-semibold uppercase text-primary-foreground opacity-90">
            Finish Setting Up
          </Text>
          <Text className="mt-2 text-2xl font-bold text-primary-foreground">
            Complete these steps to get the most out of Nugget
          </Text>
          <View className="mt-6 gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-medium text-primary-foreground">
                {completedCount} of {tasks.length} completed
              </Text>
              <Text className="text-sm font-semibold text-primary-foreground/80">
                {progress}%
              </Text>
            </View>
            <View className="h-2 rounded-full bg-primary-foreground/20">
              <View
                className="h-full rounded-full bg-primary-foreground"
                style={{ width: `${progress}%` }}
              />
            </View>
          </View>
        </View>

        <View className="px-6 py-6">
          {isLoading ? (
            <Text className="text-center text-sm text-muted-foreground">
              Loading setup tasks...
            </Text>
          ) : (
            <View className="gap-4">
              {tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  onPress={() => router.push(task.link)}
                  task={task}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View className="border-t border-border px-6 pb-8 pt-4">
        <Pressable
          className="w-full items-center justify-center rounded-2xl border border-border bg-background py-3"
          onPress={handleSkip}
        >
          <Text className="text-base font-medium text-foreground">
            Skip for now
          </Text>
        </Pressable>
        <Text className="mt-3 text-center text-xs text-muted-foreground">
          You can revisit these steps anytime from Settings.
        </Text>
      </View>
    </SafeAreaView>
  );
}

type TaskRowProps = {
  task: SetupTask;
  onPress: () => void;
};

function TaskRow({ onPress, task }: TaskRowProps) {
  const completedClasses = task.completed
    ? 'border-primary/20 bg-primary/5'
    : 'border-border bg-card';
  const iconBackground = task.completed ? 'bg-primary/10' : 'bg-muted';
  const iconColor = task.completed ? '#f472b6' : '#6b7280';

  return (
    <Pressable
      className={`rounded-3xl border-2 p-5 ${completedClasses}`}
      onPress={onPress}
    >
      <View className="flex-row items-start gap-4">
        <View className={`rounded-2xl p-3 ${iconBackground}`}>
          <Feather color={iconColor} name={task.icon} size={20} />
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-foreground">
            {task.title}
          </Text>
          <Text className="mt-1 text-sm text-muted-foreground">
            {task.description}
          </Text>
        </View>
        <View className="mt-1">
          {task.completed ? (
            <Feather color="#f472b6" name="check-circle" size={20} />
          ) : (
            <Feather color="#6b7280" name="circle" size={20} />
          )}
        </View>
      </View>
    </Pressable>
  );
}

function safeParse(value: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
