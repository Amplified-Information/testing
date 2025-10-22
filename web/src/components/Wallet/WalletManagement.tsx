import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, Crown, Edit2, ExternalLink, Wallet } from 'lucide-react';
import { useHederaWallets, useDeleteWallet, useSetPrimaryWallet, useUpdateWalletName, type HederaWallet } from '@/hooks/useHederaWallets';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from '@/hooks/use-toast';
import { useDebugger } from '@/hooks/useDebugger';

interface WalletCardProps {
  wallet: HederaWallet;
  isCurrentWallet: boolean;
  onSetPrimary: (walletId: string) => void;
  onDelete: (walletId: string) => void;
  onUpdateName: (walletId: string, name: string) => void;
}

const WalletCard: React.FC<WalletCardProps> = ({ 
  wallet, 
  isCurrentWallet, 
  onSetPrimary, 
  onDelete, 
  onUpdateName 
}) => {
  const [editingName, setEditingName] = useState(false);
  const [walletName, setWalletName] = useState(wallet.wallet_name || '');

  const handleUpdateName = () => {
    if (walletName.trim() !== wallet.wallet_name) {
      onUpdateName(wallet.id, walletName.trim());
    }
    setEditingName(false);
  };

  const handleCancelEdit = () => {
    setWalletName(wallet.wallet_name || '');
    setEditingName(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copyAccountId = () => {
    navigator.clipboard.writeText(wallet.account_id);
    toast({
      title: "Copied!",
      description: "Account ID copied to clipboard",
    });
  };

  return (
    <Card className={`relative ${isCurrentWallet ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input 
                  value={walletName}
                  onChange={(e) => setWalletName(e.target.value)}
                  className="h-6 text-sm"
                  placeholder="Wallet name"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUpdateName();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                  autoFocus
                />
                <Button size="sm" variant="ghost" onClick={handleUpdateName}>
                  ✓
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                  ✕
                </Button>
              </div>
            ) : (
              <CardTitle className="text-sm flex items-center gap-2">
                {wallet.wallet_name || `Wallet ${wallet.account_id}`}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => setEditingName(true)}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              </CardTitle>
            )}
          </div>
          <div className="flex items-center gap-1">
            {wallet.is_primary && (
              <Badge variant="default" className="text-xs">
                <Crown className="h-3 w-3 mr-1" />
                Primary
              </Badge>
            )}
            {isCurrentWallet && (
              <Badge variant="secondary" className="text-xs">
                Connected
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Account ID</Label>
            <div className="flex items-center gap-2">
              <code className="text-sm bg-muted px-2 py-1 rounded flex-1">
                {wallet.account_id}
              </code>
              <Button size="sm" variant="ghost" onClick={copyAccountId}>
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {wallet.public_key && (
            <div>
              <Label className="text-xs text-muted-foreground">Public Key</Label>
              <code className="text-xs bg-muted px-2 py-1 rounded block truncate">
                {wallet.public_key.substring(0, 32)}...
              </code>
            </div>
          )}

          <div>
            <Label className="text-xs text-muted-foreground">Last Connected</Label>
            <p className="text-sm">{formatDate(wallet.last_connected_at)}</p>
          </div>

          <div className="flex gap-2 pt-2">
            {!wallet.is_primary && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => onSetPrimary(wallet.id)}
                className="flex-1"
              >
                <Crown className="h-3 w-3 mr-1" />
                Set Primary
              </Button>
            )}
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive" className="px-3">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Wallet</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to remove this wallet ({wallet.account_id}) from your saved wallets? 
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(wallet.id)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const WalletManagement: React.FC = () => {
  const debug = useDebugger('WalletManagement');
  const { wallet: currentWallet } = useWallet();
  const { data: wallets = [], isLoading, error } = useHederaWallets();
  const deleteWalletMutation = useDeleteWallet();
  const setPrimaryWalletMutation = useSetPrimaryWallet();
  const updateWalletNameMutation = useUpdateWalletName();

  const handleSetPrimary = (walletId: string) => {
    debug.log('Setting primary wallet', walletId);
    setPrimaryWalletMutation.mutate(walletId);
  };

  const handleDelete = (walletId: string) => {
    debug.log('Deleting wallet', walletId);
    deleteWalletMutation.mutate(walletId);
  };

  const handleUpdateName = (walletId: string, name: string) => {
    debug.log('Updating wallet name', { walletId, name });
    updateWalletNameMutation.mutate({ walletId, walletName: name });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Saved Wallets</CardTitle>
          <CardDescription>Loading your saved wallets...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Saved Wallets</CardTitle>
          <CardDescription className="text-destructive">
            Failed to load wallets: {error.message}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saved Wallets</CardTitle>
        <CardDescription>
          Manage your connected Hedera wallets. Your primary wallet will be automatically connected when you sign in.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {wallets.length === 0 ? (
          <div className="text-center py-8">
            <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">No saved wallets</p>
            <p className="text-sm text-muted-foreground">
              Connect a wallet to save it to your account for future use.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {wallets.map((wallet) => (
              <WalletCard
                key={wallet.id}
                wallet={wallet}
                isCurrentWallet={currentWallet.accountId === wallet.account_id}
                onSetPrimary={handleSetPrimary}
                onDelete={handleDelete}
                onUpdateName={handleUpdateName}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};