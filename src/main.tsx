import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Buffer } from 'buffer'
import process from 'process'
import { initWalletConnectFixes } from './utils/walletConnectFixes'

// Initialize WalletConnect DataCloneError fixes before app starts
initWalletConnectFixes();

// Setup Node.js polyfills for HashConnect compatibility
window.global = window;
window.Buffer = Buffer;
window.process = process;

createRoot(document.getElementById("root")!).render(<App />);
