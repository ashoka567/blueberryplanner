import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
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
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentFamily, useFamilyMembers, useReminders, useMedicines, useMedicineLogs, useChores, useCreateReminder, useCreateMedicineLog } from "@/hooks/useData";
import * as api from "@/lib/api";

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
  
  const [mode, setMode] = useState<Mode>('OVERVIEW');
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [showAllSchedule, setShowAllSchedule] = useState(false);
  
  const [smartInputText, setSmartInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string; items?: ParsedItem[] } | null>(null);
  const recognitionRef = useRef<any>(null);
  
  const [reminderForm, setReminderForm] = useState({ title: '', date: '', time: '', members: [] as string[] });
  const [choreForm, setChoreForm] = useState({ title: '', member: '', startTime: '', endDate: '' });

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
    setReminderForm({ title: '', date: '', time: '', members: [] });
    setChoreForm({ title: '', member: '', startTime: '', endDate: '' });
    setMode('OVERVIEW');
  };

  const handleSaveReminder = () => {
    if (!family?.id) return;
    
    createReminder.mutate({
      title: reminderForm.title || "New Reminder",
      type: "Family",
      schedule: { type: "ONCE" },
      startTime: new Date(`${reminderForm.date}T${reminderForm.time || '12:00'}`),
      endTime: new Date(`${reminderForm.date}T${reminderForm.time || '13:00'}`),
    }, {
      onSuccess: () => {
        toast({ title: "Reminder Added", description: "Successfully scheduled." });
        resetForms();
      }
    });
  };

  if (mode === 'ADD_REMINDER') {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-[#D2691E]">Schedule Reminder</h1>
          <Button variant="ghost" onClick={() => setMode('OVERVIEW')}><X className="h-5 w-5" /></Button>
        </div>
        <Card className="border-none shadow-xl">
          <CardContent className="pt-6 space-y-4">
            <div className="grid gap-2">
              <Label>Reminder Title</Label>
              <Input placeholder="e.g. Soccer Practice" value={reminderForm.title} onChange={e => setReminderForm({...reminderForm, title: e.target.value})} data-testid="input-reminder-title" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Date</Label>
                <Input type="date" value={reminderForm.date} onChange={e => setReminderForm({...reminderForm, date: e.target.value})} data-testid="input-reminder-date" />
              </div>
              <div className="grid gap-2">
                <Label>Time</Label>
                <Input type="time" value={reminderForm.time} onChange={e => setReminderForm({...reminderForm, time: e.target.value})} data-testid="input-reminder-time" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Family Members Involved</Label>
              <div className="flex flex-wrap gap-3 p-3 border rounded-lg bg-muted/30">
                {members.map(user => (
                  <div key={user.id} className="flex items-center gap-2">
                    <Checkbox 
                      id={`user-${user.id}`} 
                      checked={reminderForm.members.includes(user.id)}
                      onCheckedChange={(checked) => {
                        const newMembers = checked 
                          ? [...reminderForm.members, user.id]
                          : reminderForm.members.filter(id => id !== user.id);
                        setReminderForm({...reminderForm, members: newMembers});
                      }}
                    />
                    <label htmlFor={`user-${user.id}`} className="text-sm font-medium flex items-center gap-1">
                      <img src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} className="h-5 w-5 rounded-full" />
                      {user.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button onClick={handleSaveReminder} className="flex-1 bg-[#D2691E] hover:bg-[#B8581A]" disabled={createReminder.isPending} data-testid="button-save-reminder">
                Save Reminder
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setMode('OVERVIEW')}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (mode === 'ADD_CHORE') {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-[#D2691E]">Assign Chore</h1>
          <Button variant="ghost" onClick={() => setMode('OVERVIEW')}><X className="h-5 w-5" /></Button>
        </div>
        <Card className="max-w-2xl mx-auto shadow-xl">
          <CardContent className="pt-6 space-y-4">
            <div className="grid gap-2">
              <Label>Chore Title</Label>
              <Input placeholder="e.g. Clean Kitchen" value={choreForm.title} onChange={e => setChoreForm({...choreForm, title: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label>Assign To Family Member</Label>
              <div className="grid grid-cols-2 gap-2">
                {members.map(user => (
                  <Button 
                    key={user.id} 
                    variant={choreForm.member === user.id ? "default" : "outline"}
                    className={choreForm.member === user.id ? "bg-[#D2691E] hover:bg-[#B8581A]" : ""}
                    onClick={() => setChoreForm({...choreForm, member: user.id})}
                  >
                    <img src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} className="h-4 w-4 rounded-full mr-2" />
                    {user.name}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Start Time</Label>
                <Input type="time" value={choreForm.startTime} onChange={e => setChoreForm({...choreForm, startTime: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>End Date</Label>
                <Input type="date" value={choreForm.endDate} onChange={e => setChoreForm({...choreForm, endDate: e.target.value})} />
              </div>
            </div>
            <Button className="w-full bg-[#D2691E] hover:bg-[#B8581A]" onClick={() => {
              toast({ title: "Chore Assigned", description: "Task successfully delegated." });
              resetForms();
            }}>Save Assignment</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Plus className="h-24 w-24 -mr-8 -mt-8 rotate-12" />
          </div>
          <CardHeader 
            className="pb-2 cursor-pointer" 
            onClick={() => setQuickActionsOpen(!quickActionsOpen)}
            data-testid="button-toggle-quick-actions"
          >
            <CardTitle className="text-white text-lg flex items-center justify-center w-full relative">
              <span>Quick Actions</span>
              <X className={cn("h-5 w-5 transition-transform absolute right-0", quickActionsOpen ? "rotate-0" : "rotate-45")} />
            </CardTitle>
          </CardHeader>
          {quickActionsOpen && (
            <CardContent className="pt-2 pb-3">
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => setMode('ADD_REMINDER')} variant="secondary" className="bg-white/20 hover:bg-white/30 border-none text-white text-xs justify-center gap-1.5 h-8" data-testid="button-add-reminder">
                  <Plus className="h-3 w-3" /> Reminder
                </Button>
                <Button onClick={() => setLocation('/medications')} variant="secondary" className="bg-white/20 hover:bg-white/30 border-none text-white text-xs justify-center gap-1.5 h-8" data-testid="button-log-meds">
                  <Pill className="h-3 w-3" /> Meds
                </Button>
                <Button onClick={() => setMode('ADD_CHORE')} variant="secondary" className="bg-white/20 hover:bg-white/30 border-none text-white text-xs justify-center gap-1.5 h-8" data-testid="button-add-chore">
                  <Check className="h-3 w-3" /> Chore
                </Button>
                <Button variant="secondary" className="bg-white/20 hover:bg-white/30 border-none text-white text-xs justify-center gap-1.5 h-8" onClick={() => setLocation('/groceries')} data-testid="button-add-grocery">
                  <ShoppingCart className="h-3 w-3" /> Grocery
                </Button>
              </div>
              <ul className="text-xs space-y-2 mt-4 opacity-90 border-t border-white/10 pt-4">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />
                  {medicines.length} medication(s) being tracked
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />
                  {reminders.length} upcoming reminder(s)
                </li>
              </ul>
            </CardContent>
          )}
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-l-4 border-l-[#D2691E]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Next Reminder</CardTitle>
            <Calendar className="h-4 w-4 text-[#D2691E]" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold truncate">{reminders[0]?.title || 'None scheduled'}</div>
            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3" /> 
              {reminders[0]?.startTime ? format(new Date(reminders[0].startTime), "h:mm a") : 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
