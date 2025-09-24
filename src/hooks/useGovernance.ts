import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from 'sonner';
import type { 
  MarketProposal, 
  CreateProposalData, 
  VoteChoice, 
  UserTokenBalance,
  GovernanceSettings,
  ProposalVote 
} from '@/types/governance';

export const useGovernance = () => {
  const { wallet } = useWallet();
  const queryClient = useQueryClient();

  // Get user's voting power by Hedera account ID
  const { data: userBalance, isLoading: isLoadingBalance } = useQuery({
    queryKey: ['user-token-balance', wallet.accountId],
    queryFn: async () => {
      if (!wallet.accountId) return null;
      
      // First, find the wallet entry to get the linked user_id
      const { data: walletData } = await supabase
        .from('hedera_wallets')
        .select('user_id')
        .eq('account_id', wallet.accountId)
        .maybeSingle();
      
      if (!walletData?.user_id) return null;
      
      const { data, error } = await supabase
        .from('user_token_balances')
        .select('*')
        .eq('user_id', walletData.user_id)
        .maybeSingle();

      if (error) {
        throw error;
      }
      
      return data as UserTokenBalance | null;
    },
    enabled: wallet.isConnected && !!wallet.accountId,
  });

  // Get governance settings
  const { data: governanceSettings } = useQuery({
    queryKey: ['governance-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('governance_settings')
        .select('*');

      if (error) throw error;
      return data as GovernanceSettings[];
    },
  });

  // Get active proposals
  const { data: activeProposals, isLoading: isLoadingProposals } = useQuery({
    queryKey: ['active-proposals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('market_proposals')
        .select('*')
        .in('governance_status', ['proposal', 'voting', 'election'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as MarketProposal[];
    },
  });

  // Get user's proposals by Hedera account ID
  const { data: userProposals } = useQuery({
    queryKey: ['user-proposals', wallet.accountId],
    queryFn: async () => {
      if (!wallet.accountId) return [];
      
      // Find the wallet entry to get the linked user_id
      const { data: walletData } = await supabase
        .from('hedera_wallets')
        .select('user_id')
        .eq('account_id', wallet.accountId)
        .maybeSingle();
      
      if (!walletData?.user_id) return [];
      
      const { data, error } = await supabase
        .from('market_proposals')
        .select('*')
        .eq('proposer_id', walletData.user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as MarketProposal[];
    },
    enabled: wallet.isConnected && !!wallet.accountId,
  });

  // Get user's votes by Hedera account ID
  const { data: userVotes } = useQuery({
    queryKey: ['user-votes', wallet.accountId],
    queryFn: async () => {
      if (!wallet.accountId) return [];
      
      // Find the wallet entry to get the linked user_id
      const { data: walletData } = await supabase
        .from('hedera_wallets')
        .select('user_id')
        .eq('account_id', wallet.accountId)
        .maybeSingle();
      
      if (!walletData?.user_id) return [];
      
      const { data, error } = await supabase
        .from('proposal_votes')
        .select('*')
        .eq('voter_id', walletData.user_id);

      if (error) throw error;
      return data as ProposalVote[];
    },
    enabled: wallet.isConnected && !!wallet.accountId,
  });

  // Create proposal mutation
  const createProposalMutation = useMutation({
    mutationFn: async (proposalData: CreateProposalData) => {
      if (!wallet.accountId) {
        throw new Error('Wallet not connected');
      }
      
      // Find the wallet entry to get the linked user_id
      const { data: walletData } = await supabase
        .from('hedera_wallets')
        .select('user_id')
        .eq('account_id', wallet.accountId)
        .maybeSingle();
      
      if (!walletData?.user_id) {
        throw new Error('Wallet not linked to governance account');
      }

      let imageUrl = null;
      
      // Upload image if provided
      if (proposalData.marketImage) {
        const fileExt = proposalData.marketImage.name.split('.').pop();
        const fileName = `${walletData.user_id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(fileName, proposalData.marketImage);
          
        if (uploadError) {
          console.warn('Image upload failed:', uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('images')
            .getPublicUrl(fileName);
          imageUrl = publicUrl;
        }
      }

      const { data, error } = await supabase
        .from('market_proposals')
        .insert({
          proposer_id: walletData.user_id,
          proposal_type: 'market_creation',
          title: proposalData.title,
          description: proposalData.description,
          market_title: proposalData.market_title,
          market_description: proposalData.market_description,
          market_outcomes: proposalData.market_outcomes,
          resolution_date: proposalData.resolution_date,
          oracle_type: proposalData.oracle_type,
          oracle_config: proposalData.oracle_config,
          initial_liquidity: proposalData.initial_liquidity,
          collateral_type: proposalData.collateral_type,
          governance_status: 'draft',
          image_url: imageUrl,
        })
        .select()
        .single();

      if (error) throw error;
      return data as MarketProposal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-proposals'] });
      queryClient.invalidateQueries({ queryKey: ['active-proposals'] });
      toast.success('Proposal created successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to create proposal: ${error.message}`);
    },
  });

  // Submit proposal for voting
  const submitProposalMutation = useMutation({
    mutationFn: async (proposalId: string) => {
      const { data, error } = await supabase
        .from('market_proposals')
        .update({
          governance_status: 'proposal',
          voting_start_date: new Date().toISOString(),
          voting_end_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
        })
        .eq('id', proposalId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-proposals'] });
      queryClient.invalidateQueries({ queryKey: ['active-proposals'] });
      toast.success('Proposal submitted for voting!');
    },
    onError: (error) => {
      toast.error(`Failed to submit proposal: ${error.message}`);
    },
  });

  // Vote on proposal
  const voteMutation = useMutation({
    mutationFn: async ({ 
      proposalId, 
      voteChoice, 
      isProposalPhase = true 
    }: { 
      proposalId: string; 
      voteChoice: VoteChoice; 
      isProposalPhase?: boolean;
    }) => {
      if (!wallet.accountId || !userBalance) {
        throw new Error('Wallet not connected or no voting power');
      }
      
      // Find the wallet entry to get the linked user_id
      const { data: walletData } = await supabase
        .from('hedera_wallets')
        .select('user_id')
        .eq('account_id', wallet.accountId)
        .maybeSingle();
      
      if (!walletData?.user_id) {
        throw new Error('Wallet not linked to governance account');
      }

      // Create a simple signature for now (would be replaced with actual wallet signature)
      const signature = `${wallet.accountId}-${proposalId}-${voteChoice}-${Date.now()}`;

      const { data, error } = await supabase
        .from('proposal_votes')
        .insert({
          proposal_id: proposalId,
          voter_id: walletData.user_id,
          vote_choice: voteChoice,
          voting_power: userBalance.total_voting_power,
          is_proposal_phase: isProposalPhase,
          wallet_signature: signature,
        })
        .select()
        .single();

      if (error) throw error;

      // Update proposal vote counts
      const fieldPrefix = isProposalPhase ? 'proposal' : 'election';
      const voteCountField = `${fieldPrefix}_votes_${voteChoice === 'yes' ? 'for' : voteChoice === 'no' ? 'against' : 'abstain'}`;
      const votingPowerField = `${fieldPrefix}_voting_power_${voteChoice === 'yes' ? 'for' : voteChoice === 'no' ? 'against' : 'abstain'}`;

      // Get current proposal data
      const { data: proposalData } = await supabase
        .from('market_proposals')
        .select(voteCountField + ', ' + votingPowerField)
        .eq('id', proposalId)
        .single();

      if (proposalData) {
        const currentVoteCount = proposalData[voteCountField] || 0;
        const currentVotingPower = proposalData[votingPowerField] || 0;
        
        // Update the proposal with new counts
        await supabase
          .from('market_proposals')
          .update({
            [voteCountField]: currentVoteCount + 1,
            [votingPowerField]: currentVotingPower + userBalance.total_voting_power,
          })
          .eq('id', proposalId);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-votes'] });
      queryClient.invalidateQueries({ queryKey: ['active-proposals'] });
      toast.success('Vote submitted successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to submit vote: ${error.message}`);
    },
  });

  // Helper functions
  const canCreateProposal = () => {
    const minVotingPower = governanceSettings?.find(
      s => s.setting_key === 'min_proposal_voting_power'
    )?.setting_value || 100000;
    
    return userBalance && userBalance.total_voting_power >= Number(minVotingPower);
  };

  const getVotingPowerRequirement = () => {
    return governanceSettings?.find(
      s => s.setting_key === 'min_proposal_voting_power'
    )?.setting_value || 100000;
  };

  const getProposalQuorum = () => {
    return governanceSettings?.find(
      s => s.setting_key === 'proposal_quorum_voting_power'
    )?.setting_value || 5000000;
  };

  const getElectionQuorum = () => {
    return governanceSettings?.find(
      s => s.setting_key === 'election_quorum_voting_power'
    )?.setting_value || 10000000;
  };

  return {
    // Data
    userBalance,
    activeProposals,
    userProposals,
    userVotes,
    governanceSettings,
    
    // Loading states
    isLoadingBalance,
    isLoadingProposals,
    
    // Mutations
    createProposal: createProposalMutation.mutate,
    submitProposal: submitProposalMutation.mutate,
    vote: voteMutation.mutate,
    
    // Loading states for mutations
    isCreatingProposal: createProposalMutation.isPending,
    isSubmittingProposal: submitProposalMutation.isPending,
    isVoting: voteMutation.isPending,
    
    // Helper functions
    canCreateProposal,
    getVotingPowerRequirement,
    getProposalQuorum,
    getElectionQuorum,
  };
};