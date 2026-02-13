import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Bell,
  CheckSquare,
  Loader2,
  Settings,
  ChevronUp,
  ChevronDown,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useCurrentFamily, useFamilyMembers, useReminders, useMedicines, useMedicineLogs, useChores, useCreateReminder, useCreateMedicineLog, useCreateChore, useCreateMedicine, useCreateGroceryItem } from "@/hooks/useData";
import * as api from "@/lib/api";
import {
  QuickActionsWidget,
  TodaysScheduleWidget,
  AIInputWidget,
  MedicationTrackerWidget,
  ChoreLeaderboardWidget,
  GrocerySummaryWidget,
  UpcomingRemindersWidget,
  FamilyMembersWidget,
  WIDGET_REGISTRY,
  getDefaultWidgets,
} from "@/components/DashboardWidgets";

type AddType = 'reminder' | 'chore' | 'medication' | 'grocery' | null;

interface ParsedItem {
  type: string;
  title: string;
  description?: string;
  dateTime?: string;
  points?: number;
}

interface WidgetConfig {
  id: string;
  visible: boolean;
  position: number;
}

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export default function Dashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const family = useCurrentFamily();
  const { data: members = [] } = useFamilyMembers(family?.id);
  const { data: reminders = [], isLoading: remindersLoading } = useReminders(family?.id);
  const { data: medicines = [], isLoading: medsLoading } = useMedicines(family?.id);
  const { data: medicineLogs = [] } = useMedicineLogs(family?.id);
  const { data: chores = [], isLoading: choresLoading } = useChores(family?.id);
  const createReminder = useCreateReminder(family?.id);
  const createMedicineLog = useCreateMedicineLog(family?.id);
  const createChore = useCreateChore(family?.id);
  const createMedicine = useCreateMedicine(family?.id);
  const createGroceryItem = useCreateGroceryItem(family?.id);

  const [showAllSchedule, setShowAllSchedule] = useState(false);
  const [addType, setAddType] = useState<AddType>(null);
  const [editMode, setEditMode] = useState(false);

  const [smartInputText, setSmartInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string; items?: ParsedItem[] } | null>(null);
  const recognitionRef = useRef<any>(null);

  const [reminderForm, setReminderForm] = useState({ title: '', description: '', date: '', time: '' });
  const [choreForm, setChoreForm] = useState({ title: '', assignedTo: '', points: 10, dueDate: '', dueTime: '' });
  const [medicineForm, setMedicineForm] = useState({ name: '', morning: false, afternoon: false, evening: false, quantity: '', startDate: new Date().toISOString().split('T')[0], endDate: '' });
  const [groceryForm, setGroceryForm] = useState({ name: '', quantity: '' });

  const { data: dashboardConfigData } = useQuery({
    queryKey: ['dashboard-config'],
    queryFn: api.getDashboardConfig,
  });

  const saveDashboardMutation = useMutation({
    mutationFn: (widgets: WidgetConfig[]) => api.saveDashboardConfig(widgets),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-config'] });
      toast({ title: "Dashboard saved", description: "Your dashboard layout has been updated." });
    },
  });

  const widgetConfigs: WidgetConfig[] = (dashboardConfigData?.widgets as WidgetConfig[] | null) || getDefaultWidgets();
  const [editWidgets, setEditWidgets] = useState<WidgetConfig[]>([]);

  useEffect(() => {
    if (editMode) {
      setEditWidgets([...widgetConfigs].sort((a, b) => a.position - b.position));
    }
  }, [editMode]);

  useEffect(() => {
    const supported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    setSpeechSupported(supported);

    if (supported) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setSmartInputText(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (lastResult) {
      const timer = setTimeout(() => {
        setLastResult(null);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [lastResult]);

  const toggleVoiceInput = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      setSmartInputText('');
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const processSmartInput = async () => {
    if (!smartInputText.trim() || isProcessing) return;

    setIsProcessing(true);
    setLastResult(null);

    try {
      const data = await api.aiSchedule(smartInputText, family?.id);
      const totalCreated = data.choresCreated + data.remindersCreated + data.medicationsCreated + data.groceriesCreated;

      setLastResult({
        success: totalCreated > 0,
        message: data.message,
        items: data.items as ParsedItem[]
      });

      if (totalCreated > 0) {
        setSmartInputText('');
        queryClient.invalidateQueries({ queryKey: ['chores'] });
        queryClient.invalidateQueries({ queryKey: ['reminders'] });
        queryClient.invalidateQueries({ queryKey: ['medicines'] });
        queryClient.invalidateQueries({ queryKey: ['groceries'] });
        toast({
          title: "Items Created!",
          description: `Created ${totalCreated} item(s) from your input.`
        });
      }
    } catch (error) {
      setLastResult({
        success: false,
        message: 'Something went wrong. Make sure the API is configured.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForms = () => {
    setReminderForm({ title: '', description: '', date: '', time: '' });
    setChoreForm({ title: '', assignedTo: '', points: 10, dueDate: '', dueTime: '' });
    setMedicineForm({ name: '', morning: false, afternoon: false, evening: false, quantity: '', startDate: new Date().toISOString().split('T')[0], endDate: '' });
    setGroceryForm({ name: '', quantity: '' });
    setAddType(null);
  };

  const handleAddReminder = () => {
    if (!family?.id || !reminderForm.title.trim()) {
      toast({ title: "Error", description: "Please enter a reminder title.", variant: "destructive" });
      return;
    }

    const dateStr = reminderForm.date || format(new Date(), 'yyyy-MM-dd');
    const timeStr = reminderForm.time || '12:00';

    createReminder.mutate({
      title: reminderForm.title,
      type: "Family",
      schedule: { type: "ONCE" },
      startTime: new Date(`${dateStr}T${timeStr}`),
      endTime: new Date(`${dateStr}T${timeStr}`),
    }, {
      onSuccess: () => {
        toast({ title: "Reminder Added", description: "Successfully scheduled." });
        resetForms();
      }
    });
  };

  const handleAddChore = () => {
    if (!family?.id || !choreForm.title.trim() || !choreForm.assignedTo) {
      toast({ title: "Error", description: "Please fill in task name and assign to someone.", variant: "destructive" });
      return;
    }

    const dateStr = choreForm.dueDate || format(new Date(), 'yyyy-MM-dd');

    createChore.mutate({
      title: choreForm.title,
      assignedTo: choreForm.assignedTo || null,
      points: choreForm.points,
      dueDate: dateStr,
      dueTime: choreForm.dueTime || null,
      status: "PENDING",
    }, {
      onSuccess: () => {
        toast({ title: "Chore Added", description: "Task assigned successfully." });
        resetForms();
      }
    });
  };

  const handleAddMedicine = () => {
    if (!family?.id || !medicineForm.name.trim()) {
      toast({ title: "Error", description: "Please enter a medicine name.", variant: "destructive" });
      return;
    }
    if (!medicineForm.morning && !medicineForm.afternoon && !medicineForm.evening) {
      toast({ title: "Error", description: "Please select at least one time of day.", variant: "destructive" });
      return;
    }

    const times: string[] = [];
    if (medicineForm.morning) times.push('08:00');
    if (medicineForm.afternoon) times.push('14:00');
    if (medicineForm.evening) times.push('20:00');

    createMedicine.mutate({
      name: medicineForm.name,
      schedule: { type: 'DAILY', times },
      inventory: parseInt(medicineForm.quantity) || 0,
      startDate: medicineForm.startDate || format(new Date(), 'yyyy-MM-dd'),
      endDate: medicineForm.endDate || null,
      active: true,
    }, {
      onSuccess: () => {
        toast({ title: "Medication Added", description: "Medication schedule created." });
        resetForms();
      }
    });
  };

  const handleAddGrocery = () => {
    if (!family?.id || !groceryForm.name.trim()) {
      toast({ title: "Error", description: "Please enter an item name.", variant: "destructive" });
      return;
    }

    createGroceryItem.mutate({
      name: groceryForm.name,
      quantity: groceryForm.quantity || undefined,
      status: 'NEEDED',
    }, {
      onSuccess: () => {
        toast({ title: "Item Added", description: "Added to grocery list." });
        resetForms();
      }
    });
  };

  const isLoading = remindersLoading || medsLoading || choresLoading;

  const handleDoseClick = (medicineId: string, scheduledTime: string, alreadyTaken: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (alreadyTaken) {
      toast({ title: "Already taken", description: `This dose was already logged for today.` });
      return;
    }
    createMedicineLog.mutate(
      { medicineId, takenAt: new Date(), scheduledTime },
      {
        onSuccess: () => {
          toast({ title: "Dose logged!", description: `Marked ${scheduledTime} dose as taken.` });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to log dose. Please try again.", variant: "destructive" });
        }
      }
    );
  };

  const moveWidget = (index: number, direction: 'up' | 'down') => {
    const newWidgets = [...editWidgets];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newWidgets.length) return;
    const temp = newWidgets[index];
    newWidgets[index] = newWidgets[swapIndex];
    newWidgets[swapIndex] = temp;
    newWidgets.forEach((w, i) => w.position = i);
    setEditWidgets(newWidgets);
  };

  const toggleWidgetVisibility = (index: number) => {
    const newWidgets = [...editWidgets];
    newWidgets[index] = { ...newWidgets[index], visible: !newWidgets[index].visible };
    setEditWidgets(newWidgets);
  };

  const saveWidgetConfig = () => {
    saveDashboardMutation.mutate(editWidgets);
    setEditMode(false);
  };

  const sortedWidgets = [...widgetConfigs].sort((a, b) => a.position - b.position).filter(w => w.visible);

  const renderWidget = (config: WidgetConfig) => {
    const entry = WIDGET_REGISTRY[config.id];
    if (!entry) return null;

    switch (config.id) {
      case 'quick_actions':
        return <QuickActionsWidget setAddType={setAddType} />;
      case 'todays_schedule':
        return (
          <TodaysScheduleWidget
            members={members}
            reminders={reminders}
            medicines={medicines}
            medicineLogs={medicineLogs}
            chores={chores}
            isLoading={isLoading}
            showAllSchedule={showAllSchedule}
            setShowAllSchedule={setShowAllSchedule}
            handleDoseClick={handleDoseClick}
            createMedicineLogPending={createMedicineLog.isPending}
          />
        );
      case 'ai_input':
        return (
          <AIInputWidget
            smartInputText={smartInputText}
            setSmartInputText={setSmartInputText}
            isProcessing={isProcessing}
            isRecording={isRecording}
            speechSupported={speechSupported}
            lastResult={lastResult}
            toggleVoiceInput={toggleVoiceInput}
            processSmartInput={processSmartInput}
          />
        );
      case 'medication_tracker':
        return <MedicationTrackerWidget />;
      case 'chore_leaderboard':
        return <ChoreLeaderboardWidget />;
      case 'grocery_summary':
        return <GrocerySummaryWidget />;
      case 'upcoming_reminders':
        return <UpcomingRemindersWidget />;
      case 'family_members':
        return <FamilyMembersWidget />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-3 lg:gap-6">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setEditMode(true)}
          className="gap-2 text-[#D2691E] border-[#D2691E]/30 hover:bg-[#D2691E]/10"
          data-testid="button-edit-dashboard"
        >
          <Settings className="h-4 w-4" />
          Edit Dashboard
        </Button>
      </div>

      <div className="grid gap-3 lg:gap-6 md:grid-cols-2">
        {sortedWidgets.map(config => (
          <div key={config.id} className={cn(
            config.id === 'todays_schedule' || config.id === 'ai_input' ? 'md:col-span-2' : ''
          )}>
            {renderWidget(config)}
          </div>
        ))}
      </div>

      <Dialog open={editMode} onOpenChange={setEditMode}>
        <DialogContent className="!w-[90vw] !max-w-sm !p-3 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#D2691E] text-base">
              <Settings className="h-4 w-4" /> Customize Dashboard
            </DialogTitle>
            <DialogDescription className="text-xs">Show, hide, or reorder widgets.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 py-1">
            {editWidgets.map((widget, index) => {
              const entry = WIDGET_REGISTRY[widget.id];
              if (!entry) return null;
              return (
                <div key={widget.id} className="flex items-center gap-1.5 p-1.5 rounded-lg border bg-card" data-testid={`widget-config-${widget.id}`}>
                  <div className="flex flex-col shrink-0">
                    <button
                      className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                      onClick={() => moveWidget(index, 'up')}
                      disabled={index === 0}
                      data-testid={`button-move-up-${widget.id}`}
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                      onClick={() => moveWidget(index, 'down')}
                      disabled={index === editWidgets.length - 1}
                      data-testid={`button-move-down-${widget.id}`}
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="flex-1 text-sm font-medium truncate">{entry.title}</span>
                  <Switch
                    checked={widget.visible}
                    onCheckedChange={() => toggleWidgetVisibility(index)}
                    className="shrink-0"
                    data-testid={`switch-widget-${widget.id}`}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => setEditMode(false)}>Cancel</Button>
            <Button
              size="sm"
              className="bg-[#D2691E] hover:bg-[#B8581A]"
              onClick={saveWidgetConfig}
              disabled={saveDashboardMutation.isPending}
              data-testid="button-save-dashboard"
            >
              {saveDashboardMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={addType === 'reminder'} onOpenChange={(open) => !open && setAddType(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-[#D2691E]" /> Add Reminder
            </DialogTitle>
            <DialogDescription>Create a new reminder for your family calendar.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="e.g., Doctor's appointment"
                value={reminderForm.title}
                onChange={(e) => setReminderForm({ ...reminderForm, title: e.target.value })}
                className="h-11"
                data-testid="input-reminder-title"
              />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                placeholder="Add details..."
                value={reminderForm.description}
                onChange={(e) => setReminderForm({ ...reminderForm, description: e.target.value })}
                className="resize-none h-20"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={reminderForm.date || format(new Date(), 'yyyy-MM-dd')}
                  onChange={(e) => setReminderForm({ ...reminderForm, date: e.target.value })}
                  className="h-11"
                  data-testid="input-reminder-date"
                />
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input
                  type="time"
                  value={reminderForm.time}
                  onChange={(e) => setReminderForm({ ...reminderForm, time: e.target.value })}
                  className="h-11"
                  data-testid="input-reminder-time"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" className="h-11 px-6" onClick={() => setAddType(null)}>Cancel</Button>
              <Button className="bg-[#D2691E] hover:bg-[#B8581A] h-11 px-6" onClick={handleAddReminder} disabled={createReminder.isPending}>
                {createReminder.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={addType === 'chore'} onOpenChange={(open) => !open && setAddType(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-amber-600" /> Add Chore
            </DialogTitle>
            <DialogDescription>Assign a new task to a family member.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Task Name</Label>
              <Input
                placeholder="e.g., Clean your room, Take out trash"
                value={choreForm.title}
                onChange={(e) => setChoreForm({ ...choreForm, title: e.target.value })}
                className="h-11"
                data-testid="input-chore-title"
              />
            </div>
            <div className="space-y-2">
              <Label>Assign To</Label>
              <Select value={choreForm.assignedTo} onValueChange={(val) => setChoreForm({ ...choreForm, assignedTo: val })}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select family member" />
                </SelectTrigger>
                <SelectContent sideOffset={8} className="bg-white shadow-lg border rounded-md">
                  {members.filter(m => m.isChild).map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      <div className="flex items-center gap-2">
                        <img src={m.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`} className="h-5 w-5 rounded-full" />
                        {m.name}
                      </div>
                    </SelectItem>
                  ))}
                  {members.filter(m => !m.isChild).map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      <div className="flex items-center gap-2">
                        <img src={m.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`} className="h-5 w-5 rounded-full" />
                        {m.name} (Guardian)
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={choreForm.dueDate || format(new Date(), 'yyyy-MM-dd')}
                  onChange={(e) => setChoreForm({ ...choreForm, dueDate: e.target.value })}
                  className="h-11"
                  data-testid="input-chore-date"
                />
              </div>
              <div className="space-y-2">
                <Label>Time (optional)</Label>
                <Input
                  type="time"
                  value={choreForm.dueTime || ''}
                  onChange={(e) => setChoreForm({ ...choreForm, dueTime: e.target.value })}
                  className="h-11"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Points</Label>
              <Select value={String(choreForm.points)} onValueChange={(val) => setChoreForm({ ...choreForm, points: parseInt(val) })}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent sideOffset={8} className="bg-white shadow-lg border rounded-md">
                  <SelectItem value="5">5 points (Easy)</SelectItem>
                  <SelectItem value="10">10 points (Medium)</SelectItem>
                  <SelectItem value="15">15 points (Hard)</SelectItem>
                  <SelectItem value="20">20 points (Very Hard)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" className="h-11 px-6" onClick={() => setAddType(null)}>Cancel</Button>
              <Button className="bg-[#D2691E] hover:bg-[#B8581A] h-11 px-6" onClick={handleAddChore} disabled={createChore.isPending}>
                {createChore.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
