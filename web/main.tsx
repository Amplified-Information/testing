import './shim-buffer'
import { proto } from '@hashgraph/proto'
// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter } from 'react-router'
import AppProvider from './AppProvider'
import DustParticles from './components/DustParticles'
import Routes from './components/Routes'
import Header from './components/Header'
import Footer from './components/Footer'
import { Toaster } from 'react-hot-toast'
import MacroMetadata from './components/MacroMetadata'

import './i18n/i18n'

console.log(proto) // TODO - remove eventually. Will use `proto` in Signer.tsx. Added here to to avoid tree-shaking of @hashgraph/proto

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <BrowserRouter basename="/"> {/* also see vite.config.ts */}
    <DustParticles />
      <AppProvider>
        <MacroMetadata />
        
        <Header />
        <Routes />
        <Footer />

        <Toaster
          position="bottom-right"
          reverseOrder={false}
        />
        
      </AppProvider>
    </BrowserRouter>
  // </StrictMode>
)
