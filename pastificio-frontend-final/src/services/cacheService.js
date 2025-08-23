// src/services/cacheService.js
export const CacheService = {
  getFromCache: () => {
    try {
      const cached = localStorage.getItem('ordini');
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      console.error('Errore nel recupero dalla cache:', e);
      return [];
    }
  },
  saveToCache: (ordini) => {
    try {
      localStorage.setItem('ordini', JSON.stringify(ordini));
    } catch (e) {
      console.error('Errore nel salvataggio in cache:', e);
    }
  },
  addPendingChange: (change) => {
    try {
      const pendingChanges = JSON.parse(localStorage.getItem('pendingChanges') || '[]');
      pendingChanges.push(change);
      localStorage.setItem('pendingChanges', JSON.stringify(pendingChanges));
    } catch (e) {
      console.error('Errore nell\'aggiunta di pending change:', e);
    }
  },
  getPendingChanges: () => {
    try {
      const pendingChanges = localStorage.getItem('pendingChanges');
      return pendingChanges ? JSON.parse(pendingChanges) : [];
    } catch (e) {
      console.error('Errore nel recupero dei cambiamenti pendenti:', e);
      return [];
    }
  },
  clearPendingChanges: () => {
    try {
      localStorage.removeItem('pendingChanges');
      localStorage.setItem('lastSyncTime', new Date().toISOString());
    } catch (e) {
      console.error('Errore nella pulizia dei cambiamenti pendenti:', e);
    }
  }
};