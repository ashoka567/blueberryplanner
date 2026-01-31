import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Circle, Plus, Trophy, Loader2, X } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useCurrentFamily, useFamilyMembers, useChores, useCreateChore, useUpdateChore, useAuthUser } from "@/hooks/useData";
import { cn } from "@/lib/utils";

export default function ChoresPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const family = useCurrentFamily();
  const { data: members = [] } = useFamilyMembers(family?.id);
  const { data: chores = [], isLoading } = useChores(family?.id);
  const { data: authData } = useAuthUser();
  const createChore = useCreateChore(family?.id);
  const updateChore = useUpdateChore();

  const [showForm, setShowForm] = useState(false);
  const [newChore, setNewChore] = useState({
    title: '',
    assignedTo: '',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '',
    points: 10,
  });

  const currentUser = members.find(m => m.id === authData?.user?.id);
  const isParent = currentUser && !currentUser.isChild;
  const childMembers = members.filter(m => m.isChild);

  const handleCreateChore = () => {
    if (!family?.id || !newChore.title.trim()) {
      toast({ title: "Error", description: "Please enter a chore title", variant: "destructive" });
      return;
    }

    createChore.mutate({
      title: newChore.title,
      assignedTo: newChore.assignedTo || null,
      dueDate: newChore.dueDate,
      dueTime: newChore.dueTime || null,
      points: newChore.points,
      status: "PENDING",
    }, {
      onSuccess: () => {
        toast({ title: "Chore Created", description: "Successfully added new chore." });
        setShowForm(false);
        setNewChore({ title: '', assignedTo: '', dueDate: new Date().toISOString().split('T')[0], dueTime: '', points: 10 });
      }
    });
  };

  const toggleChore = (id: string, currentStatus: string | null | undefined) => {
    const newStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    updateChore.mutate({ id, updates: { status: newStatus } }, {
      onSuccess: () => {
        if (newStatus === 'COMPLETED') {
          toast({ title: "Great job!", description: "Chore marked as completed!" });
        }
      }
    });
  };

  const pendingChores = chores.filter(c => c.status !== 'COMPLETED');
  const completedChores = chores.filter(c => c.status === 'COMPLETED');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#D2691E]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <Button 
          className="bg-[#D2691E] hover:bg-[#B8581A]" 
          onClick={() => setShowForm(!showForm)}
          data-testid="button-add-chore"
        >
          {showForm ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
          {showForm ? 'Cancel' : 'Add'}
        </Button>
      </div>

      {showForm && (
        <Card className="shadow-lg border-none animate-in fade-in slide-in-from-top-4 duration-300 overflow-visible">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="text-lg">{isParent ? "Assign a Chore" : "Add a Chore"}</CardTitle>
            <CardDescription>
              {isParent 
                ? "Create a new task and assign it to a family member" 
                : "Add a new task for yourself"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4 overflow-visible">
            <div className="space-y-2">
              <Label htmlFor="title">Task Name</Label>
              <Input
                id="title"
                placeholder="e.g., Clean your room, Take out trash"
                value={newChore.title}
                onChange={(e) => setNewChore(prev => ({ ...prev, title: e.target.value }))}
                className="h-11"
                data-testid="input-chore-title"
              />
            </div>

            <div className="space-y-2 relative z-30">
              <Label htmlFor="assignee">Assign To</Label>
              <Select 
                value={newChore.assignedTo} 
                onValueChange={(val) => setNewChore(prev => ({ ...prev, assignedTo: val }))}
              >
                <SelectTrigger className="h-11" data-testid="select-assignee">
                  <SelectValue placeholder="Select family member" />
                </SelectTrigger>
                <SelectContent sideOffset={8} className="bg-white shadow-lg border rounded-md">
                  {isParent ? (
                    <>
                      {childMembers.map(m => (
                        <SelectItem key={m.id} value={m.id}>
                          <div className="flex items-center gap-2">
                            <img 
                              src={m.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`} 
                              className="h-5 w-5 rounded-full"
                            />
                            {m.name}
                          </div>
                        </SelectItem>
                      ))}
                      {members.filter(m => !m.isChild).map(m => (
                        <SelectItem key={m.id} value={m.id}>
                          <div className="flex items-center gap-2">
                            <img 
                              src={m.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`} 
                              className="h-5 w-5 rounded-full"
                            />
                            {m.name} (Guardian)
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  ) : currentUser ? (
                    <SelectItem value={currentUser.id}>
                      <div className="flex items-center gap-2">
                        <img 
                          src={currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name}`} 
                          className="h-5 w-5 rounded-full"
                        />
                        {currentUser.name} (Me)
                      </div>
                    </SelectItem>
                  ) : null}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4 relative z-20">
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newChore.dueDate}
                  onChange={(e) => setNewChore(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="h-11"
                  data-testid="input-chore-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueTime">Time</Label>
                <Input
                  id="dueTime"
                  type="time"
                  value={newChore.dueTime}
                  onChange={(e) => setNewChore(prev => ({ ...prev, dueTime: e.target.value }))}
                  className="h-11"
                  placeholder="Optional"
                  data-testid="input-chore-time"
                />
              </div>
            </div>

            <div className="space-y-2 relative z-10">
              <Label htmlFor="points">Points</Label>
              <Select 
                value={String(newChore.points)} 
                onValueChange={(val) => setNewChore(prev => ({ ...prev, points: parseInt(val) }))}
              >
                <SelectTrigger className="h-11" data-testid="select-points">
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

            <div className="flex justify-end gap-3 pt-4 relative z-0">
              <Button 
                variant="outline"
                className="h-11 px-6"
                onClick={() => {
                  setShowForm(false);
                  setNewChore({ title: '', assignedTo: '', dueDate: new Date().toISOString().split('T')[0], dueTime: '', points: 10 });
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateChore} 
                className="bg-[#D2691E] hover:bg-[#B8581A] h-11 px-6"
                disabled={createChore.isPending}
                data-testid="button-submit-chore"
              >
                {createChore.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {isParent ? "Assign Chore" : "Add Chore"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-gradient-to-r from-[#D2691E]/10 to-white border-[#D2691E]/20 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-[#D2691E]">
            <Trophy className="h-5 w-5" /> Weekly Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8 flex-wrap">
            {childMembers.length > 0 ? (
              childMembers
                .map(user => ({
                  user,
                  points: (user as any).chorePoints || 0
                }))
                .sort((a, b) => b.points - a.points)
                .map((item, idx) => (
                  <div key={item.user.id} className="flex items-center gap-3">
                    <div className="relative">
                      <img src={item.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user.name}`} className="h-12 w-12 rounded-full border-2 border-white shadow-sm" />
                      <div className={cn(
                        "absolute -top-1 -right-1 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border border-white",
                        idx === 0 ? "bg-yellow-500" : idx === 1 ? "bg-gray-400" : idx === 2 ? "bg-amber-600" : "bg-[#D2691E]"
                      )}>
                        #{idx + 1}
                      </div>
                    </div>
                    <div>
                      <div className="font-bold text-sm">{item.user.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.points} points
                      </div>
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-sm text-muted-foreground">No family members to show</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg border-none">
          <CardHeader>
            <CardTitle>Pending Tasks</CardTitle>
            <CardDescription>
              {pendingChores.length} chore{pendingChores.length !== 1 ? 's' : ''} to complete
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingChores.length === 0 && (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">All caught up! No pending chores.</p>
              </div>
            )}
            {pendingChores.map(chore => {
              const user = members.find(u => u.id === chore.assignedTo);
              return (
                <div key={chore.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-all group" data-testid={`card-chore-${chore.id}`}>
                  <div className="flex items-center gap-3">
                    <Button 
                      onClick={() => toggleChore(chore.id, chore.status)}
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-green-500 transition-colors"
                      data-testid={`button-toggle-${chore.id}`}
                    >
                      <Circle className="h-5 w-5" />
                    </Button>
                    <div>
                      <div className="font-bold text-sm">{chore.title}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {user && (
                          <div className="flex items-center gap-1">
                            <img src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} className="h-4 w-4 rounded-full" />
                            <span>{user.name}</span>
                          </div>
                        )}
                        {!user && <span className="text-amber-600">Unassigned</span>}
                        {chore.dueDate && (
                          <>
                            <span className="text-muted-foreground/50">•</span>
                            <span>Due: {new Date(chore.dueDate).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="font-mono bg-[#D2691E]/10 text-[#D2691E] border-none">
                    +{chore.points || 0}pts
                  </Badge>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card className="shadow-lg border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Completed
            </CardTitle>
            <CardDescription>
              {completedChores.length} chore{completedChores.length !== 1 ? 's' : ''} done
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {completedChores.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No completed chores yet</p>
            )}
            {completedChores.map(chore => {
              const user = members.find(u => u.id === chore.assignedTo);
              return (
                <div key={chore.id} className="flex items-center justify-between p-3 rounded-lg border border-dashed bg-green-50/50">
                  <div className="flex items-center gap-3">
                    <Button 
                      onClick={() => toggleChore(chore.id, chore.status)}
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-green-500 hover:text-muted-foreground transition-colors"
                      data-testid={`button-toggle-${chore.id}`}
                    >
                      <CheckCircle2 className="h-5 w-5" />
                    </Button>
                    <div>
                      <div className="font-medium text-sm line-through text-muted-foreground">{chore.title}</div>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        {user && <img src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} className="h-3 w-3 rounded-full" />}
                        {user?.name || 'Unassigned'}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="font-mono text-[10px] text-green-600 bg-green-100 border-green-200">
                    +{chore.points || 0}pts
                  </Badge>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
