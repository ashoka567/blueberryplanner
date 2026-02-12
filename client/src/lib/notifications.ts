import { LocalNotifications, ScheduleOptions, LocalNotificationSchema, PendingLocalNotificationSchema } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export interface NotificationSettings {
  medicationsEnabled: boolean;
  medicationsMinutes: number;
  choresEnabled: boolean;
  choresMinutes: number;
  remindersEnabled: boolean;
  remindersMinutes: number;
  groceriesEnabled: boolean;
  calendarEnabled: boolean;
  calendarMinutes: number;
  pushEnabled: boolean;
}

interface MedicationScheduleData {
  id: string;
  name: string;
  dosage?: string | null;
  assignedTo?: string | null;
  schedule?: { type: string; times: string[] } | null;
  active?: boolean | null;
}

interface ChoreScheduleData {
  id: string;
  title: string;
  dueDate?: string | null;
  dueTime?: string | null;
  status?: string | null;
  assignedTo?: string | null;
}

interface ReminderScheduleData {
  id: string;
  title: string;
  description?: string | null;
  startTime?: string | Date | null;
  isActive?: boolean | null;
  schedule?: { type: string } | null;
}

const ID_OFFSET_MEDICATION = 100000;
const ID_OFFSET_CHORE = 200000;
const ID_OFFSET_REMINDER = 300000;

function hashStringToNumber(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash) % 90000;
}

function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

function isSupported(): boolean {
  return isNative() || ('Notification' in window);
}

export async function requestPermission(): Promise<boolean> {
  if (isNative()) {
    try {
      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted';
    } catch (e) {
      console.error('Failed to request notification permission:', e);
      return false;
    }
  }

  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export async function checkPermission(): Promise<'granted' | 'denied' | 'default'> {
  if (isNative()) {
    try {
      const result = await LocalNotifications.checkPermissions();
      if (result.display === 'granted') return 'granted';
      if (result.display === 'denied') return 'denied';
      return 'default';
    } catch {
      return 'default';
    }
  }

  if ('Notification' in window) {
    return Notification.permission;
  }

  return 'denied';
}

export async function cancelAllNotifications(): Promise<void> {
  if (!isNative()) return;

  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({
        notifications: pending.notifications.map(n => ({ id: n.id }))
      });
    }
  } catch (e) {
    console.error('Failed to cancel notifications:', e);
  }
}

async function cancelNotificationsByPrefix(prefix: number): Promise<void> {
  if (!isNative()) return;

  try {
    const pending = await LocalNotifications.getPending();
    const toCancel = pending.notifications.filter(
      n => n.id >= prefix && n.id < prefix + 100000
    );
    if (toCancel.length > 0) {
      await LocalNotifications.cancel({
        notifications: toCancel.map(n => ({ id: n.id }))
      });
    }
  } catch (e) {
    console.error('Failed to cancel notifications by prefix:', e);
  }
}

function createNotificationTime(dateStr: string, timeStr: string, minutesBefore: number): Date | null {
  try {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date(dateStr + 'T00:00:00');
    date.setHours(hours, minutes, 0, 0);
    date.setMinutes(date.getMinutes() - minutesBefore);

    if (date.getTime() <= Date.now()) return null;
    return date;
  } catch {
    return null;
  }
}

