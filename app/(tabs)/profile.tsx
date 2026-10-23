import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Switch, View, useWindowDimensions } from 'react-native';

import { useStats } from '../../src/state/derived';
import { useStore } from '../../src/state/store';
import { colors, font } from '../../src/theme';
import { Card, Divider, Press, Row, Screen, Spacer, T, tap } from '../../src/ui/base';
import { ScreenGarland } from '../../src/ui/Decor';
import { Splashes } from '../../src/ui/PixelSplash';

export default function Profile() {
  const petMode = useStore((s) => !!s.settings.petMode);
  const petCount = useStore((s) => (s.pets ?? []).length);
  const { width: W } = useWindowDimensions();
  const router = useRouter();
  const settings = useStore((s) => s.settings);
  const coins = useStore((s) => s.coins);
  const toggleVacation = useStore((s) => s.toggleVacation);
  const stats = useStats();

  return (
    <Screen>
      <Splashes width={Math.min(W, 520)} spots={[{ x: 0.86, y: 140, size: 150 }, { x: 0.08, y: 580, size: 130, tone: 'sage' }]} />
      <ScreenGarland seed={9} />
      <Row style={{ gap: 14 }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.coral,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <T v="display" color="#FFF8F2" style={{ fontSize: 24 }}>
            {(settings.householdName || 'T').trim().charAt(0).toUpperCase()}
          </T>
        </View>
        <View style={{ flex: 1 }}>
          <T v="title">{settings.householdName}</T>
          <T v="caption">
            {settings.floors.length === 1 ? 'One floor' : `${settings.floors.length} floors`} ·{' '}
            {coins} coins
          </T>
        </View>
      </Row>

      <Spacer h={18} />
      <Card style={{ padding: 16 }}>
        <T v="over">This week</T>
        <Spacer h={12} />
        <Row style={{ justifyContent: 'space-around' }}>
          <Stat value={`${stats.tasks}`} label="Tasks completed" />
          <Stat value={`${stats.minutes}`} label="Minutes cleaned" />
          <Stat value={`${stats.streak}`} label="Day streak" />
        </Row>
      </Card>

      <Spacer h={16} />
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <MenuRow icon="stats-chart" label="Insights" hint="Your week, room by room" onPress={() => router.push('/insights')} />
        {petMode ? (
          <MenuRow icon="paw" label="Pets" hint={petCount ? `${petCount} ${petCount === 1 ? 'pet' : 'pets'} · care and supplies` : 'Add your pets'} onPress={() => router.push('/pets')} />
        ) : null}
        <MenuRow icon="heart" label="How you've been" hint="Check-ins, energy and activity over time" onPress={() => router.push('/mood-data')} />
        <Divider />
        <MenuRow icon="trophy" label="Challenges" hint="16 checklists + your own" onPress={() => router.push('/challenges')} />
        <Divider />
        <MenuRow icon="ribbon" label="Achievements" hint="Quietly waiting for you" onPress={() => router.push('/achievements')} />
        <Divider />
        <MenuRow icon="sparkles" label="Sticker draws" hint={`${coins} coins to spend`} onPress={() => router.push('/shop')} />
        <Divider />
        <MenuRow icon="home" label="Home layout" hint="Rooms, floors, moving house" onPress={() => router.push('/layout')} />
      </Card>

      <Spacer h={12} />
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <MenuRow icon="restaurant" label="Kitchen" hint="Pantry, cooking plan, recipe book" onPress={() => router.push('/kitchen')} />
        <Divider />
        <MenuRow icon="cart" label="Shopping list" onPress={() => router.push('/shopping')} />
        <Divider />
        <MenuRow icon="file-tray-stacked" label="Shelves" hint="What is still in the fridge" onPress={() => router.push('/pantry')} />
        <Divider />
        <MenuRow icon="bookmark" label="Pinned info" hint="Wifi codes, bin days, the boiler" onPress={() => router.push('/notes')} />
        <Divider />
        <MenuRow icon="musical-notes" label="Music" hint="Playlists for cleaning" onPress={() => router.push('/music')} />
      </Card>

      <Spacer h={12} />
      <Card style={{ padding: 16 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <T v="heading">Vacation mode</T>
            <T v="caption">
              Freezes every cleanliness bar where it is. Nothing decays, no streak breaks.
            </T>
          </View>
          <Switch
            value={settings.vacation}
            onValueChange={() => {
              tap();
              toggleVacation();
            }}
            trackColor={{ true: colors.sage, false: colors.line }}
            thumbColor="#FFF"
          />
        </Row>
      </Card>

      <Spacer h={12} />
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <MenuRow icon="settings" label="Settings" hint="Budget, days, reminders" onPress={() => router.push('/settings')} />
        <Divider />
        <MenuRow icon="information-circle" label="About Homeorg<3" onPress={() => router.push('/about')} />
      </Card>

      <Spacer h={20} />
      <T v="caption" center>
        Everything lives on this device.{'\n'}No account, no server, no sync.
      </T>
    </Screen>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <T style={{ fontFamily: font.display, fontSize: 26, color: colors.ink }}>{value}</T>
      <T v="caption" center style={{ fontSize: 10.5 }}>
        {label}
      </T>
    </View>
  );
}

function MenuRow({
  icon,
  label,
  hint,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint?: string;
  onPress: () => void;
}) {
  return (
    <Press onPress={onPress}>
      <Row style={{ padding: 15, gap: 13 }}>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            backgroundColor: colors.cardAlt,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={icon} size={15} color={colors.inkSoft} />
        </View>
        <View style={{ flex: 1 }}>
          <T v="heading" style={{ fontSize: 14.5 }}>
            {label}
          </T>
          {hint ? <T v="caption">{hint}</T> : null}
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.inkMuted} />
      </Row>
    </Press>
  );
}
