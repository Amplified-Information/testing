import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAppContext } from '../AppProvider'
import { grantAllowanceUsd } from '../lib/hedera'
import ButtonAmount from './ButtonAmount'

const GrantAllowance = ({ open, onClose }: { open: boolean, onClose: () => void }) => {
  const [ amountUsd, setAmountUsd ] = useState<number>(0)
  const { signerZero, spenderAllowanceUsd, setSpenderAllowanceUsd, smartContractIds, networkSelected } = useAppContext()
  const [ thinger, setThinger ] = useState(false)
  const [ smartContractId, setSmartContractId ] = useState<string>('')

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    setSmartContractId(smartContractIds[networkSelected.toString().toLowerCase()] || '')
  }, [smartContractIds, networkSelected])

  if (!open) return null
  return createPortal(
    <div className='fixed inset-0 z-50 flex items-center justify-center'>
      <div className='absolute inset-0 bg-black/50' onClick={onClose} />
      <div className='relative bg-white rounded-lg shadow-lg p-6 max-w-lg w-full z-10'>
        <h2>Grant allowance</h2>

        <code>{smartContractId}</code> is requesting an allowance.
        <br />
        <br />


        <div className="mt-3 text-sm text-gray-600">
          <div className="space-2">
            <div className="flex justify-between">
              <span>Current allowance granted to {smartContractId}</span>
              <span>${spenderAllowanceUsd.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Add this amount</span>
              <span>${amountUsd.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>New allowance</span>
              <span>${(amountUsd + spenderAllowanceUsd).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <br />


        {/* <label className="block text-sm font-medium text-gray-700 mb-2">Amount (USD)</label> */}
        {/* <ButtonAmount 
          value={amount}
          onChange={(v) => setAmount(v)}
          quickButtons={[1, 5, 10]}
          min={0}
          max={1_000_000}
          showConfirm
          onConfirm={(amount) => alert('Confirming $' + amount)}
        /> */}

        <span>
          <label className="block text-sm font-medium text-gray-700 mb-2">Amount (USD)</label>
          <ButtonAmount value={amountUsd} onChange={(currentValue) => {
            setAmountUsd(currentValue)
          }} max={spenderAllowanceUsd} />
        </span>

        <div className="flex justify-end">
          <button className='btn red' disabled={thinger} onClick={async () => {
            setThinger(true)
            const wasSuccessful = await grantAllowanceUsd(signerZero!, smartContractId, 0)
            if (wasSuccessful) {
              setSpenderAllowanceUsd(0)
              onClose()
            }
            setThinger(false)
          }}>Remove Allowance</button>
          &nbsp;
          <button className='btn' disabled={thinger} onClick={async () => {
            setThinger(true)
            const wasSuccessful = await grantAllowanceUsd(signerZero!, smartContractId, spenderAllowanceUsd + amountUsd)
            if (wasSuccessful) {
              setSpenderAllowanceUsd(spenderAllowanceUsd + amountUsd)
              onClose()
            }
            setThinger(false)
          }}>Grant Allowance</button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default GrantAllowance
