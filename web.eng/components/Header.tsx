import { useAppContext } from '../AppProvider'
import { networksAvailable } from '../constants'
import Wallet from './Wallet'

const Header = () => {
  const { isLoggedIn, setIsLoggedIn, networkSelected } = useAppContext()
  const { dAppConnector } = useAppContext()

  return (
    <header className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
      <div className="flex items-center gap-2">
        <img src='../img/logo.svg' />
        <span className="font-semibold">Predict</span>
      </div>
      
      <Wallet />
    </header>
  )
}

export default Header
