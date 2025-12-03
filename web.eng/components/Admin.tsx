import { useState } from 'react'
import { apiClient } from '../grpcClient'
import { v7 as uuidv7 } from 'uuid'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router'

const Admin = () => {
  const [statement, setStatement] = useState<string>('')
  const [ marketId ] = useState<string>(uuidv7())
  const navigate = useNavigate()
  return (
    <div style={{ padding: '0 15%' }}>
      <br/>
      <h2>Create a new market</h2>
      marketId: <input className={'input'} style={{ width: '100%' }} type='text' placeholder='marketId' value={marketId} readOnly />
      <br/>
      <br/>
      statement: <input className={'input'} style={{ width: '100%' }} type='text' placeholder='statement' value={statement} onChange={(e) => setStatement(e.target.value)} />
      <br/>
      <br/>
      <button className='btn' onClick={async () => {
        try {
          const result = await apiClient.createMarket({
            marketId,
            statement
          })
          console.log(result.response)

          
          toast.success('Market created successfully!')
          setTimeout(() => {
            navigate('/')
          }, 3000)
        } catch (err) {
          console.error('Error creating market:', err)
        }
      }}>Create Market</button>
    </div>
  )
}

export default Admin
