import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, KeyRound, ArrowLeft, Eye, EyeOff, CheckCircle } from "lucide-react";
import * as api from "@/lib/api";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<'email' | 'questions' | 'success'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [questions, setQuestions] = useState({ q1: '', q2: '' });
  const [answers, setAnswers] = useState({ a1: '', a2: '' });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Missing Email", description: "Please enter your email address.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const result = await api.verifyResetPassword(email);
      if (result.found && result.securityQuestion1 && result.securityQuestion2) {
        setQuestions({ q1: result.securityQuestion1, q2: result.securityQuestion2 });
        setStep('questions');
      } else if (result.reason === 'no_security_questions') {
        toast({ title: "Security Questions Not Set Up", description: "Your account doesn't have security questions yet. Please log in and go to Settings to set them up first.", variant: "destructive" });
      } else {
        toast({ title: "Account Not Found", description: "No account found with that email address.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Something went wrong.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answers.a1 || !answers.a2) {
      toast({ title: "Missing Answers", description: "Please answer both security questions.", variant: "destructive" });
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      toast({ title: "Weak Password", description: "New password must be at least 8 characters.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Password Mismatch", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      await api.resetPassword(email, answers.a1, answers.a2, newPassword);
      setStep('success');
    } catch (error) {
      toast({ title: "Reset Failed", description: error instanceof Error ? error.message : "Could not reset password. Check your answers and try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 p-4">
      <Card className="w-full max-w-md shadow-xl border-none">
        <CardHeader className="text-center space-y-2 pb-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-[#D2691E] text-white text-3xl mb-2">
            {step === 'success' ? <CheckCircle className="h-8 w-8" /> : <KeyRound className="h-8 w-8" />}
          </div>
          <CardTitle className="text-2xl font-bold text-[#D2691E]">
            {step === 'success' ? 'Password Reset!' : 'Reset Your Password'}
          </CardTitle>
          <CardDescription>
            {step === 'email' ? "Enter your email to get started" :
             step === 'questions' ? "Answer your security questions" :
             "Your password has been updated successfully"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email Address</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  data-testid="input-reset-email"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-[#D2691E] hover:bg-[#B8581A] h-11"
                disabled={isLoading}
                data-testid="button-find-account"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Find My Account
              </Button>
            </form>
          )}

          {step === 'questions' && (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">{questions.q1}</Label>
                <Input
                  placeholder="Your answer"
                  value={answers.a1}
                  onChange={(e) => setAnswers({ ...answers, a1: e.target.value })}
                  disabled={isLoading}
                  data-testid="input-reset-a1"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">{questions.q2}</Label>
                <Input
                  placeholder="Your answer"
                  value={answers.a2}
                  onChange={(e) => setAnswers({ ...answers, a2: e.target.value })}
                  disabled={isLoading}
                  data-testid="input-reset-a2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimum 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isLoading}
                    className="pr-10"
                    data-testid="input-new-password"
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
                <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                <Input
                  id="confirm-new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  data-testid="input-confirm-new-password"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setStep('email'); setAnswers({ a1: '', a2: '' }); setNewPassword(''); setConfirmPassword(''); }}
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#D2691E] hover:bg-[#B8581A]"
                  disabled={isLoading}
                  data-testid="button-reset-password"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Reset Password
                </Button>
              </div>
            </form>
          )}

          {step === 'success' && (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Your password has been changed. You can now sign in with your new password.
              </p>
              <Button
                onClick={() => setLocation('/login')}
                className="w-full bg-[#D2691E] hover:bg-[#B8581A] h-11"
                data-testid="button-go-to-login"
              >
                Go to Sign In
              </Button>
            </div>
          )}

          {step !== 'success' && (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Remember your password?{' '}
              <Link href="/login" className="text-[#D2691E] hover:underline font-medium" data-testid="link-back-to-login">
                Sign In
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
