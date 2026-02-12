import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, User, Eye, LogOut, Search, KeyRound, Check, Loader2, EyeOff, ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Family {
  id: string;
  name: string;
}

interface UserInfo {
  id: string;
  name: string;
  email: string | null;
  isChild: boolean;
  familyId: string;
  familyName?: string;
}

function SearchableUserSelect({ 
  users, 
  placeholder, 
  onSelect,
  buttonLabel,
  buttonIcon: ButtonIcon,
  buttonClass,
}: {
  users: UserInfo[];
  placeholder: string;
  onSelect: (user: UserInfo) => void;
  buttonLabel: string;
  buttonIcon: React.ElementType;
  buttonClass?: string;
}) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const term = search.toLowerCase();
    return users.filter(u =>
      u.name.toLowerCase().includes(term) ||
      (u.email && u.email.toLowerCase().includes(term)) ||
      (u.familyName && u.familyName.toLowerCase().includes(term))
    );
  }, [users, search]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder={placeholder}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          className="pl-10"
          data-testid="input-search-users"
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-full px-3"
          onClick={() => setIsOpen(!isOpen)}
        >
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      </div>

      {isOpen && (
        <div className="max-h-[300px] overflow-y-auto border rounded-lg bg-white shadow-lg">
          {filtered.length === 0 ? (
            <p className="text-center text-gray-500 py-4 text-sm">No users found</p>
          ) : (
            filtered.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 border-b last:border-b-0 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${
                    user.isChild ? "bg-blue-100" : "bg-green-100"
                  }`}>
                    <User className={`h-4 w-4 ${user.isChild ? "text-blue-600" : "text-green-600"}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {user.email || "No email"} · {user.familyName} · {user.isChild ? "Child" : "Guardian"}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className={buttonClass || ""}
                  onClick={() => { onSelect(user); setIsOpen(false); setSearch(""); }}
                  data-testid={`button-action-${user.id}`}
                >
                  <ButtonIcon className="h-4 w-4 mr-1" />
                  {buttonLabel}
                </Button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function SuperAdmin() {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [families, setFamilies] = useState<Family[]>([]);
  const [users, setUsers] = useState<UserInfo[]>([]);

  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [resetUserName, setResetUserName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const adminEmail = "ashoka6@gmail.com";

  const adultUsers = useMemo(() => users.filter(u => !u.isChild), [users]);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/super-admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, passcode }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Access denied");
      }

      setIsAuthenticated(true);
      toast({ title: "Super Admin Access Granted" });

      const familiesRes = await fetch("/api/families");
      const familiesData = await familiesRes.json();
      setFamilies(familiesData);

      const usersRes = await fetch("/api/users");
      const usersData = await usersRes.json();
      
      const usersWithFamily = usersData.map((user: UserInfo) => ({
        ...user,
        familyName: familiesData.find((f: Family) => f.id === user.familyId)?.name || "Unknown"
      }));
      setUsers(usersWithFamily);

    } catch (error) {
      toast({
        title: "Access Denied",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImpersonate = async (user: UserInfo) => {
    try {
      const res = await fetch("/api/super-admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, adminEmail, passcode }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to impersonate user");
      }

      toast({
        title: "Impersonation Active",
        description: `You are now viewing as ${user.name}`,
      });

      window.location.href = "/";
    } catch (error) {
      toast({
        title: "Failed",
        description: error instanceof Error ? error.message : "Could not impersonate user",
        variant: "destructive",
      });
    }
  };

  const handleResetPassword = async () => {
    if (!resetUserId || !newPassword) return;

    if (newPassword.length < 8) {
      toast({ title: "Weak Password", description: "Password must be at least 8 characters.", variant: "destructive" });
      return;
    }

    setIsResetting(true);
    try {
      const res = await fetch("/api/super-admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminEmail, passcode, userId: resetUserId, newPassword }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to reset password");
      }

      toast({
        title: "Password Reset",
        description: `Password for ${resetUserName} has been reset successfully.`,
      });
      setResetUserId(null);
      setNewPassword("");
    } catch (error) {
      toast({
        title: "Reset Failed",
        description: error instanceof Error ? error.message : "Could not reset password",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPasscode("");
    setFamilies([]);
    setUsers([]);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Super Admin Access</CardTitle>
            <CardDescription>
              Enter your passcode to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="admin-passcode">Passcode</Label>
              <Input
                id="admin-passcode"
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter super admin passcode"
                onKeyDown={(e) => { if (e.key === 'Enter' && passcode) handleLogin(); }}
                data-testid="input-admin-passcode"
              />
            </div>
            <Button
              className="w-full bg-red-600 hover:bg-red-700"
              onClick={handleLogin}
              disabled={isLoading || !passcode}
              data-testid="button-admin-login"
            >
              {isLoading ? "Verifying..." : "Access Super Admin"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <Shield className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Super Admin Panel</h1>
              <p className="text-sm text-gray-500">Logged in as {adminEmail}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout} data-testid="button-admin-logout">
            <LogOut className="h-4 w-4 mr-2" />
            Exit Admin
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-red-600" />
              Reset User Password
            </CardTitle>
            <CardDescription>
              Search for a guardian and reset their password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SearchableUserSelect
              users={adultUsers}
              placeholder="Search guardian by name or email..."
              onSelect={(user) => { setResetUserId(user.id); setResetUserName(user.name); setNewPassword(""); }}
              buttonLabel="Reset"
              buttonIcon={KeyRound}
              buttonClass="text-red-600 border-red-200 hover:bg-red-50"
            />
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              View As User
            </CardTitle>
            <CardDescription>
              Search for a user to view the app as them
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SearchableUserSelect
              users={users}
              placeholder="Search user by name, email, or family..."
              onSelect={handleImpersonate}
              buttonLabel="View As"
              buttonIcon={Eye}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registered Families ({families.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {families.map((family) => (
                <div key={family.id} className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">{family.name}</p>
                  <p className="text-xs text-gray-500">
                    {users.filter(u => u.familyId === family.id).length} members
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!resetUserId} onOpenChange={(open) => { if (!open) { setResetUserId(null); setNewPassword(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password for {resetUserName}</DialogTitle>
            <DialogDescription>
              Enter a new password for this user. They will use this password to log in.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="admin-new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                  data-testid="input-admin-new-password"
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
              <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setResetUserId(null); setNewPassword(""); }}>
              Cancel
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={isResetting || newPassword.length < 8}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-reset"
            >
              {isResetting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
