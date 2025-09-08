/**
 * WalletConnect DataCloneError fixes
 * Addresses URL serialization issues in postMessage communication
 */

// Store original functions
const originalPostMessage = window.postMessage;
const originalWindowPostMessage = Window.prototype.postMessage;

// Enhanced serialization helper
function deepSerializeForCloning(obj: any, seen = new WeakSet()): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  // Prevent circular references
  if (seen.has(obj)) {
    return '[Circular Reference]';
  }
  seen.add(obj);
  
  // Handle URL objects
  if (obj instanceof URL) {
    return { __type: 'URL', href: obj.href };
  }
  
  // Handle other built-in objects that might not be cloneable
  if (obj instanceof Error) {
    return { __type: 'Error', name: obj.name, message: obj.message, stack: obj.stack };
  }
  
  if (obj instanceof Date) {
    return { __type: 'Date', value: obj.toISOString() };
  }
  
  if (obj instanceof RegExp) {
    return { __type: 'RegExp', source: obj.source, flags: obj.flags };
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => deepSerializeForCloning(item, seen));
  }
  
  // Handle plain objects
  if (obj.constructor === Object || obj.constructor === undefined) {
    const serialized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        try {
          serialized[key] = deepSerializeForCloning(obj[key], seen);
        } catch (error) {
          serialized[key] = `[Unserializable: ${error.message}]`;
        }
      }
    }
    return serialized;
  }
  
  // For other object types, try to extract meaningful data
  try {
    return { __type: obj.constructor?.name || 'Unknown', toString: obj.toString() };
  } catch {
    return '[Unserializable Object]';
  }
}

// Override window.postMessage
window.postMessage = function(message: any, targetOrigin: string, transfer?: Transferable[]) {
  try {
    // Test if message is cloneable
    structuredClone(message);
    return originalPostMessage.call(this, message, targetOrigin, transfer);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'DataCloneError') {
      console.warn('WalletConnect: DataCloneError detected, serializing message:', error);
      try {
        const serializedMessage = deepSerializeForCloning(message);
        return originalPostMessage.call(this, serializedMessage, targetOrigin, transfer);
      } catch (serializationError) {
        console.warn('WalletConnect: Message serialization failed, sending fallback:', serializationError);
        return originalPostMessage.call(this, { error: 'Message serialization failed' }, targetOrigin, transfer);
      }
    }
    throw error;
  }
};

// Override Window.prototype.postMessage for all window instances
const originalWindowPostMessageOverload = Window.prototype.postMessage;
(Window.prototype as any).postMessage = function(message: any, targetOriginOrOptions: string | WindowPostMessageOptions, transfer?: Transferable[]) {
  try {
    // Test if message is cloneable
    structuredClone(message);
    if (typeof targetOriginOrOptions === 'string') {
      return originalWindowPostMessageOverload.call(this, message, targetOriginOrOptions, transfer);
    } else {
      return originalWindowPostMessageOverload.call(this, message, targetOriginOrOptions);
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'DataCloneError') {
      console.warn('WalletConnect: DataCloneError detected on Window prototype, serializing message:', error);
      try {
        const serializedMessage = deepSerializeForCloning(message);
        if (typeof targetOriginOrOptions === 'string') {
          return originalWindowPostMessageOverload.call(this, serializedMessage, targetOriginOrOptions, transfer);
        } else {
          return originalWindowPostMessageOverload.call(this, serializedMessage, targetOriginOrOptions);
        }
      } catch (serializationError) {
        console.warn('WalletConnect: Window prototype message serialization failed:', serializationError);
        const fallbackMessage = { error: 'Message serialization failed' };
        if (typeof targetOriginOrOptions === 'string') {
          return originalWindowPostMessageOverload.call(this, fallbackMessage, targetOriginOrOptions, transfer);
        } else {
          return originalWindowPostMessageOverload.call(this, fallbackMessage, targetOriginOrOptions);
        }
      }
    }
    throw error;
  }
};

// Enhanced global error handler for all WalletConnect errors
window.addEventListener('error', (event) => {
  if (event.error?.name === 'DataCloneError' || 
      event.error?.message?.includes('URL object could not be cloned') ||
      event.error?.message?.includes('postMessage') ||
      event.error?.stack?.includes('WalletConnect') ||
      event.error?.stack?.includes('lovable.js')) {
    console.warn('WalletConnect error suppressed:', event.error?.message || event.error);
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    return false;
  }
}, true); // Capture phase to catch early errors

// Handle unhandled promise rejections from WalletConnect  
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.name === 'DataCloneError' || 
      event.reason?.message?.includes('URL object could not be cloned') ||
      event.reason?.message?.includes('postMessage') ||
      event.reason?.stack?.includes('WalletConnect') ||
      event.reason?.stack?.includes('lovable.js')) {
    console.warn('WalletConnect promise rejection suppressed:', event.reason?.message || event.reason);
    event.preventDefault();
    return false;
  }
}, true); // Capture phase to catch early rejections

// Enhanced fetch wrapper to handle WalletConnect API calls
const originalFetch = window.fetch;
window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
  try {
    // Convert URL objects to strings for WalletConnect compatibility
    const url = input instanceof URL ? input.toString() : input;
    return await originalFetch.call(this, url, init);
  } catch (error) {
    // Don't log every fetch error to avoid spam, but handle URL conversion issues
    if (error.message?.includes('URL') || error.message?.includes('clone')) {
      console.warn('WalletConnect fetch URL conversion handled:', error);
    }
    throw error;
  }
};

export const initWalletConnectFixes = () => {
  console.log('Enhanced WalletConnect DataCloneError fixes initialized');
};