const CancelOrder = ({txId}: {txId: string}) => {
  return (
    <button onClick={() => {
      console.log(`cancel txid = ${txId}`)
      // API call - db log
    }}>X</button>
  )
}

export default CancelOrder
