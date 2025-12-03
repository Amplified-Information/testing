import { LedgerId } from '@hashgraph/sdk'
import { useAppContext } from '../AppProvider'
import Wallet from './Wallet'
import Positions from './Positions'
import { smartContractId } from '../constants'
import { useNavigate } from 'react-router'

const Header = () => {
  const { networkSelected } = useAppContext()
  const navigate = useNavigate()

  return (
    <header className={`cursor-pointer ${networkSelected === LedgerId.TESTNET ? 'bg-orange-300' : networkSelected === LedgerId.PREVIEWNET ? 'bg-purple-300' : 'bg-green-400'} flex items-center justify-between px-4 py-2 border-b border-gray-200`}>
      <div className="flex items-center gap-2" onClick={() => {
        navigate('/')
      }}>
        <img src='../img/logo.svg' />
        <span className="font-semibold">Predict</span>
        
      </div>

      
      <Positions />

      <span>
        smart contract Id: <b>{smartContractId}</b>
      </span>

      <div>
        <Wallet />
      </div>
    </header>
  )
}

export default Header
