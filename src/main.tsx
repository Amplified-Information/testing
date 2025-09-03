import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Buffer } from 'buffer'
import process from 'process'

// Setup Node.js polyfills for HashConnect
window.Buffer = Buffer
window.process = process
window.global = window

createRoot(document.getElementById("root")!).render(<App />);
