import { ContractExecuteTransaction, ContractFunctionParameters, ContractId, LedgerId, Status } from '@hashgraph/sdk';
import { smartContractId, usdcAddress, usdcDecimals } from '../constants'
import { DAppSigner } from '@hashgraph/hedera-wallet-connect'

const getSpenderAllowanceUsd = async (networkSelected: LedgerId, accountId: string): Promise<number> => {
  try {
    const mirrornode = `https://${networkSelected}.mirrornode.hedera.com/api/v1/accounts/${accountId}/allowances/tokens?spender.id=eq:${smartContractId}&token.id=eq:${usdcAddress}`
    const response = await fetch(mirrornode)
    if (!response.ok) {
      throw new Error('Network response was not ok')
    }
    const data = await response.json()
    return data.allowances[0]?.amount / (10 ** usdcDecimals) || 0
  } catch (error) {
    console.error('Error fetching allowance:', error)
    throw error
  }
}

const grantAllowanceUsd = async (signerZero: DAppSigner, contractId: string, amountUsd: number): Promise<boolean> => {
  console.log(usdcAddress)
  console.log(contractId)
  console.log(amountUsd)
  console.log(ContractId.fromString(contractId).toEvmAddress())
  const approveTx = await new ContractExecuteTransaction()
    .setContractId(usdcAddress)
    .setGas(10_000_000)
    .setFunction('approve', new ContractFunctionParameters()
      .addAddress(ContractId.fromString(contractId).toEvmAddress())
      .addUint256(amountUsd * (10 ** usdcDecimals)))
    .executeWithSigner(signerZero)

    const approveReceipt = await approveTx.getReceiptWithSigner(signerZero)
    console.log('approve status:', approveReceipt.status.toString())

    if (approveReceipt.status === Status.Success) {
      return true
    } else {
      return false
    }
}

export { getSpenderAllowanceUsd, grantAllowanceUsd }
