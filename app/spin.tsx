import { useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, View } from 'react-native';
import Svg, { G, Path, Circle } from 'react-native-svg';

import { useToday } from '../src/state/derived';
import { useStore } from '../src/state/store';
import { colors, font, radius } from '../src/theme';
import { Btn, EmojiTile, Row, Spacer, T, tap, tapSuccess } from '../src/ui/base';

const SIZE = 250;

export default function Spin() {
  const router = useRouter();
  const plan = useToday();
  const rooms = useStore((s) => s.rooms);
  const completeTask = useStore((s) => s.completeTask);
  const setLastWheelTask = useStore((s) => s.setLastWheelTask);

  const tasks = useMemo(() => plan.tasks.slice(0, 12), [plan.tasks]);
  const rotation = useRef(new Animated.Value(0)).current;
  const total = useRef(0);
  const [spinning, setSpinning] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);

  const slice = tasks.length ? 360 / tasks.length : 360;

  function spin() {
    if (spinning || !tasks.length) return;
    tap();
    setPicked(null);
    setSpinning(true);
    const index = Math.floor(Math.random() * tasks.length);
    // land with the chosen slice's middle under the pointer at the top
    const target = 360 * 5 + (360 - (index * slice + slice / 2));
    total.current += target;
    Animated.timing(rotation, {
      toValue: total.current,
      duration: 2600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setSpinning(false);
      setPicked(index);
      setLastWheelTask(tasks[index].id);
      tapSuccess();
    });
  }

  const spinDeg = rotation.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  const chosen = picked != null ? tasks[picked] : null;
  const chosenRoom = rooms.find((r) => r.id === chosen?.roomId);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#2E2A25EE',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <Pressable style={{ position: 'absolute', inset: 0 }} onPress={() => router.back()} />

      <T v="over" color="#C9BEA8">
        Can't choose?
      </T>
      <Spacer h={6} />
      <T v="display" color={colors.onDark} center style={{ fontSize: 28 }}>
        Let the wheel decide.
      </T>
      <Spacer h={24} />

      <View style={{ width: SIZE, height: SIZE + 16, alignItems: 'center' }}>
        <View
          style={{
            width: 0,
            height: 0,
            borderLeftWidth: 9,
            borderRightWidth: 9,
            borderTopWidth: 15,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderTopColor: colors.coral,
            zIndex: 2,
          }}
        />
        <Animated.View style={{ transform: [{ rotate: spinDeg }], marginTop: -2 }}>
          <Svg width={SIZE} height={SIZE} viewBox="0 0 100 100">
            <G>
              {tasks.map((t, i) => {
                const room = rooms.find((r) => r.id === t.roomId);
                const a0 = (i * slice - 90) * (Math.PI / 180);
                const a1 = ((i + 1) * slice - 90) * (Math.PI / 180);
                const x0 = 50 + 48 * Math.cos(a0);
                const y0 = 50 + 48 * Math.sin(a0);
                const x1 = 50 + 48 * Math.cos(a1);
                const y1 = 50 + 48 * Math.sin(a1);
                const large = slice > 180 ? 1 : 0;
                return (
                  <Path
                    key={t.id}
                    d={`M50 50 L${x0} ${y0} A48 48 0 ${large} 1 ${x1} ${y1} Z`}
                    fill={room?.color ?? colors.sage}
                    opacity={picked === i ? 1 : 0.82}
                    stroke={colors.bg}
                    strokeWidth={0.8}
                  />
                );
              })}
              <Circle cx={50} cy={50} r={13} fill={colors.bg} />
              <Circle cx={50} cy={50} r={5} fill={colors.coral} />
            </G>
          </Svg>
        </Animated.View>
      </View>

      <Spacer h={20} />

      {chosen ? (
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: radius.lg,
            padding: 16,
            width: '100%',
          }}
        >
          <Row style={{ gap: 10 }}>
            <EmojiTile emoji={chosenRoom?.emoji ?? '\u{2728}'} size={38} bg={colors.cardAlt} />
            <View style={{ flex: 1 }}>
              <T v="heading">{chosen.name}</T>
              <T v="caption">
                {chosenRoom?.name} · {chosen.minutes} min
              </T>
            </View>
          </Row>
          <Spacer h={14} />
          <Row style={{ gap: 8 }}>
            <Btn
              style={{ flex: 1 }}
              small
              label="Mark complete"
              onPress={() => {
                completeTask(chosen.id, { source: 'wheel' });
                router.back();
              }}
            />
            <Btn
              style={{ flex: 1 }}
              small
              tone="quiet"
              label="Focus on it"
              onPress={() => router.replace(`/focus?taskId=${chosen.id}`)}
            />
          </Row>
          <Spacer h={8} />
          <Btn small tone="ghost" label="Spin again" onPress={spin} />
        </View>
      ) : (
        <Btn
          label={spinning ? 'Spinning...' : tasks.length ? 'Spin the wheel' : 'Nothing to spin'}
          disabled={spinning || !tasks.length}
          onPress={spin}
          style={{ width: '100%' }}
        />
      )}

      <Spacer h={14} />
      <Pressable onPress={() => router.back()} style={{ padding: 10 }}>
        <T style={{ fontFamily: font.semi, color: '#C9BEA8' }}>Close</T>
      </Pressable>
    </View>
  );
}
