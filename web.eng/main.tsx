// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Main from './components/Routes.tsx'
import Header from './components/Header.tsx'
import { BrowserRouter } from 'react-router'
import AppProvider from './AppProvider.tsx'

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <BrowserRouter basename="/"> {/* also see vite.config.ts */}
      <AppProvider>
        <Header />
        <Main />
      </AppProvider>
    </BrowserRouter>
  // </StrictMode>
)
