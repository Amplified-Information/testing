import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User } from "@supabase/supabase-js";
import ProfileSettings from "./ProfileSettings";
import { WalletManagement } from "@/components/Wallet/WalletManagement";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

const SettingsDialog = ({ 
  open, 
  onOpenChange, 
  user
}: SettingsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your Hedera Event Prediction Markets experience
          </DialogDescription>
        </DialogHeader>
        
        {user ? (
          <div className="mt-6 overflow-y-auto max-h-[60vh]">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="wallets">Wallets</TabsTrigger>
              </TabsList>
              <TabsContent value="profile" className="mt-6">
                <ProfileSettings user={user} />
              </TabsContent>
              <TabsContent value="wallets" className="mt-6">
                <WalletManagement />
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="mt-6 text-center text-muted-foreground">
            <p className="mb-4">Sign in to access your settings and manage your wallets.</p>
            <div className="space-y-4">
              <WalletManagement />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;