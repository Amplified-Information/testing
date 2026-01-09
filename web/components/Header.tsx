import { useState } from 'react'
import { useNavigate } from 'react-router'
import logo from '../img/prism.png'
import { useAppContext } from '../AppProvider'
import { LedgerId } from '@hiero-ledger/sdk'
import { smartContractId } from '../constants'

const Header = () => {
  const { networkSelected } = useAppContext()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  
  return (
    <header className="header">
      {/* Logo on the left */}
      <div className="logo-container" onClick={() => navigate('/')}> 
        <img src={logo} alt="Prism Logo" />
        <h1>
        &nbsp;Prism<span style={{ color: 'var(--color-text-muted)', marginLeft: '0.1rem' }}>Market</span>
        </h1>
      </div>

      {/* Links + Wallet - desktop */}
      <nav className="desktop-nav">
        <a href="#" className="nav-link">Explore</a>
        <a href="#" className="nav-link">Create</a>
        <button className="btn-primary">
          Connect Wallet
        </button>
      </nav>

      {/* Hamburger button - mobile */}
      <button 
        className="hamburger-btn"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {menuOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="mobile-menu">
          <button className="btn-primary">
            Connect Wallet
          </button>
          <a href="#" className="mobile-nav-link">Explore</a>
          <a href="#" className="mobile-nav-link">Create</a>
        </nav>
      )}
    </header>
  )
}

export default Header
