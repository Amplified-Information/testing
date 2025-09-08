import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Buffer } from 'buffer'
import process from 'process'
import { initWalletConnectFixes } from './utils/walletConnectFixes'

// Initialize WalletConnect DataCloneError fixes before app starts
initWalletConnectFixes();

// Add early error suppression for WalletConnect
window.addEventListener('error', (event) => {
  if (event.error?.name === 'DataCloneError' && event.error?.message?.includes('URL object could not be cloned')) {
    console.warn('Early DataCloneError suppressed:', event.error.message);
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
}, true); // Use capture phase to catch early

window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.name === 'DataCloneError' && event.reason?.message?.includes('URL object could not be cloned')) {
    console.warn('Early DataCloneError promise rejection suppressed:', event.reason.message);
    event.preventDefault();
    return false;
  }
}, true);

// Setup Node.js polyfills for HashConnect compatibility
window.global = window;
window.Buffer = Buffer;
window.process = process;

createRoot(document.getElementById("root")!).render(<App />);
