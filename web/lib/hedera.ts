import { AccountId, ContractExecuteTransaction, ContractFunctionParameters, ContractId, LedgerId, Status } from '@hashgraph/sdk'
import { usdcAddresses, usdcDecimals } from '../constants'
import { DAppSigner } from '@hashgraph/hedera-wallet-connect'
import { Position, UserAccountInfo } from '../types'

const getActiveMarkets = async (accountId: AccountId): Promise<string[]> => {
  // TODO
  void accountId
  return ['019a7e77-39e2-72a3-9bea-a63bdfa79d20']
}
const getAllPositions = async (accountId: AccountId): Promise<Position[]> => {
  const markets = await getActiveMarkets(accountId)
  for (let i = 0; i < markets.length; i++) {
    // TODO
  }
  return []
}

const getSpenderAllowanceUsd = async (networkSelected: LedgerId, smartContractId: string, accountId: string): Promise<number> => {
  try {
    const mirrornode = `https://${networkSelected}.mirrornode.hedera.com/api/v1/accounts/${accountId}/allowances/tokens?spender.id=eq:${smartContractId}&token.id=eq:${usdcAddresses[networkSelected.toString().toUpperCase()]}`
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

const getUserAccountInfo = async (networkSelected: LedgerId, accountId: string) => {
  try {
    const mirrornode = `https://${networkSelected}.mirrornode.hedera.com/api/v1/accounts/${accountId}`
    const response = await fetch(mirrornode)
    if (!response.ok) {
      throw new Error('Network response was not ok')
    }
    const data = await response.json()
    return data as UserAccountInfo
  } catch (error) {
    console.error('Error fetching account info from mirrornode:', error)
    throw error
  }
}

const grantAllowanceUsd = async (signerZero: DAppSigner, contractId: string, amountUsd: number): Promise<boolean> => {
  // console.log(signerZero.getLedgerId().toString)
  console.log(usdcAddresses[signerZero.getLedgerId().toString().toUpperCase()])
  console.log(contractId)
  console.log(amountUsd)
  console.log(ContractId.fromString(contractId).toEvmAddress())
  const approveTx = await new ContractExecuteTransaction()
    .setContractId(usdcAddresses[signerZero.getLedgerId().toString().toUpperCase()])
    .setGas(10_000_000) // TODO: this is coming up as infinity HBAR?
    .setFunction('approve', new ContractFunctionParameters()
      .addAddress(ContractId.fromString(contractId).toEvmAddress()) // spender (the smart contract)
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

export { 
  getAllPositions, 
  getSpenderAllowanceUsd, 
  grantAllowanceUsd,
  getUserAccountInfo
}
