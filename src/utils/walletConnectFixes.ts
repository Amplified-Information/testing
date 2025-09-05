/**
 * WalletConnect DataCloneError fixes
 * Addresses URL serialization issues in postMessage communication
 */

// Override window.postMessage to handle URL objects safely
const originalPostMessage = window.postMessage;

window.postMessage = function(message: any, targetOrigin: string, transfer?: Transferable[]) {
  try {
    // Check if message contains URL objects that need serialization
    const serializedMessage = JSON.parse(JSON.stringify(message, (key, value) => {
      // Convert URL objects to strings to avoid DataCloneError
      if (value instanceof URL) {
        return value.toString();
      }
      // Handle other non-cloneable objects
      if (value && typeof value === 'object' && value.constructor?.name === 'URL') {
        return value.toString();
      }
      return value;
    }));
    
    return originalPostMessage.call(this, serializedMessage, targetOrigin, transfer);
  } catch (error) {
    // If serialization fails, try with original message
    console.warn('WalletConnect postMessage serialization failed, falling back:', error);
    try {
      return originalPostMessage.call(this, message, targetOrigin, transfer);
    } catch (fallbackError) {
      console.error('WalletConnect postMessage completely failed:', fallbackError);
      // Silently fail to prevent breaking the app
      return;
    }
  }
};

// Add global error handler for unhandled DataCloneErrors
window.addEventListener('error', (event) => {
  if (event.error?.name === 'DataCloneError' && event.error?.message?.includes('postMessage')) {
    console.warn('Caught DataCloneError in WalletConnect, preventing app crash:', event.error);
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
});

// Enhanced fetch wrapper to handle WalletConnect API calls
const originalFetch = window.fetch;
window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
  try {
    // Convert URL objects to strings for WalletConnect compatibility
    const url = input instanceof URL ? input.toString() : input;
    return await originalFetch.call(this, url, init);
  } catch (error) {
    console.warn('WalletConnect fetch error handled:', error);
    throw error;
  }
};

export const initWalletConnectFixes = () => {
  console.log('WalletConnect DataCloneError fixes initialized');
};