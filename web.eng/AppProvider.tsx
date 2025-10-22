import { createContext, useContext, useState } from 'react'
import { BookSnapshot } from './gen/clob'
import { LedgerId } from '@hashgraph/sdk'
import { DAppConnector } from '@hashgraph/hedera-wallet-connect'

// 1. Define a type for your context
interface AppContextType {
  isLoggedIn: boolean
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>
  networkSelected: LedgerId
  setNetworkSelected: React.Dispatch<React.SetStateAction<LedgerId>>
  dAppConnector: DAppConnector | undefined
  setDappConnector: React.Dispatch<React.SetStateAction<DAppConnector | undefined>>
  isToggled: boolean[]
  setIsToggled: React.Dispatch<React.SetStateAction<boolean[]>>
  book: BookSnapshot
  setBook: React.Dispatch<React.SetStateAction<BookSnapshot>>
  spenderAllowance: number
  setSpenderAllowance: React.Dispatch<React.SetStateAction<number>>
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
  const [dAppConnector, setDappConnector] = useState<DAppConnector | undefined>(undefined)
  const [isToggled, setIsToggled] = useState<boolean[]>(Array(4).fill(false))
  const [book, setBook] = useState<BookSnapshot>({ bids: [], asks: [] })
  const [spenderAllowance, setSpenderAllowance] = useState<number>(0)

  return (
    <AppContext.Provider
      value={{
        isLoggedIn,
        setIsLoggedIn,
        networkSelected,
        setNetworkSelected,
        dAppConnector,
        setDappConnector,
        isToggled,
        setIsToggled,
        book,
        setBook,
        spenderAllowance,
        setSpenderAllowance
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