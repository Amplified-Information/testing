const Cancel = ({txId}: {txId: string}) => {
  return (
    <button onClick={() => {
      console.log(`cancel txid = ${txId}`)
    }}>X</button>
  )
}

export default Cancel
