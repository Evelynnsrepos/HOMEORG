import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, View } from 'react-native';

import { cleanliness, coinsForEffort, effortLabel } from '../lib/engine';
import { shortFrequency } from '../lib/format';
import { lastDoneLabel } from '../lib/date';
import type { Task } from '../lib/types';
import { colors, font, radius } from '../theme';
import { Bar, Row, T, tap, tapSuccess } from './base';

export function Check({
  done,
  color,
  onPress,
  size = 22,
}: {
  done: boolean;
  color: string;
  onPress?: () => void;
  size?: number;
}) {
  return (
    <Pressable
      hitSlop={10}
      onPress={onPress}
      style={{
        width: size,
        height: size,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: done ? color : color + '99',
        backgroundColor: done ? color : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {done ? <Ionicons name="checkmark" size={size * 0.62} color="#FFF" /> : null}
    </Pressable>
  );
}

export function TaskRow({
  task,
  color,
  done,
  onToggle,
  onPress,
  showBar,
  showRoom,
  roomName,
  trailing,
}: {
  task: Task;
  color: string;
  done?: boolean;
  onToggle?: () => void;
  onPress?: () => void;
  showBar?: boolean;
  showRoom?: boolean;
  roomName?: string;
  trailing?: React.ReactNode;
}) {
  const pct = cleanliness(task);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 11,
        opacity: pressed ? 0.7 : done ? 0.5 : 1,
      })}
    >
      <Check
        done={!!done}
        color={color}
        onPress={() => {
          if (done) tap();
          else tapSuccess();
          onToggle?.();
        }}
      />
      <View style={{ flex: 1 }}>
        <T
          v="heading"
          style={{
            fontSize: 14.5,
            textDecorationLine: done ? 'line-through' : 'none',
          }}
          numberOfLines={2}
        >
          {task.name}
        </T>
        <Row style={{ gap: 6, marginTop: 3 }}>
          <T v="caption" style={{ fontSize: 10 }}>
            {task.minutes}M
          </T>
          <Dot />
          <T v="caption" style={{ fontSize: 10 }}>
            {showRoom && roomName ? roomName.toUpperCase() : shortFrequency(task)}
          </T>
          <Dot />
          <Row style={{ gap: 3 }}>
            <T v="caption" style={{ fontSize: 10 }} color={colors.gold}>
              +{coinsForEffort[task.effort]}
            </T>
            <View
              style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.gold }}
            />
          </Row>
        </Row>
        {showBar ? (
          <View style={{ marginTop: 7 }}>
            <Bar pct={pct} color={color} height={4} />
            <T v="caption" style={{ fontSize: 10, marginTop: 4 }}>
              {lastDoneLabel(task.lastDone)} · {effortLabel[task.effort]}
            </T>
          </View>
        ) : null}
      </View>
      {trailing ?? (
        <T v="label" style={{ fontFamily: font.bold, fontSize: 13 }} color={color}>
          {task.minutes}
          <T v="caption" style={{ fontSize: 9.5 }} color={color}>
            m
          </T>
        </T>
      )}
    </Pressable>
  );
}

function Dot() {
  return (
    <View
      style={{ width: 2.5, height: 2.5, borderRadius: 2, backgroundColor: colors.inkMuted }}
    />
  );
}

export function GroupHeader({ color, name, count }: { color: string; name: string; count: number }) {
  return (
    <Row style={{ justifyContent: 'space-between', marginTop: 16, marginBottom: 2 }}>
      <Row style={{ gap: 7 }}>
        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }} />
        <T v="over" color={color}>
          {name}
        </T>
      </Row>
      <T v="over" style={{ fontSize: 9 }}>
        {count} {count === 1 ? 'task' : 'tasks'}
      </T>
    </Row>
  );
}

export function Toast({
  text,
  action,
  onAction,
  bottom = 90,
}: {
  text: string;
  action?: string;
  onAction?: () => void;
  bottom?: number;
}) {
  return (
    <View
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        bottom,
        backgroundColor: colors.espresso,
        borderRadius: radius.pill,
        paddingVertical: 12,
        paddingHorizontal: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <T v="heading" color={colors.onDark} style={{ fontSize: 13.5, flex: 1 }}>
        {text}
      </T>
      {action ? (
        <Pressable
          hitSlop={8}
          onPress={() => {
            tap();
            onAction?.();
          }}
        >
          <T v="heading" color={colors.coral} style={{ fontSize: 13.5 }}>
            {action}
          </T>
        </Pressable>
      ) : null}
    </View>
  );
}
