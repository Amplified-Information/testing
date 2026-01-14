import { useEffect } from 'react'
import { apiClient } from '../grpcClient'
import { useAppContext } from '../AppProvider'
import { LedgerId } from '@hiero-ledger/sdk'

// retrieves the macro metadata
// set shared state variables accordingly
const MacroMetadata = () => {

  const { setNetworksAvailable, setSmartContractIds, setUsdcTokenIds, setUsdcNdecimals, setMarketCreationFeeScaledUsdc, setTokenIds, setNmarkets} = useAppContext()

  useEffect(() => {
    ;(async () => {
      console.log('retrieving macro metadata...')
      const response = (await apiClient.macroMetadata({}).response)
      console.log('macro metadata response:', response)
      
      const _networksAvailable = response.availableNetworks.map(netStr => {
        return LedgerId.fromString(netStr.trim())
      })
      setNetworksAvailable(_networksAvailable)
      //// setNetworkSelected(LedgerId.MAINNET)

      setSmartContractIds(response.smartContracts)

      setUsdcTokenIds(response.usdcTokenIds)

      setUsdcNdecimals(response.usdcDecimals)

      setMarketCreationFeeScaledUsdc(Number(response.marketCreationFeeScaledUsdc))

      setTokenIds(response.tokenIds)

      setNmarkets(Number(response.nMarkets))

    })()
  }, [])
  
  return (
    <>
    </>
  )
}

export default MacroMetadata