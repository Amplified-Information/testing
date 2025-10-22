import { DAppConnector, HederaChainId, HederaJsonRpcMethod, HederaSessionEvent } from "@hashgraph/hedera-wallet-connect"
import { walletConnectProjectId, walletMetaData } from "../constants"
import { LedgerId } from "@hashgraph/sdk"



// const initWallet = async (networkSelected: LedgerId) => {
//   try {
//     dAppConnector.init({ logger: 'error' })
//     if (!dAppConnector) throw new Error('dAppConnector not initialised')
//     // if (!dAppConnector.walletConnectClient) throw new Error('dAppConnector.walletConnectClient not available')



//     // console.log('dAppConnector extensions:', dAppConnector.extensions)
//     // dAppConnector.walletConnectClient?.on('session_connect', (session: any) => {
//     //   console.log('session_connect', session)
//     // })
//     // dAppConnector.walletConnectClient?.on('session_request', (session: any) => {
//     //   console.log('session_request', session)
//     // })
//     // dAppConnector.walletConnectClient?.on('session_request_sent', (session: any) => {
//     //   console.log('session_request_sent', session)
//     // })
//     // dAppConnector.walletConnectClient?.on('session_expire', (session: any) => {
//     //   console.log('session_expire', session)
//     // })
//     // dAppConnector.walletConnectClient?.on('session_delete', (session: any) => {
//     //   console.log('session_delete', session)
//     // })
//   } catch (error) {
//     console.error('**Error calling initWallet: ', error)
//   }
// }


// dAppConnector.on('session_connected', async (session: any) => {
//   console.log('DAppConnector session connected:', session)
// })

export {
  // dAppConnector,
  // initWallet
}


// import { HederaAdapter, HederaChainDefinition, hederaNamespace } from '@hashgraph/hedera-wallet-connect'
// import { createAppKit } from '@reown/appkit'
// import { walletConnectProjectId } from '../constants'

// const metadata = {
//   name: 'AppKit w/ Hedera',
//   description: 'Hedera AppKit Example',
//   url: 'http://localhost:5173', // origin must match your domain & subdomain
//   icons: ['https://avatars.githubusercontent.com/u/179229932']
// }

// const hederaEVMAdapter = new HederaAdapter({
//   walletConnectProjectId,
//   networks: [
//     HederaChainDefinition.EVM.Mainnet,
//     HederaChainDefinition.EVM.Testnet
// ],
//   namespace: 'eip155',
// })

// const hederaNativeAdapter = new HederaAdapter({
//   projectId: walletConnectProjectId,
//   networks: [HederaChainDefinition.Native.Mainnet, HederaChainDefinition.Native.Testnet],
//   namespace: hederaNamespace, // 'hedera' as CaipNamespace,
// })

// const initWallet = async () => {
//   createAppKit({
//     //@ts-expect-error expected type error
//     adapters: [hederaEVMAdapter, hederaNativeAdapter],
//     projectId: walletConnectProjectId,
//     metadata,
//     networks: [
//       // EVM
//       HederaChainDefinition.EVM.Mainnet,
//       HederaChainDefinition.EVM.Testnet,
//       // Native
//       HederaChainDefinition.Native.Mainnet,
//       HederaChainDefinition.Native.Testnet,
//     ],
//   })
// }

// export {
//   initWallet
// }
// import type UniversalProvider from '@walletconnect/universal-provider'
// import { createAppKit } from '@reown/appkit'
// import { walletConnectProjectId, walletMetaData } from '../constants'

// import {
//   HederaProvider,
//   HederaAdapter,
//   HederaChainDefinition,
//   hederaNamespace,
// } from '@hashgraph/hedera-wallet-connect'

// const metadata = {
//   name: 'AppKit w/ Hedera',
//   description: 'Hedera AppKit Example',
//   url: 'http://localhost:5173', // origin must match your domain & subdomain
//   icons: ['https://avatars.githubusercontent.com/u/179229932']
// }

// const hederaEVMAdapter = new HederaAdapter({
//   walletConnectProjectId,
//   networks: [
//     HederaChainDefinition.EVM.Mainnet,
//     HederaChainDefinition.EVM.Testnet
// ],
//   namespace: 'eip155',
// })

// const universalProvider = (await HederaProvider.init({
//   projectId: walletConnectProjectId,
//   metadata,
// })) as unknown as UniversalProvider // avoid type mismatch error due to missing of private properties in HederaProvider

// createAppKit({
//   //@ts-expect-error expected type error
//   adapters: [ hederaEVMAdapter ],
//   //@ts-expect-error expected type error
//   universalProvider,
//   walletConnectProjectId,
//   metadata,
//   networks: [
//     // EVM
//     HederaChainDefinition.EVM.Mainnet,
//     HederaChainDefinition.EVM.Testnet,
//   ],
// })


