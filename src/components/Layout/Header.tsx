import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Hexagon, Menu, User } from "lucide-react";
import { Link } from "react-router-dom";
import WalletButton from "@/components/Wallet/WalletButton";
import SignUpDialog from "@/components/Auth/SignUpDialog";
import { useWallet } from "@/contexts/WalletContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const Header = () => {
  const { wallet } = useWallet();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };
  
  const handlePortfolioClick = (e: React.MouseEvent) => {
    if (!wallet.isConnected) {
      e.preventDefault();
    }
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <TrendingUp className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">HashyMarket</span>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 ml-3 flex items-center gap-2">
            <Hexagon className="h-4 w-4" />
            <span className="hidden lg:inline">Powered by Hedera Hashgraph</span>
          </Badge>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6 ml-8">
          <Link to="/markets" className="text-sm font-medium hover:text-primary transition-colors">
            Event Markets
          </Link>
          <Link to="/create-market" className="text-sm font-medium hover:text-primary transition-colors">
            Create Market
          </Link>
          <Link 
            to="/portfolio" 
            onClick={handlePortfolioClick}
            className={`text-sm font-medium transition-colors ${
              wallet.isConnected 
                ? 'hover:text-primary' 
                : 'text-muted-foreground cursor-not-allowed opacity-50'
            }`}
          >
            Portfolio
          </Link>
          <Link to="/dev-notes" className="text-sm font-medium hover:text-primary transition-colors">
            Dev Notes
          </Link>
        </nav>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col space-y-4 mt-8">
                <Link 
                  to="/markets" 
                  className="text-lg font-medium hover:text-primary transition-colors py-2"
                  onClick={closeMobileMenu}
                >
                  Event Markets
                </Link>
                <Link 
                  to="/create-market" 
                  className="text-lg font-medium hover:text-primary transition-colors py-2"
                  onClick={closeMobileMenu}
                >
                  Create Market
                </Link>
                <Link 
                  to="/portfolio" 
                  onClick={(e) => {
                    handlePortfolioClick(e);
                    if (wallet.isConnected) closeMobileMenu();
                  }}
                  className={`text-lg font-medium transition-colors py-2 ${
                    wallet.isConnected 
                      ? 'hover:text-primary' 
                      : 'text-muted-foreground cursor-not-allowed opacity-50'
                  }`}
                >
                  Portfolio
                </Link>
                <Link 
                  to="/dev-notes" 
                  className="text-lg font-medium hover:text-primary transition-colors py-2"
                  onClick={closeMobileMenu}
                >
                  Dev Notes
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          <Badge variant="secondary" className="hidden md:flex">
            Testnet
          </Badge>
          
          {user ? (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setAuthDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Login</span>
            </Button>
          )}
          
          <WalletButton />
        </div>
      </div>
      
      <SignUpDialog 
        open={authDialogOpen} 
        onOpenChange={setAuthDialogOpen} 
      />
    </header>
  );
};

export default Header;