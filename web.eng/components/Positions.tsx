import { useEffect, useState } from 'react'
import { Position } from '../types'
import { getAllPositions } from '../lib/hedera'
import { useAppContext } from '../AppProvider'

const Positions = () => {
  const [positions, setPositions] = useState<Position[]>([])
  const { signerZero } = useAppContext()

  useEffect(() => {
    ;(async () => {
      if (!signerZero) return
      const _positions = await getAllPositions(signerZero!.getAccountId())
      console.log(`current positions: ${_positions}`)
      setPositions(_positions)
    })()
  }, [signerZero])

  return (
    <div className={''}>
      {
        positions.map((position) => (
          <div key={position.market_id} className={'inline-block mx-2'}>
            <span className={'font-semibold'}>Market {position.market_id}:</span> Yes: {position.yes} | No: {position.no}
          </div>
        ))
      }
    </div>
  )
}

export default Positions
