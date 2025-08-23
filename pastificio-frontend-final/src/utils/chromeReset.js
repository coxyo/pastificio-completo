// src/utils/chromeReset.js
export const resetChromeLoop = () => {
  if (typeof window !== 'undefined') {
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    
    if (isChrome) {
      // Pulisci TUTTI i dati di reload/refresh
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('reload') || key.includes('Reload') || key.includes('refresh'))) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Pulisci anche sessionStorage
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('reload') || key.includes('Reload') || key.includes('refresh'))) {
          sessionStorage.removeItem(key);
        }
      }
      
      // Aggiungi flag di protezione
      sessionStorage.setItem('chromeProtection', 'active');
    }
  }
};

export const isChromeSafe = () => {
  return sessionStorage.getItem('chromeProtection') === 'active';
};