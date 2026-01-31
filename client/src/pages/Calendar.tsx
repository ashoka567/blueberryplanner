import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format, startOfWeek, addDays, isSameDay, isAfter, startOfDay } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Clock, Loader2, X, Pill, CheckSquare, Calendar as CalendarIcon, CalendarDays, CalendarRange, Bell, ShoppingCart, Coffee, Sun, Moon, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useCurrentFamily, useFamilyMembers, useReminders, useMedicines, useMedicineLogs, useChores, useCreateReminder, useCreateChore, useCreateMedicine, useCreateGroceryItem, useCreateMedicineLog } from "@/hooks/useData";
import { cn } from "@/lib/utils";

const TIME_SLOTS = [
  { label: 'Morning', time: '08:00', range: '6 AM - 12 PM' },
  { label: 'Afternoon', time: '14:00', range: '12 PM - 5 PM' },
  { label: 'Evening', time: '20:00', range: '5 PM - 10 PM' },
];

type AddType = 'reminder' | 'chore' | 'medication' | 'grocery' | null;

export default function CalendarPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const family = useCurrentFamily();
  const { data: members = [] } = useFamilyMembers(family?.id);
  const { data: reminders = [], isLoading: remindersLoading } = useReminders(family?.id);
  const { data: medicines = [], isLoading: medsLoading } = useMedicines(family?.id);
  const { data: medicineLogs = [] } = useMedicineLogs(family?.id);
  const { data: chores = [], isLoading: choresLoading } = useChores(family?.id);
  const createReminder = useCreateReminder(family?.id);
  const createChore = useCreateChore(family?.id);
  const createMedicine = useCreateMedicine(family?.id);
  const createGroceryItem = useCreateGroceryItem(family?.id);
  const createMedicineLog = useCreateMedicineLog(family?.id);
  
  const isLoading = remindersLoading || medsLoading || choresLoading;
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'day'>('day');
  const [addType, setAddType] = useState<AddType>(null);
  
  // Form states
  const [reminderForm, setReminderForm] = useState({ title: '', description: '', date: '', time: '' });
  const [choreForm, setChoreForm] = useState({ title: '', assignedTo: '', points: 10, dueDate: '', dueTime: '' });
  const [medicineForm, setMedicineForm] = useState({ name: '', morning: false, afternoon: false, evening: false, quantity: '', startDate: new Date().toISOString().split('T')[0], endDate: '' });

  const startDate = startOfWeek(currentDate);
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));
  const childMembers = members.filter(m => m.isChild);

  const isMedicationActiveOnDate = (medicine: typeof medicines[0], dateStr: string) => {
    if (!medicine.active) return false;
    if (medicine.startDate && dateStr < medicine.startDate) return false;
    if (medicine.endDate && dateStr > medicine.endDate) return false;
    return true;
  };

  const isDoseTakenOnDate = (medicineId: string, scheduledTime: string, date: Date) => {
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    return medicineLogs.some(log => {
      const logDate = new Date(log.takenAt);
      logDate.setHours(0, 0, 0, 0);
      return log.medicineId === medicineId && 
             log.scheduledTime === scheduledTime && 
             logDate.getTime() === dateStart.getTime();
    });
  };

  const getRemindersForDay = (day: Date) => {
    return reminders.filter(r => {
      const startTime = r.startTime ? new Date(r.startTime) : null;
      return startTime && isSameDay(startTime, day);
    });
  };

  const getMedicationsForDay = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return medicines.filter(m => isMedicationActiveOnDate(m, dateStr));
  };

  const getChoresForDay = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return chores.filter(c => c.dueDate === dateStr);
  };

  const getItemCountForDay = (day: Date) => {
    return getRemindersForDay(day).length + getMedicationsForDay(day).length + getChoresForDay(day).length;
  };

  const markDoseAsTaken = (medicineId: string, medicineName: string, scheduledTime: string, forDate: Date) => {
    const takenDate = new Date(forDate);
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    if (!isNaN(hours) && !isNaN(minutes)) {
      takenDate.setHours(hours, minutes, 0, 0);
    }
    createMedicineLog.mutate({
      medicineId,
      takenAt: takenDate,
      scheduledTime,
    }, {
      onSuccess: () => {
        toast({ title: "Dose Logged", description: `${medicineName} (${scheduledTime}) marked as taken.` });
      }
    });
  };

  const handleAddReminder = () => {
    if (!reminderForm.title.trim()) {
      toast({ title: "Error", description: "Please enter a title", variant: "destructive" });
      return;
    }
    const dateStr = reminderForm.date || format(currentDate, 'yyyy-MM-dd');
    const timeStr = reminderForm.time || '09:00';
    const startTime = new Date(`${dateStr}T${timeStr}:00`);
    
    createReminder.mutate({
      title: reminderForm.title.trim(),
      description: reminderForm.description.trim() || undefined,
      type: 'Custom',
      schedule: { type: 'ONCE' },
      startTime: startTime.toISOString(),
      isActive: true,
    }, {
      onSuccess: () => {
        toast({ title: "Reminder Added", description: `"${reminderForm.title}" has been scheduled` });
        setReminderForm({ title: '', description: '', date: '', time: '' });
        setAddType(null);
      }
    });
  };

  const handleAddChore = () => {
    if (!choreForm.title.trim()) {
      toast({ title: "Error", description: "Please enter a task name", variant: "destructive" });
      return;
    }
    createChore.mutate({
      title: choreForm.title,
      assignedTo: choreForm.assignedTo || null,
      dueDate: choreForm.dueDate || format(currentDate, 'yyyy-MM-dd'),
      dueTime: choreForm.dueTime || null,
      points: choreForm.points,
      status: "PENDING",
    }, {
      onSuccess: () => {
        toast({ title: "Chore Created", description: "Successfully added new chore." });
        setChoreForm({ title: '', assignedTo: '', points: 10, dueDate: '', dueTime: '' });
        setAddType(null);
      }
    });
  };

  const handleAddMedicine = () => {
    if (!medicineForm.name.trim()) {
      toast({ title: "Error", description: "Please enter a medicine name", variant: "destructive" });
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
      startDate: medicineForm.startDate || format(currentDate, 'yyyy-MM-dd'),
      endDate: medicineForm.endDate || null,
    }, {
      onSuccess: () => {
        toast({ title: "Medication Added", description: `${medicineForm.name} added to your schedule.` });
        setMedicineForm({ name: '', morning: false, afternoon: false, evening: false, quantity: '', startDate: new Date().toISOString().split('T')[0], endDate: '' });
        setAddType(null);
      }
    });
  };

  const navigatePrev = () => {
    setCurrentDate(addDays(currentDate, viewMode === 'week' ? -7 : -1));
  };

  const navigateNext = () => {
    setCurrentDate(addDays(currentDate, viewMode === 'week' ? 7 : 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#D2691E]" />
      </div>
    );
  }

  const dayReminders = getRemindersForDay(currentDate);
  const dayMedications = getMedicationsForDay(currentDate);
  const dayChores = getChoresForDay(currentDate);

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center gap-2 relative z-[100]">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'week' | 'day')}>
          <TabsList className="h-8 bg-[#D2691E]/10">
            <TabsTrigger value="day" className="text-xs px-3 data-[state=active]:bg-[#D2691E] data-[state=active]:text-white" data-testid="tab-day-view">Day</TabsTrigger>
            <TabsTrigger value="week" className="text-xs px-3 data-[state=active]:bg-[#D2691E] data-[state=active]:text-white" data-testid="tab-week-view">Week</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-0.5 bg-[#D2691E]/10 rounded-lg p-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-[#D2691E]/20" onClick={navigatePrev} data-testid="button-prev">
            <ChevronLeft className="h-4 w-4 text-[#D2691E]" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs px-2 min-w-[60px] text-[#D2691E] font-medium" onClick={goToToday} data-testid="button-today">
            {isSameDay(currentDate, new Date()) ? 'Today' : format(currentDate, 'MMM d')}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-[#D2691E]/20" onClick={navigateNext} data-testid="button-next">
            <ChevronRight className="h-4 w-4 text-[#D2691E]" />
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="h-8 gap-1 bg-[#D2691E] hover:bg-[#B8581A] px-3" data-testid="button-add-calendar">
              <Plus className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-48 bg-white shadow-lg border rounded-md">
            <DropdownMenuItem onClick={() => setAddType('reminder')} className="gap-2 cursor-pointer">
              <Bell className="h-4 w-4 text-[#D2691E]" /> Reminder
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setAddType('chore')} className="gap-2 cursor-pointer">
              <CheckSquare className="h-4 w-4 text-amber-600" /> Chore
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setAddType('medication')} className="gap-2 cursor-pointer">
              <Pill className="h-4 w-4 text-pink-600" /> Medication
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        </div>

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
                  value={reminderForm.date || format(currentDate, 'yyyy-MM-dd')}
                  onChange={(e) => setReminderForm({ ...reminderForm, date: e.target.value })}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input 
                  type="time" 
                  value={reminderForm.time}
                  onChange={(e) => setReminderForm({ ...reminderForm, time: e.target.value })}
                  className="h-11"
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
                  value={choreForm.dueDate || format(currentDate, 'yyyy-MM-dd')}
                  onChange={(e) => setChoreForm({ ...choreForm, dueDate: e.target.value })}
                  className="h-11"
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
                <Label>Quantity (optional)</Label>
                <Input 
                  type="number"
                  placeholder="e.g., 30 pills" 
                  value={medicineForm.quantity}
                  onChange={(e) => setMedicineForm({ ...medicineForm, quantity: e.target.value })}
                  className="h-11"
                />
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

      {viewMode === 'week' ? (
        <Card className="flex-1 overflow-hidden shadow-lg border-none relative z-0">
          <CardHeader className="bg-gradient-to-r from-[#D2691E] to-[#E8954C] text-white py-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarRange className="h-5 w-5" />
              {format(startDate, "MMM d")} - {format(addDays(startDate, 6), "MMM d, yyyy")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y overflow-y-auto max-h-[calc(100vh-280px)]">
            {weekDays.map((day) => {
              const isToday = isSameDay(new Date(), day);
              const dayRem = getRemindersForDay(day);
              const dayMed = getMedicationsForDay(day);
              const dayCho = getChoresForDay(day);
              const hasItems = dayRem.length > 0 || dayMed.length > 0 || dayCho.length > 0;

              return (
                <div 
                  key={day.toString()} 
                  className={cn(
                    "p-4 cursor-pointer hover:bg-muted/30 transition-colors",
                    isToday && "bg-[#D2691E]/5"
                  )}
                  onClick={() => { setCurrentDate(day); setViewMode('day'); }}
                  data-testid={`card-day-${format(day, 'yyyy-MM-dd')}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Date Column */}
                    <div className={cn(
                      "flex flex-col items-center justify-center min-w-[60px] py-2 px-3 rounded-lg",
                      isToday ? "bg-[#D2691E] text-white" : "bg-muted/50"
                    )}>
                      <div className="text-xs uppercase font-semibold opacity-80">
                        {format(day, "EEE")}
                      </div>
                      <div className="text-2xl font-bold">
                        {format(day, "d")}
                      </div>
                    </div>
                    
                    {/* Events Row - Horizontal Layout */}
                    <div className="flex-1 flex flex-wrap gap-2 items-center min-h-[50px]">
                      {dayRem.map(r => (
                        <div key={r.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#D2691E]/10 text-[#D2691E]">
                          <Bell className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="text-xs font-medium">{r.title}</span>
                          {r.startTime && (
                            <span className="text-[10px] opacity-70">{format(new Date(r.startTime), "h:mm a")}</span>
                          )}
                        </div>
                      ))}
                      {dayMed.map(m => {
                        const schedule = m.schedule as { times?: string[] } | null;
                        const times = schedule?.times || [];
                        const allTaken = times.length > 0 && times.every(t => isDoseTakenOnDate(m.id, t, day));
                        return (
                          <div key={m.id} className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full",
                            allTaken ? "bg-green-100 text-green-700" : "bg-pink-100 text-pink-700"
                          )}>
                            <Pill className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="text-xs font-medium">{m.name}</span>
                            {allTaken && <Check className="h-3 w-3" />}
                          </div>
                        );
                      })}
                      {dayCho.map(c => (
                        <div key={c.id} className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-full",
                          c.status === 'COMPLETED' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                        )}>
                          <CheckSquare className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="text-xs font-medium">{c.title}</span>
                          {c.status === 'COMPLETED' && <Check className="h-3 w-3" />}
                        </div>
                      ))}
                      {!hasItems && (
                        <span className="text-sm text-muted-foreground/50 italic">No events</span>
                      )}
                    </div>
                    
                    {/* Arrow indicator */}
                    <ChevronRight className="h-5 w-5 text-muted-foreground/40 flex-shrink-0" />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : (
        <Card className="flex-1 overflow-hidden shadow-lg border-none relative z-0">
          <CardHeader className="bg-gradient-to-r from-[#D2691E] to-[#E8954C] text-white py-4">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              {format(currentDate, "EEEE, MMMM d")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y overflow-y-auto max-h-[calc(100vh-280px)]">
            {TIME_SLOTS.map(slot => {
              const slotReminders = dayReminders.filter(r => {
                if (!r.startTime) return false;
                const hour = new Date(r.startTime).getHours();
                if (slot.time === '08:00') return hour >= 6 && hour < 12;
                if (slot.time === '14:00') return hour >= 12 && hour < 17;
                return hour >= 17 && hour < 22;
              });
              const slotMeds = dayMedications.filter(m => {
                const schedule = m.schedule as { times?: string[] } | null;
                return schedule?.times?.includes(slot.time);
              });
              const slotChores = slot.time === '08:00' ? dayChores : [];

              return (
                <div key={slot.label} className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-[#D2691E]/10 text-[#D2691E]">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold">{slot.label}</div>
                      <div className="text-xs text-muted-foreground">{slot.range}</div>
                    </div>
                  </div>
                  <div className="space-y-2 ml-13">
                    {/* Reminders */}
                    {slotReminders.map(r => (
                      <div key={r.id} className="flex items-center gap-2 p-3 rounded-lg bg-[#D2691E]/10 border border-[#D2691E]/20">
                        <Bell className="h-4 w-4 text-[#D2691E]" />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{r.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {r.startTime && format(new Date(r.startTime), "h:mm a")}
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">Reminder</Badge>
                      </div>
                    ))}

                    {/* Medications */}
                    {slotMeds.map(m => {
                      const taken = isDoseTakenOnDate(m.id, slot.time, currentDate);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const selectedDay = new Date(currentDate);
                      selectedDay.setHours(0, 0, 0, 0);
                      const isFutureDate = selectedDay.getTime() > today.getTime();
                      return (
                        <div key={m.id} className={cn(
                          "flex items-center gap-2 p-3 rounded-lg border",
                          taken ? "bg-green-50 border-green-100" : "bg-pink-50 border-pink-100"
                        )}>
                          <Pill className={cn("h-4 w-4", taken ? "text-green-600" : "text-pink-600")} />
                          <div className="flex-1">
                            <div className="font-medium text-sm">{m.name}</div>
                            <div className="text-xs text-muted-foreground">{slot.time}</div>
                          </div>
                          <Button 
                            size="sm"
                            className={cn(
                              "h-8",
                              taken 
                                ? "bg-green-500 hover:bg-green-600 cursor-default" 
                                : isFutureDate
                                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                  : "bg-[#D2691E] hover:bg-[#B8581A]"
                            )} 
                            onClick={() => !taken && !isFutureDate && markDoseAsTaken(m.id, m.name, slot.time, currentDate)}
                            disabled={createMedicineLog.isPending || taken || isFutureDate}
                          >
                            <Check className="h-3 w-3 mr-1" /> {taken ? 'Taken' : 'Take'}
                          </Button>
                        </div>
                      );
                    })}

                    {/* Chores (shown in morning slot) */}
                    {slotChores.map(c => (
                      <div key={c.id} className={cn(
                        "flex items-center gap-2 p-3 rounded-lg border",
                        c.status === 'COMPLETED' ? "bg-green-50 border-green-100" : "bg-amber-50 border-amber-100"
                      )}>
                        <CheckSquare className={cn("h-4 w-4", c.status === 'COMPLETED' ? "text-green-600" : "text-amber-600")} />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{c.title}</div>
                          {c.assignedTo && (
                            <div className="text-xs text-muted-foreground">
                              {members.find(m => m.id === c.assignedTo)?.name || 'Unassigned'}
                            </div>
                          )}
                        </div>
                        <Badge variant="outline" className="text-[10px]">{c.points || 5} pts</Badge>
                        <Badge className={cn(
                          "text-[10px]",
                          c.status === 'COMPLETED' ? "bg-green-500" : "bg-amber-500"
                        )}>
                          {c.status === 'COMPLETED' ? 'Done' : 'Pending'}
                        </Badge>
                      </div>
                    ))}

                    {slotReminders.length === 0 && slotMeds.length === 0 && slotChores.length === 0 && (
                      <div className="text-sm text-muted-foreground/50 italic py-2">
                        No events scheduled
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
