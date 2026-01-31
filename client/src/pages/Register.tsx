import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, Plus, Trash2, Eye, EyeOff, Users, Shield, Baby, Copy, Check } from "lucide-react";
import * as api from "@/lib/api";

interface FamilyMember {
  name: string;
  email: string;
  password: string;
  age: string;
  isChild: boolean;
  pin: string;
}

interface RegisterProps {
  onRegisterSuccess: () => void;
}

export default function Register({ onRegisterSuccess }: RegisterProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [kidPins, setKidPins] = useState<{ name: string; pin: string }[]>([]);
  const [copiedPin, setCopiedPin] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    familyName: '',
    guardianName: '',
    guardianEmail: '',
    password: '',
    confirmPassword: '',
  });
  
  const [members, setMembers] = useState<FamilyMember[]>([]);

  const addMember = () => {
    setMembers([...members, { name: '', email: '', password: '', age: '', isChild: false, pin: '' }]);
  };

  const removeMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const updateMember = (index: number, field: keyof FamilyMember, value: string | boolean) => {
    const updated = [...members];
    updated[index] = { ...updated[index], [field]: value };
    setMembers(updated);
  };

  const validateStep1 = () => {
    if (!form.familyName || !form.guardianName || !form.guardianEmail || !form.password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return false;
    }
    
    if (form.password.length < 8) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return false;
    }
    
    if (form.password !== form.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.guardianEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  const copyPin = (pin: string, name: string) => {
    navigator.clipboard.writeText(pin);
    setCopiedPin(name);
    setTimeout(() => setCopiedPin(null), 2000);
  };

  const handleContinue = () => {
    onRegisterSuccess();
    setLocation('/');
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const memberData = members
        .filter(m => m.name.trim())
        .map(m => ({
          name: m.name,
          email: m.email || undefined,
          password: m.isChild ? undefined : (m.password || undefined),
          age: m.age ? parseInt(m.age) : undefined,
          isChild: m.isChild,
          pin: m.isChild && m.pin ? m.pin : undefined,
        }));

      const response = await api.register({
        familyName: form.familyName,
        guardianName: form.guardianName,
        guardianEmail: form.guardianEmail,
        password: form.password,
        members: memberData,
      });
      
      if (response.kidPins && response.kidPins.length > 0) {
        setKidPins(response.kidPins);
        setStep(3);
      } else {
        toast({
          title: "Family Created!",
          description: "Your family account has been set up successfully.",
        });
        onRegisterSuccess();
        setLocation('/');
      }
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Could not create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 p-4">
      <Card className="w-full max-w-xl shadow-xl border-none">
        <CardHeader className="text-center space-y-2 pb-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-[#D2691E] text-white text-3xl mb-2">
            🫐
          </div>
          <CardTitle className="text-2xl font-bold text-[#D2691E]">
            {step === 3 ? "Important: Kid's PINs" : "Create Your Family Account"}
          </CardTitle>
          <CardDescription>
            {step === 1 ? "Set up the primary guardian account" : 
             step === 2 ? "Add your family members (optional)" :
             "Save these PINs - your kids will use them to sign in"}
          </CardDescription>
          <div className="flex justify-center gap-2 pt-2">
            <div className={`h-2 w-12 rounded-full ${step >= 1 ? 'bg-[#D2691E]' : 'bg-gray-200'}`} />
            <div className={`h-2 w-12 rounded-full ${step >= 2 ? 'bg-[#D2691E]' : 'bg-gray-200'}`} />
            {kidPins.length > 0 && <div className={`h-2 w-12 rounded-full ${step >= 3 ? 'bg-[#D2691E]' : 'bg-gray-200'}`} />}
          </div>
        </CardHeader>
        <CardContent>
          {step === 1 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="familyName">Family Name</Label>
                <Input
                  id="familyName"
                  placeholder="The Smith Family"
                  value={form.familyName}
                  onChange={(e) => setForm({ ...form, familyName: e.target.value })}
                  data-testid="input-family-name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="guardianName">Your Name (Primary Guardian)</Label>
                <Input
                  id="guardianName"
                  placeholder="John Smith"
                  value={form.guardianName}
                  onChange={(e) => setForm({ ...form, guardianName: e.target.value })}
                  data-testid="input-guardian-name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="guardianEmail">Email Address</Label>
                <Input
                  id="guardianEmail"
                  type="email"
                  placeholder="john@example.com"
                  value={form.guardianEmail}
                  onChange={(e) => setForm({ ...form, guardianEmail: e.target.value })}
                  data-testid="input-guardian-email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimum 8 characters"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="pr-10"
                    data-testid="input-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Must be at least 8 characters for security
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  data-testid="input-confirm-password"
                />
              </div>
              
              <Button 
                onClick={() => validateStep1() && setStep(2)}
                className="w-full bg-[#D2691E] hover:bg-[#B8581A] h-11 mt-4"
                data-testid="button-next-step"
              >
                Continue to Add Family Members
              </Button>
            </div>
          ) : step === 2 ? (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                <p className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-[#D2691E]" />
                  <strong className="text-foreground">Adding Family Members</strong>
                </p>
                <ul className="space-y-1 ml-6">
                  <li className="flex items-center gap-2">
                    <Shield className="h-3 w-3" /> Guardians can manage everything
                  </li>
                  <li className="flex items-center gap-2">
                    <Baby className="h-3 w-3" /> Kids can view and complete tasks
                  </li>
                </ul>
              </div>

              {members.map((member, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3 bg-white relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeMember(index)}
                    data-testid={`button-remove-member-${index}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Name</Label>
                      <Input
                        placeholder="Member name"
                        value={member.name}
                        onChange={(e) => updateMember(index, 'name', e.target.value)}
                        data-testid={`input-member-name-${index}`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Age (optional)</Label>
                      <Input
                        type="number"
                        placeholder="Age"
                        value={member.age}
                        onChange={(e) => updateMember(index, 'age', e.target.value)}
                        data-testid={`input-member-age-${index}`}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`isChild-${index}`}
                      checked={member.isChild}
                      onCheckedChange={(checked) => updateMember(index, 'isChild', !!checked)}
                      data-testid={`checkbox-is-child-${index}`}
                    />
                    <label htmlFor={`isChild-${index}`} className="text-sm">
                      This is a child (uses PIN to login)
                    </label>
                  </div>
                  
                  {member.isChild && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">4-Digit PIN for Kid Login</Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={4}
                        placeholder="Enter 4-digit PIN (e.g., 1234)"
                        value={member.pin}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                          updateMember(index, 'pin', value);
                        }}
                        className="font-mono text-lg tracking-widest"
                        data-testid={`input-member-pin-${index}`}
                      />
                      <p className="text-xs text-muted-foreground">
                        Your child will use this PIN to sign in
                      </p>
                    </div>
                  )}
                  
                  {!member.isChild && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Email</Label>
                        <Input
                          type="email"
                          placeholder="email@example.com"
                          value={member.email}
                          onChange={(e) => updateMember(index, 'email', e.target.value)}
                          data-testid={`input-member-email-${index}`}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Password</Label>
                        <Input
                          type="password"
                          placeholder="Password"
                          value={member.password}
                          onChange={(e) => updateMember(index, 'password', e.target.value)}
                          data-testid={`input-member-password-${index}`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                className="w-full border-dashed"
                onClick={addMember}
                data-testid="button-add-member"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Family Member
              </Button>
              
              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleSubmit}
                  className="flex-1 bg-[#D2691E] hover:bg-[#B8581A]"
                  disabled={isLoading}
                  data-testid="button-create-family"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <UserPlus className="h-4 w-4 mr-2" />
                  )}
                  Create Family
                </Button>
              </div>
            </div>
          ) : step === 3 ? (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <p className="text-amber-800 text-sm">
                  Please save these PINs in a safe place. Your kids will need them to sign in using the Kid's Login page.
                </p>
              </div>
              
              <div className="space-y-3">
                {kidPins.map((kid, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between bg-gray-50 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#D2691E]/10 flex items-center justify-center">
                        <Baby className="h-5 w-5 text-[#D2691E]" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{kid.name}</p>
                        <p className="text-xs text-gray-500">4-digit PIN</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-2xl font-bold text-[#D2691E] tracking-widest">
                        {kid.pin}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyPin(kid.pin, kid.name)}
                        className="h-8 w-8"
                        data-testid={`button-copy-pin-${index}`}
                      >
                        {copiedPin === kid.name ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button 
                onClick={handleContinue}
                className="w-full bg-[#D2691E] hover:bg-[#B8581A] mt-6"
                data-testid="button-continue"
              >
                I've saved the PINs - Continue
              </Button>
            </div>
          ) : null}
          
          {step !== 3 && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-[#D2691E] hover:underline font-medium" data-testid="link-login">
              Sign In
            </Link>
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
