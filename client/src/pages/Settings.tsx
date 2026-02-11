import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCurrentFamily, useFamilyMembers, useAuthUser } from "@/hooks/useData";
import { updateUserPin, updateUserPoints, getSecurityQuestions, updateSecurityQuestions } from "@/lib/api";
import { Loader2, User, Baby, Shield, KeyRound, Check, X, Trophy, Minus, ShieldQuestion, AlertTriangle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

export default function Settings() {
  const { toast } = useToast();
  const family = useCurrentFamily();
  const { data: members = [], isLoading } = useFamilyMembers(family?.id);
  const { data: authData } = useAuthUser();
  const getKidPoints = (kid: any) => {
    return kid.chorePoints || 0;
  };

  const [editingPin, setEditingPin] = useState<string | null>(null);
  const [editingPoints, setEditingPoints] = useState<string | null>(null);
  const [newPin, setNewPin] = useState('');
  const [newPoints, setNewPoints] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  const [securityQ1, setSecurityQ1] = useState('');
  const [securityA1, setSecurityA1] = useState('');
  const [securityQ2, setSecurityQ2] = useState('');
  const [securityA2, setSecurityA2] = useState('');
  const [hasSecurityQuestions, setHasSecurityQuestions] = useState<boolean | null>(null);
  const [savedQ1, setSavedQ1] = useState<string | null>(null);
  const [savedQ2, setSavedQ2] = useState<string | null>(null);
  const [savingQuestions, setSavingQuestions] = useState(false);

  const SECURITY_QUESTIONS = [
    "What was the name of your first pet?",
    "What city were you born in?",
    "What is your mother's maiden name?",
    "What was the name of your elementary school?",
    "What is your favorite movie?",
    "What street did you grow up on?",
    "What was your childhood nickname?",
    "What is the name of your favorite childhood friend?",
    "What was your first car?",
    "What is your favorite food?",
  ];

  const currentUser = members.find(m => m.id === authData?.user?.id);
  const isGuardian = currentUser && !currentUser.isChild;

  const kids = members.filter(m => m.isChild);
  const guardians = members.filter(m => !m.isChild);

  useEffect(() => {
    if (isGuardian) {
      getSecurityQuestions().then(data => {
        setHasSecurityQuestions(data.hasSecurityQuestions);
        setSavedQ1(data.securityQuestion1);
        setSavedQ2(data.securityQuestion2);
        if (data.securityQuestion1) setSecurityQ1(data.securityQuestion1);
        if (data.securityQuestion2) setSecurityQ2(data.securityQuestion2);
      }).catch(() => {});
    }
  }, [isGuardian]);

  const handleSaveSecurityQuestions = async () => {
    if (!securityQ1 || !securityA1 || !securityQ2 || !securityA2) {
      toast({ title: "Missing Information", description: "Please fill in all security question fields.", variant: "destructive" });
      return;
    }
    if (securityQ1 === securityQ2) {
      toast({ title: "Same Questions", description: "Please choose two different questions.", variant: "destructive" });
      return;
    }
    setSavingQuestions(true);
    try {
      await updateSecurityQuestions({ securityQuestion1: securityQ1, securityAnswer1: securityA1, securityQuestion2: securityQ2, securityAnswer2: securityA2 });
      setHasSecurityQuestions(true);
      setSavedQ1(securityQ1);
      setSavedQ2(securityQ2);
      setSecurityA1('');
      setSecurityA2('');
      toast({ title: "Security Questions Saved", description: "You can now use 'Forgot Password' to reset your password." });
    } catch (error) {
      toast({ title: "Failed", description: error instanceof Error ? error.message : "Could not save security questions.", variant: "destructive" });
    } finally {
      setSavingQuestions(false);
    }
  };

  const handleUpdatePin = async (userId: string) => {
    if (!/^\d{4}$/.test(newPin)) {
      toast({
        title: "Invalid PIN",
        description: "PIN must be exactly 4 digits",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      await updateUserPin(userId, newPin);
      toast({
        title: "PIN Updated",
        description: "The PIN has been updated successfully",
      });
      setEditingPin(null);
      setNewPin('');
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update PIN",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePoints = async (userId: string) => {
    const points = parseInt(newPoints);
    if (isNaN(points) || points < 0) {
      toast({
        title: "Invalid Points",
        description: "Points must be 0 or greater",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      await updateUserPoints(userId, points);
      toast({
        title: "Points Updated",
        description: `Points have been set to ${points}`,
      });
      setEditingPoints(null);
      setNewPoints('');
      queryClient.invalidateQueries({ queryKey: ['familyMembers', family?.id] });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update points",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Family Settings</h1>
        <p className="text-muted-foreground">Manage your family members and their settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#D2691E]" />
            Guardians
          </CardTitle>
          <CardDescription>
            Adult members who can manage the family
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {guardians.map(guardian => (
              <div 
                key={guardian.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <img
                  src={guardian.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${guardian.name}`}
                  alt={guardian.name}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{guardian.name}</p>
                  {guardian.email && (
                    <p className="text-sm text-gray-500">{guardian.email}</p>
                  )}
                </div>
                {guardian.id === authData?.user?.id && (
                  <span className="text-xs bg-[#D2691E]/10 text-[#D2691E] px-2 py-1 rounded">
                    You
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {isGuardian && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldQuestion className="h-5 w-5 text-[#D2691E]" />
            Security Questions
          </CardTitle>
          <CardDescription>
            {hasSecurityQuestions
              ? "Your security questions are set up. You can update them below."
              : "Set up security questions so you can reset your password if you forget it."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasSecurityQuestions === false && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-800">
                You don't have security questions set up yet. Without them, you won't be able to reset your password if you forget it.
              </p>
            </div>
          )}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Security Question 1</Label>
              {savedQ1 && <p className="text-xs text-muted-foreground">Currently: {savedQ1}</p>}
              <Select value={securityQ1} onValueChange={setSecurityQ1}>
                <SelectTrigger data-testid="select-settings-q1">
                  <SelectValue placeholder="Choose a question..." />
                </SelectTrigger>
                <SelectContent>
                  {SECURITY_QUESTIONS.map((q) => (
                    <SelectItem key={q} value={q}>{q}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Your answer"
                value={securityA1}
                onChange={(e) => setSecurityA1(e.target.value)}
                data-testid="input-settings-a1"
              />
            </div>
            <div className="space-y-2">
              <Label>Security Question 2</Label>
              {savedQ2 && <p className="text-xs text-muted-foreground">Currently: {savedQ2}</p>}
              <Select value={securityQ2} onValueChange={setSecurityQ2}>
                <SelectTrigger data-testid="select-settings-q2">
                  <SelectValue placeholder="Choose a different question..." />
                </SelectTrigger>
                <SelectContent>
                  {SECURITY_QUESTIONS.filter(q => q !== securityQ1).map((q) => (
                    <SelectItem key={q} value={q}>{q}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Your answer"
                value={securityA2}
                onChange={(e) => setSecurityA2(e.target.value)}
                data-testid="input-settings-a2"
              />
            </div>
            <Button
              onClick={handleSaveSecurityQuestions}
              disabled={savingQuestions}
              className="bg-[#D2691E] hover:bg-[#B8581A]"
              data-testid="button-save-security-questions"
            >
              {savingQuestions ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              {hasSecurityQuestions ? "Update Security Questions" : "Save Security Questions"}
            </Button>
          </div>
        </CardContent>
      </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Baby className="h-5 w-5 text-[#D2691E]" />
            Children
          </CardTitle>
          <CardDescription>
            Kids can log in with their PIN to view and complete tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          {kids.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Baby className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>No children added yet</p>
              <p className="text-sm">Add children during registration to manage their PINs</p>
            </div>
          ) : (
            <div className="space-y-3">
              {kids.map(kid => (
                <div 
                  key={kid.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <img
                    src={kid.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${kid.name}`}
                    alt={kid.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{kid.name}</p>
                    <p className="text-xs text-gray-500">PIN login</p>
                  </div>
                  
                  <span className="text-sm font-medium text-[#D2691E] whitespace-nowrap">
                    {getKidPoints(kid)} pts
                  </span>
                  
                  {isGuardian && (
                    <>
                    <Dialog open={editingPoints === kid.id} onOpenChange={(open) => {
                      if (!open) {
                        setEditingPoints(null);
                        setNewPoints('');
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setEditingPoints(kid.id);
                            setNewPoints(String(getKidPoints(kid)));
                          }}
                          data-testid={`button-edit-points-${kid.id}`}
                        >
                          <Trophy className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Manage Points for {kid.name}</DialogTitle>
                          <DialogDescription>
                            Adjust or reset {kid.name}'s chore points
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                          <div>
                            <Label htmlFor="new-points">Points</Label>
                            <Input
                              id="new-points"
                              type="number"
                              min="0"
                              placeholder="Enter points"
                              value={newPoints}
                              onChange={(e) => setNewPoints(e.target.value)}
                              className="text-xl text-center mt-2"
                              data-testid="input-new-points"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="flex-1"
                              onClick={() => setNewPoints('0')}
                            >
                              Reset to 0
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="flex-1"
                              onClick={() => setNewPoints(String(Math.max(0, parseInt(newPoints || '0') - 10)))}
                            >
                              <Minus className="h-3 w-3 mr-1" /> 10
                            </Button>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setEditingPoints(null);
                              setNewPoints('');
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => handleUpdatePoints(kid.id)}
                            disabled={isUpdating}
                            className="bg-[#D2691E] hover:bg-[#B8581A]"
                            data-testid="button-save-points"
                          >
                            {isUpdating ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Check className="h-4 w-4 mr-2" />
                            )}
                            Save Points
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Dialog open={editingPin === kid.id} onOpenChange={(open) => {
                      if (!open) {
                        setEditingPin(null);
                        setNewPin('');
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setEditingPin(kid.id)}
                          data-testid={`button-edit-pin-${kid.id}`}
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Change PIN for {kid.name}</DialogTitle>
                          <DialogDescription>
                            Enter a new 4-digit PIN that {kid.name} will use to log in
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <Label htmlFor="new-pin">New PIN</Label>
                          <Input
                            id="new-pin"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={4}
                            placeholder="Enter 4 digits"
                            value={newPin}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                              setNewPin(value);
                            }}
                            className="font-mono text-2xl tracking-widest text-center mt-2"
                            data-testid="input-new-pin"
                          />
                          <p className="text-xs text-muted-foreground mt-2">
                            PIN must be exactly 4 digits
                          </p>
                        </div>
                        <DialogFooter>
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setEditingPin(null);
                              setNewPin('');
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => handleUpdatePin(kid.id)}
                            disabled={isUpdating || newPin.length !== 4}
                            className="bg-[#D2691E] hover:bg-[#B8581A]"
                            data-testid="button-save-pin"
                          >
                            {isUpdating ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Check className="h-4 w-4 mr-2" />
                            )}
                            Save PIN
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Family Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">Family Name</span>
              <span className="font-medium">{family?.name || 'Not set'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">Total Members</span>
              <span className="font-medium">{members.length}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">Guardians / Children</span>
              <span className="font-medium">{guardians.length} / {kids.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
