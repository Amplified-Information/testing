import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import WalletButton from "@/components/Wallet/WalletButton";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <TrendingUp className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">Hedera Event Prediction Markets</span>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 ml-3">
            Powered by Hedera Hashgraph
          </Badge>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6 ml-8">
          <Link to="/markets" className="text-sm font-medium hover:text-primary transition-colors">
            Event Markets
          </Link>
          <Link to="/category-wheel" className="text-sm font-medium hover:text-primary transition-colors">
            Categories
          </Link>
          <Link to="/portfolio" className="text-sm font-medium hover:text-primary transition-colors">
            Portfolio
          </Link>
          <Link to="/docs" className="text-sm font-medium hover:text-primary transition-colors">
            Docs
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