import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { homeTypes, roomTypes, startingConditions } from '../src/data/roomTypes';
import { NewRoomInput, useStore } from '../src/state/store';
import { colors, font, radius, shadow } from '../src/theme';
import { Btn, Card, Chip, EmojiTile, Row, Spacer, T, tap } from '../src/ui/base';

const WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function Welcome() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const createHome = useStore((s) => s.createHome);
  const patchSettings = useStore((s) => s.patchSettings);

  const [step, setStep] = useState(0);
  const [name, setName] = useState('Your Sanctuary');
  const [homeType, setHomeType] = useState('flat');
  const [counts, setCounts] = useState<Record<string, number>>({
    kitchen: 1,
    living: 1,
    bathroom: 1,
    bedroom: 1,
  });
  const [floorOf, setFloorOf] = useState<Record<string, number>>({});
  const [condition, setCondition] = useState(0.5);
  const [budget, setBudget] = useState(30);
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);

  const home = homeTypes.find((h) => h.id === homeType)!;
  const floors = home.floors;

  const chosen = useMemo(() => {
    const out: { key: string; typeId: string; name: string; emoji: string }[] = [];
    for (const rt of roomTypes) {
      const n = counts[rt.id] ?? 0;
      for (let i = 0; i < n; i++) {
        out.push({
          key: `${rt.id}-${i}`,
          typeId: rt.id,
          name: n > 1 ? `${rt.name} ${i + 1}` : rt.name,
          emoji: rt.emoji,
        });
      }
    }
    return out;
  }, [counts]);

  const totalChores = useMemo(
    () =>
      chosen.reduce(
        (sum, r) => sum + (roomTypes.find((t) => t.id === r.typeId)?.chores.filter((c) => c.on).length ?? 0),
        0,
      ),
    [chosen],
  );

  const steps = floors.length > 1 ? 6 : 5;
  const stepIndex = floors.length > 1 ? step : step >= 3 ? step + 1 : step;

  function next() {
    tap();
    if (step === steps - 1) return finish();
    setStep((s) => s + 1);
  }

  function finish() {
    const rooms: NewRoomInput[] = chosen.map((r) => {
      const type = roomTypes.find((t) => t.id === r.typeId)!;
      return {
        typeId: r.typeId,
        name: r.name,
        emoji: r.emoji,
        floor: floorOf[r.key] ?? 0,
        condition,
        chores: type.chores
          .filter((c) => c.on)
          .map((c) => ({
            name: c.name,
            minutes: c.minutes,
            effort: c.effort,
            every: c.every,
            unit: c.unit,
          })),
      };
    });
    createHome(homeType, floors, rooms, name.trim());
    patchSettings({ dailyBudget: budget, preferredDays: days });
    router.replace('/');
  }

  const canNext =
    (stepIndex === 2 && chosen.length === 0) || (stepIndex === 0 && !name.trim()) ? false : true;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 10 }}>
      <Row style={{ paddingHorizontal: 20, gap: 5 }}>
        {Array.from({ length: steps }).map((_, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 4,
              backgroundColor: i <= step ? colors.sage : colors.lineSoft,
            }}
          />
        ))}
      </Row>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        {stepIndex === 0 ? (
          <View>
            <Spacer h={30} />
            <T v="over">Welcome to Homeorg&lt;3</T>
            <Spacer h={8} />
            <T v="display" style={{ fontSize: 38, lineHeight: 42 }}>
              Your home,{'\n'}on autopilot.
            </T>
            <Spacer h={12} />
            <T v="body" style={{ fontSize: 15, lineHeight: 22 }}>
              A chore tracker that keeps everything on your phone. No account, no server, no
              missed-day shame. Let's set up your rooms.
            </T>
            <Spacer h={28} />
            <T v="over">What shall we call it?</T>
            <Spacer h={8} />
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your Sanctuary"
              placeholderTextColor={colors.inkMuted}
              style={{
                backgroundColor: colors.card,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.line,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontFamily: font.semi,
                fontSize: 16,
                color: colors.ink,
              }}
            />
            <Spacer h={20} />
            <Row style={{ gap: 10 }}>
              <Ionicons name="lock-closed-outline" size={16} color={colors.sage} />
              <T v="label" style={{ flex: 1 }}>
                Everything lives on this device. Nothing is uploaded, ever.
              </T>
            </Row>
          </View>
        ) : null}

        {stepIndex === 1 ? (
          <View>
            <Spacer h={16} />
            <T v="over">Step 2</T>
            <Spacer h={6} />
            <T v="display">What sort of place?</T>
            <Spacer h={6} />
            <T v="body">This decides the floors your dollhouse gets.</T>
            <Spacer h={18} />
            {homeTypes.map((h) => {
              const active = homeType === h.id;
              return (
                <Pressable
                  key={h.id}
                  onPress={() => {
                    tap();
                    setHomeType(h.id);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    backgroundColor: active ? colors.sageSoft : colors.card,
                    borderWidth: 1.5,
                    borderColor: active ? colors.sage : colors.lineSoft,
                    borderRadius: radius.lg,
                    padding: 14,
                    marginBottom: 10,
                  }}
                >
                  <EmojiTile emoji={h.emoji} size={42} bg={colors.bgDeep} />
                  <View style={{ flex: 1 }}>
                    <T v="heading">{h.name}</T>
                    <T v="caption">{h.floors.join(' · ')}</T>
                  </View>
                  {active ? (
                    <Ionicons name="checkmark-circle" size={22} color={colors.sage} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {stepIndex === 2 ? (
          <View>
            <Spacer h={16} />
            <T v="over">Step 3</T>
            <Spacer h={6} />
            <T v="display">Which rooms?</T>
            <Spacer h={6} />
            <T v="body">
              Each one arrives with its usual chores already set up. You can edit any of them later.
            </T>
            <Spacer h={18} />
            {roomTypes
              .filter((r) => r.id !== 'custom')
              .map((rt) => {
                const n = counts[rt.id] ?? 0;
                return (
                  <View
                    key={rt.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      backgroundColor: n ? colors.card : 'transparent',
                      borderWidth: 1,
                      borderColor: n ? colors.line : colors.lineSoft,
                      borderRadius: radius.md,
                      padding: 10,
                      marginBottom: 8,
                    }}
                  >
                    <EmojiTile emoji={rt.emoji} size={36} bg={colors.bgDeep} />
                    <View style={{ flex: 1 }}>
                      <T v="heading" style={{ fontSize: 15 }}>
                        {rt.name}
                      </T>
                      <T v="caption">{rt.chores.filter((c) => c.on).length} usual chores</T>
                    </View>
                    <Row style={{ gap: 4 }}>
                      <Pressable
                        hitSlop={8}
                        onPress={() => {
                          tap();
                          setCounts((c) => ({ ...c, [rt.id]: Math.max(0, (c[rt.id] ?? 0) - 1) }));
                        }}
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 15,
                          backgroundColor: colors.cardAlt,
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: n ? 1 : 0.4,
                        }}
                      >
                        <Ionicons name="remove" size={16} color={colors.ink} />
                      </Pressable>
                      <T v="heading" style={{ width: 20, textAlign: 'center' }}>
                        {n}
                      </T>
                      <Pressable
                        hitSlop={8}
                        onPress={() => {
                          tap();
                          setCounts((c) => ({ ...c, [rt.id]: Math.min(6, (c[rt.id] ?? 0) + 1) }));
                        }}
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 15,
                          backgroundColor: colors.sageSoft,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name="add" size={16} color={colors.sageDeep} />
                      </Pressable>
                    </Row>
                  </View>
                );
              })}
            <Spacer h={8} />
            <T v="caption">
              {chosen.length} rooms · about {totalChores} chores to start
            </T>
          </View>
        ) : null}

        {stepIndex === 3 ? (
          <View>
            <Spacer h={16} />
            <T v="over">Step 4</T>
            <Spacer h={6} />
            <T v="display">Which floor?</T>
            <Spacer h={6} />
            <T v="body">Tap to move a room between floors.</T>
            <Spacer h={18} />
            {chosen.map((r) => (
              <Row key={r.key} style={{ marginBottom: 10, gap: 10 }}>
                <EmojiTile emoji={r.emoji} size={34} bg={colors.cardAlt} />
                <T v="heading" style={{ flex: 1, fontSize: 14 }}>
                  {r.name}
                </T>
                <Row style={{ gap: 6 }}>
                  {floors.map((f, i) => (
                    <Chip
                      key={f}
                      small
                      label={f}
                      active={(floorOf[r.key] ?? 0) === i}
                      onPress={() => setFloorOf((m) => ({ ...m, [r.key]: i }))}
                    />
                  ))}
                </Row>
              </Row>
            ))}
          </View>
        ) : null}

        {stepIndex === 4 ? (
          <View>
            <Spacer h={16} />
            <T v="over">Step {floors.length > 1 ? 5 : 4}</T>
            <Spacer h={6} />
            <T v="display">How is it looking?</T>
            <Spacer h={6} />
            <T v="body">
              This just sets where everything starts on the cleanliness line. Nothing is judged.
            </T>
            <Spacer h={18} />
            {startingConditions.map((sc) => {
              const active = condition === sc.progress;
              return (
                <Pressable
                  key={sc.id}
                  onPress={() => {
                    tap();
                    setCondition(sc.progress);
                  }}
                  style={{
                    backgroundColor: active ? colors.sageSoft : colors.card,
                    borderWidth: 1.5,
                    borderColor: active ? colors.sage : colors.lineSoft,
                    borderRadius: radius.lg,
                    padding: 16,
                    marginBottom: 10,
                  }}
                >
                  <T v="heading">{sc.name}</T>
                  <T v="caption">{sc.hint}</T>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {stepIndex === 5 ? (
          <View>
            <Spacer h={16} />
            <T v="over">Last step</T>
            <Spacer h={6} />
            <T v="display">How long a day?</T>
            <Spacer h={6} />
            <T v="body">
              Today never shows more than this. Everything else waits in a drawer below the list.
            </T>
            <Spacer h={18} />
            <Row style={{ gap: 8, flexWrap: 'wrap' }}>
              {[15, 30, 60, 90].map((b) => (
                <Chip key={b} label={`${b} min`} active={budget === b} onPress={() => setBudget(b)} />
              ))}
            </Row>
            <Spacer h={24} />
            <T v="over">Your usual cleaning days</T>
            <Spacer h={8} />
            <Row style={{ gap: 6 }}>
              {WEEK.map((d, i) => {
                const on = days.includes(i);
                return (
                  <Pressable
                    key={i}
                    onPress={() => {
                      tap();
                      setDays((prev) =>
                        prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i],
                      );
                    }}
                    style={{
                      flex: 1,
                      aspectRatio: 1,
                      borderRadius: radius.md,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: on ? colors.sage : colors.card,
                      borderWidth: 1,
                      borderColor: on ? colors.sage : colors.line,
                    }}
                  >
                    <T v="heading" color={on ? '#FFF' : colors.inkMuted}>
                      {d}
                    </T>
                  </Pressable>
                );
              })}
            </Row>
            <Spacer h={10} />
            <T v="caption">
              Days you leave off get half the budget. Pick none and every day is the same.
            </T>
            <Spacer h={22} />
            <Card soft>
              <T v="heading">You're all set</T>
              <Spacer h={4} />
              <T v="body">
                {chosen.length} rooms, about {totalChores} chores, {budget} minutes a day.
              </T>
            </Card>
          </View>
        ) : null}
      </ScrollView>

      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: insets.bottom + 12,
          backgroundColor: colors.bg,
          borderTopWidth: 1,
          borderTopColor: colors.lineSoft,
          flexDirection: 'row',
          gap: 10,
          ...shadow.card,
        }}
      >
        {step > 0 ? (
          <Btn label="Back" tone="quiet" full={false} onPress={() => setStep((s) => s - 1)} />
        ) : null}
        <Btn
          style={{ flex: 1 }}
          label={step === steps - 1 ? 'Create my home' : 'Continue'}
          disabled={!canNext}
          onPress={next}
        />
      </View>
    </View>
  );
}
