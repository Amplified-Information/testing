import './shim-buffer'
// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Routes from './components/Routes'
import Header from './components/Header'
import { BrowserRouter } from 'react-router'
import AppProvider from './AppProvider'
import DustParticles from './components/DustParticles'

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <BrowserRouter basename="/"> {/* also see vite.config.ts */}
      <AppProvider>
        
        <Header />
        <Routes />
        <DustParticles />
      </AppProvider>
    </BrowserRouter>
  // </StrictMode>
)
