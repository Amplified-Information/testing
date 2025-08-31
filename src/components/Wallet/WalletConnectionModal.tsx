import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, Shield, Zap, Globe, ExternalLink, Copy, Check } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { toast } from "@/hooks/use-toast";

interface WalletConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WalletConnectionModal = ({ open, onOpenChange }: WalletConnectionModalProps) => {
  const { connect, isLoading } = useWallet();
  const [copiedProjectId, setCopiedProjectId] = useState(false);
  
  const projectId = "wc:8a5226d8e9fdc4de86cc";

  const walletOptions = [
    {
      id: 'hashpack',
      name: 'HashPack',
      description: 'The most popular Hedera wallet',
      icon: '🟣',
      isRecommended: true,
      downloadUrl: 'https://hashpack.app/',
      features: ['Mobile & Desktop', 'DeFi Integration', 'NFT Support']
    },
    {
      id: 'blade',
      name: 'Blade Wallet',
      description: 'Multi-chain wallet with Hedera support',
      icon: '⚔️',
      isRecommended: false,
      downloadUrl: 'https://bladewallet.io/',
      features: ['Multi-chain', 'Hardware Support', 'Staking']
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      description: 'Connect any WalletConnect compatible wallet',
      icon: '🔗',
      isRecommended: false,
      downloadUrl: 'https://walletconnect.com/',
      features: ['Universal Protocol', 'QR Code', 'Mobile Support']
    }
  ];

  const handleConnect = async (walletId: string) => {
    try {
      if (walletId === 'hashpack') {
        // Check if HashPack extension is available
        const hasHashPackExtension = typeof window !== 'undefined' && 
          ((window as any).hashpack || (window as any).HashPack);
        
        if (!hasHashPackExtension) {
          toast({
            title: "HashPack Not Found",
            description: "Please install the HashPack browser extension first",
            variant: "destructive",
          });
          return;
        }
      }
      
      await connect();
      onOpenChange(false);
    } catch (error) {
      console.error(`Failed to connect to ${walletId}:`, error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect wallet",
        variant: "destructive",
      });
    }
  };

  const copyProjectId = async () => {
    try {
      await navigator.clipboard.writeText(projectId);
      setCopiedProjectId(true);
      setTimeout(() => setCopiedProjectId(false), 2000);
      toast({
        title: "Project ID Copied",
        description: "WalletConnect project ID copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy project ID",
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
            Connect your Hedera wallet to start trading on HashyMarket prediction markets.
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

          {/* Wallet Options */}
          <div className="space-y-3">
            {/* HashPack - Special handling for extension detection */}
            <Card
              className={`cursor-pointer transition-all hover:shadow-md ring-2 ring-primary/20`}
              onClick={() => handleConnect('hashpack')}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🟣</span>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        HashPack
                        <Badge variant="secondary" className="text-xs">
                          Recommended
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-xs">
                        The most popular Hedera wallet
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Extension Status Indicator */}
                    {typeof window !== 'undefined' && ((window as any).hashpack || (window as any).HashPack) ? (
                      <Badge variant="default" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                        Installed
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs border-orange-300 text-orange-700 dark:border-orange-700 dark:text-orange-300">
                        Not Installed
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open('https://hashpack.app/', '_blank');
                      }}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {typeof window !== 'undefined' && !((window as any).hashpack || (window as any).HashPack) ? (
                  <div className="mb-3 p-2 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded text-xs text-orange-800 dark:text-orange-200">
                    Please install HashPack extension first, then refresh this page.
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-1">
                  {['Mobile & Desktop', 'DeFi Integration', 'NFT Support'].map((feature) => (
                    <Badge key={feature} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Other wallet options */}
            {walletOptions.filter(w => w.id !== 'hashpack').map((wallet) => (
              <Card
                key={wallet.id}
                className="opacity-60 cursor-not-allowed"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{wallet.icon}</span>
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {wallet.name}
                          <Badge variant="outline" className="text-xs">
                            Coming Soon
                          </Badge>
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {wallet.description}
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(wallet.downloadUrl, '_blank');
                      }}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1">
                    {wallet.features.map((feature) => (
                      <Badge key={feature} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Development Info */}
          <Card className="bg-yellow-50/50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">Development Mode</p>
                  <p className="text-yellow-600 dark:text-yellow-300 mb-2">
                    This is a testnet application. Use testnet HBAR only.
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-yellow-100 dark:bg-yellow-900/50 px-2 py-1 rounded">
                      {projectId}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyProjectId}
                      className="h-6 w-6 p-0"
                    >
                      {copiedProjectId ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
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