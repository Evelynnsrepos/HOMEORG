import {
  BricolageGrotesque_400Regular,
  BricolageGrotesque_500Medium,
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/bricolage-grotesque';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useStore } from '../src/state/store';
import { MusicEngine } from '../src/ui/MusicEngine';
import { colors } from '../src/theme';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Bricolage_400Regular: BricolageGrotesque_400Regular,
    Bricolage_500Medium: BricolageGrotesque_500Medium,
    Bricolage_600SemiBold: BricolageGrotesque_600SemiBold,
    Bricolage_700Bold: BricolageGrotesque_700Bold,
    Bricolage_800ExtraBold: BricolageGrotesque_800ExtraBold,
  });

  const hydrated = useStore((s) => s.hydrated);
  const onboarded = useStore((s) => s.settings.onboarded);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated || !fontsLoaded) return;
    const inWelcome = segments[0] === 'welcome';
    if (!onboarded && !inWelcome) router.replace('/welcome');
    if (onboarded && inWelcome) router.replace('/');
  }, [hydrated, fontsLoaded, onboarded, segments, router]);

  if (!fontsLoaded || !hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.sage} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <MusicEngine />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" />
          {/* The four kitchen screens replace each other when you tap the
              segmented control up top. A slide would throw the whole page
              sideways for what is meant to look like one button moving. */}
          <Stack.Screen name="kitchen" options={{ animation: 'fade', animationDuration: 140 }} />
          <Stack.Screen name="cook" options={{ animation: 'fade', animationDuration: 140 }} />
          <Stack.Screen name="recipes" options={{ animation: 'fade', animationDuration: 140 }} />
          <Stack.Screen name="shopping" options={{ animation: 'fade', animationDuration: 140 }} />
          <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
          <Stack.Screen name="focus" options={{ animation: 'fade' }} />
          <Stack.Screen name="sprint" options={{ animation: 'fade' }} />
          <Stack.Screen name="spin" options={{ presentation: 'transparentModal', animation: 'fade' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
