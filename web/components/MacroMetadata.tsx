import { useEffect } from 'react'
import { apiClient } from '../grpcClient'
import { useAppContext } from '../AppProvider'
import { LedgerId } from '@hiero-ledger/sdk'

// retrieves the macro metadata
// set shared state variables accordingly
const MacroMetadata = () => {

  const { setNetworksAvailable, setSmartContractIds, setUsdcAddresses, setUsdcNdecimals, setMarketCreationFeeScaledUsdc } = useAppContext()

  useEffect(() => {
    ;(async () => {
      const response = (await apiClient.macroMetadata({}).response)
      console.log('macro metadata response:', response)
      
      const _networksAvailable = response.availableNetworks.map(netStr => {
        return LedgerId.fromString(netStr.trim())
      })
      setNetworksAvailable(_networksAvailable)
      //// setNetworkSelected(LedgerId.MAINNET)

      setSmartContractIds(response.smartContracts)

      setUsdcAddresses(response.usdcAddresses)

      setUsdcNdecimals(response.usdcDecimals)

      setMarketCreationFeeScaledUsdc(Number(response.marketCreationFeeScaledUsdc))

    })()
  }, [])
  
  return (
    <>
    </>
  )
}

export default MacroMetadata