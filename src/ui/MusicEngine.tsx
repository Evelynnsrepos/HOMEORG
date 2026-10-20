import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect, useRef } from 'react';

import { trackById } from '../state/music';
import { useMusic } from '../state/music';

/**
 * The one audio player in the app. Lives in the root layout so playback
 * survives navigation; every screen just talks to the music store.
 * Renders nothing.
 */
export function MusicEngine() {
  const trackId = useMusic((s) => s.trackId);
  const playing = useMusic((s) => s.playing);
  const volume = useMusic((s) => s.volume);
  const next = useMusic((s) => s.next);
  const setPosition = useMusic((s) => s.setPosition);
  const setPlaying = useMusic((s) => s.setPlaying);

  const track = trackById(trackId);
  const player = useAudioPlayer(track?.src ?? null, { updateInterval: 900 });
  const status = useAudioPlayerStatus(player);
  const loadedId = useRef<string | null>(null);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      shouldRouteThroughEarpiece: false,
      interruptionMode: 'mixWithOthers',
      allowsRecording: false,
    }).catch(() => {});
  }, []);

  // swap the source when the track changes
  useEffect(() => {
    if (!track || loadedId.current === track.id) return;
    loadedId.current = track.id;
    try {
      player.replace(track.src);
    } catch {
      // a source that won't load shouldn't take the app down
    }
  }, [track, player]);

  useEffect(() => {
    player.volume = volume;
  }, [volume, player]);

  useEffect(() => {
    try {
      if (playing) player.play();
      else player.pause();
    } catch {
      setPlaying(false);
    }
  }, [playing, trackId, player, setPlaying]);

  useEffect(() => {
    if (status.didJustFinish) next();
    else if (status.playing) setPosition(status.currentTime ?? 0);
  }, [status.didJustFinish, status.playing, status.currentTime, next, setPosition]);

  return null;
}
