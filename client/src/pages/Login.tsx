import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogIn, Eye, EyeOff, RefreshCw } from "lucide-react";
import * as api from "@/lib/api";

function generateCaptcha() {
  const a = Math.floor(Math.random() * 20) + 1;
  const b = Math.floor(Math.random() * 20) + 1;
  return { a, b, answer: a + b };
}

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [captcha, setCaptcha] = useState(generateCaptcha);
  const [captchaInput, setCaptchaInput] = useState('');
  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const refreshCaptcha = useCallback(() => {
    setCaptcha(generateCaptcha());
    setCaptchaInput('');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.email || !form.password) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    if (parseInt(captchaInput) !== captcha.answer) {
      toast({
        title: "Wrong Answer",
        description: "Please solve the math problem correctly.",
        variant: "destructive",
      });
      refreshCaptcha();
      return;
    }

    setIsLoading(true);
    try {
      await api.login(form.email, form.password);
      toast({
        title: "Welcome Back!",
        description: "You've successfully logged in.",
      });
      onLoginSuccess();
      setLocation('/');
    } catch (error) {
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Invalid email or password.",
        variant: "destructive",
      });
      refreshCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 p-4">
      <Card className="w-full max-w-md shadow-xl border-none">
        <CardHeader className="text-center space-y-2 pb-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-[#D2691E] text-white text-3xl mb-2">
            🫐
          </div>
          <CardTitle className="text-2xl font-bold text-[#D2691E]">Welcome to Blueberry</CardTitle>
          <CardDescription>Sign in to manage your family's schedule</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="text"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                disabled={isLoading}
                data-testid="input-email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  disabled={isLoading}
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
            </div>

            <div className="space-y-2">
              <Label>Verify you're a real person</Label>
              <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 border">
                <div className="flex items-center gap-2 text-lg font-semibold text-[#D2691E] select-none whitespace-nowrap">
                  <span data-testid="text-captcha-problem">{captcha.a} + {captcha.b} = ?</span>
                </div>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Answer"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value.replace(/\D/g, ''))}
                  disabled={isLoading}
                  className="w-24 text-center font-mono text-lg"
                  data-testid="input-captcha"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={refreshCaptcha}
                  className="shrink-0"
                  tabIndex={-1}
                  data-testid="button-refresh-captcha"
                >
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-[#D2691E] hover:bg-[#B8581A] h-11"
              disabled={isLoading}
              data-testid="button-login"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <LogIn className="h-4 w-4 mr-2" />
              )}
              Sign In
            </Button>
          </form>

          <div className="mt-3 text-center">
            <Link href="/reset-password" className="text-sm text-[#D2691E] hover:underline font-medium" data-testid="link-forgot-password">
              Forgot your password?
            </Link>
          </div>
          
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/register" className="text-[#D2691E] hover:underline font-medium" data-testid="link-register">
              Create Family Account
            </Link>
          </div>
          
          <div className="mt-4 text-center">
            <Link href="/kid-login" className="text-sm text-muted-foreground hover:text-[#D2691E]" data-testid="link-kid-login">
              I'm a kid with a PIN code
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
