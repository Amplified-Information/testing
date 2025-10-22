import { networksAvailable } from "../constants"
import { useAppContext } from "../AppProvider"
import { useEffect, useState } from "react"
const NetworkSelector = () => {
  const { networkSelected, setNetworkSelected } = useAppContext()
  const [ networkSelectedIdx, setNetworkSelectedIdx ] = useState(0)

  useEffect(() => {
    const idx = networksAvailable.findIndex(network => network === networkSelected)
    setNetworkSelectedIdx(idx)
  }, [networkSelected])

  return (
    <>
      <select value={networkSelectedIdx} onChange={(evt) => {
          const selectedNetwork = networksAvailable[Number(evt.target.value)]
          console.log(selectedNetwork.toString())
          setNetworkSelectedIdx(Number(evt.target.value))
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
