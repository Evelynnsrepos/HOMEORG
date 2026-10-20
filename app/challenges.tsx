import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { presetChallenges } from '../src/data/challenges';
import { useStore } from '../src/state/store';
import { colors, radius } from '../src/theme';
import { Bar, Card, EmojiTile, IconBtn, Press, Row, Screen, Spacer, T } from '../src/ui/base';

export default function Challenges() {
  const router = useRouter();
  const progress = useStore((s) => s.challenges);
  const custom = useStore((s) => s.customChallenges);

  const progressOf = (id: string) => progress.find((p) => p.challengeId === id);

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <IconBtn name="chevron-back" onPress={() => router.back()} />
        <T v="heading">Challenges</T>
        <IconBtn name="add" onPress={() => router.push('/challenge/new')} />
      </Row>

      <Spacer h={10} />
      <T v="display" style={{ fontSize: 28 }}>
        Time-boxed lists,{'\n'}with coins at the end.
      </T>
      <Spacer h={6} />
      <T v="label">
        {presetChallenges.length} curated checklists, plus any you build yourself.
      </T>

      <Spacer h={18} />
      <Press
        onPress={() => router.push('/challenge/new')}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 7,
          borderWidth: 1.5,
          borderStyle: 'dashed',
          borderColor: colors.line,
          borderRadius: radius.md,
          paddingVertical: 14,
        }}
      >
        <Ionicons name="add" size={16} color={colors.inkSoft} />
        <T v="heading" style={{ fontSize: 13.5 }}>
          Create your own challenge
        </T>
      </Press>

      {custom.length ? (
        <>
          <Spacer h={20} />
          <T v="over">Yours</T>
          <Spacer h={8} />
          {custom.map((ch) => {
            const total = ch.taskIds.length + ch.oneOffs.length;
            const p = progressOf(ch.id);
            return (
              <ChallengeCard
                key={ch.id}
                emoji={ch.emoji}
                color={ch.color}
                name={ch.name}
                blurb={`${total} items you picked`}
                meta={`${total} items · ${ch.days} days · ${Math.min(200, total * 5)} coins`}
                done={p?.done.length ?? 0}
                total={total}
                joined={!!p}
                mine
                onPress={() => router.push(`/challenge/${ch.id}`)}
              />
            );
          })}
        </>
      ) : null}

      <Spacer h={20} />
      <T v="over">Preset checklists</T>
      <Spacer h={8} />
      {presetChallenges.map((ch) => {
        const p = progressOf(ch.id);
        return (
          <ChallengeCard
            key={ch.id}
            emoji={ch.emoji}
            color={ch.color}
            name={ch.name}
            blurb={ch.blurb}
            meta={`${ch.items.length} tasks · ${ch.days} days · ${ch.coins} coins`}
            done={p?.done.length ?? 0}
            total={ch.items.length}
            joined={!!p}
            onPress={() => router.push(`/challenge/${ch.id}`)}
          />
        );
      })}
    </Screen>
  );
}

function ChallengeCard({
  emoji,
  color,
  name,
  blurb,
  meta,
  done,
  total,
  joined,
  mine,
  onPress,
}: {
  emoji: string;
  color: string;
  name: string;
  blurb: string;
  meta: string;
  done: number;
  total: number;
  joined: boolean;
  mine?: boolean;
  onPress: () => void;
}) {
  const complete = joined && done >= total && total > 0;
  return (
    <Press onPress={onPress} style={{ marginBottom: 10 }}>
      <Card style={{ padding: 14 }}>
        <Row style={{ gap: 12, alignItems: 'flex-start' }}>
          <EmojiTile emoji={emoji} size={44} bg={color + '26'} />
          <View style={{ flex: 1 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <T v="heading" style={{ flex: 1 }}>
                {name}
              </T>
              {complete ? (
                <Ionicons name="checkmark-circle" size={18} color={colors.sage} />
              ) : mine ? (
                <View
                  style={{
                    backgroundColor: colors.cardAlt,
                    borderRadius: radius.pill,
                    paddingHorizontal: 7,
                    paddingVertical: 2,
                  }}
                >
                  <T v="caption" style={{ fontSize: 9.5 }}>
                    Added by you
                  </T>
                </View>
              ) : null}
            </Row>
            <T v="caption" numberOfLines={2}>
              {blurb}
            </T>
            <Spacer h={7} />
            <T v="over" style={{ fontSize: 9 }} color={color}>
              {meta}
            </T>
            {joined ? (
              <>
                <Spacer h={8} />
                <Bar pct={total ? (done / total) * 100 : 0} color={color} height={5} />
                <Spacer h={5} />
                <T v="caption" style={{ fontSize: 10 }}>
                  {done} of {total} ticked off
                </T>
              </>
            ) : null}
          </View>
        </Row>
      </Card>
    </Press>
  );
}
