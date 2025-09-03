import { Button } from "@/components/ui/button";
import { useWallet } from "@/contexts/WalletContext";
import { Wallet, Loader2, Copy, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import WalletConnectionModal from "./WalletConnectionModal";
import { toast } from "@/hooks/use-toast";

const WalletButton = () => {
  const { wallet, disconnect, isLoading } = useWallet();
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const formatAccountId = (accountId: string) => {
    return `${accountId.slice(0, 6)}...${accountId.slice(-4)}`;
  };

  const formatBalance = (balance: string | null) => {
    if (!balance) return null;
    const numBalance = parseFloat(balance);
    if (numBalance === 0) return '0 HBAR';
    if (numBalance < 1) return `${numBalance.toFixed(4)} HBAR`;
    return `${numBalance.toFixed(2)} HBAR`;
  };

  const copyAccountId = async () => {
    if (!wallet.accountId) return;
    
    try {
      await navigator.clipboard.writeText(wallet.accountId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Account ID Copied",
        description: "Account ID copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy account ID",
        variant: "destructive",
      });
    }
  };

  const openAccountOnHashscan = () => {
    if (!wallet.accountId) return;
    window.open(`https://hashscan.io/testnet/account/${wallet.accountId}`, '_blank');
  };

  if (wallet.isConnected) {
    return (
      <>
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className="bg-primary/10 border-primary text-primary cursor-pointer hover:bg-primary/20 transition-colors"
            onClick={copyAccountId}
          >
            <Wallet className="w-3 h-3 mr-1" />
            <span className="mr-1">
              {wallet.accountId ? formatAccountId(wallet.accountId) : 'Connected'}
            </span>
            {copied ? (
              <Copy className="w-3 h-3 text-primary" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </Badge>
          
          {wallet.balance && (
            <Badge variant="secondary" className="text-xs">
              {formatBalance(wallet.balance)}
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={openAccountOnHashscan}
            className="h-8 w-8 p-0"
          >
            <ExternalLink className="w-3 h-3" />
          </Button>

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
      </>
    );
  }

  return (
    <>
      <Button
        onClick={() => setShowConnectionModal(true)}
        disabled={isLoading}
        className="bg-primary hover:bg-primary-glow"
      >
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        <Wallet className="w-4 h-4 mr-2" />
        Connect Wallet
      </Button>
      
      <WalletConnectionModal 
        open={showConnectionModal} 
        onOpenChange={setShowConnectionModal} 
      />
    </>
  );
};

export default WalletButton;