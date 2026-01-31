import { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Delete } from "lucide-react";
import * as api from "@/lib/api";

interface KidLoginProps {
  onLoginSuccess: () => void;
}

export default function KidLogin({ onLoginSuccess }: KidLoginProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [familyName, setFamilyName] = useState('');
  const [kidName, setKidName] = useState('');
  const [pin, setPin] = useState<string[]>(['', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleClear = () => {
    setPin(['', '', '', '']);
    inputRefs.current[0]?.focus();
  };

  const handleSubmit = async () => {
    const pinCode = pin.join('');
    
    if (!familyName.trim()) {
      toast({
        title: "Enter Family Name",
        description: "Please type your family name.",
        variant: "destructive",
      });
      return;
    }
    
    if (!kidName.trim()) {
      toast({
        title: "Enter Your Name",
        description: "Please type your name to sign in.",
        variant: "destructive",
      });
      return;
    }
    
    if (pinCode.length !== 4) {
      toast({
        title: "Enter Your PIN",
        description: "Please enter your 4-digit PIN.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await api.kidLogin(familyName.trim(), kidName.trim(), pinCode);
      toast({
        title: "Welcome!",
        description: "You're now signed in.",
      });
      onLoginSuccess();
      setLocation('/');
    } catch (error) {
      toast({
        title: "Couldn't Sign In",
        description: "Please check your name and PIN.",
        variant: "destructive",
      });
      setPin(['', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 p-4">
      <Card className="w-full max-w-sm shadow-xl border-none">
        <CardHeader className="text-center space-y-2 pb-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-[#D2691E] text-white text-3xl mb-2">
            🫐
          </div>
          <CardTitle className="text-2xl font-bold text-[#D2691E]">Kid's Login</CardTitle>
          <CardDescription>Enter your family name, your name, and PIN</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="familyName">Family Name</Label>
            <Input
              id="familyName"
              placeholder="Enter your family name"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              disabled={isLoading}
              data-testid="input-family-name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="kidName">Your Name</Label>
            <Input
              id="kidName"
              placeholder="Enter your name"
              value={kidName}
              onChange={(e) => setKidName(e.target.value)}
              disabled={isLoading}
              data-testid="input-kid-name"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Your PIN</Label>
            <div className="flex justify-center gap-3">
              {pin.map((digit, index) => (
                <input
                  key={index}
                  ref={el => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={isLoading}
                  className="w-14 h-16 text-center text-2xl font-bold border-2 rounded-xl focus:border-[#D2691E] focus:ring-2 focus:ring-[#D2691E]/20 outline-none transition-all"
                  data-testid={`input-pin-${index}`}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClear}
              className="flex-1"
              disabled={isLoading}
              data-testid="button-clear-pin"
            >
              <Delete className="h-4 w-4 mr-2" />
              Clear
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-[#D2691E] hover:bg-[#B8581A]"
              disabled={isLoading || !familyName.trim() || !kidName.trim() || pin.some(d => !d)}
              data-testid="button-submit-pin"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Sign In"
              )}
            </Button>
          </div>

          <div className="text-center">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-[#D2691E]" data-testid="link-adult-login">
              <ArrowLeft className="h-4 w-4 inline mr-1" />
              Adult sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
