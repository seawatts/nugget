import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ONBOARDING_STORAGE_KEY = 'onboardingData';

export default function Bootstrap() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      try {
        const stored = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
        const parsed = stored ? JSON.parse(stored) : null;

        if (!isMounted) {
          return;
        }

        if (!parsed?.completedAt) {
          router.replace('/onboarding');
        } else {
          router.replace('/(tabs)');
        }
      } catch (error) {
        console.warn('Failed to read onboarding state', error);
        if (!isMounted) return;
        router.replace('/onboarding');
      } finally {
        if (isMounted) {
          setIsChecking(false);
        }
      }
    };

    void hydrate();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-background px-6">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="items-center justify-center">
        <ActivityIndicator color="#f472b6" size="large" />
        <Text className="mt-4 text-sm text-muted-foreground">
          {isChecking
            ? 'Preparing your experience...'
            : 'Redirecting to your dashboard'}
        </Text>
      </View>
    </SafeAreaView>
  );
}
