import { Button } from "@/components/ui/button";
import { useWallet } from "@/contexts/WalletContext";
import { Wallet, Loader2, Copy, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useHederaBalance } from "@/hooks/useHederaBalance";
const WalletButton = () => {
  const {
    wallet,
    connect,
    disconnect,
    isLoading
  } = useWallet();
  const {
    balance
  } = useHederaBalance();
  const [copied, setCopied] = useState(false);
  const formatAccountId = (accountId: string) => {
    return `${accountId.slice(0, 6)}...${accountId.slice(-4)}`;
  };
  const formatBalance = (balance: any) => {
    // Mock balance for development
    return '100.00 ℏ (Mock)';
  };
  const copyAccountId = async () => {
    if (!wallet.accountId) return;
    try {
      await navigator.clipboard.writeText(wallet.accountId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Account ID Copied",
        description: "Mock account ID copied to clipboard"
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy account ID",
        variant: "destructive"
      });
    }
  };
  const openAccountOnHashscan = () => {
    toast({
      title: "Mock Account",
      description: "This is a mock account for development - no real Hashscan link",
    });
  };
  if (wallet.isConnected) {
    return <>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-primary/10 border-primary text-primary cursor-pointer hover:bg-primary/20 transition-colors" onClick={copyAccountId}>
            <Wallet className="w-3 h-3 mr-1" />
            <span className="mr-1">
              {wallet.accountId ? formatAccountId(wallet.accountId) : 'Connected'} (Mock)
            </span>
            {copied ? <Copy className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
          </Badge>
          
          <Badge variant="secondary" className="text-xs">
            {formatBalance(balance)}
          </Badge>

          <Button variant="ghost" size="sm" onClick={openAccountOnHashscan} className="h-8 w-8 p-0" disabled>
            <ExternalLink className="w-3 h-3" />
          </Button>

          <Button variant="outline" size="sm" onClick={disconnect} disabled={isLoading}>
            {isLoading && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
            Disconnect (Mock)
          </Button>
        </div>
      </>;
  }
  const handleConnect = async () => {
    // Wallet is always connected in mock mode
    toast({
      title: "Already Connected",
      description: "Mock wallet is always connected in development mode",
    });
  };
  return <Button onClick={handleConnect} disabled className="bg-primary hover:bg-primary-glow text-slate-50">
      <Wallet className="w-4 h-4 mr-2" />
      Connected (Mock)
    </Button>;
};
export default WalletButton;