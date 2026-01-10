import { toast } from 'react-hot-toast'

const CreateMarket = () => {
  // const navigate = useNavigate()

  // const { signerZero } = useAppContext()
  
  // useEffect(() => {
  //   console.log('signerZero', signerZero)
  //   if (!signerZero) {

  //     toast.error('Please connect your wallet to create a market.')
  //     navigate(-1)
  //   }
  // }, [])

  return (
    <>
      Create Market


      <button onClick={() => {
        toast('This is a test toast', { icon: '👏' })
      }}>Hello</button>

      {
        /*
        A form to create a new market
        calls api.CreateMarket 
        message NewMarketRequest {market_id, net, statement, image_url }

        I want a nicely styled form with labels and placeholders to do this
        use tailwindccss for styling
        use already defined components where possible
        use css styling (tailwindscss) from index.css as much as possible
        */
      }


    </>
  )
}

export default CreateMarket
