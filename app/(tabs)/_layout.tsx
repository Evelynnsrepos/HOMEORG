import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { tap } from '../../src/ui/base';
import { colors, font } from '../../src/theme';

const items: {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: keyof typeof Ionicons.glyphMap;
}[] = [
  { name: 'index', label: 'Home', icon: 'home-outline', active: 'home' },
  { name: 'today', label: 'Today', icon: 'checkbox-outline', active: 'checkbox' },
  { name: 'myhome', label: 'My Home', icon: 'heart-outline', active: 'heart' },
  { name: 'profile', label: 'Profile', icon: 'person-outline', active: 'person' },
];

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
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
          {state.routes.map((route, i) => {
            const meta = items.find((it) => it.name === route.name);
            if (!meta) return null;
            const focused = state.index === i;
            return (
              <Pressable
                key={route.key}
                onPress={() => {
                  tap();
                  if (!focused) navigation.navigate(route.name as never);
                }}
                style={{ flex: 1, alignItems: 'center', gap: 3 }}
              >
                <Ionicons
                  name={focused ? meta.active : meta.icon}
                  size={21}
                  color={focused ? colors.ink : colors.inkMuted}
                />
                <Text
                  style={{
                    fontFamily: focused ? font.bold : font.medium,
                    fontSize: 10.5,
                    color: focused ? colors.ink : colors.inkMuted,
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
      <Tabs.Screen name="today" />
      <Tabs.Screen name="myhome" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
