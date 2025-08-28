import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, User, TrendingUp, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import SettingsDialog from "@/components/Settings/SettingsDialog";
import SignUpDialog from "@/components/Auth/SignUpDialog";
import { useTheme } from "@/hooks/useTheme";

const Header = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [signUpOpen, setSignUpOpen] = useState(false);
  const { theme, setTheme, backgroundTexture, setBackgroundTexture } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <TrendingUp className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">Hedera Markets</span>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 ml-3">
            Powered by Hedera Hashgraph
          </Badge>
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search markets..."
              className="pl-8 bg-muted/50"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          <Badge variant="secondary" className="hidden md:flex">
            Testnet
          </Badge>
          
          <Button variant="outline" size="sm" onClick={() => setSignUpOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Sign Up / Log In
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        currentTheme={theme}
        onThemeChange={setTheme}
        currentTexture={backgroundTexture}
        onTextureChange={setBackgroundTexture}
      />
      
      <SignUpDialog
        open={signUpOpen}
        onOpenChange={setSignUpOpen}
      />
    </header>
  );
};

export default Header;