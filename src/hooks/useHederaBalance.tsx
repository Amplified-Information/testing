import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { hederaService } from '@/lib/hedera';
import { useWallet } from '@/contexts/WalletContext';

export const useHederaBalance = () => {
  const { wallet } = useWallet();

  const { data: balance, isLoading, error, refetch } = useQuery({
    queryKey: ['hedera-balance', wallet.accountId],
    queryFn: async () => {
      if (!wallet.accountId) return null;
      return await hederaService.getAccountBalance(wallet.accountId);
    },
    enabled: !!wallet.accountId && wallet.isConnected,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return {
    balance,
    isLoading,
    error,
    refetch,
  };
};

export const useHederaAccountInfo = () => {
  const { wallet } = useWallet();

  const { data: accountInfo, isLoading, error } = useQuery({
    queryKey: ['hedera-account-info', wallet.accountId],
    queryFn: async () => {
      if (!wallet.accountId) return null;
      return await hederaService.getAccountInfo(wallet.accountId);
    },
    enabled: !!wallet.accountId && wallet.isConnected,
  });

  return {
    accountInfo,
    isLoading,
    error,
  };
};