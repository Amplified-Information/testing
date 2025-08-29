import { Button } from "@/components/ui/button";
import { useWallet } from "@/contexts/WalletContext";
import { Wallet, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const WalletButton = () => {
  const { wallet, connect, disconnect, isLoading } = useWallet();

  const formatAccountId = (accountId: string) => {
    return `${accountId.slice(0, 6)}...${accountId.slice(-4)}`;
  };

  if (wallet.isConnected) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="bg-primary/10 border-primary text-primary">
          <Wallet className="w-3 h-3 mr-1" />
          {wallet.accountId ? formatAccountId(wallet.accountId) : 'Connected'}
        </Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={disconnect}
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={connect}
      disabled={isLoading}
      className="bg-primary hover:bg-primary-glow"
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      <Wallet className="w-4 h-4 mr-2" />
      Connect Wallet
    </Button>
  );
};

export default WalletButton;