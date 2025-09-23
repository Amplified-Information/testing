# Protocol Token Implementation Notes

## Overview
The governance system currently operates without a defined PROTOCOL_TOKEN. This document outlines the requirements and implementation plan for the protocol token.

## Current State
- **Voting Power**: Currently using placeholder values in `user_token_balances.total_voting_power`
- **Staking**: Database schema exists but no actual token staking mechanism
- **References**: Temporary placeholders in UI components

## Requirements for PROTOCOL_TOKEN

### 1. Token Specifications
- **Type**: HTS (Hedera Token Service) fungible token
- **Supply**: To be determined based on tokenomics
- **Decimals**: Standard 8 decimals for Hedera tokens
- **Symbol**: TBD (e.g., HMT for HashyMarket Token)

### 2. Integration Points

#### Governance System
- Minimum 100,000 tokens required for proposal creation
- Proposal phase quorum: 5,000,000 voting power
- Election phase quorum: 10,000,000 voting power
- Voting power = token_balance + (staked_balance * multiplier)

#### Staking Mechanism
- Lock tokens for enhanced voting power
- Multipliers based on stake duration:
  - 1 month: 1.25x
  - 3 months: 1.5x
  - 6 months: 2.0x
  - 1 year: 3.0x

### 3. Implementation Plan

#### Phase 1: Token Creation
1. Create HTS token on Hedera testnet
2. Configure token properties (supply, decimals, etc.)
3. Set up treasury account for initial distribution

#### Phase 2: Balance Integration
1. Create edge function to fetch real token balances from Hedera
2. Update `user_token_balances` table with real data
3. Implement balance sync mechanism

#### Phase 3: Staking System
1. Create staking smart contract or use HTS freeze/unfreeze
2. Implement staking UI in governance dashboard
3. Add staking rewards calculation

#### Phase 4: Distribution Strategy
1. Define initial token distribution (team, community, treasury)
2. Implement token claiming mechanism
3. Set up liquidity incentives for early users

### 4. Technical Implementation

#### Database Changes
```sql
-- Add token-specific columns if needed
ALTER TABLE user_token_balances 
ADD COLUMN protocol_token_id TEXT; -- Store HTS token ID

-- Add staking rewards tracking
CREATE TABLE staking_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  reward_amount NUMERIC NOT NULL DEFAULT 0,
  reward_period DATERANGE NOT NULL,
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Edge Functions Needed
- `sync-token-balances`: Fetch real balances from Hedera
- `calculate-staking-rewards`: Distribute staking rewards
- `process-staking`: Handle stake/unstake operations

#### Frontend Updates
- Replace all "PROTOCOL_TOKEN" placeholders with actual token symbol
- Add token balance display in wallet component
- Create staking interface
- Add token distribution claiming UI

### 5. Files to Update
Once PROTOCOL_TOKEN is implemented, update:

- `src/components/Governance/ProposalForm.tsx` - Remove TODO comments
- `src/pages/DevelopmentNotes.tsx` - Update progress tracking
- `src/hooks/useGovernance.ts` - Add real token balance fetching
- `src/components/Wallet/WalletButton.tsx` - Display token balance
- `src/hooks/useHederaBalance.tsx` - Include protocol token in balance queries

### 6. Testing Checklist
- [ ] Token creation on testnet
- [ ] Balance fetching accuracy
- [ ] Staking mechanism functionality
- [ ] Governance voting power calculation
- [ ] UI displays correct token information
- [ ] Reward distribution system

## Temporary Workarounds
Until PROTOCOL_TOKEN is implemented:
1. Use mock voting power values in governance settings
2. Display generic "voting power" instead of token amounts
3. Allow proposal creation based on wallet connection (for testing)
4. Use placeholder token symbol in UI components

## Security Considerations
- Implement proper access controls for token minting
- Secure staking contract against reentrancy attacks
- Add multi-sig requirements for treasury operations
- Audit token economics before mainnet deployment