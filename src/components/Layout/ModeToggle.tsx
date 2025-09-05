import { Button } from "@/components/ui/button";
import { useMode } from "@/contexts/ModeContext";
import { Edit3, Gamepad2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const ModeToggle = () => {
  const { mode, toggleMode, isEditMode } = useMode();

  const handleToggle = () => {
    toggleMode();
    toast({
      title: `Switched to ${mode === 'edit' ? 'Demo' : 'Edit'} Mode`,
      description: mode === 'edit' 
        ? "WalletConnect enabled, Visual Edits may be limited" 
        : "Visual Edits enabled, WalletConnect disabled",
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      className="flex items-center gap-2 text-xs"
    >
      {isEditMode ? (
        <>
          <Edit3 className="w-3 h-3" />
          Edit Mode
        </>
      ) : (
        <>
          <Gamepad2 className="w-3 h-3" />
          Demo Mode
        </>
      )}
    </Button>
  );
};

export default ModeToggle;