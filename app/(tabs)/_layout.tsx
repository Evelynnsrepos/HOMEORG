import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { tap } from '../../src/ui/base';
import { colors, font } from '../../src/theme';

/**
 * The bar from the sketch: home, what did I do and when, what could I cook,
 * my home, profile. The kitchen lives outside the tabs (it has its own
 * header of four), so its button pushes instead of switching. Today is still
 * a tab route — the chores pill on Home opens it — it just has no button.
 */
const items: {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: keyof typeof Ionicons.glyphMap;
  push?: string;
}[] = [
  { name: 'index', label: 'Home', icon: 'home-outline', active: 'home' },
  { name: 'history', label: 'History', icon: 'sparkles-outline', active: 'sparkles' },
  { name: 'kitchen', label: 'Kitchen', icon: 'restaurant-outline', active: 'restaurant', push: '/kitchen' },
  { name: 'myhome', label: 'My Home', icon: 'heart-outline', active: 'heart' },
  { name: 'profile', label: 'Profile', icon: 'person-outline', active: 'person' },
];

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}
      tabBar={({ state, navigation }) => (
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: colors.card,
            borderTopWidth: 1,
            borderTopColor: colors.lineSoft,
            paddingTop: 9,
            paddingBottom: Math.max(insets.bottom, 10),
          }}
        >
          {items.map((meta) => {
            const i = state.routes.findIndex((r) => r.name === meta.name);
            const focused = i >= 0 && state.index === i;
            return (
              <Pressable
                key={meta.name}
                onPress={() => {
                  tap();
                  if (meta.push) router.push(meta.push as never);
                  else if (!focused) navigation.navigate(meta.name as never);
                }}
                style={{ flex: 1, alignItems: 'center', gap: 3 }}
              >
                <View
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 3,
                    borderRadius: 999,
                    backgroundColor: focused ? colors.coralSoft : 'transparent',
                  }}
                >
                  <Ionicons
                    name={focused ? meta.active : meta.icon}
                    size={21}
                    color={focused ? colors.coralDeep : colors.inkMuted}
                  />
                </View>
                <Text
                  style={{
                    fontFamily: focused ? font.bold : font.medium,
                    fontSize: 10.5,
                    color: focused ? colors.coralDeep : colors.inkMuted,
                  }}
                >
                  {meta.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="history" />
      <Tabs.Screen name="today" />
      <Tabs.Screen name="myhome" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
