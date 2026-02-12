import { useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Capacitor } from '@capacitor/core';
import {
  scheduleAllNotifications,
  scheduleMedicationNotifications,
  scheduleChoreNotifications,
  scheduleReminderNotifications,
  setupNotificationListeners,
  checkPermission,
  type NotificationSettings
} from '@/lib/notifications';
import * as api from '@/lib/api';

const DEFAULT_SETTINGS: NotificationSettings = {
  medicationsEnabled: true,
  medicationsMinutes: 15,
  choresEnabled: true,
  choresMinutes: 30,
  remindersEnabled: true,
  remindersMinutes: 15,
  groceriesEnabled: false,
  calendarEnabled: true,
  calendarMinutes: 15,
  pushEnabled: false,
};

export function useNotificationScheduler(familyId?: string) {
  const listenersSetup = useRef(false);
  const lastScheduleTime = useRef(0);

  const { data: settingsData } = useQuery({
    queryKey: ['notificationSettings'],
    queryFn: async () => {
      const res = await fetch('/api/notification-settings', { credentials: 'include' });
      if (!res.ok) return DEFAULT_SETTINGS;
      return res.json() as Promise<NotificationSettings>;
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: medications } = useQuery({
    queryKey: ['medicines', familyId],
    queryFn: () => api.getMedicines(familyId!),
    enabled: !!familyId,
  });

  const { data: chores } = useQuery({
    queryKey: ['chores', familyId],
    queryFn: () => api.getChores(familyId!),
    enabled: !!familyId,
  });

  const { data: reminders } = useQuery({
    queryKey: ['reminders', familyId],
    queryFn: () => api.getReminders(familyId!),
    enabled: !!familyId,
  });

  useEffect(() => {
    if (!listenersSetup.current && Capacitor.isNativePlatform()) {
      setupNotificationListeners();
      listenersSetup.current = true;
    }
  }, []);

  const rescheduleAll = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;

    const now = Date.now();
    if (now - lastScheduleTime.current < 5000) return;
    lastScheduleTime.current = now;

    const permission = await checkPermission();
    if (permission !== 'granted') return;

    const settings = settingsData || DEFAULT_SETTINGS;

    const result = await scheduleAllNotifications(
      medications || [],
      chores || [],
      reminders || [],
      settings
    );

    console.log('Notifications scheduled:', result);
  }, [medications, chores, reminders, settingsData]);

  useEffect(() => {
    if (familyId && medications && chores && reminders && settingsData) {
      rescheduleAll();
    }
  }, [familyId, medications, chores, reminders, settingsData, rescheduleAll]);

  const rescheduleCategory = useCallback(async (category: 'medications' | 'chores' | 'reminders') => {
    if (!Capacitor.isNativePlatform()) return;

    const permission = await checkPermission();
    if (permission !== 'granted') return;

    const settings = settingsData || DEFAULT_SETTINGS;

    switch (category) {
      case 'medications':
        await scheduleMedicationNotifications(medications || [], settings);
        break;
      case 'chores':
        await scheduleChoreNotifications(chores || [], settings);
        break;
      case 'reminders':
        await scheduleReminderNotifications(reminders || [], settings);
        break;
    }
  }, [medications, chores, reminders, settingsData]);

  return {
    rescheduleAll,
    rescheduleCategory,
  };
}
