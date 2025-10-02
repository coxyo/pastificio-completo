// src/services/backupService.js

import { LoggingService } from './loggingService'; // Corretto l'import

class BackupServiceClass {
  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
    this.backupHistory = [];
    this.isBackingUp = false;
  }

  async createBackup(tipo = 'manuale') {
    if (this.isBackingUp) {
      LoggingService.warn('Backup già in corso');
      return null;
    }

    this.isBackingUp = true;
    
    try {
      LoggingService.info(`Avvio backup ${tipo}`);
      
      // Raccogli tutti i dati da backuppare
      const backupData = {
        timestamp: new Date().toISOString(),
        tipo,
        versione: '1.0.0',
        dati: {
          ordini: this.getLocalData('ordini'),
          clienti: this.getLocalData('clienti'),
          magazzino: this.getLocalData('magazzino'),
          movimenti: this.getLocalData('movimenti'),
          configurazione: this.getLocalData('app_config'),
          cache: this.getLocalData('cache_data')
        },
        metadata: {
          device: navigator.userAgent,
          url: window.location.href,
          utente: localStorage.getItem('userEmail') || 'Anonimo'
        }
      };

      // Invia al server
      const response = await fetch(`${this.apiUrl}/api/backup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`
        },
        body: JSON.stringify(backupData)
      });

      if (response.ok) {
        const result = await response.json();
        
        // Salva nella cronologia
        this.backupHistory.unshift({
          id: result.backupId,
          timestamp: backupData.timestamp,
          tipo,
          size: JSON.stringify(backupData).length,
          status: 'success'
        });

        // Mantieni solo ultimi 10 backup nella cronologia locale
        if (this.backupHistory.length > 10) {
          this.backupHistory = this.backupHistory.slice(0, 10);
        }

        localStorage.setItem('backup_history', JSON.stringify(this.backupHistory));
        
        LoggingService.success(`Backup ${tipo} completato`, { backupId: result.backupId });
        
        return result;
      } else {
        throw new Error(`Errore server: ${response.status}`);
      }
    } catch (error) {
      LoggingService.error('Errore durante il backup:', error);
      
      // Salva backup locale come fallback
      return this.saveLocalBackup(backupData);
    } finally {
      this.isBackingUp = false;
    }
  }

  async restoreBackup(backupId) {
    try {
      LoggingService.info('Avvio ripristino backup', { backupId });
      
      // Scarica backup dal server
      const response = await fetch(`${this.apiUrl}/api/backup/${backupId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`
        }
      });

      if (!response.ok) {
        throw new Error(`Backup non trovato: ${backupId}`);
      }

      const backupData = await response.json();
      
      // Ripristina i dati
      if (backupData.dati) {
        Object.entries(backupData.dati).forEach(([key, value]) => {
          if (value) {
            localStorage.setItem(key, JSON.stringify(value));
          }
        });
      }

      LoggingService.success('Backup ripristinato con successo');
      
      // Ricarica la pagina per applicare le modifiche
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
      return true;
    } catch (error) {
      LoggingService.error('Errore ripristino backup:', error);
      throw error;
    }
  }

  async getBackupList() {
    try {
      const response = await fetch(`${this.apiUrl}/api/backup/list`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`
        }
      });

      if (response.ok) {
        const backups = await response.json();
        this.backupHistory = backups;
        return backups;
      }
    } catch (error) {
      LoggingService.error('Errore recupero lista backup:', error);
    }

    // Ritorna backup locali se il server non risponde
    return this.backupHistory;
  }

  async deleteBackup(backupId) {
    try {
      const response = await fetch(`${this.apiUrl}/api/backup/${backupId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`
        }
      });

      if (response.ok) {
        this.backupHistory = this.backupHistory.filter(b => b.id !== backupId);
        localStorage.setItem('backup_history', JSON.stringify(this.backupHistory));
        LoggingService.info('Backup eliminato', { backupId });
        return true;
      }
    } catch (error) {
      LoggingService.error('Errore eliminazione backup:', error);
    }
    
    return false;
  }

  // Metodi di utilità
  getLocalData(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      LoggingService.error(`Errore lettura ${key}:`, error);
      return null;
    }
  }

  saveLocalBackup(backupData) {
    try {
      // Salva backup locale con timestamp
      const localBackupKey = `local_backup_${Date.now()}`;
      localStorage.setItem(localBackupKey, JSON.stringify(backupData));
      
      // Mantieni solo ultimi 3 backup locali
      const localBackups = Object.keys(localStorage)
        .filter(key => key.startsWith('local_backup_'))
        .sort()
        .reverse();
      
      if (localBackups.length > 3) {
        localBackups.slice(3).forEach(key => {
          localStorage.removeItem(key);
        });
      }

      LoggingService.info('Backup salvato localmente', { key: localBackupKey });
      
      return {
        backupId: localBackupKey,
        timestamp: backupData.timestamp,
        local: true
      };
    } catch (error) {
      LoggingService.error('Errore salvataggio backup locale:', error);
      return null;
    }
  }

  async exportBackup(backupId) {
    try {
      let backupData;
      
      if (backupId.startsWith('local_backup_')) {
        // Backup locale
        backupData = this.getLocalData(backupId);
      } else {
        // Backup server
        const response = await fetch(`${this.apiUrl}/api/backup/${backupId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Backup non trovato');
        }
        
        backupData = await response.json();
      }

      // Crea file per download
      const dataStr = JSON.stringify(backupData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `backup-${backupData.timestamp.split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      LoggingService.info('Backup esportato', { backupId });
      
      return true;
    } catch (error) {
      LoggingService.error('Errore esportazione backup:', error);
      return false;
    }
  }

  async importBackup(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const backupData = JSON.parse(event.target.result);
          
          // Valida struttura backup
          if (!backupData.timestamp || !backupData.dati) {
            throw new Error('Formato backup non valido');
          }

          // Crea nuovo backup con i dati importati
          const result = await this.createBackup('importato');
          
          // Ripristina i dati importati
          if (backupData.dati) {
            Object.entries(backupData.dati).forEach(([key, value]) => {
              if (value) {
                localStorage.setItem(key, JSON.stringify(value));
              }
            });
          }

          LoggingService.success('Backup importato con successo');
          
          // Ricarica per applicare modifiche
          setTimeout(() => {
            window.location.reload();
          }, 1000);
          
          resolve(result);
        } catch (error) {
          LoggingService.error('Errore importazione backup:', error);
          reject(error);
        }
      };
      
      reader.onerror = () => {
        const error = new Error('Errore lettura file');
        LoggingService.error('Errore lettura file backup:', error);
        reject(error);
      };
      
      reader.readAsText(file);
    });
  }

  // Pianifica backup automatici
  scheduleAutomaticBackup(intervalHours = 24) {
    // Cancella eventuali timer esistenti
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
    }

    // Imposta nuovo timer
    this.backupTimer = setInterval(() => {
      this.createBackup('automatico');
    }, intervalHours * 60 * 60 * 1000);

    LoggingService.info(`Backup automatico pianificato ogni ${intervalHours} ore`);
  }

  // Ottieni statistiche backup
  getBackupStats() {
    const stats = {
      totale: this.backupHistory.length,
      ultimo: this.backupHistory[0]?.timestamp || null,
      spazioUsato: 0,
      tipi: {
        manuale: 0,
        automatico: 0,
        importato: 0
      }
    };

    this.backupHistory.forEach(backup => {
      stats.spazioUsato += backup.size || 0;
      if (backup.tipo && stats.tipi[backup.tipo] !== undefined) {
        stats.tipi[backup.tipo]++;
      }
    });

    return stats;
  }
}

// Crea istanza singleton
const BackupService = new BackupServiceClass();

// Export sia come default che come named export
export { BackupService };
export default BackupService;