const ButtonAmount = ({ value = 0, max=0, onChange }: {value: number, max: number, onChange: (value: number) => void }) => {
  return (
    <>
    <input 
      className='border border-gray-300 rounded px-3 py-2 w-24'
      type="number"
      min={0.0}
      max={max}
      value={value}
      onChange={(e) => { onChange(Number(e.target.value)) }} />
      {[1, 5, 10].map((v) => {
        return (
          <button className='ml-2 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border' key={v}
            onClick={() => {
              if ((value + v) >= max) {
                onChange(max)
              } else {
                onChange(value + v)
              }
            }}>${v}</button>
        )
      })}
    </>
  )
}

export default ButtonAmount
