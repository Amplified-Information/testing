import { LedgerId } from '@hashgraph/sdk'
import { useAppContext } from '../AppProvider'
import Wallet from './Wallet'
import Positions from './Positions'

const Header = () => {
  const { networkSelected } = useAppContext()

  return (
    <header className={`${networkSelected === LedgerId.TESTNET ? 'bg-orange-300' : networkSelected === LedgerId.PREVIEWNET ? 'bg-purple-300' : 'bg-green-400'} flex items-center justify-between px-4 py-2 border-b border-gray-200`}>
      <div className="flex items-center gap-2">
        <img src='../img/logo.svg' />
        <span className="font-semibold">Predict</span>
      </div>

      
      <Positions />
      
      <div>
        <Wallet />
      </div>
    </header>
  )
}

export default Header
