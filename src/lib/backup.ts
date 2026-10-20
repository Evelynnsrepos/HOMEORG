import Constants from 'expo-constants';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { useMusic } from '../state/music';
import { useStore, type Store } from '../state/store';

/**
 * One JSON file with everything this phone knows: home, rooms, chores, history,
 * coins, furniture, challenges, recipes, shelves, lists, notes and settings.
 * It is the way across to a new build or a new phone, so the shape is
 * versioned and a later app can read an older file.
 */
export const BACKUP_FORMAT = 'homeorg-backup';
export const BACKUP_VERSION = 1;

/** the zustand persist version of the main store when the file was written */
const STORE_VERSION = 2;

type Data = Partial<Omit<Store, 'hydrated'>>;
type MusicPrefs = { enabled: boolean; playlistId: string; trackId: string | null; shuffle: boolean; volume: number };

export interface Backup {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: string;
  app: { name: string; version: string };
  storeVersion: number;
  data: Data;
  music?: Partial<MusicPrefs>;
}

export class NotABackup extends Error {}

/** Everything in the store that isn't a function or the hydration flag. */
function storedData(): Data {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(useStore.getState())) {
    if (key === 'hydrated' || typeof value === 'function') continue;
    out[key] = value;
  }
  return out as Data;
}

export function buildBackup(): Backup {
  const m = useMusic.getState();
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    app: {
      name: Constants.expoConfig?.name ?? 'Homeorg<3',
      version: Constants.expoConfig?.version ?? '',
    },
    storeVersion: STORE_VERSION,
    data: storedData(),
    music: {
      enabled: m.enabled,
      playlistId: m.playlistId,
      trackId: m.trackId,
      shuffle: m.shuffle,
      volume: m.volume,
    },
  };
}

const fileName = () => `homeorg-backup-${new Date().toISOString().slice(0, 10)}.json`;

/** Writes the file and hands it to the share sheet, so it can go to Drive, Files or an email. */
export async function exportBackup(): Promise<void> {
  const json = JSON.stringify(buildBackup(), null, 2);

  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName();
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  const file = new File(Paths.cache, fileName());
  if (file.exists) file.delete();
  file.create();
  file.write(json);

  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available');
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    UTI: 'public.json',
    dialogTitle: 'Save your Homeorg<3 backup',
  });
}

/** Reads and checks a backup without touching the store. */
export function parseBackup(text: string): Backup {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new NotABackup('not json');
  }
  const b = raw as Partial<Backup> | null;
  if (!b || b.format !== BACKUP_FORMAT || typeof b.data !== 'object' || !b.data) {
    throw new NotABackup('wrong format');
  }
  if (typeof b.version !== 'number' || b.version > BACKUP_VERSION) {
    throw new NotABackup('made by a newer app');
  }

  // an older store shape goes through the same migration the phone itself would run
  let data = b.data as Record<string, unknown>;
  const from = typeof b.storeVersion === 'number' ? b.storeVersion : STORE_VERSION;
  const migrate = useStore.persist.getOptions().migrate;
  if (from < STORE_VERSION && migrate) data = migrate(data, from) as unknown as Record<string, unknown>;

  // keep only what this build knows about, and make sure lists really are lists
  const known = storedData() as Record<string, unknown>;
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (!(key in known)) continue;
    if (Array.isArray(known[key]) && !Array.isArray(value)) continue;
    clean[key] = value;
  }

  return { ...(b as Backup), data: clean as Data };
}

/** What the confirm dialog shows before anything is replaced. */
export function describeBackup(b: Backup): string {
  const d = b.data;
  const parts = [
    [d.rooms?.length, 'room', 'rooms'],
    [d.tasks?.length, 'chore', 'chores'],
    [d.recipes?.length, 'recipe', 'recipes'],
    [(d.challenges?.length ?? 0) + (d.customChallenges?.length ?? 0), 'challenge', 'challenges'],
    [d.pantry?.length, 'shelf item', 'shelf items'],
    [d.notes?.length, 'note', 'notes'],
  ] as const;
  const counted = parts
    .filter(([n]) => n)
    .map(([n, one, many]) => `${n} ${n === 1 ? one : many}`);
  const day = b.exportedAt ? new Date(b.exportedAt).toLocaleDateString() : 'an unknown day';
  const name = d.settings?.householdName ? `"${d.settings.householdName}"` : 'A household';
  return `${name} from ${day}${counted.length ? `: ${counted.join(', ')}` : ''}.`;
}

/** Replaces everything on this phone with the backup. */
export function restoreBackup(b: Backup): void {
  const store = useStore.getState();
  store.resetEverything();
  useStore.setState({
    ...b.data,
    settings: { ...useStore.getState().settings, ...(b.data.settings ?? {}) },
    hydrated: true,
  });
  if (b.music) {
    // playback itself never comes along, only what you'd chosen
    const { enabled, playlistId, trackId, shuffle, volume } = b.music;
    useMusic.setState({
      ...(typeof enabled === 'boolean' ? { enabled } : {}),
      ...(typeof playlistId === 'string' ? { playlistId } : {}),
      ...(trackId === null || typeof trackId === 'string' ? { trackId } : {}),
      ...(typeof shuffle === 'boolean' ? { shuffle } : {}),
      ...(typeof volume === 'number' ? { volume } : {}),
    });
  }
}
