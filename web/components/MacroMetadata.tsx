import { useEffect } from 'react'
import { apiClient } from '../grpcClient'
import { useAppContext } from '../AppProvider'
import { LedgerId } from '@hiero-ledger/sdk'

// retrieves the macro metadata
// set shared state variables accordingly
const MacroMetadata = () => {

  const { setNetworksAvailable, setSmartContractIds, setUsdcAddresses, setUsdcNdecimals } = useAppContext()

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

    })()
  }, [])
  
  return (
    <>
    </>
  )
}

export default MacroMetadata