import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User } from "@supabase/supabase-js";
import ThemeSettings from "./ThemeSettings";
import ProfileSettings from "./ProfileSettings";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  currentTheme: string;
  onThemeChange: (theme: string) => void;
  currentTexture: string;
  onTextureChange: (texture: string) => void;
}

const SettingsDialog = ({ 
  open, 
  onOpenChange, 
  user,
  currentTheme, 
  onThemeChange,
  currentTexture,
  onTextureChange
}: SettingsDialogProps) => {
  const defaultTab = user ? "profile" : "theme";
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your Hedera Markets experience
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className={`grid w-full ${user ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {user && <TabsTrigger value="profile">Profile</TabsTrigger>}
            <TabsTrigger value="theme">Theme</TabsTrigger>
          </TabsList>
          
          {user && (
            <TabsContent value="profile" className="mt-6 overflow-y-auto max-h-[60vh]">
              <ProfileSettings user={user} />
            </TabsContent>
          )}
          
          <TabsContent value="theme" className="mt-6">
            <ThemeSettings 
              currentTheme={currentTheme}
              onThemeChange={onThemeChange}
              currentTexture={currentTexture}
              onTextureChange={onTextureChange}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;