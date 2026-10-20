import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, Switch, View } from 'react-native';

import { playlists } from '../src/data/musicTracks';
import { mmss } from '../src/lib/date';
import { trackById, useMusic } from '../src/state/music';
import { colors, font, radius } from '../src/theme';
import { Bar, Card, Empty, IconBtn, Press, Row, Screen, Spacer, T, tap } from '../src/ui/base';

export default function Music() {
  const router = useRouter();
  const enabled = useMusic((s) => s.enabled);
  const setEnabled = useMusic((s) => s.setEnabled);
  const playlistId = useMusic((s) => s.playlistId);
  const choosePlaylist = useMusic((s) => s.choosePlaylist);
  const trackId = useMusic((s) => s.trackId);
  const playing = useMusic((s) => s.playing);
  const position = useMusic((s) => s.position);
  const shuffle = useMusic((s) => s.shuffle);
  const setShuffle = useMusic((s) => s.setShuffle);
  const volume = useMusic((s) => s.volume);
  const setVolume = useMusic((s) => s.setVolume);
  const playTrack = useMusic((s) => s.playTrack);
  const toggle = useMusic((s) => s.toggle);
  const next = useMusic((s) => s.next);
  const previous = useMusic((s) => s.previous);

  const list = playlists.find((p) => p.id === playlistId) ?? playlists[0];
  const track = trackById(trackId);

  if (!playlists.length) {
    return (
      <Screen>
        <Row style={{ justifyContent: 'space-between' }}>
          <IconBtn name="chevron-back" onPress={() => router.back()} />
          <T v="heading">Music</T>
          <View style={{ width: 38 }} />
        </Row>
        <Empty emoji={'\u{1F3B5}'} title="No music bundled" body="Run npm run music to add some." />
      </Screen>
    );
  }

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <IconBtn name="chevron-back" onPress={() => router.back()} />
        <T v="heading">Music</T>
        <View style={{ width: 38 }} />
      </Row>

      <Spacer h={10} />
      <T v="display" style={{ fontSize: 28 }}>
        Something in{'\n'}the background.
      </T>
      <Spacer h={6} />
      <T v="label">Plays on its own in Focus and Sprints. Keeps going when the screen sleeps.</T>

      {/* Now playing --------------------------------------------- */}
      <Spacer h={18} />
      <View
        style={{
          backgroundColor: colors.espresso,
          borderRadius: radius.xl,
          padding: 20,
        }}
      >
        <Row style={{ gap: 12 }}>
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: 15,
              backgroundColor: '#FFFFFF1A',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <T style={{ fontSize: 22 }}>{list.emoji}</T>
          </View>
          <View style={{ flex: 1 }}>
            <T v="heading" color={colors.onDark} numberOfLines={1}>
              {track?.title ?? 'Nothing playing'}
            </T>
            <T v="caption" color="#BCB1A0" numberOfLines={1}>
              {list.name}
            </T>
          </View>
        </Row>

        <Spacer h={14} />
        <Bar
          pct={track?.seconds ? (position / track.seconds) * 100 : 0}
          color={colors.sage}
          track="#FFFFFF20"
          height={4}
        />
        <Row style={{ justifyContent: 'space-between', marginTop: 6 }}>
          <T v="caption" color="#9F9484" style={{ fontSize: 10 }}>
            {mmss(position)}
          </T>
          <T v="caption" color="#9F9484" style={{ fontSize: 10 }}>
            {mmss(track?.seconds ?? 0)}
          </T>
        </Row>

        <Spacer h={12} />
        <Row style={{ justifyContent: 'center', gap: 22 }}>
          <Pressable hitSlop={10} onPress={() => { tap(); previous(); }}>
            <Ionicons name="play-skip-back" size={22} color="#D8CDBB" />
          </Pressable>
          <Pressable
            onPress={() => { tap(); toggle(); }}
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: colors.coral,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name={playing ? 'pause' : 'play'} size={24} color="#FFF8F2" />
          </Pressable>
          <Pressable hitSlop={10} onPress={() => { tap(); next(); }}>
            <Ionicons name="play-skip-forward" size={22} color="#D8CDBB" />
          </Pressable>
        </Row>

        <Spacer h={16} />
        <Row style={{ gap: 12 }}>
          <Ionicons name="volume-low" size={15} color="#9F9484" />
          <View style={{ flex: 1, flexDirection: 'row', gap: 4 }}>
            {[0.2, 0.4, 0.6, 0.8, 1].map((v) => (
              <Pressable
                key={v}
                onPress={() => { tap(); setVolume(v); }}
                style={{
                  flex: 1,
                  height: 22,
                  justifyContent: 'center',
                }}
              >
                <View
                  style={{
                    height: 5,
                    borderRadius: 3,
                    backgroundColor: volume >= v - 0.001 ? colors.sage : '#FFFFFF22',
                  }}
                />
              </Pressable>
            ))}
          </View>
          <Pressable hitSlop={8} onPress={() => { tap(); setShuffle(!shuffle); }}>
            <Ionicons name="shuffle" size={17} color={shuffle ? colors.sage : '#7C7264'} />
          </Pressable>
        </Row>
      </View>

      {/* Playlists ------------------------------------------------ */}
      <Spacer h={20} />
      <T v="over">Playlists</T>
      <Spacer h={9} />
      <Row style={{ gap: 8, flexWrap: 'wrap' }}>
        {playlists.map((p) => {
          const active = p.id === playlistId;
          return (
            <Pressable
              key={p.id}
              onPress={() => { tap(); choosePlaylist(p.id); }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 7,
                paddingVertical: 9,
                paddingHorizontal: 13,
                borderRadius: radius.pill,
                backgroundColor: active ? colors.sage : colors.card,
                borderWidth: 1,
                borderColor: active ? colors.sage : colors.line,
              }}
            >
              <T style={{ fontSize: 14 }}>{p.emoji}</T>
              <T
                style={{
                  fontFamily: font.semi,
                  fontSize: 13,
                  color: active ? '#FFF8F2' : colors.inkSoft,
                }}
              >
                {p.name}
              </T>
            </Pressable>
          );
        })}
      </Row>
      <Spacer h={8} />
      <T v="caption">{list.blurb}</T>

      {/* Tracks --------------------------------------------------- */}
      <Spacer h={16} />
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {list.tracks.map((t, i) => {
          const on = t.id === trackId;
          return (
            <Press
              key={t.id}
              onPress={() => playTrack(t.id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 14,
                borderTopWidth: i ? 1 : 0,
                borderTopColor: colors.lineSoft,
                backgroundColor: on ? colors.sageSoft : 'transparent',
              }}
            >
              <Ionicons
                name={on && playing ? 'volume-medium' : 'musical-note'}
                size={15}
                color={on ? colors.sageDeep : colors.inkMuted}
              />
              <T v="heading" style={{ flex: 1, fontSize: 14 }} numberOfLines={1}>
                {t.title}
              </T>
              <T v="caption">{mmss(t.seconds)}</T>
            </Press>
          );
        })}
      </Card>

      <Spacer h={16} />
      <Card style={{ padding: 15 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <T v="heading" style={{ fontSize: 14.5 }}>
              Play music automatically
            </T>
            <T v="caption">
              Starts on its own when a task appears in Focus or a Sprint begins.
            </T>
          </View>
          <Switch
            value={enabled}
            onValueChange={(v) => { tap(); setEnabled(v); }}
            trackColor={{ true: colors.sage, false: colors.line }}
            thumbColor="#FFF"
          />
        </Row>
      </Card>

      <Spacer h={14} />
      <T v="caption" center>
        {playlists.reduce((n, p) => n + p.tracks.length, 0)} tracks, all on the device.{'\n'}
        Nothing streams, nothing is tracked.
      </T>
    </Screen>
  );
}
