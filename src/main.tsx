import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Buffer } from 'buffer'
import process from 'process'
import { initWalletConnectFixes } from './utils/walletConnectFixes'

// Initialize WalletConnect DataCloneError fixes before app starts
initWalletConnectFixes();

// Comprehensive early error suppression for WalletConnect
const suppressWalletConnectError = (error: any) => {
  return error?.name === 'DataCloneError' || 
         error?.message?.includes('URL object could not be cloned') ||
         error?.message?.includes('postMessage') ||
         error?.stack?.includes('WalletConnect') ||
         error?.stack?.includes('lovable.js') ||
         error?.stack?.includes('fetchListings') ||
         error?.stack?.includes('getRecomendedWallets');
};

window.addEventListener('error', (event) => {
  if (suppressWalletConnectError(event.error)) {
    console.warn('WalletConnect error suppressed (main):', event.error?.message || 'Unknown error');
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    return false;
  }
}, true);

window.addEventListener('unhandledrejection', (event) => {
  if (suppressWalletConnectError(event.reason)) {
    console.warn('WalletConnect promise rejection suppressed (main):', event.reason?.message || 'Unknown rejection');
    event.preventDefault();
    return false;
  }
}, true);

// Setup Node.js polyfills for HashConnect compatibility
window.global = window;
window.Buffer = Buffer;
window.process = process;

createRoot(document.getElementById("root")!).render(<App />);
