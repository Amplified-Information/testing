# CLOB Smart Contract Integration

## Overview

This document explains how the CLOB (Central Limit Order Book) system integrates with Hedera smart contracts for on-chain order execution.

## Architecture

### Components

1. **HederaContractService** (`src/lib/hederaContract.ts`)
   - Handles all smart contract interactions
   - Submits limit orders to on-chain contracts
   - Manages transaction signing and execution
   - Queries contract state

2. **CLOBService** (`src/lib/clob.ts`)
   - Enhanced to support both on-chain and off-chain execution
   - Routes orders to smart contracts when enabled
   - Falls back to database-only mode if needed

3. **CLOBTradingInterface** (`src/components/CLOB/CLOBTradingInterface.tsx`)
   - User interface for placing orders
   - Toggle for smart contract execution
   - Transaction status feedback

## Setup Instructions

### 1. Deploy CLOB Smart Contract

First, you need to deploy a CLOB smart contract to Hedera. The contract should implement:

```solidity
// Example Solidity interface
interface ICLOBContract {
    function submitLimitOrder(
        string memory marketId,
        uint8 side,         // 0 = BUY, 1 = SELL
        uint256 priceTicks,
        uint256 quantity,
        string memory maker
    ) external returns (bool);
    
    function cancelOrder(
        string memory orderId,
        string memory accountId
    ) external returns (bool);
    
    function getOrder(string memory orderId) external view returns (...);
    
    function getCollateral(string memory accountId) external view returns (uint256);
}
```

**Note**: The provided `HederaClobExchange` contract uses a different approach with `settleOrder()` for operator-based settlement. For user order submission, add a function like `submitLimitOrder()` shown above.

### 2. Store Contract ID

After deploying the contract, store its ID in Supabase secrets:

```sql
INSERT INTO secrets (name, value)
VALUES ('CLOB_CONTRACT_ID', '0.0.YOUR_CONTRACT_ID')
ON CONFLICT (name) 
DO UPDATE SET value = EXCLUDED.value;
```

### 3. Enable Smart Contract Mode

In the CLOB Trading interface, users can toggle "Smart Contract Execution" on/off:
- **ON**: Orders are submitted to the Hedera smart contract
- **OFF**: Orders are processed off-chain in the database

## How It Works

### Order Submission Flow

1. **User fills order form** (price, quantity, side)
2. **buildOrder** creates a signed order object
3. **Smart Contract Path** (if enabled):
   - Fetch contract ID from Supabase secrets
   - Create ContractExecuteTransaction
   - Sign transaction with user's wallet via WalletConnect
   - Submit to Hedera network
   - Wait for receipt and confirmation
   - Store transaction ID with order
4. **Database Queue** (fallback or parallel):
   - Insert order into `order_queue` table
   - Trigger off-chain matching engine (optional)
5. **Success notification** shown to user

### Transaction Signing

Orders are signed using the user's connected Hedera wallet (HashPack, Blade, etc.) via WalletConnect.

**Fixed Implementation** - Properly extracts signer from DAppConnector:

```typescript
// Get active session
const sessions = walletConnector.walletConnectClient.session?.getAll() || [];
if (sessions.length === 0) {
  throw new Error('No active wallet session found');
}

const session = sessions[0];

// Get signer for the session topic
const signers = await walletConnector.getSigner(session.topic);
const signer = signers[0];

// Execute transaction
const txResponse = await transaction.executeWithSigner(signer);
const receipt = await txResponse.getReceipt(signer.getAccountId().client);
```

This ensures wallet pairing strings are properly sent to the wallet for user approval.

### Gas and Fees

- Limit order submission: ~300,000 gas (≤2 HBAR max fee)
- Order cancellation: ~200,000 gas (≤1 HBAR max fee)
- Query operations: ~100,000 gas (≤0.5 HBAR max fee)

## Fallback Mechanism

If smart contract execution fails, the system automatically falls back to database-only mode:

1. Contract call fails (network issue, insufficient gas, etc.)
2. Error is logged but not thrown
3. Order is still queued in database
4. Off-chain matching continues as normal
5. User is notified of fallback behavior

## Testing

### Local Development

For testing without deploying a contract:

1. Set `useSmartContract = false` in CLOBTradingInterface
2. Orders will only go to database queue
3. Off-chain matching engine will process orders

### Testnet Testing

1. Deploy contract to Hedera Testnet
2. Get testnet HBAR from faucet
3. Set contract ID in secrets
4. Toggle smart contract execution ON
5. Submit test orders and verify on HashScan

## Contract Events

The smart contract should emit events for:

```solidity
event OrderSubmitted(string orderId, string marketId, uint8 side, uint256 price, uint256 quantity);
event OrderCancelled(string orderId, string accountId);
event OrderFilled(string orderId, uint256 filledQuantity);
event OrderMatched(string buyOrderId, string sellOrderId, uint256 price, uint256 quantity);
```

## Security Considerations

1. **Order Validation**: Orders are validated before contract submission
2. **Signature Verification**: All orders must be signed by the maker
3. **Collateral Checks**: Smart contract should verify sufficient collateral
4. **Reentrancy Protection**: Contract should use reentrancy guards
5. **Access Control**: Only authorized addresses can call admin functions

## Future Enhancements

- [ ] Multi-signature support for institutional accounts
- [ ] Batch order submission to save on gas
- [ ] Layer 2 scaling solution for high-frequency trading
- [ ] Advanced order types (stop-loss, take-profit, etc.)
- [ ] Cross-market arbitrage detection
- [ ] Real-time order book streaming from smart contract events

## Troubleshooting

### "Wallet not connected" or "No signer available"
- Ensure HashPack or compatible wallet is installed
- Check WalletConnect session is active in your wallet app
- Try disconnecting and reconnecting wallet
- **Fixed**: Signer extraction now properly retrieves from session topic

### "Smart contract execution failed"
- Verify contract ID is correct in secrets table
- Check account has sufficient HBAR for gas
- Ensure contract is deployed on correct network (testnet/mainnet)
- Verify contract has the expected functions (`submitLimitOrder`, etc.)
- Check browser console for detailed error messages

### "Transaction timeout"
- Hedera network may be congested
- Try increasing max transaction fee
- Check transaction status on HashScan
- Ensure wallet is unlocked and responsive

### "No active wallet session found"
- Wallet needs to be connected before placing orders
- Click "Connect Wallet" button first
- Accept the connection in your wallet app
- Session expires after 20 minutes of inactivity

## Resources

- [Hedera Smart Contracts Documentation](https://docs.hedera.com/hedera/smart-contracts)
- [Hedera SDK Documentation](https://docs.hedera.com/hedera/sdks-and-apis)
- [HashScan Explorer](https://hashscan.io/)
- [WalletConnect Hedera Integration](https://docs.walletconnect.com/)
