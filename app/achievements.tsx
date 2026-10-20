import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { achievements } from '../src/data/achievements';
import { useAchievementInput } from '../src/state/derived';
import { colors, radius } from '../src/theme';
import { Bar, Card, IconBtn, Row, Screen, Spacer, T } from '../src/ui/base';

export default function Achievements() {
  const router = useRouter();
  const input = useAchievementInput();

  const scored = achievements
    .map((a) => ({ ...a, value: a.progress(input) }))
    .sort((a, b) => (b.value >= 1 ? 1 : 0) - (a.value >= 1 ? 1 : 0) || b.value - a.value);

  const unlocked = scored.filter((a) => a.value >= 1).length;

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <IconBtn name="chevron-back" onPress={() => router.back()} />
        <T v="heading">Achievements</T>
        <View style={{ width: 38 }} />
      </Row>

      <Spacer h={10} />
      <T v="display" style={{ fontSize: 28 }}>
        {unlocked} of {achievements.length}
      </T>
      <Spacer h={6} />
      <T v="label">No deadlines on any of these. They just wait.</T>

      <Spacer h={18} />
      {scored.map((a) => {
        const done = a.value >= 1;
        return (
          <Card key={a.id} style={{ padding: 14, marginBottom: 10 }}>
            <Row style={{ gap: 13 }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: radius.md,
                  backgroundColor: done ? colors.sageSoft : colors.cardAlt,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: done ? 1 : 0.55,
                }}
              >
                <T style={{ fontSize: 21 }}>{a.emoji}</T>
              </View>
              <View style={{ flex: 1 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <T v="heading" style={{ fontSize: 14.5 }}>
                    {a.name}
                  </T>
                  {done ? (
                    <T v="caption" color={colors.sage}>
                      Unlocked
                    </T>
                  ) : (
                    <T v="caption">{Math.round(a.value * 100)}%</T>
                  )}
                </Row>
                <T v="caption">{a.hint}</T>
                {done ? null : (
                  <View style={{ marginTop: 7 }}>
                    <Bar pct={a.value * 100} color={colors.noRush} height={4} />
                  </View>
                )}
              </View>
            </Row>
          </Card>
        );
      })}
    </Screen>
  );
}
