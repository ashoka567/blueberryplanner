import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar, 
  Check, 
  Clock, 
  Pill, 
  Plus, 
  X, 
  Mic,
  MicOff,
  Sparkles,
  Send,
  ShoppingCart,
  Loader2,
  Bell,
  CheckSquare,
  Coffee,
  Sun,
  Moon,
  CalendarDays
} from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentFamily, useFamilyMembers, useReminders, useMedicines, useMedicineLogs, useChores, useCreateReminder, useCreateMedicineLog, useCreateChore, useCreateMedicine, useCreateGroceryItem } from "@/hooks/useData";
import * as api from "@/lib/api";

type AddType = 'reminder' | 'chore' | 'medication' | 'grocery' | null;

type Mode = 'OVERVIEW' | 'ADD_REMINDER' | 'ADD_CHORE';

interface ParsedItem {
  type: string;
  title: string;
  description?: string;
  dateTime?: string;
  points?: number;
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
  
  const [mode, setMode] = useState<Mode>('OVERVIEW');
  const [showAllSchedule, setShowAllSchedule] = useState(false);
  const [addType, setAddType] = useState<AddType>(null);
  
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

  // Auto-close AI result notification after 1 second
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
    setMode('OVERVIEW');
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
    const timeStr = choreForm.dueTime || '12:00';
    
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

  // Get today's date string in YYYY-MM-DD format for comparison
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Filter reminders for today
  const todayReminders = reminders.filter(reminder => {
    if (!reminder.startTime) return false;
    const reminderDate = new Date(reminder.startTime);
    return reminderDate >= today && reminderDate < tomorrow;
  });
  
  // Filter chores for today
  const todayChores = chores.filter(chore => {
    if (!chore.dueDate) return false;
    return chore.dueDate === todayStr;
  });
  
  // Create combined schedule items for today
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
  
  // Check if a medication dose is taken today
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

  // Check if medication is active today based on start/end dates
  const isMedicationActiveToday = (medicine: typeof medicines[0]) => {
    if (!medicine.active) return false;
    const todayStr = new Date().toISOString().split('T')[0];
    if (medicine.startDate && todayStr < medicine.startDate) return false;
    if (medicine.endDate && todayStr > medicine.endDate) return false;
    return true;
  };

  // Priority items: reminders and medications (shown first)
  // Create one entry per medication with all dose times and their statuses
  // Only show medications that are active today based on start/end dates
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
  
  // Chore items (shown on View All)
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

  return (
    <div className="flex flex-col gap-3 lg:gap-6">
      <div className="grid gap-3 lg:gap-6 md:grid-cols-2">
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
                onClick={() => setAddType('medication')} 
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
                onClick={() => setAddType('grocery')} 
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
                          {item.doses.map((dose, idx) => (
                            <button
                              key={dose.time}
                              onClick={(e) => handleDoseClick(item.medicineId!, dose.time, dose.taken, e)}
                              disabled={createMedicineLog.isPending}
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
      </div>

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

      {/* Add Reminder Modal */}
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

      {/* Add Chore Modal */}
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

      {/* Add Medication Modal */}
      <Dialog open={addType === 'medication'} onOpenChange={(open) => !open && setAddType(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-pink-600" /> Add Medication
            </DialogTitle>
            <DialogDescription>Add a new medication to your schedule.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Medicine Name</Label>
              <Input 
                placeholder="e.g., Vitamin D" 
                value={medicineForm.name}
                onChange={(e) => setMedicineForm({ ...medicineForm, name: e.target.value })}
                className="h-11"
                data-testid="input-medicine-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Schedule</Label>
              <div className="flex gap-2">
                <Button 
                  type="button"
                  variant={medicineForm.morning ? "default" : "outline"}
                  className={cn("flex-1 h-11 gap-2", medicineForm.morning && "bg-[#D2691E] hover:bg-[#B8581A]")}
                  onClick={() => setMedicineForm({ ...medicineForm, morning: !medicineForm.morning })}
                >
                  <Coffee className="h-4 w-4" /> Morning
                </Button>
                <Button 
                  type="button"
                  variant={medicineForm.afternoon ? "default" : "outline"}
                  className={cn("flex-1 h-11 gap-2", medicineForm.afternoon && "bg-[#D2691E] hover:bg-[#B8581A]")}
                  onClick={() => setMedicineForm({ ...medicineForm, afternoon: !medicineForm.afternoon })}
                >
                  <Sun className="h-4 w-4" /> Afternoon
                </Button>
                <Button 
                  type="button"
                  variant={medicineForm.evening ? "default" : "outline"}
                  className={cn("flex-1 h-11 gap-2", medicineForm.evening && "bg-[#D2691E] hover:bg-[#B8581A]")}
                  onClick={() => setMedicineForm({ ...medicineForm, evening: !medicineForm.evening })}
                >
                  <Moon className="h-4 w-4" /> Evening
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input 
                  type="date"
                  value={medicineForm.startDate}
                  onChange={(e) => setMedicineForm({ ...medicineForm, startDate: e.target.value })}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label>End Date (optional)</Label>
                <Input 
                  type="date"
                  value={medicineForm.endDate}
                  onChange={(e) => setMedicineForm({ ...medicineForm, endDate: e.target.value })}
                  className="h-11"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" className="h-11 px-6" onClick={() => setAddType(null)}>Cancel</Button>
              <Button className="bg-[#D2691E] hover:bg-[#B8581A] h-11 px-6" onClick={handleAddMedicine} disabled={createMedicine.isPending}>
                {createMedicine.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Grocery Modal */}
      <Dialog open={addType === 'grocery'} onOpenChange={(open) => !open && setAddType(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-green-600" /> Add Grocery Item
            </DialogTitle>
            <DialogDescription>Add an item to your grocery list.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Item Name</Label>
              <Input 
                placeholder="e.g., Milk, Bread, Eggs" 
                value={groceryForm.name}
                onChange={(e) => setGroceryForm({ ...groceryForm, name: e.target.value })}
                className="h-11"
                data-testid="input-grocery-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Quantity (optional)</Label>
              <Input 
                placeholder="e.g., 2 gallons, 1 loaf" 
                value={groceryForm.quantity}
                onChange={(e) => setGroceryForm({ ...groceryForm, quantity: e.target.value })}
                className="h-11"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" className="h-11 px-6" onClick={() => setAddType(null)}>Cancel</Button>
              <Button className="bg-[#D2691E] hover:bg-[#B8581A] h-11 px-6" onClick={handleAddGrocery} disabled={createGroceryItem.isPending}>
                {createGroceryItem.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
