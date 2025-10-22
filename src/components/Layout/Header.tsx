import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Hexagon, Menu } from "lucide-react";
import { Link } from "react-router-dom";
import WalletButton from "@/components/Wallet/WalletButton";
import { useWallet } from "@/contexts/WalletContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";

const Header = () => {
  const { wallet } = useWallet();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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
          <a href="https://hedera.com/" target="_blank" rel="noopener noreferrer">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 ml-3 flex items-center gap-2 hover:bg-primary/20 transition-colors cursor-pointer">
              <span className="hidden lg:inline">Powered by</span>
              <img src="https://bfenuvdwsgzglhhjbrql.supabase.co/storage/v1/object/public/images/uploads/1758864965179_1p4b5jtrdp7.JPG" alt="Hedera Hashgraph" className="h-4 ml-1" />
              <span className="text-blue-600 font-medium">Hedera Hashgraph</span>
            </Badge>
          </a>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6 ml-8">
          <Link to="/markets" className="text-sm font-medium hover:text-primary transition-colors">
            Explore Markets
          </Link>
          <Link to="/create-market" className="text-sm font-medium hover:text-primary transition-colors">
            Market Factory
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
                  Explore Markets
                </Link>
                <Link 
                  to="/create-market" 
                  className="text-lg font-medium hover:text-primary transition-colors py-2"
                  onClick={closeMobileMenu}
                >
                  Market Factory
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
          
          <WalletButton />
        </div>
      </div>
    </header>
  );
};

export default Header;