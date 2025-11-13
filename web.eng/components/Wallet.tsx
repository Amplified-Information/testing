import { DAppConnector, HederaChainId, HederaJsonRpcMethod, HederaSessionEvent } from '@hashgraph/hedera-wallet-connect'
import { smartContractId, walletConnectProjectId, walletMetaData } from '../constants'
import { useEffect, useState } from 'react'
import { useAppContext } from '../AppProvider'
import NetworkSelector from './NetworkSelector'
import { getSpenderAllowanceUsd } from '../lib/hedera'
import GrantAllowance from './GrantAllowance'

const Wallet = () => {
  const { dAppConnector, setDappConnector, networkSelected, signerZero, setSignerZero, spenderAllowanceUsd, setSpenderAllowanceUsd } = useAppContext()
  const [ thinger, setThinger ] = useState(false)
  const [showGrantAllowance, setShowGrantAllowance] = useState(false)

  useEffect(() => {
    ;(async () => {
      const _dAppConnector = await initDAppConnector()
      await searchExistingSignerAndConnect(_dAppConnector)
    })()
  }, [])

  useEffect(() => {
    ;(async () => {
      await searchExistingSignerAndConnect(dAppConnector)
    })()
  }, [networkSelected])

  useEffect(() => {
    ;(async () => {
      await searchExistingSignerAndConnect(dAppConnector)
    })()
  }, [])

  useEffect(() => {
    ;(async () => {
      if (!signerZero) return

      const _spenderAllowance = await getSpenderAllowanceUsd(networkSelected, smartContractId, signerZero.getAccountId().toString())
      setSpenderAllowanceUsd(_spenderAllowance)
    })()
  }, [signerZero])

  const initDAppConnector = async () => {
    // https://www.npmjs.com/package/@hashgraph/hedera-wallet-connect
    const _dAppConnector = new DAppConnector(
      walletMetaData,
      networkSelected,
      walletConnectProjectId,
      Object.values(HederaJsonRpcMethod),
      [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged],
      [HederaChainId.Mainnet, HederaChainId.Testnet, HederaChainId.Previewnet]
    )

    setDappConnector(_dAppConnector)
    await _dAppConnector.init()
    return _dAppConnector
  }

  const disconnect = async () => {
    setThinger(true)
    try {
      await dAppConnector!.disconnectAll()
    } catch (error) {
      console.error('Error disconnecting wallet:', error)
    } finally {
      setSignerZero(undefined)
      setDappConnector(undefined)
      setThinger(false)
    }
  }

  const connect = async () => {
    setThinger(true)
    const _dAppConnector = await initDAppConnector()
    try {
      const _signerZero = _dAppConnector!.signers.find(signer => signer.getLedgerId() === networkSelected) // find first signer on the selected network
      if (!_signerZero) {
        // this can take the user several seconds to complete the flow...
        const walletObj = await _dAppConnector!.openModal(undefined /* yes, undefined - a bit messy */, true) // true: reject if user does not fully complete the flow...
        console.log('walletObj:')
        console.log(walletObj)
      } else {
        console.log(`Already have a connected signer for ${networkSelected.toString()}: ${_signerZero.getAccountId().toString()}`)
      }
    } catch (error) {
      console.error('Error initializing dAppConnector:', error)
    } finally {
      await searchExistingSignerAndConnect(_dAppConnector)
      setThinger(false)
    }
  }

  const searchExistingSignerAndConnect = async (_dAppConnector: DAppConnector | undefined) => {
    try {
      if (typeof _dAppConnector === 'undefined') {
        console.log('_dAppConnector still undefined')
        return
      }

      console.log('Available sessions:')
      console.log(_dAppConnector!.signers)
      const _signerZero = _dAppConnector!.signers.find(signer => signer.getLedgerId() === networkSelected) // find first signer on the selected network
      if (!_signerZero) {
        console.log(`No connected signer found for network ${networkSelected.toString()}`)
        setSignerZero(undefined)
      } else {
        setSignerZero(_signerZero)
        console.log(`signerZero set to ${_signerZero.getAccountId().toString()} for network ${networkSelected.toString()}`)
      }
    } catch (e) {
      console.error('searchExistingSignerAndConnect: ', JSON.stringify(e))
    }
  }

  return (
    <div className="flex items-center gap-2 ml-auto">
      <NetworkSelector />
      { signerZero === undefined ? (
        <>
          <button className='btn' title='Connect wallet' disabled={thinger} onClick={() => { connect() }}>
            {thinger ? 'Connecting...' : 'Connect'}
          </button>
        </>
      ) : (
        <>
            <span>
              <div className='text-sm text-center -mt-1'>
                Spender allowance: <a className='text-blue-500 underline cursor-pointer' onClick={() => setShowGrantAllowance(true)} target="#"> ${spenderAllowanceUsd.toFixed(2)}</a>
              </div>
            </span>
            {/* <span>{signerZero.getLedgerId().toString()}</span> */}
            <button className='btn orange' title='Disconnect wallet' onClick={() => { disconnect() }}>
              {thinger ? 'Disconnecting...' : 
                <>
                  Disconnect
                  <div className='text-xs text-center font-bold'>
                    {signerZero!.getAccountId().toString()}
                  </div>
                </>
              }
            </button>
            <GrantAllowance open={showGrantAllowance} onClose={() => { setShowGrantAllowance(false) }} />
        </>
      )}
    </div>
  )
}

export default Wallet
