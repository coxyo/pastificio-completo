// src/services/cacheService.js
// ✅ VERSIONE CON GESTIONE CACHE MIGLIORATA
// Data: 22 Gennaio 2026

export const CacheService = {
  // ═══════════════════════════════════════════════════════════════════════════
  // 🔄 GESTIONE ORDINI
  // ═══════════════════════════════════════════════════════════════════════════
  getFromCache: () => {
    try {
      const cached = localStorage.getItem('ordini');
      const timestamp = localStorage.getItem('ordini_timestamp');
      
      if (!cached) {
        console.log('💾 Cache ordini: vuota');
        return [];
      }
      
      const ordini = JSON.parse(cached);
      const age = timestamp ? Date.now() - parseInt(timestamp) : Infinity;
      
      console.log(`💾 Cache ordini: ${ordini.length} ordini (età: ${Math.round(age/1000)}s)`);
      
      return ordini;
    } catch (e) {
      console.error('❌ Errore recupero cache:', e);
      return [];
    }
  },
  
  saveToCache: (ordini) => {
    try {
      localStorage.setItem('ordini', JSON.stringify(ordini));
      localStorage.setItem('ordini_timestamp', Date.now().toString());
      console.log(`💾 Cache salvata: ${ordini.length} ordini`);
    } catch (e) {
      console.error('❌ Errore salvataggio cache:', e);
      
      // Se quota superata, pulisci cache vecchia
      if (e.name === 'QuotaExceededError') {
        console.warn('⚠️ Quota localStorage piena, pulizia in corso...');
        CacheService.clearOldCache();
        
        // Riprova
        try {
          localStorage.setItem('ordini', JSON.stringify(ordini));
          localStorage.setItem('ordini_timestamp', Date.now().toString());
          console.log('✅ Cache salvata dopo pulizia');
        } catch (e2) {
          console.error('❌ Impossibile salvare anche dopo pulizia:', e2);
        }
      }
    }
  },
  
  // 🆕 Invalida cache ordini
  invalidateCache: () => {
    try {
      localStorage.removeItem('ordini');
      localStorage.removeItem('ordini_timestamp');
      console.log('🗑️ Cache ordini invalidata');
    } catch (e) {
      console.error('❌ Errore invalidazione cache:', e);
    }
  },
  
  // 🆕 Forza refresh cache
  forceRefresh: async (fetchFunction) => {
    try {
      console.log('🔄 Forza refresh cache...');
      CacheService.invalidateCache();
      
      const data = await fetchFunction();
      CacheService.saveToCache(data);
      
      return data;
    } catch (e) {
      console.error('❌ Errore force refresh:', e);
      throw e;
    }
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 🔄 GESTIONE PENDING CHANGES (modifiche offline)
  // ═══════════════════════════════════════════════════════════════════════════
  addPendingChange: (change) => {
    try {
      const pendingChanges = JSON.parse(localStorage.getItem('pendingChanges') || '[]');
      
      // Aggiungi timestamp se mancante
      if (!change.timestamp) {
        change.timestamp = Date.now();
      }
      
      pendingChanges.push(change);
      localStorage.setItem('pendingChanges', JSON.stringify(pendingChanges));
      
      console.log(`📝 Pending change aggiunto: ${change.type} (totale: ${pendingChanges.length})`);
    } catch (e) {
      console.error('❌ Errore aggiunta pending change:', e);
    }
  },
  
  getPendingChanges: () => {
    try {
      const pendingChanges = localStorage.getItem('pendingChanges');
      return pendingChanges ? JSON.parse(pendingChanges) : [];
    } catch (e) {
      console.error('❌ Errore recupero pending changes:', e);
      return [];
    }
  },
  
  clearPendingChanges: () => {
    try {
      const count = CacheService.getPendingChanges().length;
      localStorage.removeItem('pendingChanges');
      localStorage.setItem('lastSyncTime', new Date().toISOString());
      
      console.log(`✅ ${count} pending changes sincronizzati`);
    } catch (e) {
      console.error('❌ Errore pulizia pending changes:', e);
    }
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 🆕 GESTIONE LIMITI PRODUZIONE (con cache temporizzata)
  // ═══════════════════════════════════════════════════════════════════════════
  getLimitiFromCache: (prodotto, data) => {
    try {
      const cacheKey = `limiti_${prodotto}_${data}`;
      const cached = sessionStorage.getItem(cacheKey);
      const cacheTime = sessionStorage.getItem(`${cacheKey}_time`);
      
      if (!cached || !cacheTime) {
        return null;
      }
      
      const age = Date.now() - parseInt(cacheTime);
      const MAX_AGE = 2 * 60 * 1000; // 2 minuti
      
      if (age > MAX_AGE) {
        console.log(`🗑️ Cache limiti ${prodotto} scaduta (${Math.round(age/1000)}s)`);
        sessionStorage.removeItem(cacheKey);
        sessionStorage.removeItem(`${cacheKey}_time`);
        return null;
      }
      
      console.log(`💾 Limiti ${prodotto} da cache (età: ${Math.round(age/1000)}s)`);
      return JSON.parse(cached);
    } catch (e) {
      console.error('❌ Errore recupero limiti cache:', e);
      return null;
    }
  },
  
  saveLimitiToCache: (prodotto, data, limiti) => {
    try {
      const cacheKey = `limiti_${prodotto}_${data}`;
      sessionStorage.setItem(cacheKey, JSON.stringify(limiti));
      sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString());
      
      console.log(`💾 Limiti ${prodotto} salvati in cache`);
    } catch (e) {
      console.error('❌ Errore salvataggio limiti cache:', e);
    }
  },
  
  invalidateLimitiCache: () => {
    try {
      // Rimuovi tutti i limiti in cache
      const keys = Object.keys(sessionStorage);
      const limitiKeys = keys.filter(k => k.startsWith('limiti_'));
      
      limitiKeys.forEach(key => {
        sessionStorage.removeItem(key);
        sessionStorage.removeItem(`${key}_time`);
      });
      
      console.log(`🗑️ ${limitiKeys.length} cache limiti invalidate`);
    } catch (e) {
      console.error('❌ Errore invalidazione limiti:', e);
    }
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 🧹 PULIZIA CACHE
  // ═══════════════════════════════════════════════════════════════════════════
  clearOldCache: () => {
    try {
      // Mantieni solo ordini e pending changes essenziali
      const ordini = localStorage.getItem('ordini');
      const pendingChanges = localStorage.getItem('pendingChanges');
      const lastSyncTime = localStorage.getItem('lastSyncTime');
      
      // Pulisci tutto
      localStorage.clear();
      
      // Ripristina essenziali
      if (ordini) localStorage.setItem('ordini', ordini);
      if (pendingChanges) localStorage.setItem('pendingChanges', pendingChanges);
      if (lastSyncTime) localStorage.setItem('lastSyncTime', lastSyncTime);
      
      console.log('🧹 Cache vecchia pulita, mantenuti solo dati essenziali');
    } catch (e) {
      console.error('❌ Errore pulizia cache:', e);
    }
  },
  
  clearAllCache: () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      console.log('🧹 Tutta la cache eliminata');
    } catch (e) {
      console.error('❌ Errore pulizia completa:', e);
    }
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 📊 STATISTICHE CACHE
  // ═══════════════════════════════════════════════════════════════════════════
  getCacheStats: () => {
    try {
      const stats = {
        ordini: 0,
        ordiniAge: null,
        pendingChanges: 0,
        lastSync: null,
        localStorageSize: 0,
        sessionStorageSize: 0,
      };
      
      // Ordini
      const ordini = localStorage.getItem('ordini');
      if (ordini) {
        stats.ordini = JSON.parse(ordini).length;
        const timestamp = localStorage.getItem('ordini_timestamp');
        if (timestamp) {
          stats.ordiniAge = Math.round((Date.now() - parseInt(timestamp)) / 1000);
        }
      }
      
      // Pending changes
      const pending = localStorage.getItem('pendingChanges');
      if (pending) {
        stats.pendingChanges = JSON.parse(pending).length;
      }
      
      // Last sync
      stats.lastSync = localStorage.getItem('lastSyncTime');
      
      // Size (approssimato)
      stats.localStorageSize = new Blob(Object.values(localStorage)).size;
      stats.sessionStorageSize = new Blob(Object.values(sessionStorage)).size;
      
      return stats;
    } catch (e) {
      console.error('❌ Errore statistiche cache:', e);
      return null;
    }
  },
  
  logCacheStats: () => {
    const stats = CacheService.getCacheStats();
    if (stats) {
      console.log('📊 CACHE STATS:', stats);
    }
  }
};

export default CacheService;