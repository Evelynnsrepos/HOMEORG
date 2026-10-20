import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const CHANNEL = 'tidywell-daily';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

/**
 * One local notification a day. Local only — nothing leaves the device, and it
 * keeps working with the phone in flight mode.
 */
export async function scheduleDailyReminder(
  hour: number,
  minute: number,
  body: string,
): Promise<boolean> {
  const ok = await ensurePermission();
  if (!ok) return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'Daily reminder',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  await cancelDailyReminder();
  await Notifications.scheduleNotificationAsync({
    content: { title: 'Today in your home', body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: Platform.OS === 'android' ? CHANNEL : undefined,
    },
  });
  return true;
}

export async function cancelDailyReminder(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
