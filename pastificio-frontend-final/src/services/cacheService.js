// src/services/cacheService.js
// ✅ VERSIONE CON PULIZIA AUTOMATICA + SCADENZE + MONITORING
// Data: 28 Febbraio 2026

// ═══════════════════════════════════════════════════════════════════════════
// 📋 CONFIGURAZIONE SCADENZE CACHE
// ═══════════════════════════════════════════════════════════════════════════
const CACHE_CONFIG = {
  // Chiavi con scadenza (in millisecondi)
  scadenze: {
    ordini:    7 * 24 * 60 * 60 * 1000,   // 7 giorni
    clienti:   7 * 24 * 60 * 60 * 1000,   // 7 giorni
    prodotti:  30 * 24 * 60 * 60 * 1000,  // 30 giorni
    chiamata:  24 * 60 * 60 * 1000,       // 24 ore
  },
  // Prefissi da NON eliminare mai
  protetti: ['preferenze_', 'device_', 'tema_', 'notifiche_config'],
  // Soglia pulizia automatica (bytes)
  sogliaAvviso: 3 * 1024 * 1024,    // 3MB → avviso
  sogliaPulizia: 4 * 1024 * 1024,   // 4MB → pulizia automatica
};

export const CacheService = {
  // ═══════════════════════════════════════════════════════════════════════════
  // 🚀 INIZIALIZZAZIONE ALL'AVVIO (chiamare una volta in ClientLayout.js)
  // ═══════════════════════════════════════════════════════════════════════════
  inizializza: () => {
    try {
      if (typeof window === 'undefined') return; // SSR safe

      console.log('🚀 CacheService: inizializzazione pulizia automatica...');
      
      // 1. Rimuovi cache scadute
      const rimossi = CacheService.pulisciCacheScadute();
      
      // 2. Controlla dimensione totale
      const dimensione = CacheService.getDimensioneStorage();
      
      if (dimensione > CACHE_CONFIG.sogliaPulizia) {
        console.warn(`⚠️ localStorage pieno (${CacheService.formatBytes(dimensione)}), pulizia forzata...`);
        CacheService.puliziaForzata();
      } else if (dimensione > CACHE_CONFIG.sogliaAvviso) {
        console.warn(`⚠️ localStorage quasi pieno: ${CacheService.formatBytes(dimensione)}`);
      }
      
      // 3. Log statistiche
      const stats = CacheService.getCacheStats();
      console.log(`✅ CacheService inizializzato | ${CacheService.formatBytes(dimensione)} usati | ${rimossi} chiavi scadute rimosse`);
      
      return stats;
    } catch (e) {
      console.error('❌ Errore inizializzazione CacheService:', e);
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🧹 PULIZIA CACHE SCADUTE
  // ═══════════════════════════════════════════════════════════════════════════
  pulisciCacheScadute: () => {
    try {
      if (typeof window === 'undefined') return 0;
      
      let rimossi = 0;
      const ora = Date.now();
      const chiavi = Object.keys(localStorage);
      
      for (const chiave of chiavi) {
        // Skip chiavi protette
        if (CACHE_CONFIG.protetti.some(p => chiave.startsWith(p))) continue;
        // Skip chiavi _timestamp (sono metadata)
        if (chiave.endsWith('_timestamp') || chiave.endsWith('_time')) continue;
        
        // Controlla timestamp associato
        const timestampKey = `${chiave}_timestamp`;
        const timestamp = localStorage.getItem(timestampKey);
        
        if (timestamp) {
          const eta = ora - parseInt(timestamp);
          
          // Determina scadenza in base al prefisso
          let scadenza = null;
          for (const [prefisso, ms] of Object.entries(CACHE_CONFIG.scadenze)) {
            if (chiave.startsWith(prefisso) || chiave === prefisso) {
              scadenza = ms;
              break;
            }
          }
          
          // Se ha una scadenza configurata e l'ha superata → rimuovi
          if (scadenza && eta > scadenza) {
            localStorage.removeItem(chiave);
            localStorage.removeItem(timestampKey);
            rimossi++;
            console.log(`🗑️ Cache scaduta rimossa: ${chiave} (età: ${Math.round(eta / 86400000)}gg)`);
          }
        }
        
        // Rimuovi chiavi chiamata_ vecchie (> 24h)
        if (chiave.startsWith('chiamata_') || chiave.startsWith('lastCall_') || chiave.startsWith('call_')) {
          const val = localStorage.getItem(chiave);
          try {
            const parsed = JSON.parse(val);
            const callTime = parsed.timestamp || parsed.time || parsed.createdAt;
            if (callTime && (ora - new Date(callTime).getTime() > CACHE_CONFIG.scadenze.chiamata)) {
              localStorage.removeItem(chiave);
              rimossi++;
            }
          } catch {
            // Chiave chiamata non-JSON → rimuovi se non è metadata
            localStorage.removeItem(chiave);
            rimossi++;
          }
        }
      }
      
      return rimossi;
    } catch (e) {
      console.error('❌ Errore pulizia cache scadute:', e);
      return 0;
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔥 PULIZIA FORZATA (quando storage > 4MB)
  // ═══════════════════════════════════════════════════════════════════════════
  puliziaForzata: () => {
    try {
      if (typeof window === 'undefined') return;
      
      const prima = CacheService.getDimensioneStorage();
      
      // Salva dati critici
      const pendingChanges = localStorage.getItem('pendingChanges');
      const lastSyncTime = localStorage.getItem('lastSyncTime');
      
      // Salva preferenze protette
      const protette = {};
      for (const chiave of Object.keys(localStorage)) {
        if (CACHE_CONFIG.protetti.some(p => chiave.startsWith(p))) {
          protette[chiave] = localStorage.getItem(chiave);
        }
      }
      
      // Pulisci tutto
      localStorage.clear();
      
      // Ripristina critici
      if (pendingChanges) localStorage.setItem('pendingChanges', pendingChanges);
      if (lastSyncTime) localStorage.setItem('lastSyncTime', lastSyncTime);
      
      // Ripristina protette
      for (const [k, v] of Object.entries(protette)) {
        localStorage.setItem(k, v);
      }
      
      const dopo = CacheService.getDimensioneStorage();
      console.log(`🧹 Pulizia forzata: ${CacheService.formatBytes(prima)} → ${CacheService.formatBytes(dopo)} (liberati ${CacheService.formatBytes(prima - dopo)})`);
    } catch (e) {
      console.error('❌ Errore pulizia forzata:', e);
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔄 GESTIONE ORDINI
  // ═══════════════════════════════════════════════════════════════════════════
  getFromCache: () => {
    try {
      if (typeof window === 'undefined') return [];
      
      const cached = localStorage.getItem('ordini');
      const timestamp = localStorage.getItem('ordini_timestamp');
      
      if (!cached) {
        console.log('💾 Cache ordini: vuota');
        return [];
      }
      
      // Controlla scadenza
      if (timestamp) {
        const eta = Date.now() - parseInt(timestamp);
        if (eta > CACHE_CONFIG.scadenze.ordini) {
          console.log('🗑️ Cache ordini scaduta, invalido...');
          CacheService.invalidateCache();
          return [];
        }
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
      if (typeof window === 'undefined') return;
      
      localStorage.setItem('ordini', JSON.stringify(ordini));
      localStorage.setItem('ordini_timestamp', Date.now().toString());
      console.log(`💾 Cache salvata: ${ordini.length} ordini`);
    } catch (e) {
      console.error('❌ Errore salvataggio cache:', e);
      
      // Se quota superata, pulisci e riprova
      if (e.name === 'QuotaExceededError') {
        console.warn('⚠️ Quota localStorage piena, pulizia forzata...');
        CacheService.puliziaForzata();
        
        try {
          localStorage.setItem('ordini', JSON.stringify(ordini));
          localStorage.setItem('ordini_timestamp', Date.now().toString());
          console.log('✅ Cache salvata dopo pulizia forzata');
        } catch (e2) {
          console.error('❌ Impossibile salvare anche dopo pulizia:', e2);
        }
      }
    }
  },
  
  invalidateCache: () => {
    try {
      if (typeof window === 'undefined') return;
      localStorage.removeItem('ordini');
      localStorage.removeItem('ordini_timestamp');
      console.log('🗑️ Cache ordini invalidata');
    } catch (e) {
      console.error('❌ Errore invalidazione cache:', e);
    }
  },
  
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
      if (typeof window === 'undefined') return;
      
      const pendingChanges = JSON.parse(localStorage.getItem('pendingChanges') || '[]');
      
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
      if (typeof window === 'undefined') return [];
      const pendingChanges = localStorage.getItem('pendingChanges');
      return pendingChanges ? JSON.parse(pendingChanges) : [];
    } catch (e) {
      console.error('❌ Errore recupero pending changes:', e);
      return [];
    }
  },
  
  clearPendingChanges: () => {
    try {
      if (typeof window === 'undefined') return;
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
      if (typeof window === 'undefined') return null;
      
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
      if (typeof window === 'undefined') return;
      
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
      if (typeof window === 'undefined') return;
      
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
  // 🧹 PULIZIA CACHE (compatibilità con versione precedente)
  // ═══════════════════════════════════════════════════════════════════════════
  clearOldCache: () => {
    try {
      if (typeof window === 'undefined') return;
      
      const ordini = localStorage.getItem('ordini');
      const ordiniTs = localStorage.getItem('ordini_timestamp');
      const pendingChanges = localStorage.getItem('pendingChanges');
      const lastSyncTime = localStorage.getItem('lastSyncTime');
      
      // Salva preferenze protette
      const protette = {};
      for (const chiave of Object.keys(localStorage)) {
        if (CACHE_CONFIG.protetti.some(p => chiave.startsWith(p))) {
          protette[chiave] = localStorage.getItem(chiave);
        }
      }
      
      localStorage.clear();
      
      if (ordini) localStorage.setItem('ordini', ordini);
      if (ordiniTs) localStorage.setItem('ordini_timestamp', ordiniTs);
      if (pendingChanges) localStorage.setItem('pendingChanges', pendingChanges);
      if (lastSyncTime) localStorage.setItem('lastSyncTime', lastSyncTime);
      
      for (const [k, v] of Object.entries(protette)) {
        localStorage.setItem(k, v);
      }
      
      console.log('🧹 Cache vecchia pulita, mantenuti dati essenziali + preferenze');
    } catch (e) {
      console.error('❌ Errore pulizia cache:', e);
    }
  },
  
  clearAllCache: () => {
    try {
      if (typeof window === 'undefined') return;
      localStorage.clear();
      sessionStorage.clear();
      console.log('🧹 Tutta la cache eliminata');
    } catch (e) {
      console.error('❌ Errore pulizia completa:', e);
    }
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 📐 UTILITY
  // ═══════════════════════════════════════════════════════════════════════════
  getDimensioneStorage: () => {
    try {
      if (typeof window === 'undefined') return 0;
      let totale = 0;
      for (const chiave of Object.keys(localStorage)) {
        totale += chiave.length + (localStorage.getItem(chiave)?.length || 0);
      }
      return totale * 2; // UTF-16 = 2 bytes per character
    } catch (e) {
      return 0;
    }
  },
  
  formatBytes: (bytes) => {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 📊 STATISTICHE CACHE
  // ═══════════════════════════════════════════════════════════════════════════
  getCacheStats: () => {
    try {
      if (typeof window === 'undefined') return null;
      
      const stats = {
        ordini: 0,
        ordiniAge: null,
        pendingChanges: 0,
        lastSync: null,
        localStorageSize: 0,
        localStorageSizeFormatted: '',
        sessionStorageSize: 0,
        chiavi: Object.keys(localStorage).length,
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
      
      // Size
      stats.localStorageSize = CacheService.getDimensioneStorage();
      stats.localStorageSizeFormatted = CacheService.formatBytes(stats.localStorageSize);
      
      try {
        let sessionSize = 0;
        for (const k of Object.keys(sessionStorage)) {
          sessionSize += k.length + (sessionStorage.getItem(k)?.length || 0);
        }
        stats.sessionStorageSize = sessionSize * 2;
      } catch { /* ignore */ }
      
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