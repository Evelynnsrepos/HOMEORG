import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { presetById } from '../../src/data/challenges';
import { addDays } from '../../src/lib/date';
import { useStore } from '../../src/state/store';
import { colors, radius } from '../../src/theme';
import { Bar, Btn, Card, Empty, IconBtn, Row, Screen, Spacer, T, tapSuccess } from '../../src/ui/base';

export default function ChallengeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const preset = presetById(id ?? '');
  const custom = useStore((s) => s.customChallenges.find((c) => c.id === id));
  const tasks = useStore((s) => s.tasks);
  const progress = useStore((s) => s.challenges.find((c) => c.challengeId === id));
  const join = useStore((s) => s.joinChallenge);
  const leave = useStore((s) => s.leaveChallenge);
  const toggle = useStore((s) => s.toggleChallengeItem);
  const remove = useStore((s) => s.deleteCustomChallenge);

  const meta = useMemo(() => {
    if (preset) {
      return {
        name: preset.name,
        emoji: preset.emoji,
        blurb: preset.blurb,
        color: preset.color,
        days: preset.days,
        coins: preset.coins,
        items: preset.items.map((label, i) => ({ id: `preset:${i}`, label })),
      };
    }
    if (custom) {
      const items = [
        ...custom.taskIds.map((tid) => ({
          id: tid,
          label: tasks.find((t) => t.id === tid)?.name ?? '[deleted task]',
        })),
        ...custom.oneOffs.map((label, i) => ({ id: `oneoff:${i}`, label })),
      ];
      return {
        name: custom.name,
        emoji: custom.emoji,
        blurb: 'A checklist you built yourself.',
        color: custom.color,
        days: custom.days,
        coins: Math.min(200, items.length * 5),
        items,
      };
    }
    return null;
  }, [preset, custom, tasks]);

  if (!meta) {
    return (
      <Screen>
        <Empty emoji={'\u{1F3C6}'} title="Challenge not found" />
        <Btn label="Back" tone="quiet" onPress={() => router.back()} />
      </Screen>
    );
  }

  const done = progress?.done ?? [];
  const complete = done.length >= meta.items.length && meta.items.length > 0;
  const deadline = progress ? addDays(new Date(progress.joinedAt), meta.days) : null;
  const expired = deadline ? deadline.getTime() < Date.now() : false;
  const daysLeft = deadline
    ? Math.ceil((deadline.getTime() - Date.now()) / 86_400_000)
    : meta.days;

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <IconBtn name="chevron-back" onPress={() => router.back()} />
        {custom ? (
          <IconBtn
            name="trash-outline"
            onPress={() =>
              Alert.alert('Delete this challenge?', 'It goes for good, along with your progress.', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => {
                    remove(custom.id);
                    router.back();
                  },
                },
              ])
            }
          />
        ) : (
          <View style={{ width: 38 }} />
        )}
      </Row>

      <Spacer h={8} />
      <T style={{ fontSize: 40 }}>{meta.emoji}</T>
      <Spacer h={8} />
      <T v="display" style={{ fontSize: 28, lineHeight: 32 }}>
        {meta.name}
      </T>
      <Spacer h={6} />
      <T v="body">{meta.blurb}</T>

      <Spacer h={14} />
      <Row style={{ gap: 7, flexWrap: 'wrap' }}>
        <Tag text={`${meta.items.length} items`} color={meta.color} />
        <Tag text={`${meta.days} days`} color={meta.color} />
        <Tag text={`${meta.coins} coins`} color={colors.gold} />
        {progress ? (
          <Tag
            text={expired ? 'Expired — carry on anyway' : `${Math.max(0, daysLeft)} days left`}
            color={expired ? colors.needsLove : colors.sage}
          />
        ) : null}
      </Row>

      {progress ? (
        <>
          <Spacer h={16} />
          <Card style={{ padding: 14 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <T v="heading">
                {done.length} of {meta.items.length}
              </T>
              {complete ? (
                <Row style={{ gap: 5 }}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.sage} />
                  <T v="label" color={colors.sage}>
                    Finished — coins paid
                  </T>
                </Row>
              ) : null}
            </Row>
            <Spacer h={9} />
            <Bar
              pct={(done.length / Math.max(1, meta.items.length)) * 100}
              color={meta.color}
            />
          </Card>

          <Spacer h={16} />
          {meta.items.map((item) => {
            const ticked = done.includes(item.id);
            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  tapSuccess();
                  toggle(id!, item.id);
                }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 }}
              >
                <View
                  style={{
                    width: 21,
                    height: 21,
                    borderRadius: 7,
                    borderWidth: 2,
                    borderColor: ticked ? meta.color : colors.line,
                    backgroundColor: ticked ? meta.color : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {ticked ? <Ionicons name="checkmark" size={13} color="#FFF" /> : null}
                </View>
                <T
                  v="body"
                  style={{
                    flex: 1,
                    fontSize: 14.5,
                    textDecorationLine: ticked ? 'line-through' : 'none',
                    color: ticked ? colors.inkMuted : colors.inkSoft,
                  }}
                >
                  {item.label}
                </T>
              </Pressable>
            );
          })}

          <Spacer h={20} />
          <Btn
            label="Leave this challenge"
            tone="quiet"
            onPress={() =>
              Alert.alert('Leave?', 'Your progress on this one is wiped. Nothing else changes.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Leave', style: 'destructive', onPress: () => leave(id!) },
              ])
            }
          />
        </>
      ) : (
        <>
          <Spacer h={18} />
          <Card soft>
            <T v="heading">What's on the list</T>
            <Spacer h={8} />
            {meta.items.slice(0, 6).map((i) => (
              <Row key={i.id} style={{ gap: 8, paddingVertical: 4 }}>
                <View
                  style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: meta.color }}
                />
                <T v="body" style={{ flex: 1 }}>
                  {i.label}
                </T>
              </Row>
            ))}
            {meta.items.length > 6 ? (
              <T v="caption" style={{ marginTop: 6 }}>
                and {meta.items.length - 6} more
              </T>
            ) : null}
          </Card>
          <Spacer h={18} />
          <Btn label="Join the challenge" onPress={() => join(id!)} />
          <Spacer h={8} />
          <T v="caption" center>
            The clock starts the moment you join. Run past it and you can still finish — the coins
            still land.
          </T>
        </>
      )}
    </Screen>
  );
}

function Tag({ text, color }: { text: string; color: string }) {
  return (
    <View
      style={{
        backgroundColor: color + '20',
        borderRadius: radius.pill,
        paddingHorizontal: 11,
        paddingVertical: 5,
      }}
    >
      <T v="label" style={{ fontSize: 11.5 }} color={color}>
        {text}
      </T>
    </View>
  );
}
