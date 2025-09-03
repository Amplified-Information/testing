import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, Shield, Globe, Loader2 } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { toast } from "@/hooks/use-toast";

interface WalletConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WalletConnectionModal = ({ open, onOpenChange }: WalletConnectionModalProps) => {
  const { connect, isLoading } = useWallet();

  const handleConnect = async () => {
    try {
      await connect();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Connection failed:", error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Connect Your Wallet
          </DialogTitle>
          <DialogDescription>
            Connect your Hedera wallet to start trading on prediction markets.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Network Info */}
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  <span className="font-medium">Network</span>
                </div>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                  Hedera Testnet
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800 dark:text-blue-200">Secure Connection</p>
                  <p className="text-blue-600 dark:text-blue-300">
                    Your wallet connection is encrypted and secure. We never access your private keys.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Connect Button */}
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                🔗 Connect Wallet
                <Badge variant="secondary" className="text-xs">
                  Recommended
                </Badge>
              </CardTitle>
              <CardDescription>
                Supports HashPack, Blade Wallet, and other WalletConnect compatible wallets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  ✅ Automatic wallet detection<br/>
                  ✅ QR code for mobile wallets<br/>
                  ✅ Browser extension support
                </div>
                
                <Button 
                  onClick={handleConnect}
                  disabled={isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    "Connect Wallet"
                  )}
                </Button>
                
                <div className="text-xs text-muted-foreground text-center">
                  If you don't have a wallet, <a href="https://hashpack.app/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">download HashPack</a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How it works */}
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="text-sm">
                <p className="font-medium mb-2">How it works:</p>
                <div className="space-y-1 text-muted-foreground">
                  <p>1. Click "Connect Wallet" above</p>
                  <p>2. Choose your wallet from the options</p>
                  <p>3. Approve the connection in your wallet</p>
                  <p>4. Start trading on Hedera testnet!</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalletConnectionModal;