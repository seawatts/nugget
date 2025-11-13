import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type JourneyStage = 'ttc' | 'pregnant' | 'born';
type TTCMethod = 'natural' | 'ivf' | 'other';
type UserRole = 'primary' | 'partner';

type StepConfig = {
  id: number;
  label: string;
};

const STEPS: StepConfig[] = [
  { id: 1, label: 'Stage' },
  { id: 2, label: 'Details' },
  { id: 3, label: 'Role' },
];

const ONBOARDING_STORAGE_KEY = 'onboardingData';

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [journeyStage, setJourneyStage] = useState<JourneyStage | null>(null);
  const [ttcMethod, setTTCMethod] = useState<TTCMethod | null>(null);
  const [lastPeriodDate, setLastPeriodDate] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [dueDateManuallySet, setDueDateManuallySet] = useState<boolean>(false);
  const [birthDate, setBirthDate] = useState<string>('');
  const [babyName, setBabyName] = useState<string>('');
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  const canProceed = useMemo(() => {
    if (step === 1) return journeyStage !== null;
    if (step === 2) {
      if (journeyStage === 'ttc') return ttcMethod !== null;
      if (journeyStage === 'pregnant') return dueDate.length > 0;
      if (journeyStage === 'born') return birthDate.length > 0;
    }
    if (step === 3) return userRole !== null;
    return false;
  }, [birthDate, dueDate, journeyStage, step, ttcMethod, userRole]);

  const calculateDueDate = useCallback((lmpDate: string) => {
    if (!lmpDate) return '';
    const lmp = new Date(lmpDate);
    if (Number.isNaN(lmp.getTime())) return '';
    const estimated = new Date(lmp.getTime() + 280 * 24 * 60 * 60 * 1000);
    return estimated.toISOString().split('T')[0] ?? '';
  }, []);

  const handleLastPeriodChange = useCallback(
    (value: string) => {
      setLastPeriodDate(value);
      if (!dueDateManuallySet) {
        const calculated = calculateDueDate(value);
        setDueDate(calculated);
      }
    },
    [calculateDueDate, dueDateManuallySet],
  );

  const handleDueDateChange = useCallback((value: string) => {
    setDueDate(value);
    setDueDateManuallySet(value.length > 0);
  }, []);

  const handleComplete = useCallback(async () => {
    const onboardingData = {
      babyName,
      birthDate,
      completedAt: new Date().toISOString(),
      dueDate,
      journeyStage,
      lastPeriodDate,
      ttcMethod,
      userRole,
    };

    await AsyncStorage.setItem(
      ONBOARDING_STORAGE_KEY,
      JSON.stringify(onboardingData),
    );

    router.push('/onboarding/setup');
  }, [
    babyName,
    birthDate,
    dueDate,
    journeyStage,
    lastPeriodDate,
    router,
    ttcMethod,
    userRole,
  ]);

  const renderStageSelection = () => (
    <View className="mt-6 gap-4">
      <StageOption
        description="Track cycle insights and ovulation windows"
        icon="heart"
        isSelected={journeyStage === 'ttc'}
        onPress={() => {
          setJourneyStage('ttc');
          setTTCMethod(null);
          setDueDate('');
          setLastPeriodDate('');
          setDueDateManuallySet(false);
          setBirthDate('');
          setBabyName('');
        }}
        title="Trying to Conceive"
      />
      <StageOption
        description="Stay on top of milestones through pregnancy"
        icon="calendar"
        isSelected={journeyStage === 'pregnant'}
        onPress={() => {
          setJourneyStage('pregnant');
          setTTCMethod(null);
          setBirthDate('');
          setBabyName('');
          setDueDate('');
          setLastPeriodDate('');
          setDueDateManuallySet(false);
        }}
        title="Pregnant"
      />
      <StageOption
        description="Monitor feeding, sleep, and development"
        icon="baby"
        isSelected={journeyStage === 'born'}
        onPress={() => {
          setJourneyStage('born');
          setTTCMethod(null);
          setDueDate('');
          setLastPeriodDate('');
          setDueDateManuallySet(false);
        }}
        title="Baby is Here"
      />
    </View>
  );

  const renderStageDetails = () => {
    if (journeyStage === 'ttc') {
      return (
        <View className="mt-6 gap-3">
          <StageOption
            description="Chart your natural cycle and fertile window"
            icon="trending-up"
            isSelected={ttcMethod === 'natural'}
            onPress={() => setTTCMethod('natural')}
            title="Natural Conception"
          />
          <StageOption
            description="Document fertility treatments and appointments"
            icon="activity"
            isSelected={ttcMethod === 'ivf'}
            onPress={() => setTTCMethod('ivf')}
            title="IVF / Fertility Support"
          />
          <StageOption
            description="Adoption, surrogacy, or other paths"
            icon="users"
            isSelected={ttcMethod === 'other'}
            onPress={() => setTTCMethod('other')}
            title="Another Journey"
          />
        </View>
      );
    }

    if (journeyStage === 'pregnant') {
      return (
        <View className="mt-6 gap-5 rounded-3xl border border-border bg-card p-5">
          <View className="gap-2">
            <Text className="text-base font-semibold text-foreground">
              First Day of Last Period
            </Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="off"
              className="rounded-2xl border border-input bg-background px-4 py-3 text-base text-foreground"
              keyboardType="numbers-and-punctuation"
              onChangeText={handleLastPeriodChange}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9ca3af"
              value={lastPeriodDate}
            />
            <Text className="text-xs text-muted-foreground">
              We will estimate your due date automatically from this.
            </Text>
          </View>

          <View className="gap-2">
            <Text className="text-base font-semibold text-foreground">
              Expected Due Date{' '}
              {!dueDateManuallySet && dueDate.length > 0 ? '(Auto-filled)' : ''}
            </Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="off"
              className="rounded-2xl border border-input bg-background px-4 py-3 text-base text-foreground"
              keyboardType="numbers-and-punctuation"
              onChangeText={handleDueDateChange}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9ca3af"
              value={dueDate}
            />
            <Text className="text-xs text-muted-foreground">
              Add your provider’s date if it differs from the estimate.
            </Text>
          </View>
        </View>
      );
    }

    if (journeyStage === 'born') {
      return (
        <View className="mt-6 gap-5 rounded-3xl border border-border bg-card p-5">
          <View className="gap-2">
            <Text className="text-base font-semibold text-foreground">
              Baby’s Name (optional)
            </Text>
            <TextInput
              className="rounded-2xl border border-input bg-background px-4 py-3 text-base text-foreground"
              onChangeText={setBabyName}
              placeholder="Enter name"
              placeholderTextColor="#9ca3af"
              value={babyName}
            />
          </View>
          <View className="gap-2">
            <Text className="text-base font-semibold text-foreground">
              Birth Date
            </Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="off"
              className="rounded-2xl border border-input bg-background px-4 py-3 text-base text-foreground"
              keyboardType="numbers-and-punctuation"
              onChangeText={setBirthDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9ca3af"
              value={birthDate}
            />
            <Text className="text-xs text-muted-foreground">
              We will tailor milestones to your baby’s age.
            </Text>
          </View>
        </View>
      );
    }

    return null;
  };

  const renderRoleSelection = () => (
    <View className="mt-6 gap-4">
      <StageOption
        description="Primary caregiver, birthing parent, or guardian"
        icon="user"
        isSelected={userRole === 'primary'}
        onPress={() => setUserRole('primary')}
        title="Primary Caregiver"
      />
      <StageOption
        description="Partner or support person assisting day-to-day"
        icon="users"
        isSelected={userRole === 'partner'}
        onPress={() => setUserRole('partner')}
        title="Partner / Support"
      />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="w-full bg-muted py-2">
        <View
          className="h-2 rounded-full bg-primary transition-all duration-300"
          style={{ width: `${(step / STEPS.length) * 100}%` }}
        />
      </View>

      <ScrollView
        automaticallyAdjustKeyboardInsets
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="px-6 pt-8">
          <Text className="text-center text-2xl font-bold text-foreground">
            Welcome to Nugget
          </Text>
          <Text className="mt-2 text-center text-sm text-muted-foreground">
            Let’s personalize your journey so we can surface the right support.
          </Text>

          {step === 1 && renderStageSelection()}
          {step === 2 && renderStageDetails()}
          {step === 3 && renderRoleSelection()}
        </View>
      </ScrollView>

      <View className="border-t border-border px-6 pb-8 pt-4">
        <View className="flex-row gap-3">
          {step > 1 && (
            <Pressable
              className="flex-1 items-center justify-center rounded-2xl border border-border bg-card py-3"
              onPress={() => setStep((prev) => Math.max(prev - 1, 1))}
            >
              <Text className="text-base font-medium text-foreground">
                Back
              </Text>
            </Pressable>
          )}

          <Pressable
            className={`flex-1 items-center justify-center rounded-2xl py-3 ${
              canProceed ? 'bg-primary' : 'bg-muted opacity-60'
            }`}
            disabled={!canProceed}
            onPress={() => {
              if (step < STEPS.length) {
                setStep((prev) => prev + 1);
              } else {
                handleComplete();
              }
            }}
          >
            <Text
              className={`text-base font-semibold ${
                canProceed ? 'text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              {step < STEPS.length ? 'Continue' : 'Get Started'}
            </Text>
          </Pressable>
        </View>

        <View className="mt-4 flex-row items-center justify-center gap-1">
          {STEPS.map((item) => (
            <View
              className={`h-2 rounded-full ${
                item.id === step ? 'w-8 bg-primary' : 'w-2 bg-muted'
              }`}
              key={item.id}
            />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

type StageOptionProps = {
  title: string;
  description: string;
  icon:
    | 'heart'
    | 'calendar'
    | 'baby'
    | 'trending-up'
    | 'activity'
    | 'users'
    | 'user';
  isSelected: boolean;
  onPress: () => void;
};

function StageOption({
  description,
  icon,
  isSelected,
  onPress,
  title,
}: StageOptionProps) {
  return (
    <Pressable
      className={`rounded-3xl border-2 p-5 ${
        isSelected ? 'border-primary bg-primary/10' : 'border-border bg-card'
      }`}
      onPress={onPress}
    >
      <View className="flex-row items-start gap-4">
        <View
          className={`rounded-2xl p-3 ${isSelected ? 'bg-primary' : 'bg-muted'}`}
        >
          <Icon name={icon} selected={isSelected} />
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-foreground">
            {title}
          </Text>
          <Text className="mt-1 text-sm text-muted-foreground">
            {description}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

type IconProps = {
  name: StageOptionProps['icon'];
  selected: boolean;
};

function Icon({ name, selected }: IconProps) {
  const color = selected ? '#ffffff' : '#0f172a';

  switch (name) {
    case 'heart':
      return <FeatherIcon color={color} name="heart" />;
    case 'calendar':
      return <FeatherIcon color={color} name="calendar" />;
    case 'baby':
      return <FeatherIcon color={color} name="smile" />;
    case 'trending-up':
      return <FeatherIcon color={color} name="trending-up" />;
    case 'activity':
      return <FeatherIcon color={color} name="activity" />;
    case 'users':
      return <FeatherIcon color={color} name="users" />;
    case 'user':
      return <FeatherIcon color={color} name="user" />;
    default:
      return <FeatherIcon color={color} name="circle" />;
  }
}

type FeatherIconProps = {
  name: ComponentProps<typeof Feather>['name'];
  color: string;
};

function FeatherIcon({ color, name }: FeatherIconProps) {
  return <Feather color={color} name={name} size={20} />;
}
