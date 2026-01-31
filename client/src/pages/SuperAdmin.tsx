import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, User, Eye, LogOut, Search } from "lucide-react";

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

export default function SuperAdmin() {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [passcode, setPasscode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [families, setFamilies] = useState<Family[]>([]);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/super-admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, passcode }),
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

  const handleImpersonate = async (userId: string, userName: string) => {
    try {
      const res = await fetch("/api/super-admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, adminEmail: email, passcode }),
      });

      if (!res.ok) {
        throw new Error("Failed to impersonate user");
      }

      toast({
        title: "Impersonation Active",
        description: `You are now viewing as ${userName}`,
      });

      window.location.href = "/dashboard";
    } catch (error) {
      toast({
        title: "Failed",
        description: "Could not impersonate user",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setEmail("");
    setPasscode("");
    setFamilies([]);
    setUsers([]);
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.familyName && user.familyName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
              Restricted area - Authorized personnel only
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="admin-email">Admin Email</Label>
              <Input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter admin email"
                data-testid="input-admin-email"
              />
            </div>
            <div>
              <Label htmlFor="admin-passcode">Passcode</Label>
              <Input
                id="admin-passcode"
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter super admin passcode"
                data-testid="input-admin-passcode"
              />
            </div>
            <Button
              className="w-full bg-red-600 hover:bg-red-700"
              onClick={handleLogin}
              disabled={isLoading || !email || !passcode}
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
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <Shield className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Super Admin Panel</h1>
              <p className="text-sm text-gray-500">Logged in as {email}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout} data-testid="button-admin-logout">
            <LogOut className="h-4 w-4 mr-2" />
            Exit Admin
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>User Impersonation</CardTitle>
            <CardDescription>
              Select a user to view the app as them for testing purposes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or family..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-users"
              />
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      user.isChild ? "bg-blue-100" : "bg-green-100"
                    }`}>
                      <User className={`h-5 w-5 ${user.isChild ? "text-blue-600" : "text-green-600"}`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">
                        {user.email || "No email"} • {user.familyName} • {user.isChild ? "Child" : "Guardian"}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleImpersonate(user.id, user.name)}
                    data-testid={`button-impersonate-${user.id}`}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View As
                  </Button>
                </div>
              ))}

              {filteredUsers.length === 0 && (
                <p className="text-center text-gray-500 py-8">No users found</p>
              )}
            </div>
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
    </div>
  );
}
