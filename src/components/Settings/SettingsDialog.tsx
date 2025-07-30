import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ThemeSettings from "./ThemeSettings";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTheme: string;
  onThemeChange: (theme: string) => void;
}

const SettingsDialog = ({ 
  open, 
  onOpenChange, 
  currentTheme, 
  onThemeChange 
}: SettingsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your Hedera Markets experience
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="theme" className="w-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="theme">Theme</TabsTrigger>
          </TabsList>
          
          <TabsContent value="theme" className="mt-6">
            <ThemeSettings 
              currentTheme={currentTheme}
              onThemeChange={onThemeChange}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;