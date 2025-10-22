import { Route, Routes as Routing } from 'react-router'
import Home from './Home'

const Routes = () => {
  return (
    <>
      <Routing>
        <Route path='/*' element={<Home />} />
        {/* <Route path='/login' element={<Login />} /> */}
      </Routing>
    </>
  )
}

export default Routes