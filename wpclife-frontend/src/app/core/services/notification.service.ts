import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, PushNotificationSchema } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  async initialize(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await this.initializePushNotifications();
    } else {
      await this.initializeWebNotifications();
    }
  }

  private async initializePushNotifications(): Promise<void> {
    const permission = await PushNotifications.requestPermissions();
    
    if (permission.receive === 'granted') {
      await PushNotifications.register();

      PushNotifications.addListener('registration', (token: Token) => {
        console.log('Push registration success, token:', token.value);
        this.registerDeviceToken(token.value);
      });

      PushNotifications.addListener('registrationError', (error: any) => {
        console.error('Push registration error:', error);
      });

      PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        console.log('Push notification received:', notification);
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (notification: any) => {
        console.log('Push notification action performed:', notification);
      });
    }
  }

  private async initializeWebNotifications(): Promise<void> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Web notifications enabled');
      }
    }
  }

  private registerDeviceToken(token: string): void {
    this.http.post(`${this.API_URL}/notifications/register`, { token }).subscribe({
      next: () => console.log('Device token registered'),
      error: (err) => console.error('Failed to register device token:', err)
    });
  }

  async scheduleLocalNotification(title: string, body: string, scheduleAt: Date): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await LocalNotifications.schedule({
        notifications: [{
          id: Date.now(),
          title,
          body,
          schedule: { at: scheduleAt },
          sound: 'default',
          actionTypeId: '',
          extra: null
        }]
      });
    }
  }

  async scheduleMedicationReminder(medicationName: string, time: Date): Promise<void> {
    await this.scheduleLocalNotification(
      'Medication Reminder',
      `Time to take your ${medicationName}`,
      time
    );
  }

  async scheduleChoreReminder(choreTitle: string, dueDate: Date): Promise<void> {
    const reminderTime = new Date(dueDate);
    reminderTime.setHours(reminderTime.getHours() - 1);
    
    await this.scheduleLocalNotification(
      'Chore Due Soon',
      `${choreTitle} is due in 1 hour`,
      reminderTime
    );
  }

  showWebNotification(title: string, body: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/badge-72x72.png'
      });
    }
  }
}
