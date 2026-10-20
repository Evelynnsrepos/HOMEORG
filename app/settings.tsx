import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Platform, Pressable, Switch, TextInput, View } from 'react-native';

import { describeBackup, exportBackup, NotABackup, parseBackup, restoreBackup } from '../src/lib/backup';
import { humanMinutes } from '../src/lib/date';
import { cancelDailyReminder, scheduleDailyReminder } from '../src/lib/notify';
import { useMusic } from '../src/state/music';
import { useToday } from '../src/state/derived';
import { useStore } from '../src/state/store';
import { colors, font, radius } from '../src/theme';
import { Btn, Card, Chip, Divider, IconBtn, Press, Row, Screen, Spacer, T, tap } from '../src/ui/base';

const WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function Settings() {
  const router = useRouter();
  const settings = useStore((s) => s.settings);
  const patch = useStore((s) => s.patchSettings);
  const reset = useStore((s) => s.resetEverything);
  const plan = useToday();
  const musicOn = useMusic((m) => m.enabled);

  const [custom, setCustom] = useState(`${settings.dailyBudget}`);
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);
  const [customOpen, setCustomOpen] = useState(![15, 30, 60, 90].includes(settings.dailyBudget));

  async function setReminder(on: boolean) {
    if (!on) {
      await cancelDailyReminder();
      patch({ reminderOn: false });
      return;
    }
    const body = plan.tasks.length
      ? `${plan.tasks.length} on the list, about ${humanMinutes(plan.minutes)}.`
      : 'Nothing due — the house is fine.';
    const ok = await scheduleDailyReminder(settings.reminderHour, settings.reminderMinute, body);
    if (!ok) {
      Alert.alert(
        'Notifications are off',
        'Turn them on for Homeorg<3 in your phone settings, then try again.',
      );
      return;
    }
    patch({ reminderOn: true });
  }

  async function exportData() {
    setBusy('export');
    try {
      await exportBackup();
    } catch {
      Alert.alert('Export failed', "The backup file couldn't be written. Try again in a moment.");
    } finally {
      setBusy(null);
    }
  }

  async function importData() {
    const res = await DocumentPicker.getDocumentAsync({
      type: ['application/json', 'text/plain', 'application/octet-stream'],
      copyToCacheDirectory: true,
    });
    if (res.canceled || !res.assets[0]) return;
    const asset = res.assets[0];

    setBusy('import');
    let backup;
    try {
      const text =
        Platform.OS === 'web' && asset.file ? await asset.file.text() : await new File(asset.uri).text();
      backup = parseBackup(text);
    } catch (e) {
      Alert.alert(
        'Not a backup',
        e instanceof NotABackup && e.message === 'made by a newer app'
          ? 'That backup comes from a newer version of the app. Update this one first.'
          : 'That file isn\'t a Homeorg<3 backup. Pick the .json file you exported.',
      );
      return;
    } finally {
      setBusy(null);
    }

    Alert.alert(
      'Replace everything?',
      `${describeBackup(backup)}\n\nWhat is on this phone now gets replaced by the backup.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          style: 'destructive',
          onPress: async () => {
            restoreBackup(backup);
            const s = useStore.getState().settings;
            // a reminder only exists on the phone that scheduled it
            if (s.reminderOn) {
              const ok = await scheduleDailyReminder(s.reminderHour, s.reminderMinute, 'Your list is waiting.');
              if (!ok) patch({ reminderOn: false });
            } else {
              await cancelDailyReminder();
            }
            Alert.alert('Welcome back', 'Everything from the backup is in place.');
          },
        },
      ],
    );
  }

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <IconBtn name="chevron-back" onPress={() => router.back()} />
        <T v="heading">Settings</T>
        <View style={{ width: 38 }} />
      </Row>

      <Spacer h={16} />
      <Card style={{ padding: 16 }}>
        <T v="over">Household name</T>
        <Spacer h={8} />
        <TextInput
          value={settings.householdName}
          onChangeText={(householdName) => patch({ householdName })}
          style={{
            backgroundColor: colors.cardAlt,
            borderRadius: radius.md,
            paddingHorizontal: 14,
            paddingVertical: 11,
            fontFamily: font.semi,
            fontSize: 15,
            color: colors.ink,
          }}
        />
      </Card>

      <Spacer h={14} />
      <Card style={{ padding: 16 }}>
        <T v="over">Daily time budget</T>
        <Spacer h={5} />
        <T v="caption">
          Today never shows more than this. Anything over waits in "Got more time?".
        </T>
        <Spacer h={12} />
        <Row style={{ gap: 8, flexWrap: 'wrap' }}>
          {[15, 30, 60, 90].map((b) => (
            <Chip
              key={b}
              label={`${b} min`}
              active={!customOpen && settings.dailyBudget === b}
              onPress={() => {
                setCustomOpen(false);
                patch({ dailyBudget: b });
              }}
            />
          ))}
          <Chip label="Custom" active={customOpen} onPress={() => setCustomOpen(true)} />
        </Row>
        {customOpen ? (
          <>
            <Spacer h={12} />
            <Row style={{ gap: 8 }}>
              <TextInput
                value={custom}
                onChangeText={setCustom}
                keyboardType="number-pad"
                style={{
                  flex: 1,
                  backgroundColor: colors.cardAlt,
                  borderRadius: radius.md,
                  paddingHorizontal: 14,
                  paddingVertical: 11,
                  fontFamily: font.semi,
                  fontSize: 15,
                  color: colors.ink,
                }}
              />
              <Btn
                small
                full={false}
                label="Set"
                onPress={() => {
                  const n = Math.max(5, Math.min(240, parseInt(custom, 10) || 30));
                  setCustom(`${n}`);
                  patch({ dailyBudget: n });
                }}
              />
            </Row>
            <Spacer h={6} />
            <T v="caption">Anything from 5 to 240 minutes.</T>
          </>
        ) : null}
      </Card>

      <Spacer h={14} />
      <Card style={{ padding: 16 }}>
        <T v="over">Your usual cleaning days</T>
        <Spacer h={5} />
        <T v="caption">
          Days you leave off get half the budget. Pick none and every day is the same.
        </T>
        <Spacer h={12} />
        <Row style={{ gap: 6 }}>
          {WEEK.map((d, i) => {
            const on = settings.preferredDays.includes(i);
            return (
              <Pressable
                key={i}
                onPress={() => {
                  tap();
                  patch({
                    preferredDays: on
                      ? settings.preferredDays.filter((x) => x !== i)
                      : [...settings.preferredDays, i],
                  });
                }}
                style={{
                  flex: 1,
                  aspectRatio: 1,
                  borderRadius: radius.md,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: on ? colors.sage : colors.cardAlt,
                }}
              >
                <T v="heading" color={on ? '#FFF' : colors.inkMuted}>
                  {d}
                </T>
              </Pressable>
            );
          })}
        </Row>
      </Card>

      <Spacer h={14} />
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <Toggle
          label="Group Today by room"
          hint="Off shows one flat list, most urgent first"
          value={settings.groupByRooms}
          onChange={(groupByRooms) => patch({ groupByRooms })}
        />
        <Divider />
        <Press onPress={() => router.push('/music')}>
          <Row style={{ padding: 15, justifyContent: 'space-between' }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <T v="heading" style={{ fontSize: 14.5 }}>
                Sound
              </T>
              <T v="caption">Playlists, volume, and whether music starts on its own</T>
            </View>
            <T v="label" color={colors.coralDeep}>
              {musicOn ? 'On' : 'Off'}
            </T>
          </Row>
        </Press>
        <Divider />
        <Toggle
          label="Haptics"
          hint="A little tap when something lands"
          value={settings.haptics}
          onChange={(haptics) => patch({ haptics })}
        />
        <Divider />
        <Toggle
          label="Look barcodes up online"
          hint="The only thing this app ever sends: the number on the packet, to Open Food Facts"
          value={settings.lookupOnline}
          onChange={(lookupOnline) => patch({ lookupOnline })}
        />
        <Divider />
        <Toggle
          label="Daily reminder"
          hint={`Once a day at ${settings.reminderHour}:${`${settings.reminderMinute}`.padStart(2, '0')}`}
          value={settings.reminderOn}
          onChange={setReminder}
        />
      </Card>

      <Spacer h={14} />
      <Card style={{ padding: 16 }}>
        <T v="over">Reminder time</T>
        <Spacer h={10} />
        <Row style={{ gap: 7, flexWrap: 'wrap' }}>
          {[7, 8, 9, 12, 17, 18, 20].map((h) => (
            <Chip
              key={h}
              small
              label={`${h}:00`}
              active={settings.reminderHour === h && settings.reminderMinute === 0}
              onPress={async () => {
                patch({ reminderHour: h, reminderMinute: 0 });
                if (settings.reminderOn) {
                  await scheduleDailyReminder(h, 0, 'Your list is waiting.');
                }
              }}
            />
          ))}
        </Row>
      </Card>

      <Spacer h={14} />
      <Card style={{ padding: 16 }}>
        <T v="over">Your data</T>
        <Spacer h={8} />
        <T v="caption">
          Export saves your whole household in one file: rooms, chores, history, coins, furniture,
          challenges, recipes, shelves, lists, notes and settings. Keep it somewhere safe, then
          import it on a new phone or a new version of the app. Before and after photos stay on
          this phone.
        </T>
        <Spacer h={14} />
        <Btn
          label="Export data"
          icon="share-outline"
          tone="sage"
          loading={busy === 'export'}
          onPress={exportData}
          disabled={busy !== null}
        />
        <Spacer h={8} />
        <Btn
          label="Import data"
          icon="download-outline"
          tone="quiet"
          loading={busy === 'import'}
          onPress={importData}
          disabled={busy !== null}
        />
      </Card>

      <Spacer h={14} />
      <Card style={{ padding: 16 }}>
        <T v="over">Danger zone</T>
        <Spacer h={8} />
        <T v="caption">
          Wipes every room, chore, completion, coin and piece of furniture on this device. There is
          no server, so export your data first if you want to keep it.
        </T>
        <Spacer h={14} />
        <Btn
          label="Start completely over"
          tone="quiet"
          onPress={() =>
            Alert.alert('Start over?', 'Everything on this device goes. This cannot be undone.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Erase everything',
                style: 'destructive',
                onPress: () => {
                  reset();
                  router.replace('/welcome');
                },
              },
            ])
          }
        />
      </Card>
    </Screen>
  );
}

function Toggle({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Row style={{ padding: 15, justifyContent: 'space-between' }}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <T v="heading" style={{ fontSize: 14.5 }}>
          {label}
        </T>
        {hint ? <T v="caption">{hint}</T> : null}
      </View>
      <Switch
        value={value}
        onValueChange={(v) => {
          tap();
          onChange(v);
        }}
        trackColor={{ true: colors.sage, false: colors.line }}
        thumbColor="#FFF"
      />
    </Row>
  );
}
