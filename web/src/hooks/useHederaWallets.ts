import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDebugger } from './useDebugger';
import { toast } from '@/hooks/use-toast';

// Type definitions for hedera wallets
export interface HederaWallet {
  id: string;
  user_id: string | null;
  account_id: string;
  public_key: string | null;
  is_primary: boolean;
  wallet_name: string | null;
  last_connected_at: string;
  created_at: string;
  updated_at: string;
}

export interface SaveWalletParams {
  accountId: string;
  publicKey: string | null;
  walletName?: string;
  isPrimary?: boolean;
}

// Hook to get all wallets for current user
export const useHederaWallets = () => {
  const debug = useDebugger('useHederaWallets');

  return useQuery({
    queryKey: ['hedera-wallets'],
    queryFn: async (): Promise<HederaWallet[]> => {
      debug.log('Fetching user wallets');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        debug.log('No authenticated user, returning empty array');
        return [];
      }

      const { data, error } = await supabase
        .from('hedera_wallets')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        debug.error('Failed to fetch wallets', error);
        throw error;
      }

      debug.log('Fetched wallets successfully', data);
      return data || [];
    },
    enabled: true,
    retry: 2,
    retryDelay: 1000,
  });
};

// Hook to get primary wallet for current user
export const usePrimaryWallet = () => {
  const debug = useDebugger('usePrimaryWallet');

  return useQuery({
    queryKey: ['primary-wallet'],
    queryFn: async (): Promise<HederaWallet | null> => {
      debug.log('Fetching primary wallet');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        debug.log('No authenticated user, returning null');
        return null;
      }

      const { data, error } = await supabase
        .from('hedera_wallets')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('is_primary', true)
        .maybeSingle();

      if (error) {
        debug.error('Failed to fetch primary wallet', error);
        throw error;
      }

      debug.log('Fetched primary wallet', data);
      return data;
    },
    enabled: true,
    retry: 2,
    retryDelay: 1000,
  });
};

// Hook to save wallet to database
export const useSaveWallet = () => {
  const queryClient = useQueryClient();
  const debug = useDebugger('useSaveWallet');

  return useMutation({
    mutationFn: async ({ accountId, publicKey, walletName, isPrimary = false }: SaveWalletParams): Promise<HederaWallet> => {
      debug.log('Saving wallet', { accountId, walletName, isPrimary });
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('User must be authenticated to save wallet');
      }

      // Check if wallet already exists for this user
      const { data: existingWallet } = await supabase
        .from('hedera_wallets')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('account_id', accountId)
        .maybeSingle();

      let walletData: HederaWallet;

      if (existingWallet) {
        // Update existing wallet
        debug.log('Updating existing wallet', existingWallet.id);
        const { data, error } = await supabase
          .from('hedera_wallets')
          .update({
            public_key: publicKey,
            wallet_name: walletName || existingWallet.wallet_name,
            last_connected_at: new Date().toISOString(),
            ...(isPrimary && { is_primary: true })
          })
          .eq('id', existingWallet.id)
          .select()
          .single();

        if (error) throw error;
        walletData = data;
      } else {
        // Create new wallet
        debug.log('Creating new wallet');
        const { data, error } = await supabase
          .from('hedera_wallets')
          .insert({
            user_id: session.user.id,
            account_id: accountId,
            public_key: publicKey,
            wallet_name: walletName,
            is_primary: isPrimary,
            last_connected_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        walletData = data;
      }

      // If this is set as primary, handle primary wallet logic
      if (isPrimary) {
        debug.log('Setting wallet as primary');
        await supabase.rpc('set_primary_wallet', { wallet_id: walletData.id });
      }

      debug.log('Wallet saved successfully', walletData);
      return walletData;
    },
    onSuccess: (data) => {
      // Invalidate and refetch wallet queries
      queryClient.invalidateQueries({ queryKey: ['hedera-wallets'] });
      queryClient.invalidateQueries({ queryKey: ['primary-wallet'] });
      
      debug.log('Wallet cache invalidated');
      toast({
        title: "Wallet Saved",
        description: `Wallet ${data.account_id} has been saved to your account.`,
      });
    },
    onError: (error: any) => {
      debug.error('Failed to save wallet', error);
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save wallet to your account.",
        variant: "destructive",
      });
    },
  });
};

// Hook to set primary wallet
export const useSetPrimaryWallet = () => {
  const queryClient = useQueryClient();
  const debug = useDebugger('useSetPrimaryWallet');

  return useMutation({
    mutationFn: async (walletId: string): Promise<boolean> => {
      debug.log('Setting primary wallet', walletId);
      
      const { data, error } = await supabase.rpc('set_primary_wallet', { wallet_id: walletId });

      if (error) {
        debug.error('Failed to set primary wallet', error);
        throw error;
      }

      debug.log('Primary wallet set successfully', data);
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch wallet queries
      queryClient.invalidateQueries({ queryKey: ['hedera-wallets'] });
      queryClient.invalidateQueries({ queryKey: ['primary-wallet'] });
      
      toast({
        title: "Primary Wallet Set",
        description: "Your primary wallet has been updated.",
      });
    },
    onError: (error: any) => {
      debug.error('Failed to set primary wallet', error);
      toast({
        title: "Update Failed", 
        description: error.message || "Failed to update primary wallet.",
        variant: "destructive",
      });
    },
  });
};

// Hook to delete wallet
export const useDeleteWallet = () => {
  const queryClient = useQueryClient();
  const debug = useDebugger('useDeleteWallet');

  return useMutation({
    mutationFn: async (walletId: string): Promise<void> => {
      debug.log('Deleting wallet', walletId);
      
      const { error } = await supabase
        .from('hedera_wallets')
        .delete()
        .eq('id', walletId);

      if (error) {
        debug.error('Failed to delete wallet', error);
        throw error;
      }

      debug.log('Wallet deleted successfully');
    },
    onSuccess: () => {
      // Invalidate and refetch wallet queries
      queryClient.invalidateQueries({ queryKey: ['hedera-wallets'] });
      queryClient.invalidateQueries({ queryKey: ['primary-wallet'] });
      
      toast({
        title: "Wallet Removed",
        description: "Wallet has been removed from your account.",
      });
    },
    onError: (error: any) => {
      debug.error('Failed to delete wallet', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to remove wallet.",
        variant: "destructive",
      });
    },
  });
};

// Hook to update wallet name
export const useUpdateWalletName = () => {
  const queryClient = useQueryClient();
  const debug = useDebugger('useUpdateWalletName');

  return useMutation({
    mutationFn: async ({ walletId, walletName }: { walletId: string; walletName: string }): Promise<HederaWallet> => {
      debug.log('Updating wallet name', { walletId, walletName });
      
      const { data, error } = await supabase
        .from('hedera_wallets')
        .update({ wallet_name: walletName })
        .eq('id', walletId)
        .select()
        .single();

      if (error) {
        debug.error('Failed to update wallet name', error);
        throw error;
      }

      debug.log('Wallet name updated successfully', data);
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch wallet queries
      queryClient.invalidateQueries({ queryKey: ['hedera-wallets'] });
      queryClient.invalidateQueries({ queryKey: ['primary-wallet'] });
      
      toast({
        title: "Wallet Updated",
        description: "Wallet name has been updated.",
      });
    },
    onError: (error: any) => {
      debug.error('Failed to update wallet name', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update wallet name.",
        variant: "destructive",
      });
    },
  });
};