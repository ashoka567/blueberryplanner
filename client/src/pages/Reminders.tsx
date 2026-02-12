import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCurrentFamily, useFamilyMembers, useReminders, useCreateReminder, useDeleteReminder, useAuthUser } from "@/hooks/useData";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Bell, Plus, Trash2, Loader2, Clock, Calendar, X, Users, Check } from "lucide-react";

export default function Reminders() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const family = useCurrentFamily();
  const { data: authUser } = useAuthUser();
  const { data: members = [] } = useFamilyMembers(family?.id);
  const { data: reminders = [], isLoading } = useReminders(family?.id);
  const createReminder = useCreateReminder(family?.id);
  const deleteReminder = useDeleteReminder();

  const isChild = authUser?.isChild;

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
  });
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);

  const toggleTarget = (userId: string) => {
    setSelectedTargets(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.title.trim()) {
      toast({ title: "Error", description: "Please enter a reminder title", variant: "destructive" });
      return;
    }

    if (!form.date) {
      toast({ title: "Error", description: "Please select a date", variant: "destructive" });
      return;
    }

    if (selectedTargets.length === 0) {
      toast({ title: "Error", description: "Please select at least one family member", variant: "destructive" });
      return;
    }

    try {
      const startTime = form.time 
        ? new Date(`${form.date}T${form.time}:00`)
        : new Date(`${form.date}T09:00:00`);

      await createReminder.mutateAsync({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        type: 'Custom',
        schedule: { type: 'ONCE' },
        startTime: startTime.toISOString(),
        isActive: true,
        targetUserIds: selectedTargets,
      });

      toast({ title: "Reminder Added", description: `"${form.title}" has been scheduled` });
      setForm({ title: '', description: '', date: '', time: '' });
      setSelectedTargets([]);
      setShowForm(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to create reminder", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string, title: string) => {
    try {
      await deleteReminder.mutateAsync(id);
      toast({ title: "Reminder Deleted", description: `"${title}" has been removed` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete reminder", variant: "destructive" });
    }
  };

  const getMemberName = (userId: string) => {
    const member = members.find(m => m.id === userId);
    return member?.name || 'Unknown';
  };

  const activeReminders = reminders.filter((r: any) => r.isActive !== false);
  const sortedReminders = [...activeReminders].sort((a: any, b: any) => {
    const dateA = a.startTime ? new Date(a.startTime).getTime() : 0;
    const dateB = b.startTime ? new Date(b.startTime).getTime() : 0;
    return dateA - dateB;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#D2691E]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!isChild && (
        <div className="flex items-center justify-end gap-2">
          <Button 
            onClick={() => setShowForm(!showForm)}
            className="bg-[#D2691E] hover:bg-[#B8581A]"
            data-testid="button-add-reminder"
          >
            {showForm ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            {showForm ? 'Cancel' : 'Add'}
          </Button>
        </div>
      )}

      {showForm && !isChild && (
        <Card className="shadow-lg border-none animate-in fade-in slide-in-from-top-4 duration-300">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5 text-[#D2691E]" />
              New Reminder
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Doctor's appointment"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="h-11"
                  data-testid="input-reminder-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add any additional details..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="resize-none h-20"
                  data-testid="input-reminder-description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="h-11"
                    data-testid="input-reminder-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time (optional)</Label>
                  <Input
                    id="time"
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className="h-11"
                    data-testid="input-reminder-time"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#D2691E]" />
                  Assign To
                </Label>
                <div className="flex flex-wrap gap-2">
                  {members.map((member) => {
                    const isSelected = selectedTargets.includes(member.id);
                    return (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => toggleTarget(member.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                          isSelected
                            ? 'bg-[#D2691E] text-white border-[#D2691E]'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-[#D2691E] hover:text-[#D2691E]'
                        }`}
                        data-testid={`button-toggle-target-${member.id}`}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5" />}
                        {member.name}
                        {member.isChild && <span className="text-xs opacity-70">(kid)</span>}
                      </button>
                    );
                  })}
                </div>
                {selectedTargets.length === 0 && (
                  <p className="text-xs text-muted-foreground">Select who this reminder is for</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 px-6"
                  onClick={() => {
                    setShowForm(false);
                    setForm({ title: '', description: '', date: '', time: '' });
                    setSelectedTargets([]);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createReminder.isPending}
                  className="bg-[#D2691E] hover:bg-[#B8581A] h-11 px-6"
                  data-testid="button-save-reminder"
                >
                  {createReminder.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Save Reminder
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-lg border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-[#D2691E]" />
            {isChild ? 'My Reminders' : 'All Reminders'}
            {sortedReminders.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({sortedReminders.length})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedReminders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No reminders yet</p>
              {!isChild && <p className="text-sm">Click "Add" to create one</p>}
            </div>
          ) : (
            <div className="space-y-3">
              {sortedReminders.map((reminder: any) => {
                const startDate = reminder.startTime ? new Date(reminder.startTime) : null;
                const isPast = startDate && startDate < new Date();
                const targetUserIds: string[] = reminder.targetUserIds || [];

                return (
                  <div
                    key={reminder.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border ${
                      isPast ? 'bg-gray-50 opacity-70' : 'bg-white'
                    }`}
                    data-testid={`reminder-item-${reminder.id}`}
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#D2691E]/10 flex items-center justify-center">
                      <Bell className="h-5 w-5 text-[#D2691E]" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900">{reminder.title}</h3>
                      {reminder.description && (
                        <p className="text-sm text-gray-500 mt-1">{reminder.description}</p>
                      )}
                      {startDate && (
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {format(startDate, 'MMM d, yyyy')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {format(startDate, 'h:mm a')}
                          </span>
                        </div>
                      )}
                      {targetUserIds.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          <Users className="h-3.5 w-3.5 text-[#D2691E]" />
                          {targetUserIds.map((uid: string) => (
                            <span
                              key={uid}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#D2691E]/10 text-[#D2691E]"
                              data-testid={`reminder-target-${uid}`}
                            >
                              {getMemberName(uid)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {!isChild && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(reminder.id, reminder.title)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        data-testid={`button-delete-reminder-${reminder.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
