import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pill, CheckSquare, Clock, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface NotificationSettings {
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
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
    checkNotificationPermission();
  }, []);

  const checkNotificationPermission = () => {
    if ('Notification' in window) {
      setPushPermission(Notification.permission);
    }
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
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    } finally {
      setIsSaving(false);
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

  const requestPushPermission = async () => {
    if (!('Notification' in window)) {
      toast({ title: "Not supported", description: "Push notifications are not supported in this browser.", variant: "destructive" });
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      
      if (permission === 'granted') {
        const newSettings = { ...settings, pushEnabled: true };
        setSettings(newSettings);
        saveSettings(newSettings);
        toast({ title: "Notifications enabled!" });
        new Notification('Blueberry Planner', {
          body: 'Push notifications are now enabled!',
          icon: '/favicon.ico',
        });
      } else if (permission === 'denied') {
        toast({ title: "Permission denied", variant: "destructive" });
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const disablePushNotifications = () => {
    const newSettings = { ...settings, pushEnabled: false };
    setSettings(newSettings);
    saveSettings(newSettings);
    toast({ title: "Notifications disabled" });
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
        <h1 className="text-2xl font-bold text-[#D2691E]">Notifications</h1>
        <p className="text-sm text-muted-foreground">Manage your notification preferences</p>
      </div>

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

      {isSaving && (
        <div className="fixed bottom-4 right-4 bg-[#D2691E] text-white px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2 text-sm">
          <Loader2 className="h-3 w-3 animate-spin" />
          Saving...
        </div>
      )}
    </div>
  );
}
