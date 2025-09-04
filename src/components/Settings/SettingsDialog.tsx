import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { User } from "@supabase/supabase-js";
import ProfileSettings from "./ProfileSettings";

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
            <ProfileSettings user={user} />
          </div>
        ) : (
          <div className="mt-6 text-center text-muted-foreground">
            Connect your wallet to access profile settings.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;