/**
 * Bundles a curated slice of the user's music library into the app.
 *
 * The source library is ~1 GB of full-quality mp3 — far too much to ship. This
 * picks a handful of calm tracks per playlist and re-encodes them at a bitrate
 * that suits background listening, which gets the whole soundtrack under 40 MB.
 *
 *   node scripts/prepare-music.js
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ffmpeg = require('ffmpeg-static');

const SRC = process.env.TIDYWELL_MUSIC_SRC || 'C:/Users/Evelindows/Desktop/Personal Data/youtube/Music';
const OUT = path.join(__dirname, '..', 'assets', 'music');
const MAP = path.join(__dirname, '..', 'src', 'data', 'musicTracks.ts');

const BITRATE = '64k';
const CHANNELS = 1;
const RATE = 44100;

/** Playlists mirror the folders in the library. */
const playlists = [
  {
    id: 'underwater',
    name: 'Underwater',
    blurb: 'Slow, wide and wordless. For a long job.',
    emoji: '\u{1F30A}',
    dir: 'game music/Subnautica',
    tracks: [
      ['Amid the Kelp', 'Amid the Kelp.mp3'],
      ['Shallows', 'Shallows.mp3'],
      ['Coral Reef', 'Coral Reef.mp3'],
      ['Lily Pads', 'Lily Pads.mp3'],
      ['Tropical Eden', 'Tropical Eden.mp3'],
      ['Safe in Kelp Forest', 'Safe in Kelp Forest.mp3'],
    ],
  },
  {
    id: 'tokyo',
    name: 'Tokyo Nights',
    blurb: 'Jazzy, unhurried, a bit of swagger.',
    emoji: '\u{1F303}',
    dir: 'game music/persona 5 instrumental',
    tracks: [
      ['Beneath the Mask', 'Persona 5 OST 79 - Beneath the Mask -rain, instrumental version-.mp3'],
      ['Tokyo Daylight', 'Persona 5 OST - Tokyo Daylight [Extended].mp3'],
      ['Everyday Days', 'Persona 5 OST 30 - Everyday Days.mp3'],
      ['BAR Yuu Comer', 'Persona 5 OST 49 - BAR Yuu Comer.mp3'],
      ['Sunset Bridge', 'Persona 5 OST 46 - Sunset Bridge.mp3'],
      ['Life Goes On', 'Persona 5 OST 55 - Life Goes On.mp3'],
    ],
  },
  {
    id: 'moonlight',
    name: 'Moonlight',
    blurb: 'Quiet piano and strings. Late evening tidying.',
    emoji: '\u{1F319}',
    dir: 'game music/persona 3 instrumental',
    tracks: [
      ['Iwatodai Dorm', 'Iwatodai Dorm (Instrumental).mp3'],
      ['Paulownia Mall', 'Paulownia Mall (Instrumental).mp3'],
      ['Memories of You', 'Memories of You (Instrumental).mp3'],
      ['Want To Be Close', 'Want To Be Close (Instrumental).mp3'],
      ['Time', 'Time (Instrumental).mp3'],
    ],
  },
  {
    id: 'vocals',
    name: 'With Words',
    blurb: 'When the silence is the problem.',
    emoji: '\u{1F3A4}',
    dir: 'game music/persona',
    tracks: [
      ['Your Affection', '[Persona 4 OST] 08 - Your Affection.mp3'],
      ['Signs Of Love', '[Persona 4 OST] 06 - Signs Of Love.mp3'],
      ['Color Your Night', 'Color Your Night.mp3'],
      ["When The Moon's Reaching Out Stars", "Persona 3 OST - When The Moon's Reaching Out Stars.mp3"],
    ],
  },
  {
    id: 'focus',
    name: 'Focus Beats',
    blurb: 'Steady tempo, nothing to think about.',
    emoji: '\u{1F3A7}',
    dir: 'ncs',
    tracks: [
      ['Intention', 'chill-abstract_intention-12099.mp3'],
      ['Reinvention', 'floating-abstract_reinvention-142819.mp3'],
      ['Chops', 'jazzy-abstract-beat_chops-11254.mp3'],
      ['Tokyo Cafe', 'tvari-tokyo-cafe-159065.mp3'],
      ['Retro Lounge', 'retro-lounge-389644.mp3'],
      ['Water', 'water-144303.mp3'],
    ],
  },
];

/** ffmpeg prints the duration to stderr; there is no ffprobe in ffmpeg-static. */
function durationOf(file) {
  try {
    execFileSync(ffmpeg, ['-i', file], { stdio: 'pipe' });
  } catch (err) {
    const text = String(err.stderr ?? '');
    const m = text.match(/Duration:\s*(\d+):(\d+):(\d+)/);
    if (m) return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
  }
  return 0;
}

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

(async () => {
  if (!fs.existsSync(SRC)) {
    console.error(`Music library not found at ${SRC}. Set TIDYWELL_MUSIC_SRC.`);
    process.exit(1);
  }
  fs.mkdirSync(OUT, { recursive: true });

  const out = [];
  let bytes = 0;

  for (const list of playlists) {
    const entries = [];
    for (const [title, filename] of list.tracks) {
      const from = path.join(SRC, list.dir, filename);
      if (!fs.existsSync(from)) {
        console.warn('missing:', filename);
        continue;
      }
      const id = `${list.id}_${slug(title)}`;
      const dest = path.join(OUT, `${id}.mp3`);

      execFileSync(
        ffmpeg,
        ['-y', '-i', from, '-vn', '-ac', String(CHANNELS), '-ar', String(RATE), '-b:a', BITRATE, dest],
        { stdio: 'pipe' },
      );

      const size = fs.statSync(dest).size;
      bytes += size;
      entries.push({ id, title, seconds: durationOf(dest) });
      process.stdout.write(`  ${title} — ${(size / 1024 / 1024).toFixed(1)} MB\n`);
    }
    out.push({ ...list, entries });
  }

  const body = out
    .map(
      (l) => `  {
    id: '${l.id}',
    name: ${JSON.stringify(l.name)},
    blurb: ${JSON.stringify(l.blurb)},
    emoji: '${l.emoji.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, (c) => `\\u{${c.codePointAt(0).toString(16).toUpperCase()}}`)}',
    tracks: [
${l.entries
  .map(
    (t) =>
      `      { id: '${t.id}', title: ${JSON.stringify(t.title)}, seconds: ${t.seconds}, src: require('../../assets/music/${t.id}.mp3') },`,
  )
  .join('\n')}
    ],
  },`,
    )
    .join('\n');

  fs.writeFileSync(
    MAP,
    `// Generated by scripts/prepare-music.js — do not edit by hand.
// Re-encoded from the user's own library at ${BITRATE} mono for background listening.

export interface Track {
  id: string;
  title: string;
  /** length in seconds */
  seconds: number;
  src: number;
}

export interface Playlist {
  id: string;
  name: string;
  blurb: string;
  emoji: string;
  tracks: Track[];
}

export const playlists: Playlist[] = [
${body}
];

export const allTracks: Track[] = playlists.flatMap((p) => p.tracks);

export function playlistOf(trackId: string): Playlist | undefined {
  return playlists.find((p) => p.tracks.some((t) => t.id === trackId));
}
`,
  );

  console.log(
    `\n${out.reduce((n, l) => n + l.entries.length, 0)} tracks in ${out.length} playlists, ${(
      bytes /
      1024 /
      1024
    ).toFixed(1)} MB total`,
  );
})();
