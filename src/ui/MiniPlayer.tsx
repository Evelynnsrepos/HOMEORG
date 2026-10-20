import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';

import { playlists } from '../data/musicTracks';
import { trackById, useMusic } from '../state/music';
import { colors, radius } from '../theme';
import { Row, T, tap } from './base';

/** The little bar in Focus and Sprint. Tap it to open the full list. */
export function MiniPlayer({ dark = false }: { dark?: boolean }) {
  const router = useRouter();
  const enabled = useMusic((s) => s.enabled);
  const playing = useMusic((s) => s.playing);
  const trackId = useMusic((s) => s.trackId);
  const playlistId = useMusic((s) => s.playlistId);
  const toggle = useMusic((s) => s.toggle);
  const next = useMusic((s) => s.next);

  if (!enabled) return null;

  const track = trackById(trackId);
  const list = playlists.find((p) => p.id === playlistId);
  const fg = dark ? colors.onDark : colors.ink;
  const sub = dark ? '#BCB1A0' : colors.inkMuted;

  return (
    <Pressable
      onPress={() => {
        tap();
        router.push('/music');
      }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: dark ? '#00000033' : colors.card,
        borderWidth: dark ? 0 : 1,
        borderColor: colors.lineSoft,
        borderRadius: radius.pill,
        paddingVertical: 8,
        paddingHorizontal: 12,
      }}
    >
      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: 13,
          backgroundColor: dark ? '#FFFFFF22' : colors.sageSoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <T style={{ fontSize: 13 }}>{list?.emoji ?? '\u{1F3B5}'}</T>
      </View>

      <View style={{ flex: 1 }}>
        <T v="heading" style={{ fontSize: 12.5 }} color={fg} numberOfLines={1}>
          {track?.title ?? 'Nothing playing'}
        </T>
        <T v="caption" style={{ fontSize: 10 }} color={sub} numberOfLines={1}>
          {list?.name}
        </T>
      </View>

      <Row style={{ gap: 2 }}>
        <Pressable
          hitSlop={8}
          onPress={() => {
            tap();
            toggle();
          }}
          style={{ padding: 5 }}
        >
          <Ionicons name={playing ? 'pause' : 'play'} size={16} color={fg} />
        </Pressable>
        <Pressable
          hitSlop={8}
          onPress={() => {
            tap();
            next();
          }}
          style={{ padding: 5 }}
        >
          <Ionicons name="play-skip-forward" size={15} color={sub} />
        </Pressable>
      </Row>
    </Pressable>
  );
}
