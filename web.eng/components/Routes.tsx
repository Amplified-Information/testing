import { Route, Routes as Routing } from 'react-router'
import Home from './Home'
import Market from './Market'
import Admin from './Admin'

const Routes = () => {
  return (
    <>
      <Routing>
        <Route path='/*' element={<Home />} />
        <Route path='/market/:marketId' element={<Market />} />
         <Route path='/admin' element={<Admin />} />
        {/* <Route path='/login' element={<Login />} /> */}
      </Routing>
    </>
  )
}

export default Routes