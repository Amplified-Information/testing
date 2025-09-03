import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Force rebuild trigger - comprehensive polyfill
if (typeof global === 'undefined') {
  (window as any).global = window;
}

createRoot(document.getElementById("root")!).render(<App />);
