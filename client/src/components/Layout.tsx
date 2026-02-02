import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Calendar, 
  CheckSquare, 
  Pill, 
  ShoppingCart, 
  Home, 
  Menu,
  LogOut,
  User,
  Camera,
  Settings,
  Bell
} from "lucide-react";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useFamilyMembers, useCurrentFamily, useAuthUser } from "@/hooks/useData";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import * as api from "@/lib/api";
import ImageCropDialog from "@/components/ImageCropDialog";

const NAVIGATION = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Medications', href: '/medications', icon: Pill },
  { name: 'Chores', href: '/chores', icon: CheckSquare },
  { name: 'Groceries', href: '/groceries', icon: ShoppingCart },
  { name: 'Reminders', href: '/reminders', icon: Bell },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const family = useCurrentFamily();
  const { data: members = [] } = useFamilyMembers(family?.id);
  const { data: authData } = useAuthUser();
  const currentUser = members.find(m => m.id === authData?.user?.id) || members[0];
  const { toast } = useToast();

  const handleLogout = async () => {
    await api.logout();
    queryClient.clear();
    window.location.href = '/login';
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Error", description: "Please select an image file", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "Image must be less than 5MB", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setSelectedImageSrc(base64);
      setCropDialogOpen(true);
    };
    reader.onerror = () => {
      toast({ title: "Error", description: "Failed to read image file", variant: "destructive" });
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropComplete = async (croppedImage: string) => {
    if (!currentUser) return;
    
    setIsUploading(true);
    try {
      await api.updateUserAvatar(currentUser.id, croppedImage);
      queryClient.invalidateQueries({ queryKey: ['familyMembers', family?.id] });
      toast({ title: "Photo updated!", description: "Profile photo has been changed." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update photo", variant: "destructive" });
    } finally {
      setIsUploading(false);
      setSelectedImageSrc(null);
    }
  };

  const NavContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="flex h-full flex-col gap-4 bg-[#D2691E] text-white">
      <div className="flex h-16 items-center border-b border-white/10 px-6">
        <Link href="/" className="flex items-center gap-2 font-display text-2xl font-bold text-white">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#D2691E]">
            🫐
          </div>
          Blueberry
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-4 text-sm font-medium">
          {NAVIGATION.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:bg-white/10 hover:text-white",
                  isActive 
                    ? "bg-white/20 text-white font-semibold" 
                    : "text-white/80"
                )}
                data-testid={`nav-link-${item.name.toLowerCase()}`}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="border-t border-white/10 p-4 space-y-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          data-testid="input-avatar-upload"
        />
        
        {currentUser ? (
          <div className="rounded-xl bg-white/10 p-4 space-y-3">
            <div className="flex flex-col items-center text-center">
              <div 
                className="relative cursor-pointer group mb-3"
                onClick={handleAvatarClick}
                title="Click to change photo"
                data-testid="button-change-avatar"
              >
                <img 
                  src={currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name}`}
                  alt={currentUser.name} 
                  className={cn(
                    "h-20 w-20 rounded-full bg-white border-4 border-white/30 object-cover shadow-lg",
                    isUploading && "opacity-50"
                  )}
                />
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1.5 shadow-md">
                  <Camera className="h-3 w-3 text-[#D2691E]" />
                </div>
              </div>
              <p className="text-base font-bold text-white">{currentUser.name}</p>
              <p className="text-xs text-white/70">{currentUser.isChild ? 'Member' : 'Guardian'}</p>
              {currentUser.email && (
                <p className="text-xs text-white/50 mt-1 truncate max-w-full">{currentUser.email}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-white/10 p-4 flex flex-col items-center">
            <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center mb-3">
              <User className="h-8 w-8 text-white/70" />
            </div>
            <p className="text-sm font-medium text-white">User</p>
          </div>
        )}
        
        <Button 
          variant="ghost" 
          className="w-full justify-center gap-2 text-white/80 hover:text-white hover:bg-white/10 border border-white/20"
          onClick={handleLogout}
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
        <div className="hidden border-r lg:block">
          <NavContent />
        </div>
        <div className="flex flex-col overflow-visible">
          <header className="flex min-h-12 items-center gap-3 border-b bg-background px-4 lg:hidden relative z-10" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0 lg:hidden text-[#D2691E]" data-testid="button-menu">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col p-0 w-[280px] border-none bg-[#D2691E]">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <NavContent onNavigate={() => setSheetOpen(false)} />
              </SheetContent>
            </Sheet>
            <div className="w-full flex-1">
              <span className="font-display font-semibold text-lg text-[#D2691E]">
                {location === '/' ? 'Blueberry' : (NAVIGATION.find(item => item.href === location)?.name || 'Blueberry')}
              </span>
            </div>
            {location !== '/' && (
              <Button 
                variant="outline" 
                size="sm" 
                className="border-[#D2691E] text-[#D2691E] hover:bg-[#D2691E]/10"
                onClick={() => setLocation('/')}
              >
                Close
              </Button>
            )}
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-8 lg:p-8 bg-background overflow-auto" style={{ WebkitOverflowScrolling: 'touch', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
            {children}
          </main>
        </div>
      </div>

      {selectedImageSrc && (
        <ImageCropDialog
          open={cropDialogOpen}
          onClose={() => {
            setCropDialogOpen(false);
            setSelectedImageSrc(null);
          }}
          imageSrc={selectedImageSrc}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
}
