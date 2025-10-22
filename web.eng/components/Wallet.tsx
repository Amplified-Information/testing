import { DAppConnector, DAppSigner, HederaChainId, HederaJsonRpcMethod, HederaSessionEvent } from "@hashgraph/hedera-wallet-connect"
import { smartContractId, walletConnectProjectId, walletMetaData } from "../constants"
import { useEffect, useState } from "react"
import { useAppContext } from "../AppProvider"
import NetworkSelector from "./NetworkSelector"

const Wallet = () => {
  const { dAppConnector, setDappConnector, networkSelected, setNetworkSelected } = useAppContext()
  const [ signerZero, setSignerZero ] = useState<DAppSigner | undefined>(undefined)

  useEffect(() => {
    ;(async () => {
      await connect()
    })()
  }, [networkSelected])

  const initDAppConnector = async () => {
    // https://www.npmjs.com/package/@hashgraph/hedera-wallet-connect
    const dAppConnector = new DAppConnector(
      walletMetaData,
      networkSelected,
      walletConnectProjectId,
      Object.values(HederaJsonRpcMethod),
      [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged],
      [HederaChainId.Mainnet, HederaChainId.Testnet, HederaChainId.Previewnet],
    )
    console.log(`DAppConnector initialized for ${networkSelected.toString()}:`, dAppConnector)
    setDappConnector(dAppConnector)

    console.log('Attempting to init dAppConnector...')
    await dAppConnector.init()

    return dAppConnector
  }

  const disconnect = async () => {
    try {
      await dAppConnector!.disconnectAll()
    } catch (error) {
      console.error('Error disconnecting wallet:', error)
    } finally {
      setSignerZero(undefined)
      setDappConnector(undefined)
    }
  }

  const connect = async () => {
    try {
      const _dAppConnector = await initDAppConnector()

      if (_dAppConnector!.signers.length === 0) {
        await _dAppConnector!.openModal()
      } else {
        console.log('Already connected sessions:')
        console.log(_dAppConnector!.signers)
        setSignerZero(_dAppConnector!.signers[0])
        setNetworkSelected(_dAppConnector!.signers[0].getLedgerId())
      }
    } catch (error) {
      console.error('Error initializing dAppConnector:', error)
    }
  }

  return (
    <>
      <NetworkSelector />

      { signerZero === undefined ? (
        <>
          <button className='btn' title='Connect wallet' onClick={() => { connect() }}>Connect</button>
        </>
      ) : (
        <>

          {signerZero.getAccountId().toString()}

          {signerZero.getLedgerId().toString()}

          <button className='btn orange' title='Disconnect wallet' onClick={() => { disconnect() }}>Disconnect</button>
          {/* <button className='btn'
            onClick={async () => {
              // await initWallet()

              // const x = await dAppConnector.init()

              if (dAppConnector.signers.length === 0) {
                const _sessions = await dAppConnector.openModal()
                console.log('sessions')
                console.log(_sessions)
                _sessions.self.publicKey
                setSessions(_sessions)
              } else {
                console.log('Already connected sessions:')
                console.log(dAppConnector.signers)
              }
            }}
          >
            Connect
          </button> */}
        </>
      )}
    </>
  )
}

export default Wallet
