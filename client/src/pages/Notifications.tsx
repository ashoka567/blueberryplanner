import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pill, CheckSquare, Clock, Loader2, Bell, BellRing, Smartphone, Globe } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Capacitor } from '@capacitor/core';
import {
  requestPermission,
  checkPermission,
  sendTestNotification,
  scheduleAllNotifications,
  cancelAllNotifications,
  getPendingNotificationCount,
  type NotificationSettings,
} from '@/lib/notifications';
import { useCurrentFamily, useFamilyMembers } from '@/hooks/useData';
import * as api from '@/lib/api';

const TIMING_OPTIONS = [
  { value: "5", label: "5 min" },
  { value: "10", label: "10 min" },
  { value: "15", label: "15 min" },
  { value: "30", label: "30 min" },
  { value: "60", label: "1 hr" },
  { value: "120", label: "2 hr" },
];

export default function NotificationsPage() {
  const { toast } = useToast();
  const family = useCurrentFamily();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'default'>('default');
  const [pendingCount, setPendingCount] = useState(0);
  const [isScheduling, setIsScheduling] = useState(false);
  const isNative = Capacitor.isNativePlatform();
  const [settings, setSettings] = useState<NotificationSettings>({
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
  });

  useEffect(() => {
    loadSettings();
    loadPermission();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      loadPendingCount();
    }
  }, [isLoading]);

  const loadPermission = async () => {
    const perm = await checkPermission();
    setPermission(perm);
  };

  const loadPendingCount = async () => {
    const count = await getPendingNotificationCount();
    setPendingCount(count);
  };

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/notification-settings', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: NotificationSettings) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/notification-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newSettings),
      });
      if (response.ok) {
        toast({ title: "Settings saved" });
        await rescheduleNotifications(newSettings);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const rescheduleNotifications = async (currentSettings?: NotificationSettings) => {
    if (!family?.id) return;
    setIsScheduling(true);
    try {
      const s = currentSettings || settings;
      const [medications, chores, reminders] = await Promise.all([
        api.getMedicines(family.id),
        api.getChores(family.id),
        api.getReminders(family.id),
      ]);

      const result = await scheduleAllNotifications(medications, chores, reminders, s);
      const total = result.medications + result.chores + result.reminders;
      setPendingCount(total);

      if (isNative) {
        toast({
          title: "Notifications updated",
          description: `${total} notification${total !== 1 ? 's' : ''} scheduled`,
        });
      }
    } catch (error) {
      console.error('Failed to reschedule notifications:', error);
    } finally {
      setIsScheduling(false);
    }
  };

  const handleToggle = (key: keyof NotificationSettings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleMinutesChange = (key: keyof NotificationSettings, value: string) => {
    const newSettings = { ...settings, [key]: parseInt(value) };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      setPermission('granted');
      const newSettings = { ...settings, pushEnabled: true };
      setSettings(newSettings);
      await saveSettings(newSettings);
      await sendTestNotification();
      toast({ title: "Notifications enabled!", description: "You'll receive a test notification shortly." });
    } else {
      setPermission('denied');
      toast({ title: "Permission denied", description: "Please enable notifications in your device settings.", variant: "destructive" });
    }
  };

  const handleDisableNotifications = async () => {
    await cancelAllNotifications();
    const newSettings = { ...settings, pushEnabled: false };
    setSettings(newSettings);
    await saveSettings(newSettings);
    setPendingCount(0);
    toast({ title: "Notifications disabled" });
  };

  const handleTestNotification = async () => {
    const sent = await sendTestNotification();
    if (sent) {
      toast({ title: "Test sent", description: "You should see a notification in a few seconds." });
    } else {
      toast({ title: "Could not send", description: "Make sure notifications are enabled.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#D2691E]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[#D2691E]" data-testid="text-notifications-title">Notifications</h1>
        <p className="text-sm text-muted-foreground">Manage your notification preferences</p>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-base text-[#D2691E] flex items-center gap-2">
            {isNative ? <Smartphone className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
            {isNative ? 'Device Notifications' : 'Push Notifications'}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2 px-4">
          {permission === 'granted' && settings.pushEnabled ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg" data-testid="status-notifications-enabled">
                <BellRing className="h-5 w-5" />
                <div>
                  <p className="font-medium text-sm">Notifications are active</p>
                  {isNative && (
                    <p className="text-xs text-green-500">{pendingCount} upcoming notification{pendingCount !== 1 ? 's' : ''} scheduled</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestNotification}
                  data-testid="button-test-notification"
                >
                  <Bell className="h-4 w-4 mr-1" />
                  Send Test
                </Button>
                {isNative && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => rescheduleNotifications()}
                    disabled={isScheduling}
                    data-testid="button-refresh-schedule"
                  >
                    {isScheduling ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <BellRing className="h-4 w-4 mr-1" />}
                    Refresh Schedule
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisableNotifications}
                  className="text-red-500 hover:text-red-600"
                  data-testid="button-disable-notifications"
                >
                  Disable
                </Button>
              </div>
            </div>
          ) : permission === 'denied' ? (
            <div className="text-amber-600 bg-amber-50 p-3 rounded-lg" data-testid="status-notifications-denied">
              <p className="font-medium text-sm">Notifications are blocked</p>
              <p className="text-xs mt-1">
                {isNative
                  ? 'Go to your device Settings > Blueberry Planner to enable notifications.'
                  : 'Please allow notifications in your browser settings to receive reminders.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-muted-foreground bg-gray-50 p-3 rounded-lg" data-testid="status-notifications-default">
                <p className="text-sm">Enable notifications to receive timely reminders for medications, chores, and more.</p>
              </div>
              <Button
                onClick={handleEnableNotifications}
                className="bg-[#D2691E] hover:bg-[#B8571A] text-white"
                data-testid="button-enable-notifications"
              >
                <Bell className="h-4 w-4 mr-2" />
                Enable Notifications
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-none shadow-md">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-base text-[#D2691E]">Categories</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Items without a set time will notify at 8:00 AM</p>
        </CardHeader>
        <CardContent className="py-2 px-4 space-y-2">
          <div className="flex items-center justify-between p-3 rounded-lg bg-pink-50" data-testid="section-medications-notifications">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-pink-100 flex items-center justify-center">
                <Pill className="h-4 w-4 text-pink-600" />
              </div>
              <Label className="text-sm font-medium">Medications</Label>
            </div>
            <div className="flex items-center gap-2">
              <Select 
                value={settings.medicationsMinutes.toString()} 
                onValueChange={(v) => handleMinutesChange('medicationsMinutes', v)}
                disabled={!settings.medicationsEnabled}
              >
                <SelectTrigger className="w-[80px] h-8 text-xs" data-testid="select-medications-timing">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent sideOffset={8} className="bg-white shadow-lg border rounded-md z-50">
                  {TIMING_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Switch 
                checked={settings.medicationsEnabled} 
                onCheckedChange={() => handleToggle('medicationsEnabled')}
                data-testid="switch-medications-enabled"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50" data-testid="section-chores-notifications">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <CheckSquare className="h-4 w-4 text-amber-600" />
              </div>
              <Label className="text-sm font-medium">Chores</Label>
            </div>
            <div className="flex items-center gap-2">
              <Select 
                value={settings.choresMinutes.toString()} 
                onValueChange={(v) => handleMinutesChange('choresMinutes', v)}
                disabled={!settings.choresEnabled}
              >
                <SelectTrigger className="w-[80px] h-8 text-xs" data-testid="select-chores-timing">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent sideOffset={8} className="bg-white shadow-lg border rounded-md z-50">
                  {TIMING_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Switch 
                checked={settings.choresEnabled} 
                onCheckedChange={() => handleToggle('choresEnabled')}
                data-testid="switch-chores-enabled"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50" data-testid="section-reminders-notifications">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <Label className="text-sm font-medium">Reminders</Label>
            </div>
            <div className="flex items-center gap-2">
              <Select 
                value={settings.remindersMinutes.toString()} 
                onValueChange={(v) => handleMinutesChange('remindersMinutes', v)}
                disabled={!settings.remindersEnabled}
              >
                <SelectTrigger className="w-[80px] h-8 text-xs" data-testid="select-reminders-timing">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent sideOffset={8} className="bg-white shadow-lg border rounded-md z-50">
                  {TIMING_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Switch 
                checked={settings.remindersEnabled} 
                onCheckedChange={() => handleToggle('remindersEnabled')}
                data-testid="switch-reminders-enabled"
              />
            </div>
          </div>

        </CardContent>
      </Card>

      {isNative && permission === 'granted' && settings.pushEnabled && (
        <Card className="border-none shadow-md">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-base text-[#D2691E]">How It Works</CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <Pill className="h-4 w-4 mt-0.5 text-pink-500 shrink-0" />
                <span><strong>Medications</strong> — Get reminded before each scheduled dose time</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckSquare className="h-4 w-4 mt-0.5 text-amber-500 shrink-0" />
                <span><strong>Chores</strong> — Get notified before a chore is due</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="h-4 w-4 mt-0.5 text-blue-500 shrink-0" />
                <span><strong>Reminders</strong> — Receive alerts before your scheduled reminders</span>
              </li>
            </ul>
            <p className="text-xs text-muted-foreground mt-3 border-t pt-2">
              Notifications are refreshed automatically when you open the app or change your data. 
              Tap "Refresh Schedule" to manually update.
            </p>
          </CardContent>
        </Card>
      )}

      {isSaving && (
        <div className="fixed bottom-4 right-4 bg-[#D2691E] text-white px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2 text-sm">
          <Loader2 className="h-3 w-3 animate-spin" />
          Saving...
        </div>
      )}
    </div>
  );
}
