import './shim-buffer'
// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter } from 'react-router'
import AppProvider from './AppProvider'
import DustParticles from './components/DustParticles'
import Routes from './components/Routes'
import Header from './components/Header'
import { Toaster } from 'react-hot-toast'
import MacroMetadata from './components/MacroMetadata'

import './i18n/i18n'

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <BrowserRouter basename="/"> {/* also see vite.config.ts */}
      <AppProvider>
        <MacroMetadata />
        <Header />
        <Routes />

        <Toaster
          position="bottom-right"
          reverseOrder={false}
        />
        <DustParticles />
      </AppProvider>
    </BrowserRouter>
  // </StrictMode>
)
