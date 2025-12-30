import { useAppContext } from '../AppProvider'
import { useEffect, useState } from 'react'
import { apiClient } from '../grpcClient'
import { LedgerId } from '@hashgraph/sdk'
const NetworkSelector = () => {
  const { networkSelected, setNetworkSelected, networksAvailable, setNetworksAvailable  } = useAppContext()
  const [ networkSelectedIdx, setNetworkSelectedIdx ] = useState(0)

  useEffect(() => {
    (async () => {
      const networksAvailableStr = (await apiClient.availableNetworks({}).response).message
      const _networksAvailable = networksAvailableStr.split(',').map(netStr => {
        return LedgerId.fromString(netStr.trim())
      })
      setNetworksAvailable(_networksAvailable)
    })()
  }, [])

  useEffect(() => {
    const idx = networksAvailable.findIndex(network => network === networkSelected)
    setNetworkSelectedIdx(idx)
  }, [networkSelected, networksAvailable])

  return (
    <>
      <select value={networkSelectedIdx} onChange={(evt) => {
        const indx = Number(evt.target.value)
        const selectedNetwork = networksAvailable[indx]
        setNetworkSelectedIdx(indx)
        setNetworkSelected(selectedNetwork)
      }}>
        {
          networksAvailable.map((network, ii) => (
            <option key={ii} value={ii}>
              {network.toString()}
            </option>
          ))
        }
      </select>
    </>
  )
}

export default NetworkSelector
