import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { playlists, type Track } from '../data/musicTracks';

interface MusicState {
  /** master switch — when off, nothing ever starts on its own */
  enabled: boolean;
  playlistId: string;
  trackId: string | null;
  shuffle: boolean;
  volume: number;

  // transient
  playing: boolean;
  position: number;
  /** true when a screen started the music, so leaving that screen stops it */
  startedByScreen: boolean;
}

interface MusicActions {
  setEnabled: (v: boolean) => void;
  setShuffle: (v: boolean) => void;
  setVolume: (v: number) => void;
  choosePlaylist: (id: string) => void;
  playTrack: (trackId: string, byScreen?: boolean) => void;
  toggle: () => void;
  next: () => void;
  previous: () => void;
  stop: () => void;
  /** Focus and Sprint call this on the way in and out. */
  screenEnter: () => void;
  screenLeave: () => void;
  /** engine only */
  setPlaying: (v: boolean) => void;
  setPosition: (v: number) => void;
}

export type MusicStore = MusicState & MusicActions;

function listOf(id: string) {
  return playlists.find((p) => p.id === id) ?? playlists[0];
}

function pick(playlistId: string, currentId: string | null, shuffle: boolean, step: 1 | -1): Track {
  const list = listOf(playlistId).tracks;
  const at = list.findIndex((t) => t.id === currentId);
  if (shuffle && list.length > 1) {
    let n = at;
    while (n === at) n = Math.floor(Math.random() * list.length);
    return list[n];
  }
  const nextAt = at < 0 ? 0 : (at + step + list.length) % list.length;
  return list[nextAt];
}

export const useMusic = create<MusicStore>()(
  persist(
    (set, get) => ({
      enabled: true,
      playlistId: playlists[0]?.id ?? '',
      trackId: playlists[0]?.tracks[0]?.id ?? null,
      shuffle: true,
      volume: 0.7,
      playing: false,
      position: 0,
      startedByScreen: false,

      setEnabled: (enabled) => {
        set({ enabled });
        if (!enabled) set({ playing: false, startedByScreen: false });
      },
      setShuffle: (shuffle) => set({ shuffle }),
      setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),

      choosePlaylist: (playlistId) => {
        const first = listOf(playlistId).tracks[0];
        set({ playlistId, trackId: first?.id ?? null, position: 0 });
      },

      playTrack: (trackId, byScreen = false) =>
        set({ trackId, playing: true, position: 0, startedByScreen: byScreen }),

      toggle: () => {
        const s = get();
        set({ playing: !s.playing, startedByScreen: s.playing ? s.startedByScreen : false });
      },

      next: () => {
        const s = get();
        set({ trackId: pick(s.playlistId, s.trackId, s.shuffle, 1).id, position: 0, playing: true });
      },

      previous: () => {
        const s = get();
        set({ trackId: pick(s.playlistId, s.trackId, s.shuffle, -1).id, position: 0, playing: true });
      },

      stop: () => set({ playing: false, startedByScreen: false }),

      screenEnter: () => {
        const s = get();
        if (!s.enabled || s.playing || !s.trackId) return;
        set({ playing: true, startedByScreen: true });
      },

      screenLeave: () => {
        const s = get();
        if (s.startedByScreen) set({ playing: false, startedByScreen: false });
      },

      setPlaying: (playing) => set({ playing }),
      setPosition: (position) => set({ position }),
    }),
    {
      name: 'tidywell-music',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        enabled: s.enabled,
        playlistId: s.playlistId,
        trackId: s.trackId,
        shuffle: s.shuffle,
        volume: s.volume,
      }),
    },
  ),
);

export function currentTrack(): Track | undefined {
  const { playlistId, trackId } = useMusic.getState();
  return listOf(playlistId).tracks.find((t) => t.id === trackId);
}

export function trackById(id: string | null): Track | undefined {
  if (!id) return undefined;
  for (const p of playlists) {
    const t = p.tracks.find((x) => x.id === id);
    if (t) return t;
  }
  return undefined;
}
