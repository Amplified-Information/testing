import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, Hexagon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import WalletButton from "@/components/Wallet/WalletButton";
import { useWallet } from "@/contexts/WalletContext";

const Header = () => {
  const { wallet } = useWallet();
  
  const handlePortfolioClick = (e: React.MouseEvent) => {
    if (!wallet.isConnected) {
      e.preventDefault();
    }
  };

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
          <Link to="/category-wheel" className="text-sm font-medium hover:text-primary transition-colors">
            Categories
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
          <Link to="/docs" className="text-sm font-medium hover:text-primary transition-colors">
            Docs
          </Link>
          <Link to="/dev-notes" className="text-sm font-medium hover:text-primary transition-colors">
            Dev Notes
          </Link>
        </nav>

        {/* Search */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search event prediction markets..."
              className="pl-8 bg-muted/50"
            />
          </div>
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