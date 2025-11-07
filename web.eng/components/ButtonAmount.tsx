import React, { useEffect, useMemo, useState } from 'react'

// export type PolymarketAmountPickerProps = {
//   /** value in dollars (number) */
//   value?: number
//   onChange?: (value: number) => void
//   /** quick add buttons in dollars */
//   quickButtons?: number[]
//   min?: number
//   max?: number
//   /** placeholder text for the input */
//   placeholder?: string
//   disabled?: boolean
//   /** HTML name attribute for the input */
//   name?: string
//   /** show a confirm / set button (optional) */
//   showConfirm?: boolean
//   /** callback when confirm pressed (if showConfirm) */
//   onConfirm?: (value: number) => void
// }


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
            onClick={(e) => {
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

// const ButtonAmount =({
//   value = 0,
//   onChange,
//   quickButtons = [1, 20, 100],
//   min = 0,
//   max = 1000000,
//   placeholder = "Enter amount",
//   disabled = false,
//   name,
//   showConfirm = false,
//   onConfirm,
// }: PolymarketAmountPickerProps) => {
//   // store internal state in cents (integer)
//   const toCents = (d: number) => Math.round(d * 100)
//   const fromCents = (c: number) => c / 100

//   const [cents, setCents] = useState<number>(() => toCents(value))
//   const [inputText, setInputText] = useState<string>(() => (value ? String(value) : ""))

//   // keep internal state synced if parent changes value
//   useEffect(() => {
//     setCents(toCents(value))
//     setInputText(value ? String(value) : "")
//   }, [value])

//   // formatted display
//   const formatter = useMemo(
//     () => new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 }), []
//   )

//   const clampCents = (c: number) => {
//     const minC = toCents(min)
//     const maxC = toCents(max)
//     return Math.min(Math.max(c, minC), maxC)
//   }

//   const publish = (newCents: number) => {
//     const clamped = clampCents(newCents)
//     setCents(clamped)
//     setInputText(String(fromCents(clamped)))
//     onChange?.(fromCents(clamped))
//   }

//   const handleQuickAdd = (amountDollars: number) => {
//     if (disabled) return;
//     publish(cents + toCents(amountDollars))
//   }

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const t = e.target.value
//     setInputText(t)

//     // try to parse a number; allow empty
//     if (t.trim() === "") {
//       publish(0)
//       return
//     }

//     // remove commas, $ and spaces
//     const cleaned = t.replace(/[$,\s]/g, "")
//     const n = Number(cleaned)
//     if (!Number.isFinite(n)) return // ignore invalid chars
//     publish(n)
//   }

//   const handleBlur = () => {
//     // ensure inputText reflects properly formatted value
//     setInputText(String(fromCents(clampCents(cents))))
//   }

//   const handleClear = () => {
//     if (disabled) return
//     publish(0)
//   }

//   const handleConfirm = () => {
//     if (onConfirm) onConfirm(fromCents(cents))
//   }

//   return (
//     <div className="w-full max-w-md">
//       <div className="flex items-center gap-2">
//         <input
//           name={name}
//           className={`flex-1 p-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"`}
//           value={inputText}
//           onChange={handleInputChange}
//           onBlur={handleBlur}
//           placeholder={placeholder}
//           inputMode="decimal"
//           disabled={disabled}
//         />
//         <div className="flex flex-col gap-2">
//           <div className="flex gap-2">
//             {quickButtons.map((b) => (
//               <button
//                 key={b}
//                 type="button"
//                 onClick={() => handleQuickAdd(b)}
//                 disabled={disabled}
//                 aria-label={`Add $${b}`}
//                 className="px-3 py-1 rounded-md border bg-white hover:shadow-sm disabled:opacity-60"
//               >
//                 +${b}
//               </button>
//             ))}
//           </div>
//           <div className="flex gap-2">
//             <button
//               type="button"
//               onClick={handleClear}
//               disabled={disabled}
//               className="px-3 py-1 rounded-md border bg-white hover:shadow-sm disabled:opacity-60"
//             >
//               Clear
//             </button>
//             {showConfirm && (
//               <button
//                 type="button"
//                 onClick={handleConfirm}
//                 disabled={disabled}
//                 className="px-3 py-1 rounded-md border bg-indigo-600 text-white hover:brightness-95 disabled:opacity-60"
//               >
//                 Set
//               </button>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default ButtonAmount
