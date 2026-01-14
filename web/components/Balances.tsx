import { useEffect, useState } from 'react'
import { useAppContext } from '../AppProvider'
import { getSpenderAllowanceUsd, getTokenBalance } from '../lib/hedera'
import { formatNumberShort } from '../lib/utils'

const Balances = () => {
  const { smartContractIds, usdcTokenIds, spenderAllowanceUsd, setSpenderAllowanceUsd, networkSelected, signerZero, setShowPopupAllowance, tokenIds } = useAppContext()
  const [prsmBalance, setPrsmBalance] =  useState<number>(0)

  useEffect(() => {
    const fetchPrsmBalance = async () => {
      if (!signerZero) return
      const prsmTokenId = tokenIds[networkSelected.toString().toLowerCase()]
      if (!prsmTokenId) {
        console.warn('PRSM token ID not found for network:', networkSelected.toString())
        return
      } 
      const balance = await getTokenBalance(networkSelected, prsmTokenId, signerZero.getAccountId().toString())
      setPrsmBalance(balance)
    }
    fetchPrsmBalance()
  }, [signerZero, networkSelected, tokenIds])

  const updateSpenderAllowance = async () => {
    if (Object.keys(smartContractIds).length === 0) {
      console.warn('smartContractIds not set yet, cannot fetch allowance')
      return
    }
     if (Object.keys(usdcTokenIds).length === 0) {
      console.warn('usdcTokenIds not set yet, cannot fetch allowance')
      return
    }

    console.log('***', networkSelected, '***', usdcTokenIds, '***', smartContractIds)

    try {
      const _spenderAllowance = await getSpenderAllowanceUsd(networkSelected, usdcTokenIds, smartContractIds[networkSelected.toString().toLowerCase()], signerZero!.getAccountId().toString())
      setSpenderAllowanceUsd(_spenderAllowance)
    } catch (error) {
      console.error('Error updating spender allowance:', error)
    }
  }

  useEffect(() => {
    ;(async () => {
      await updateSpenderAllowance()
    })()
  }, [signerZero, networkSelected, smartContractIds, usdcTokenIds])

  
  if (signerZero === undefined) {
    return <></>
  }

  return (
    <div className="flex items-center justify-center -mt-1">
    {/* <div className="px-4 md:px-8 lg:px-24"> */}
      <div>
    {/* <div className="absolute left-0 top-full z-20    px-4 md:px-8 lg:px-24">
      <div className="relative inline-block"> */}
        <span className="inline-block px-2 py-2 rounded-b-md text-white text-xs shadow border border-t-0 border-gray-500 cursor-pointer" >
          
          
          <span 
            title='Your current balance in USD' 
            onClick={ () => { setShowPopupAllowance(true) }}
          >
            balance: <a className='text-blue-500 cursor-pointer'>
              ${spenderAllowanceUsd.toFixed(2)}
            </a>
          </span>

          &nbsp;&nbsp;|&nbsp;&nbsp;
          <span 
            title='The USD value if you sold all your positions at their current market prices'
          >
            liquidated value: <a className='text-blue-500 cursor-pointer'>
              {/* TODO */}
              ${0.00}
            </a>
          </span>

          &nbsp;&nbsp;|&nbsp;&nbsp;
          <span 
            title='PRSM balance'
          >
            <a className='text-blue-500'>
              {formatNumberShort(prsmBalance)} PRSM
            </a>
          </span>

          &nbsp;&nbsp;|&nbsp;&nbsp;
          <span 
            title='Frozen PRSM - PRSM that is not yet allocated to you'
          >
            PRSM 🧊: <a className='text-blue-500 cursor-pointer'>
              {/* TODO */}
              {0.00}
            </a>
            </span>
        </span>
      </div>            
    </div>
  )
}

export default Balances