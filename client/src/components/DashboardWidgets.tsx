import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  Check,
  Clock,
  Pill,
  Mic,
  MicOff,
  Sparkles,
  Send,
  ShoppingCart,
  Loader2,
  Bell,
  CheckSquare,
  CalendarDays,
  Trophy,
  Users,
  Activity,
  Package,
  type LucideIcon,
} from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { useCurrentFamily, useFamilyMembers, useReminders, useMedicines, useMedicineLogs, useChores, useGroceryItems } from "@/hooks/useData";
import type { User, Medicine, MedicineLog, Reminder } from "@/lib/types";

type AddType = 'reminder' | 'chore' | 'medication' | 'grocery' | null;

interface ParsedItem {
  type: string;
  title: string;
  description?: string;
  dateTime?: string;
  points?: number;
}

interface QuickActionsProps {
  setAddType: (type: AddType) => void;
}

export function QuickActionsWidget({ setAddType }: QuickActionsProps) {
  const [, setLocation] = useLocation();

  return (
    <Card className="bg-gradient-to-br from-[#D2691E] to-[#E8954C] border-none shadow-lg shadow-[#D2691E]/20 text-white overflow-hidden relative">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-lg text-center">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="pt-2 pb-4">
        <div className="grid grid-cols-3 gap-3">
          <Button
            onClick={() => setAddType('reminder')}
            variant="secondary"
            className="bg-white/90 hover:bg-white text-[#D2691E] border-none flex flex-col items-center justify-center gap-1 h-16 rounded-xl shadow-md"
            data-testid="button-add-reminder"
          >
            <Bell className="h-5 w-5" />
            <span className="text-xs font-medium">Reminder</span>
          </Button>
          <Button
            onClick={() => setLocation('/medications')}
            variant="secondary"
            className="bg-white/90 hover:bg-white text-[#D2691E] border-none flex flex-col items-center justify-center gap-1 h-16 rounded-xl shadow-md"
            data-testid="button-add-meds"
          >
            <Pill className="h-5 w-5" />
            <span className="text-xs font-medium">Meds</span>
          </Button>
          <Button
            onClick={() => setAddType('chore')}
            variant="secondary"
            className="bg-white/90 hover:bg-white text-[#D2691E] border-none flex flex-col items-center justify-center gap-1 h-16 rounded-xl shadow-md"
            data-testid="button-add-chore"
          >
            <CheckSquare className="h-5 w-5" />
            <span className="text-xs font-medium">Chore</span>
          </Button>
          <Button
            onClick={() => setLocation('/groceries')}
            variant="secondary"
            className="bg-white/90 hover:bg-white text-[#D2691E] border-none flex flex-col items-center justify-center gap-1 h-16 rounded-xl shadow-md"
            data-testid="button-add-grocery"
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="text-xs font-medium">Grocery</span>
          </Button>
          <Button
            onClick={() => setLocation('/calendar')}
            variant="secondary"
            className="bg-white/90 hover:bg-white text-[#D2691E] border-none flex flex-col items-center justify-center gap-1 h-16 rounded-xl shadow-md col-span-2"
            data-testid="button-go-calendar"
          >
            <CalendarDays className="h-5 w-5" />
            <span className="text-xs font-medium">Calendar</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

type ScheduleItem = {
  id: string;
  type: 'reminder' | 'chore' | 'medication';
  title: string;
  time?: string;
  status?: string;
  assignedTo?: string;
  assignedName?: string;
  medicineId?: string;
  doses?: { time: string; taken: boolean }[];
};

interface TodaysScheduleProps {
  members: User[];
  reminders: Reminder[];
  medicines: Medicine[];
  medicineLogs: MedicineLog[];
  chores: any[];
  isLoading: boolean;
  showAllSchedule: boolean;
  setShowAllSchedule: (v: boolean) => void;
  handleDoseClick: (medicineId: string, scheduledTime: string, alreadyTaken: boolean, e: React.MouseEvent) => void;
  createMedicineLogPending: boolean;
}

export function TodaysScheduleWidget({
  members, reminders: allReminders, medicines, medicineLogs, chores: allChores,
  isLoading, showAllSchedule, setShowAllSchedule, handleDoseClick, createMedicineLogPending
}: TodaysScheduleProps) {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayReminders = allReminders.filter(reminder => {
    if (!reminder.startTime) return false;
    const reminderDate = new Date(reminder.startTime);
    return reminderDate >= today && reminderDate < tomorrow;
  });

  const todayChores = allChores.filter(chore => {
    if (!chore.dueDate) return false;
    return chore.dueDate === todayStr;
  });

  const isDoseTakenToday = (medicineId: string, scheduledTime: string) => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return medicineLogs.some(log => {
      const logDate = new Date(log.takenAt);
      logDate.setHours(0, 0, 0, 0);
      return log.medicineId === medicineId &&
        log.scheduledTime === scheduledTime &&
        logDate.getTime() === todayStart.getTime();
    });
  };

  const isMedicationActiveToday = (medicine: Medicine) => {
    if (!medicine.active) return false;
    const todayStr = new Date().toISOString().split('T')[0];
    if (medicine.startDate && todayStr < medicine.startDate) return false;
    if (medicine.endDate && todayStr > medicine.endDate) return false;
    return true;
  };

  const medicationItems: ScheduleItem[] = medicines.filter(m => isMedicationActiveToday(m)).map(m => {
    const schedule = m.schedule as { type?: string; times?: string[] } | null;
    const times = schedule?.times || [];
    const dosesInfo = times.map(time => ({
      time,
      taken: isDoseTakenToday(m.id, time)
    }));
    const allTaken = dosesInfo.every(d => d.taken);
    const someTaken = dosesInfo.some(d => d.taken);
    return {
      id: m.id,
      type: 'medication' as const,
      title: m.name,
      medicineId: m.id,
      doses: dosesInfo,
      status: allTaken ? 'TAKEN' : (someTaken ? 'PARTIAL' : 'PENDING')
    };
  });

  const priorityItems: ScheduleItem[] = [
    ...todayReminders.map(r => ({
      id: r.id,
      type: 'reminder' as const,
      title: r.title,
      time: r.startTime ? format(new Date(r.startTime), 'h:mm a') : undefined
    })),
    ...medicationItems
  ];

  const choreItems: ScheduleItem[] = todayChores.map(c => {
    const assignedMember = members.find(m => m.id === c.assignedTo);
    return {
      id: c.id,
      type: 'chore' as const,
      title: c.title,
      status: c.status || undefined,
      assignedTo: c.assignedTo || undefined,
      assignedName: assignedMember?.name
    };
  });

  const displaySchedule = showAllSchedule ? [...priorityItems, ...choreItems] : priorityItems;

  return (
    <Card className="shadow-lg border-none bg-white/50 backdrop-blur-sm overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b bg-[#D2691E]/5">
        <CardTitle className="text-lg text-[#D2691E]">Today's Schedule</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="text-[#D2691E] hover:bg-[#D2691E]/10 text-xs h-7"
          onClick={() => setShowAllSchedule(!showAllSchedule)}
          data-testid="button-view-all-schedule"
        >
          {showAllSchedule ? 'Show Less' : `View All (${choreItems.length} chores)`}
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[#D2691E]" />
          </div>
        )}
        <div className="divide-y divide-border">
          {displaySchedule.length === 0 && !isLoading && (
            <div className="p-6 text-center text-muted-foreground text-sm">
              No appointments or medications for today
            </div>
          )}
          {displaySchedule.map(item => (
            <div key={`${item.type}-${item.id}`} className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-all cursor-pointer group" data-testid={`card-schedule-${item.type}-${item.id}`}>
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg font-bold text-xs group-hover:text-white transition-all",
                item.type === 'reminder' && "bg-[#D2691E]/10 text-[#D2691E] group-hover:bg-[#D2691E]",
                item.type === 'chore' && item.status === 'PENDING' && "bg-amber-100 text-amber-600 group-hover:bg-amber-500",
                item.type === 'chore' && item.status !== 'PENDING' && "bg-green-100 text-green-600 group-hover:bg-green-500",
                item.type === 'medication' && item.status === 'TAKEN' && "bg-green-100 text-green-600 group-hover:bg-green-500",
                item.type === 'medication' && item.status === 'PARTIAL' && "bg-amber-100 text-amber-600 group-hover:bg-amber-500",
                item.type === 'medication' && item.status === 'PENDING' && "bg-pink-100 text-pink-600 group-hover:bg-pink-500"
              )}>
                {item.type === 'reminder' && <Calendar className="h-5 w-5" />}
                {item.type === 'chore' && item.status === 'PENDING' && <Clock className="h-5 w-5" />}
                {item.type === 'chore' && item.status !== 'PENDING' && <Check className="h-5 w-5" />}
                {item.type === 'medication' && item.status === 'TAKEN' && <Check className="h-5 w-5" />}
                {item.type === 'medication' && item.status === 'PARTIAL' && <Pill className="h-5 w-5" />}
                {item.type === 'medication' && item.status === 'PENDING' && <Pill className="h-5 w-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm truncate group-hover:text-[#D2691E]">{item.title}</h4>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 flex-wrap">
                  {item.time && <><Clock className="h-3 w-3" /> {item.time}</>}
                  {item.type === 'medication' && item.doses && item.doses.length > 0 && (
                    <span className="flex items-center gap-2">
                      {item.doses.map((dose) => (
                        <button
                          key={dose.time}
                          onClick={(e) => handleDoseClick(item.medicineId!, dose.time, dose.taken, e)}
                          disabled={createMedicineLogPending}
                          className={cn(
                            "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-all",
                            dose.taken
                              ? "bg-green-100 text-green-700 cursor-default"
                              : "bg-pink-100 text-pink-700 hover:bg-pink-200 cursor-pointer"
                          )}
                          data-testid={`button-dose-${item.id}-${dose.time}`}
                        >
                          {dose.time} {dose.taken ? '✓' : '○'}
                        </button>
                      ))}
                    </span>
                  )}
                  {item.type === 'chore' && (
                    <span className="flex items-center gap-1">
                      <span className="font-medium text-[#D2691E]">{item.assignedName || 'Unassigned'}</span>
                      <span className="capitalize">• {(item.status || 'pending').toLowerCase()}</span>
                    </span>
                  )}
                  {!item.time && item.type !== 'medication' && item.type !== 'chore' && 'All day'}
                </p>
              </div>
              <Badge
                variant="secondary"
                className={cn(
                  "text-[10px] font-medium h-5 rounded-md capitalize",
                  item.type === 'chore' && item.status === 'PENDING' && "bg-amber-100 text-amber-700",
                  item.type === 'chore' && item.status !== 'PENDING' && "bg-green-100 text-green-700",
                  item.type === 'medication' && item.status === 'TAKEN' && "bg-green-100 text-green-700",
                  item.type === 'medication' && item.status === 'PARTIAL' && "bg-amber-100 text-amber-700",
                  item.type === 'medication' && item.status === 'PENDING' && "bg-pink-100 text-pink-700"
                )}
              >
                {item.type === 'medication' ? (item.status === 'TAKEN' ? 'All Taken' : item.status === 'PARTIAL' ? 'Partial' : 'Pending') : item.type}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface AIInputProps {
  smartInputText: string;
  setSmartInputText: (v: string) => void;
  isProcessing: boolean;
  isRecording: boolean;
  speechSupported: boolean;
  lastResult: { success: boolean; message: string; items?: ParsedItem[] } | null;
  toggleVoiceInput: () => void;
  processSmartInput: () => void;
}

export function AIInputWidget({
  smartInputText, setSmartInputText, isProcessing, isRecording,
  speechSupported, lastResult, toggleVoiceInput, processSmartInput
}: AIInputProps) {
  return (
    <Card className="bg-gradient-to-br from-[#D2691E] to-[#B8581A] border-none shadow-xl text-white overflow-hidden" data-testid="card-smart-input">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5" /> Quick Add with AI
        </CardTitle>
        <CardDescription className="text-white/80">
          Type or speak to add chores, reminders, medications, or groceries
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white rounded-xl p-4">
          <Textarea
            value={smartInputText}
            onChange={(e) => setSmartInputText(e.target.value)}
            placeholder="Try: 'Tomorrow buy milk and eggs, remind me to take vitamins at 8am, kids need to do homework by 5pm, doctor appointment Thursday at 2pm'"
            className="border-0 resize-none text-gray-800 placeholder:text-gray-400 focus-visible:ring-0 min-h-[80px]"
            disabled={isProcessing}
            data-testid="input-smart-text"
          />
          <div className="flex justify-end gap-2 mt-3 pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleVoiceInput}
              disabled={isProcessing || !speechSupported}
              className={cn(
                "gap-2",
                isRecording && "bg-red-50 border-red-300 text-red-600 animate-pulse"
              )}
              title={speechSupported ? (isRecording ? 'Stop recording' : 'Start voice input') : 'Voice input not supported'}
              data-testid="button-voice-input"
            >
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {isRecording ? 'Stop' : 'Speak'}
            </Button>
            <Button
              size="sm"
              onClick={processSmartInput}
              disabled={isProcessing || !smartInputText.trim()}
              className="gap-2 bg-violet-600 hover:bg-violet-700"
              data-testid="button-process-input"
            >
              <Send className="h-4 w-4" />
              {isProcessing ? 'Processing...' : 'Add Items'}
            </Button>
          </div>
        </div>

        {lastResult && (
          <div className={cn(
            "rounded-lg p-3 text-sm border",
            lastResult.success ? "bg-[#D2691E] text-white border-[#D2691E]" : "bg-red-100 text-red-800 border-red-300"
          )} data-testid="text-result-message">
            <p>{lastResult.message}</p>
            {lastResult.items && lastResult.items.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {lastResult.items.map((item, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className={cn(
                      "text-xs",
                      item.type === 'chore' && "bg-amber-100 text-amber-800",
                      item.type === 'reminder' && "bg-blue-100 text-blue-800",
                      item.type === 'medication' && "bg-green-100 text-green-800",
                      item.type === 'grocery' && "bg-[#D2691E]/10 text-[#D2691E]"
                    )}
                  >
                    {item.type}: {item.title}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function MedicationTrackerWidget() {
  const family = useCurrentFamily();
  const { data: medicines = [] } = useMedicines(family?.id);
  const { data: medicineLogs = [] } = useMedicineLogs(family?.id);
  const [, setLocation] = useLocation();

  const todayStr = new Date().toISOString().split('T')[0];
  const activeMeds = medicines.filter(m => {
    if (!m.active) return false;
    if (m.startDate && todayStr < m.startDate) return false;
    if (m.endDate && todayStr > m.endDate) return false;
    return true;
  });

  let totalDoses = 0;
  let takenDoses = 0;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  activeMeds.forEach(m => {
    const schedule = m.schedule as { type?: string; times?: string[] } | null;
    const times = schedule?.times || [];
    totalDoses += times.length;
    times.forEach(time => {
      const taken = medicineLogs.some(log => {
        const logDate = new Date(log.takenAt);
        logDate.setHours(0, 0, 0, 0);
        return log.medicineId === m.id && log.scheduledTime === time && logDate.getTime() === todayStart.getTime();
      });
      if (taken) takenDoses++;
    });
  });

  const progress = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;

  return (
    <Card className="border-none shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setLocation('/medications')} data-testid="widget-medication-tracker">
      <CardHeader className="pb-2">
        <CardTitle className="text-[#D2691E] text-lg flex items-center gap-2">
          <Activity className="h-5 w-5" /> Medication Tracker
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-2xl font-bold">{activeMeds.length}</p>
            <p className="text-xs text-muted-foreground">Active medications</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{takenDoses}/{totalDoses}</p>
            <p className="text-xs text-muted-foreground">Doses taken today</p>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={cn("h-2 rounded-full transition-all", progress === 100 ? "bg-green-500" : "bg-[#D2691E]")}
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1 text-center">{progress}% complete</p>
      </CardContent>
    </Card>
  );
}

export function ChoreLeaderboardWidget() {
  const family = useCurrentFamily();
  const { data: members = [] } = useFamilyMembers(family?.id);

  const sortedMembers = [...members]
    .filter(m => m.isChild)
    .sort((a, b) => ((b as any).chorePoints || 0) - ((a as any).chorePoints || 0));

  const allMembers = sortedMembers.length > 0 ? sortedMembers : members.slice(0, 5);

  return (
    <Card className="border-none shadow-md" data-testid="widget-chore-leaderboard">
      <CardHeader className="pb-2">
        <CardTitle className="text-[#D2691E] text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5" /> Chore Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        {allMembers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">No family members yet</p>
        ) : (
          <div className="space-y-2">
            {allMembers.map((member, idx) => (
              <div key={member.id} className="flex items-center gap-3 py-1" data-testid={`leaderboard-member-${member.id}`}>
                <span className="text-sm font-bold text-muted-foreground w-5">{idx + 1}</span>
                <img
                  src={member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`}
                  className="h-7 w-7 rounded-full"
                  alt={member.name}
                />
                <span className="text-sm font-medium flex-1">{member.name}</span>
                <Badge variant="secondary" className="bg-[#D2691E]/10 text-[#D2691E] text-xs">
                  {(member as any).chorePoints || 0} pts
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function GrocerySummaryWidget() {
  const family = useCurrentFamily();
  const { data: groceries = [] } = useGroceryItems(family?.id);
  const [, setLocation] = useLocation();

  const needed = groceries.filter(g => g.status === 'NEEDED' || g.status === 'PENDING');
  const purchased = groceries.filter(g => g.status === 'PURCHASED' || g.status === 'CHECKED');

  return (
    <Card className="border-none shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setLocation('/groceries')} data-testid="widget-grocery-summary">
      <CardHeader className="pb-2">
        <CardTitle className="text-[#D2691E] text-lg flex items-center gap-2">
          <Package className="h-5 w-5" /> Grocery Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <p className="text-2xl font-bold text-[#D2691E]">{needed.length}</p>
            <p className="text-xs text-muted-foreground">Items needed</p>
          </div>
          <div className="w-px h-10 bg-border" />
          <div className="text-center flex-1">
            <p className="text-2xl font-bold text-green-600">{purchased.length}</p>
            <p className="text-xs text-muted-foreground">Purchased</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-3">Tap to view full list →</p>
      </CardContent>
    </Card>
  );
}

export function UpcomingRemindersWidget() {
  const family = useCurrentFamily();
  const { data: reminders = [] } = useReminders(family?.id);
  const [, setLocation] = useLocation();

  const now = new Date();
  const upcoming = reminders
    .filter(r => r.startTime && new Date(r.startTime) >= now)
    .sort((a, b) => new Date(a.startTime!).getTime() - new Date(b.startTime!).getTime())
    .slice(0, 5);

  return (
    <Card className="border-none shadow-md" data-testid="widget-upcoming-reminders">
      <CardHeader className="pb-2">
        <CardTitle className="text-[#D2691E] text-lg flex items-center gap-2">
          <Bell className="h-5 w-5" /> Upcoming Reminders
        </CardTitle>
      </CardHeader>
      <CardContent>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">No upcoming reminders</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map(r => (
              <div key={r.id} className="flex items-center gap-3 py-1 cursor-pointer hover:bg-muted/30 rounded px-2 -mx-2" onClick={() => setLocation('/reminders')} data-testid={`reminder-upcoming-${r.id}`}>
                <div className="bg-[#D2691E]/10 rounded-lg p-1.5">
                  <Calendar className="h-4 w-4 text-[#D2691E]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.startTime ? format(new Date(r.startTime), 'MMM d, h:mm a') : 'No date'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function FamilyMembersWidget() {
  const family = useCurrentFamily();
  const { data: members = [] } = useFamilyMembers(family?.id);

  return (
    <Card className="border-none shadow-md" data-testid="widget-family-members">
      <CardHeader className="pb-2">
        <CardTitle className="text-[#D2691E] text-lg flex items-center gap-2">
          <Users className="h-5 w-5" /> Family Members
        </CardTitle>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">No family members</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {members.map(member => (
              <div key={member.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30" data-testid={`family-member-${member.id}`}>
                <img
                  src={member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`}
                  className="h-8 w-8 rounded-full"
                  alt={member.name}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{member.name}</p>
                  <Badge variant="secondary" className="text-[10px] h-4">
                    {member.isChild ? 'Member' : 'Guardian'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export interface WidgetRegistryEntry {
  title: string;
  icon: LucideIcon;
  component: React.ComponentType<any>;
  defaultVisible: boolean;
  description: string;
}

export const WIDGET_REGISTRY: Record<string, WidgetRegistryEntry> = {
  quick_actions: {
    title: 'Quick Actions',
    icon: Sparkles,
    component: QuickActionsWidget,
    defaultVisible: true,
    description: 'Quick action buttons for adding reminders, meds, chores, and more',
  },
  todays_schedule: {
    title: "Today's Schedule",
    icon: CalendarDays,
    component: TodaysScheduleWidget,
    defaultVisible: true,
    description: "Today's medications, reminders, and chores at a glance",
  },
  medication_tracker: {
    title: 'Medication Tracker',
    icon: Activity,
    component: MedicationTrackerWidget,
    defaultVisible: true,
    description: 'Overview of active medications and doses taken today',
  },
  chore_leaderboard: {
    title: 'Chore Leaderboard',
    icon: Trophy,
    component: ChoreLeaderboardWidget,
    defaultVisible: true,
    description: 'Family members ranked by chore points',
  },
  grocery_summary: {
    title: 'Grocery Summary',
    icon: Package,
    component: GrocerySummaryWidget,
    defaultVisible: true,
    description: 'Quick view of grocery items needed and purchased',
  },
  upcoming_reminders: {
    title: 'Upcoming Reminders',
    icon: Bell,
    component: UpcomingRemindersWidget,
    defaultVisible: true,
    description: 'Next 5 upcoming reminders across all days',
  },
  ai_input: {
    title: 'AI Quick Add',
    icon: Sparkles,
    component: AIInputWidget,
    defaultVisible: true,
    description: 'Add items using AI-powered text or voice input',
  },
  family_members: {
    title: 'Family Members',
    icon: Users,
    component: FamilyMembersWidget,
    defaultVisible: true,
    description: 'View family member avatars and roles',
  },
};

export const DEFAULT_WIDGET_ORDER = [
  'quick_actions', 'todays_schedule', 'medication_tracker', 'chore_leaderboard',
  'grocery_summary', 'upcoming_reminders', 'ai_input', 'family_members',
];

export function getDefaultWidgets() {
  return DEFAULT_WIDGET_ORDER.map((id, index) => ({
    id,
    visible: true,
    position: index,
  }));
}
