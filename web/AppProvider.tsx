import { createContext, useContext, useState } from 'react'
import { BookSnapshot } from './gen/clob'
import { LedgerId } from '@hiero-ledger/sdk'
import { DAppConnector, DAppSigner } from '@hashgraph/hedera-wallet-connect'
import { MarketResponse } from './gen/api'
import { UserAccountInfo } from './types'

// 1. Define a type for your context
interface AppContextType {
  isLoggedIn: boolean
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>
  networkSelected: LedgerId
  setNetworkSelected: React.Dispatch<React.SetStateAction<LedgerId>>
  dAppConnector: DAppConnector | undefined
  networksAvailable: LedgerId[]
  setNetworksAvailable: React.Dispatch<React.SetStateAction<LedgerId[]>>
  setDappConnector: React.Dispatch<React.SetStateAction<DAppConnector | undefined>>
  signerZero: DAppSigner | undefined
  setSignerZero: React.Dispatch<React.SetStateAction<DAppSigner | undefined>>
  isToggled: boolean[]
  setIsToggled: React.Dispatch<React.SetStateAction<boolean[]>>
  book: BookSnapshot
  setBook: React.Dispatch<React.SetStateAction<BookSnapshot>>
  spenderAllowanceUsd: number
  setSpenderAllowanceUsd: React.Dispatch<React.SetStateAction<number>>
  market: MarketResponse | undefined
  setMarket: React.Dispatch<React.SetStateAction<MarketResponse | undefined>>
  userAccountInfo: UserAccountInfo | undefined
  setUserAccountInfo: React.Dispatch<React.SetStateAction<UserAccountInfo | undefined>>
}

// 2. Create the context with `undefined` (so we can inject real values later)
const AppContext = createContext<AppContextType | undefined>(undefined)

const useAppContext = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppProvider')
  return ctx
}

// 3. Build the provider with real state
const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [networkSelected, setNetworkSelected] = useState<LedgerId>(LedgerId.TESTNET)
  const [networksAvailable, setNetworksAvailable] = useState<LedgerId[]>([])
  const [dAppConnector, setDappConnector] = useState<DAppConnector | undefined>(undefined)
  const [signerZero, setSignerZero] = useState<DAppSigner | undefined>(undefined)
  const [isToggled, setIsToggled] = useState<boolean[]>(Array(4).fill(false))
  const [book, setBook] = useState<BookSnapshot>({ bids: [], asks: [] })
  const [spenderAllowanceUsd, setSpenderAllowanceUsd] = useState<number>(0)
  const [market, setMarket] = useState<MarketResponse | undefined>(undefined)
  const [userAccountInfo, setUserAccountInfo] = useState<UserAccountInfo | undefined>(undefined)
  return (
    <AppContext.Provider
      value={{
        isLoggedIn,
        setIsLoggedIn,
        networkSelected,
        setNetworkSelected,
        networksAvailable,
        setNetworksAvailable,
        dAppConnector,
        setDappConnector,
        signerZero,
        setSignerZero,
        isToggled,
        setIsToggled,
        book,
        setBook,
        spenderAllowanceUsd,
        setSpenderAllowanceUsd,
        market,
        setMarket,
        userAccountInfo,
        setUserAccountInfo
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export default AppProvider

export {
  useAppContext
}