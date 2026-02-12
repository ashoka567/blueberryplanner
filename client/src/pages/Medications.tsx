import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, Clock, Plus, Loader2, X, Pill, Coffee, Sun, Moon, Info, Trash2, User } from "lucide-react";
import { useCurrentFamily, useFamilyMembers, useMedicines, useMedicineLogs, useCreateMedicineLog, useCreateMedicine, useDeleteMedicine, useAuthUser } from "@/hooks/useData";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MedicationsPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const family = useCurrentFamily();
  const { data: members = [] } = useFamilyMembers(family?.id);
  const { data: medicines = [], isLoading } = useMedicines(family?.id);
  const { data: medicineLogs = [] } = useMedicineLogs(family?.id);
  const createLog = useCreateMedicineLog(family?.id);
  const createMedicine = useCreateMedicine(family?.id);
  const deleteMedicine = useDeleteMedicine(family?.id);
  const { data: authData } = useAuthUser();
  const isChild = authData?.user?.isChild;

  const [showAddForm, setShowAddForm] = useState(false);
  const [medForm, setMedForm] = useState({ 
    name: '', 
    quantity: '', 
    morning: false, 
    afternoon: false, 
    evening: false,
    instructions: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    assignedTo: '',
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isDoseTakenToday = (medicineId: string, scheduledTime: string) => {
    return medicineLogs.some(log => {
      const logDate = new Date(log.takenAt);
      logDate.setHours(0, 0, 0, 0);
      return log.medicineId === medicineId && 
             log.scheduledTime === scheduledTime && 
             logDate.getTime() === today.getTime();
    });
  };

  const markDoseAsTaken = (medicineId: string, medicineName: string, scheduledTime: string) => {
    createLog.mutate({
      medicineId,
      takenAt: new Date(),
      scheduledTime,
    }, {
      onSuccess: () => {
        toast({
          title: "Dose Logged",
          description: `${medicineName} (${scheduledTime}) marked as taken.`,
        });
      }
    });
  };

  const handleAddMedicine = () => {
    if (!family?.id || !medForm.name || !medForm.assignedTo) return;
    const times: string[] = [];
    if (medForm.morning) times.push('08:00');
    if (medForm.afternoon) times.push('14:00');
    if (medForm.evening) times.push('20:00');
    
    createMedicine.mutate({
      name: medForm.name,
      schedule: { type: 'DAILY', times },
      inventory: parseInt(medForm.quantity) || 0,
      startDate: medForm.startDate || null,
      endDate: medForm.endDate || null,
      assignedTo: medForm.assignedTo,
    }, {
      onSuccess: () => {
        toast({ title: "Medication Added", description: `${medForm.name} added to your schedule.` });
        setMedForm({ name: '', quantity: '', morning: false, afternoon: false, evening: false, instructions: '', startDate: new Date().toISOString().split('T')[0], endDate: '', assignedTo: '' });
        setShowAddForm(false);
      }
    });
  };

  const isMedicationActiveToday = (medicine: typeof medicines[0]) => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (medicine.startDate && todayStr < medicine.startDate) return false;
    if (medicine.endDate && todayStr > medicine.endDate) return false;
    return medicine.active;
  };

  const handleDeleteMedicine = (id: string, name: string) => {
    deleteMedicine.mutate(id, {
      onSuccess: () => {
        toast({ title: "Medication Removed", description: `${name} has been removed.` });
      }
    });
  };

  // Calculate today's status
  const activeMedicines = medicines.filter(m => isMedicationActiveToday(m));
  const todayStats = activeMedicines.reduce((acc, med) => {
    const schedule = med.schedule as { times?: string[] } | null;
    const times = schedule?.times || [];
    const takenCount = times.filter(time => isDoseTakenToday(med.id, time)).length;
    return {
      totalDoses: acc.totalDoses + times.length,
      takenDoses: acc.takenDoses + takenCount,
    };
  }, { totalDoses: 0, takenDoses: 0 });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#D2691E]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!isChild && (
        <div className="flex items-center justify-end gap-2">
          <Button 
            className="bg-[#D2691E] hover:bg-[#B8581A]"
            onClick={() => setShowAddForm(!showAddForm)}
            data-testid="button-add-medication"
          >
            {showAddForm ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            {showAddForm ? 'Cancel' : 'Add'}
          </Button>
        </div>
      )}

      {showAddForm && (
        <Card className="shadow-lg border-none animate-in fade-in slide-in-from-top-4 duration-300">
          <CardHeader className="bg-muted/30 border-b py-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Pill className="h-4 w-4 text-[#D2691E]" />
              Add New Medication
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="flex gap-3">
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Medicine Name</Label>
                <Input 
                  placeholder="Enter name" 
                  value={medForm.name} 
                  onChange={e => setMedForm({...medForm, name: e.target.value})} 
                  className="h-9"
                  data-testid="input-medicine-name"
                />
              </div>
              <div className="w-24 space-y-1">
                <Label className="text-xs">Qty</Label>
                <Input 
                  type="number" 
                  placeholder="30" 
                  value={medForm.quantity} 
                  onChange={e => setMedForm({...medForm, quantity: e.target.value})} 
                  className="h-9"
                  data-testid="input-medicine-quantity"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1">
                <User className="h-3 w-3 text-muted-foreground" />
                Assigned To <span className="text-red-500">*</span>
              </Label>
              <Select
                value={medForm.assignedTo}
                onValueChange={(value) => setMedForm({...medForm, assignedTo: value})}
              >
                <SelectTrigger className="h-9" data-testid="select-medicine-assigned-to">
                  <SelectValue placeholder="Select family member" />
                </SelectTrigger>
                <SelectContent className="bg-white shadow-lg border rounded-md" sideOffset={8}>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id} data-testid={`option-member-${member.id}`}>
                      <span className="flex items-center gap-2">
                        <img 
                          src={member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`} 
                          className="h-5 w-5 rounded-full inline-block" 
                          alt="" 
                        />
                        {member.name} {member.isChild ? '(Child)' : '(Guardian)'}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <Label className="text-xs">Schedule</Label>
              <div className="flex gap-2">
                <Button 
                  type="button"
                  variant={medForm.morning ? "default" : "outline"}
                  size="sm"
                  className={cn("flex-1 h-8 gap-1 text-xs", medForm.morning && "bg-[#D2691E] hover:bg-[#B8581A]")}
                  onClick={() => setMedForm({...medForm, morning: !medForm.morning})}
                  data-testid="button-schedule-morning"
                >
                  <Coffee className="h-3 w-3" /> Morning
                </Button>
                <Button 
                  type="button"
                  variant={medForm.afternoon ? "default" : "outline"}
                  size="sm"
                  className={cn("flex-1 h-8 gap-1 text-xs", medForm.afternoon && "bg-[#D2691E] hover:bg-[#B8581A]")}
                  onClick={() => setMedForm({...medForm, afternoon: !medForm.afternoon})}
                  data-testid="button-schedule-afternoon"
                >
                  <Sun className="h-3 w-3" /> Afternoon
                </Button>
                <Button 
                  type="button"
                  variant={medForm.evening ? "default" : "outline"}
                  size="sm"
                  className={cn("flex-1 h-8 gap-1 text-xs", medForm.evening && "bg-[#D2691E] hover:bg-[#B8581A]")}
                  onClick={() => setMedForm({...medForm, evening: !medForm.evening})}
                  data-testid="button-schedule-evening"
                >
                  <Moon className="h-3 w-3" /> Evening
                </Button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Start Date</Label>
                <Input 
                  type="date" 
                  value={medForm.startDate} 
                  onChange={e => setMedForm({...medForm, startDate: e.target.value})} 
                  className="h-9"
                  data-testid="input-medicine-start-date"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">End Date (Optional)</Label>
                <Input 
                  type="date" 
                  value={medForm.endDate} 
                  onChange={e => setMedForm({...medForm, endDate: e.target.value})} 
                  className="h-9"
                  data-testid="input-medicine-end-date"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1">
                <Info className="h-3 w-3 text-muted-foreground" />
                Instructions (Optional)
              </Label>
              <Input 
                placeholder="e.g. Take with food" 
                value={medForm.instructions}
                onChange={e => setMedForm({...medForm, instructions: e.target.value})}
                className="h-9"
                data-testid="input-medicine-instructions"
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-2">
              <Button 
                variant="outline"
                size="sm"
                className="h-9 px-4"
                onClick={() => {
                  setShowAddForm(false);
                  setMedForm({ name: '', quantity: '', morning: false, afternoon: false, evening: false, instructions: '', startDate: new Date().toISOString().split('T')[0], endDate: '', assignedTo: '' });
                }}
              >
                Cancel
              </Button>
              <Button 
                size="sm"
                className="bg-[#D2691E] hover:bg-[#B8581A] h-9 px-4" 
                onClick={handleAddMedicine}
                disabled={!medForm.name || !medForm.assignedTo || createMedicine.isPending}
                data-testid="button-save-medication"
              >
                {createMedicine.isPending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                Save
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {medicines.length === 0 && !showAddForm && (
        <div className="text-center py-12">
          <Pill className="h-12 w-12 mx-auto mb-3 opacity-40 text-muted-foreground" />
          <p className="text-muted-foreground font-medium">No medications added yet</p>
          <p className="text-sm text-muted-foreground">Click "Add Medication" to get started</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {medicines.filter(m => isMedicationActiveToday(m)).map((med) => {
          const user = members.find(u => u.id === med.assignedTo);
          const schedule = med.schedule as { type?: string; times?: string[] } | null;
          const times = schedule?.times || [];
          const inventory = med.inventory || 0;
          const takenCount = times.filter(time => isDoseTakenToday(med.id, time)).length;
          const allDosesTaken = times.length > 0 && takenCount === times.length;
          
          return (
            <Card key={med.id} className="overflow-hidden shadow-lg border-none" data-testid={`card-medicine-${med.id}`}>
              <div className={cn(
                "h-2 w-full",
                allDosesTaken ? 'bg-green-500' : takenCount > 0 ? 'bg-amber-500' : 'bg-[#D2691E]'
              )} />
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Pill className="h-5 w-5 text-[#D2691E]" />
                      {med.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      {user && (
                        <>
                          <img src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} className="h-5 w-5 rounded-full" />
                          {user.name}
                        </>
                      )}
                      {!user && <span>Unassigned</span>}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1",
                      allDosesTaken ? "bg-green-100 text-green-700" : "bg-[#D2691E]/10 text-[#D2691E]"
                    )}>
                      {allDosesTaken ? (
                        <><Check className="h-3 w-3" /> DONE</>
                      ) : (
                        <><Clock className="h-3 w-3" /> {takenCount}/{times.length}</>
                      )}
                    </div>
                    {!isChild && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                        onClick={() => handleDeleteMedicine(med.id, med.name)}
                        data-testid={`button-delete-medicine-${med.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block text-xs">Dosage</span>
                    <span className="font-medium">{med.dosage || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Frequency</span>
                    <span className="font-medium">{schedule?.type || 'Daily'}</span>
                  </div>
                </div>

                {times.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-muted-foreground block text-xs">Today's Doses</span>
                    <div className="space-y-2">
                      {times.map((time: string) => {
                        const isTaken = isDoseTakenToday(med.id, time);
                        return (
                          <div 
                            key={time} 
                            className={cn(
                              "flex items-center justify-between p-3 rounded-lg border",
                              isTaken ? "bg-green-50 border-green-200" : "bg-muted/30 border-border"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center",
                                isTaken ? "bg-green-500 text-white" : "bg-[#D2691E]/10 text-[#D2691E]"
                              )}>
                                {isTaken ? <Check className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                              </div>
                              <div>
                                <span className="font-mono font-medium">{time}</span>
                                <span className={cn(
                                  "block text-xs",
                                  isTaken ? "text-green-600" : "text-muted-foreground"
                                )}>
                                  {isTaken ? "Taken" : "Pending"}
                                </span>
                              </div>
                            </div>
                            <Button 
                              size="sm"
                              className={cn(
                                isTaken 
                                  ? "bg-green-500 hover:bg-green-600 cursor-default" 
                                  : "bg-[#D2691E] hover:bg-[#B8581A]"
                              )} 
                              onClick={() => !isTaken && markDoseAsTaken(med.id, med.name, time)}
                              disabled={createLog.isPending || isTaken}
                              data-testid={`button-mark-taken-${med.id}-${time}`}
                            >
                              <Check className="h-4 w-4 mr-1" /> {isTaken ? 'Taken' : 'Take'}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5 pt-2 border-t">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Inventory</span>
                    <span className={inventory < 10 ? "text-red-500 font-bold" : "text-[#D2691E]"}>
                      {inventory} pills left
                    </span>
                  </div>
                  <Progress value={(inventory / 30) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Today's Status */}
      {activeMedicines.length > 0 && (
        <Card className="shadow-lg border-none bg-gradient-to-r from-[#D2691E]/5 to-[#E8954C]/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Check className="h-5 w-5 text-[#D2691E]" />
              Today's Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Daily Progress</span>
              <span className={cn(
                "text-lg font-bold",
                todayStats.takenDoses === todayStats.totalDoses ? "text-green-600" : "text-[#D2691E]"
              )}>
                {todayStats.takenDoses} / {todayStats.totalDoses} doses
              </span>
            </div>
            <Progress 
              value={todayStats.totalDoses > 0 ? (todayStats.takenDoses / todayStats.totalDoses) * 100 : 0} 
              className="h-3" 
            />
            {todayStats.takenDoses === todayStats.totalDoses && todayStats.totalDoses > 0 && (
              <p className="text-center text-green-600 font-medium mt-3 flex items-center justify-center gap-2">
                <Check className="h-4 w-4" /> All medications taken for today!
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
