import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Polyfill for HashConnect library
if (typeof global === 'undefined') {
  (window as any).global = window;
}

console.log('Main.tsx loading...');

try {
  const root = createRoot(document.getElementById("root")!);
  console.log('Root created, rendering App...');
  root.render(<App />);
  console.log('App rendered successfully');
} catch (error) {
  console.error('Error in main.tsx:', error);
}
