// src/services/syncService.js
import webSocketService from './webSocketService';
import { CacheService } from './cacheService';
import dashboardService from './dashboardService';

export const SyncService = {
  // Funzione di sincronizzazione dati tra client e server
  sincronizza: async () => {
    console.log('Inizio sincronizzazione dati');
    
    try {
      // Recupera i cambiamenti in sospeso
      const pendingChanges = CacheService.getPendingChanges() || [];
      
      if (pendingChanges.length === 0) {
        console.log('Nessun cambiamento da sincronizzare');
        return { success: true, message: 'Nessun cambiamento da sincronizzare' };
      }
      
      console.log(`Sincronizzazione di ${pendingChanges.length} cambiamenti`);
      
      // Invia ogni cambiamento al server
      for (const change of pendingChanges) {
        if (change.type === 'nuovo') {
          await webSocketService.inviaOrdine(change.data);
        } else if (change.type === 'aggiorna') {
          await webSocketService.aggiornaOrdine(change.data);
        } else if (change.type === 'elimina') {
          await webSocketService.eliminaOrdine(change.id);
        }
      }
      
      // Pulisci i cambiamenti in sospeso dopo la sincronizzazione
      CacheService.clearPendingChanges();
      
      console.log('Sincronizzazione completata con successo');
      return { success: true, message: 'Sincronizzazione completata', modificati: pendingChanges.length };
    } catch (error) {
      console.error('Errore durante la sincronizzazione:', error);
      return { 
        success: false, 
        error: error.message, 
        message: 'Errore durante la sincronizzazione' 
      };
    }
  },
  
  // NUOVO: Sincronizzazione dashboard
  syncDashboardData: async () => {
    try {
      if (!navigator.onLine) {
        console.log('Offline - usando dati locali per dashboard');
        return;
      }

      // Sincronizza statistiche dashboard
      const dashboardData = await dashboardService.fetchDashboardStats();
      
      // Emetti evento per aggiornare il dashboard
      window.dispatchEvent(new CustomEvent('dashboard:updated', { 
        detail: dashboardData 
      }));
      
      console.log('Dashboard sincronizzato');
    } catch (error) {
      console.error('Errore sincronizzazione dashboard:', error);
    }
  },
  
  // Verifica se ci sono cambiamenti da sincronizzare
  hasPendingChanges: () => {
    const pendingChanges = CacheService.getPendingChanges() || [];
    return pendingChanges.length > 0;
  },
  
  // Ottieni lo stato della sincronizzazione
  getStatus: () => {
    return {
      pendingChanges: CacheService.getPendingChanges()?.length || 0,
      lastSyncTime: localStorage.getItem('lastSyncTime') || null
    };
  },
  
  // NUOVO: Avvia sincronizzazione automatica
  startSync: function() {
    // Sincronizza ordini ogni 60 secondi
    this.syncInterval = setInterval(() => {
      this.sincronizza();
    }, 60000);
    
    // Sincronizza dashboard ogni 30 secondi
    this.dashboardInterval = setInterval(() => {
      this.syncDashboardData();
    }, 30000);
    
    console.log('Sincronizzazione automatica avviata');
  },
  
  // NUOVO: Ferma sincronizzazione automatica
  stopSync: function() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    if (this.dashboardInterval) {
      clearInterval(this.dashboardInterval);
    }
    console.log('Sincronizzazione automatica fermata');
  }
};

export default SyncService;