import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

import { fromDayKey, humanMinutes, monthShort, weekdayLong } from '../src/lib/date';
import { useWrapped } from '../src/state/derived';
import { colors, font, radius } from '../src/theme';
import { Btn, Card, Chip, IconBtn, Row, Screen, Spacer, T } from '../src/ui/base';

export default function Wrapped() {
  const router = useRouter();
  const [back, setBack] = useState(0);
  const w = useWrapped(back);

  const headline =
    w.tasks === 0
      ? 'A quiet week.'
      : w.tasks < 8
        ? 'Steady week.'
        : w.tasks < 20
          ? 'Good week.'
          : 'What a week.';

  const range = `${w.monday.getDate()} ${monthShort(w.monday)} – ${w.sunday.getDate()} ${monthShort(
    w.sunday,
  )}`;

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <IconBtn name="chevron-back" onPress={() => router.back()} />
        <T v="heading">Weekly wrapped</T>
        <View style={{ width: 38 }} />
      </Row>

      <Spacer h={12} />
      <Row style={{ gap: 7 }}>
        <Chip small label="This week" active={back === 0} onPress={() => setBack(0)} />
        <Chip small label="Last week" active={back === 1} onPress={() => setBack(1)} />
        <Chip small label="Two back" active={back === 2} onPress={() => setBack(2)} />
      </Row>

      <Spacer h={18} />
      <T v="over">{range}</T>
      <Spacer h={6} />
      <T v="display" style={{ fontSize: 34 }}>
        {headline}
      </T>

      <Spacer h={20} />
      <Card style={{ padding: 20 }}>
        <Row style={{ justifyContent: 'space-around' }}>
          <Big value={`${w.tasks}`} label="Chores" />
          <Big value={humanMinutes(w.minutes)} label="Cleaning" />
          <Big value={`${w.coins}`} label="Coins" tint={colors.gold} />
        </Row>
      </Card>

      <Spacer h={12} />
      <Card style={{ padding: 16 }}>
        <T v="over">The room that got the most love</T>
        <Spacer h={8} />
        {w.topRoom ? (
          <>
            <T v="title">
              {w.topRoom.emoji} {w.topRoom.name}
            </T>
            <T v="caption">
              {w.topRoomCount} {w.topRoomCount === 1 ? 'chore' : 'chores'} in there
            </T>
          </>
        ) : (
          <T v="body">Nothing recorded this week.</T>
        )}
      </Card>

      <Spacer h={12} />
      <Card style={{ padding: 16 }}>
        <T v="over">Your best day</T>
        <Spacer h={8} />
        {w.bestDayKey ? (
          <>
            <T v="title">{weekdayLong(fromDayKey(w.bestDayKey))}</T>
            <T v="caption">
              {w.bestDayCount} {w.bestDayCount === 1 ? 'chore' : 'chores'} in one day
            </T>
          </>
        ) : (
          <T v="body">No days with anything on them.</T>
        )}
      </Card>

      <Spacer h={12} />
      <Row style={{ gap: 12 }}>
        <Card style={{ flex: 1, padding: 16 }}>
          <T v="over">Days active</T>
          <Spacer h={6} />
          <T v="title">{w.daysActive} / 7</T>
        </Card>
        <Card style={{ flex: 1, padding: 16 }}>
          <T v="over">Deep cleans</T>
          <Spacer h={6} />
          <T v="title">{w.deep}</T>
        </Card>
      </Row>

      <Spacer h={20} />
      <Card soft style={{ padding: 16, borderRadius: radius.lg }}>
        <T v="body">
          {w.tasks === 0
            ? "Nothing this week, and that's allowed. The bars will wait for you."
            : w.daysActive >= 5
              ? 'Five days or more with something ticked off. That is the habit, not the effort.'
              : 'Every one of those counted. No shame in the days you skipped.'}
        </T>
      </Card>

      <Spacer h={18} />
      <Btn label="Back to insights" tone="quiet" onPress={() => router.back()} />
    </Screen>
  );
}

function Big({ value, label, tint = colors.ink }: { value: string; label: string; tint?: string }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <T style={{ fontFamily: font.display, fontSize: 26, color: tint }}>{value}</T>
      <T v="caption">{label}</T>
    </View>
  );
}