function getTodayDateStr(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

function getTomorrowDateStr(): string {
  const now = new Date();
  now.setDate(now.getDate() + 1);
  return now.toISOString().split('T')[0];
}

export async function scheduleMedicationNotifications(
  medications: MedicationScheduleData[],
  settings: NotificationSettings
): Promise<number> {
  if (!isNative() || !settings.medicationsEnabled) return 0;

  await cancelNotificationsByPrefix(ID_OFFSET_MEDICATION);

  const notifications: LocalNotificationSchema[] = [];
  const today = getTodayDateStr();
  const tomorrow = getTomorrowDateStr();

  for (const med of medications) {
    if (!med.active || !med.schedule) continue;
    const schedule = typeof med.schedule === 'string' ? JSON.parse(med.schedule) : med.schedule;
    if (!schedule.times || !Array.isArray(schedule.times)) continue;

    for (let timeIdx = 0; timeIdx < schedule.times.length; timeIdx++) {
      const time = schedule.times[timeIdx];
      const baseId = ID_OFFSET_MEDICATION + hashStringToNumber(med.id) + timeIdx;

      for (const dateStr of [today, tomorrow]) {
        const notifTime = createNotificationTime(dateStr, time, settings.medicationsMinutes);
        if (!notifTime) continue;

        const dayOffset = dateStr === tomorrow ? 1000 : 0;
        notifications.push({
          id: baseId + dayOffset,
          title: '💊 Medication Reminder',
          body: `Time to take ${med.name}${med.dosage ? ` (${med.dosage})` : ''}`,
          schedule: { at: notifTime },
          sound: 'default',
          smallIcon: 'ic_notification',
          largeIcon: 'ic_notification',
          actionTypeId: 'MEDICATION_REMINDER',
          extra: { type: 'medication', id: med.id }
        });
      }
    }
  }

  if (notifications.length > 0) {
    try {
      await LocalNotifications.schedule({ notifications });
    } catch (e) {
      console.error('Failed to schedule medication notifications:', e);
    }
  }

  return notifications.length;
}

export async function scheduleChoreNotifications(
  chores: ChoreScheduleData[],
  settings: NotificationSettings
): Promise<number> {
  if (!isNative() || !settings.choresEnabled) return 0;

  await cancelNotificationsByPrefix(ID_OFFSET_CHORE);

  const notifications: LocalNotificationSchema[] = [];

  for (const chore of chores) {
    if (chore.status === 'COMPLETED' || chore.status === 'DONE') continue;
    if (!chore.dueDate) continue;

    const time = chore.dueTime || '08:00';
    const notifTime = createNotificationTime(chore.dueDate, time, settings.choresMinutes);
    if (!notifTime) continue;

    const id = ID_OFFSET_CHORE + hashStringToNumber(chore.id);
    notifications.push({
      id,
      title: '✅ Chore Reminder',
      body: `Don't forget: ${chore.title}`,
      schedule: { at: notifTime },
      sound: 'default',
      smallIcon: 'ic_notification',
      largeIcon: 'ic_notification',
      actionTypeId: 'CHORE_REMINDER',
      extra: { type: 'chore', id: chore.id }
    });
  }

  if (notifications.length > 0) {
    try {
      await LocalNotifications.schedule({ notifications });
    } catch (e) {
      console.error('Failed to schedule chore notifications:', e);
    }
  }

  return notifications.length;
}

export async function scheduleReminderNotifications(
  reminders: ReminderScheduleData[],
  settings: NotificationSettings
): Promise<number> {
  if (!isNative() || !settings.remindersEnabled) return 0;

  await cancelNotificationsByPrefix(ID_OFFSET_REMINDER);

  const notifications: LocalNotificationSchema[] = [];

  for (const reminder of reminders) {
    if (reminder.isActive === false) continue;
    if (!reminder.startTime) continue;

    const startTime = new Date(reminder.startTime);
    const notifTime = new Date(startTime.getTime() - settings.remindersMinutes * 60 * 1000);

    if (notifTime.getTime() <= Date.now()) continue;

    const id = ID_OFFSET_REMINDER + hashStringToNumber(reminder.id);
    notifications.push({
      id,
      title: '🔔 Reminder',
      body: reminder.title + (reminder.description ? `: ${reminder.description}` : ''),
      schedule: { at: notifTime },
      sound: 'default',
      smallIcon: 'ic_notification',
      largeIcon: 'ic_notification',
      actionTypeId: 'REMINDER',
      extra: { type: 'reminder', id: reminder.id }
    });
  }

  if (notifications.length > 0) {
    try {
      await LocalNotifications.schedule({ notifications });
    } catch (e) {
      console.error('Failed to schedule reminder notifications:', e);
    }
  }

  return notifications.length;
}

export async function scheduleAllNotifications(
  medications: MedicationScheduleData[],
  chores: ChoreScheduleData[],
  reminders: ReminderScheduleData[],
  settings: NotificationSettings
): Promise<{ medications: number; chores: number; reminders: number }> {
  const [medCount, choreCount, reminderCount] = await Promise.all([
    scheduleMedicationNotifications(medications, settings),
    scheduleChoreNotifications(chores, settings),
    scheduleReminderNotifications(reminders, settings),
  ]);

  return {
    medications: medCount,
    chores: choreCount,
    reminders: reminderCount,
  };
}

export async function getPendingNotificationCount(): Promise<number> {
  if (!isNative()) return 0;

  try {
    const pending = await LocalNotifications.getPending();
    return pending.notifications.length;
  } catch {
    return 0;
  }
}

export async function sendTestNotification(): Promise<boolean> {
  if (isNative()) {
    try {
      await LocalNotifications.schedule({
        notifications: [{
          id: 99999,
          title: '🫐 Blueberry Planner',
          body: 'Notifications are working! You\'ll receive reminders for your medications, chores, and more.',
          schedule: { at: new Date(Date.now() + 3000) },
          sound: 'default',
        }]
      });
      return true;
    } catch (e) {
      console.error('Failed to send test notification:', e);
      return false;
    }
  }

  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('🫐 Blueberry Planner', {
      body: 'Notifications are working! You\'ll receive reminders for your medications, chores, and more.',
      icon: '/favicon.ico',
    });
    return true;
  }

  return false;
}

export function setupNotificationListeners(): void {
  if (!isNative()) return;

  LocalNotifications.addListener('localNotificationReceived', (notification) => {
    console.log('Notification received:', notification);
  });

  LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
    console.log('Notification action:', action);
    const extra = action.notification.extra;
    if (extra?.type === 'medication') {
      window.location.href = '/medications';
    } else if (extra?.type === 'chore') {
      window.location.href = '/chores';
    } else if (extra?.type === 'reminder') {
      window.location.href = '/reminders';
    }
  });
}
