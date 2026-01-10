import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import Wallet from './Wallet'
import logo from '../img/prism.png'
import { useAppContext } from '../AppProvider'
import NetworkSelector from './NetworkSelector'
import Allowance from './Allowance'
import SelectLang from './SelectLang'

const Header = () => {
  const { networkSelected, smartContractIds, signerZero } = useAppContext()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  // Close menu on Escape key
  useEffect(() => {
    if (!menuOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    };
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [menuOpen])
  
  return (
    <div className="relative">
      <header className="header" style={{ borderColor: `${networkSelected.isTestnet() ? 'orange' : networkSelected.isPreviewnet() ? 'purple' : ''}` }}>
        {/* Logo on the left */}
        <div className="logo-container" onClick={() => navigate('/')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img src={logo} alt="Prism Logo" />
            <h1 style={{ margin: 0 }}>
              &nbsp;Prism<span style={{ color: 'var(--color-text-muted)', marginLeft: '0.1rem' }}>Market</span>
            </h1>
          </div>
          <div style={{ marginTop: '-6px', textAlign: 'center', width: '100%', fontSize: '0.7rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: typeof signerZero === 'undefined' ? 'orange' : 'green',
                    marginRight: 6,
                    boxShadow: typeof signerZero === 'undefined' ? '0 0 6px 2px orange' : '0 0 6px 2px #0f0'
                }}
                ></span>
              <span title={`${typeof signerZero === 'undefined' ? '': 'Connected to'} prism.market smart contract on ${networkSelected.toString()}`}>&nbsp;{ smartContractIds[networkSelected.toString().toLowerCase()] }</span>
            </span>
          </div>
        </div>

        {/* Links + Wallet - desktop */}
        <nav className="desktop-nav">
          <a className="nav-link" onClick={() => navigate('/explore')}>Explore</a>
          <a className="nav-link" onClick={() => navigate('/create')}>Create</a>
          <SelectLang />
          <Wallet />
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
          <nav className="mobile-menu" style={{ zIndex: 1000, position: 'absolute', top: '100%', left: 0, width: '100%' }}>
            
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ margin: '0 auto' }}>
                <Wallet />
              </div>
            </div>

            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <SelectLang />
            </div>
            
            <a href="#" className="mobile-nav-link">Explore</a>
            <a href="#" className="mobile-nav-link">Create</a>
          </nav>
        )}
      </header>

      <div>
        <NetworkSelector />
        <Allowance />
      </div>
    </div>
  )
}

export default Header
