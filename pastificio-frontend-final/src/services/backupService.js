// services/backupService.js
import { EventEmitter } from 'events';
import { LoggingService } from './loggingService';
import { CacheService } from './cacheService';

class BackupServiceClass extends EventEmitter {
  config = {
    backupKey: 'pastificio_backup',
    versionKey: 'backup_version',
    currentVersion: '1.0',
    maxBackups: 10,
    autoBackupInterval: 1000 * 60 * 60, // 1 ora
  };

  timerId = null;
  initialTimerId = null;

  async createBackup() {
    try {
      LoggingService.info('Inizio creazione backup');
      
      const dati = {
        ordini: CacheService.getFromCache(),
        pendingChanges: CacheService.getPendingChanges(),
        timestamp: new Date().toISOString(),
        version: this.config.currentVersion
      };

      const backups = this.getBackups();
      backups.unshift(dati);

      if (backups.length > this.config.maxBackups) {
        backups.length = this.config.maxBackups;
      }

      localStorage.setItem(this.config.backupKey, JSON.stringify(backups));
      
      this.emit('backup-created', dati);
      LoggingService.info('Backup completato con successo', {
        timestamp: dati.timestamp,
        numeroOrdini: dati.ordini.length
      });

      return dati;
    } catch (error) {
      LoggingService.error('Errore durante la creazione del backup', error);
      this.emit('backup-error', error);
      throw error;
    }
  }

  getBackups() {
    try {
      const backups = JSON.parse(localStorage.getItem(this.config.backupKey) || '[]');
      LoggingService.debug('Backup recuperati', { numeroBackup: backups.length });
      return backups;
    } catch (error) {
      LoggingService.error('Errore nel recupero dei backup', error);
      return [];
    }
  }

  async restoreBackup(backup) {
    try {
      LoggingService.info('Inizio ripristino backup', { timestamp: backup.timestamp });

      if (backup.version !== this.config.currentVersion) {
        LoggingService.warn('Versione backup diversa dalla versione corrente', {
          backupVersion: backup.version,
          currentVersion: this.config.currentVersion
        });
      }

      CacheService.saveToCache(backup.ordini);
      
      const currentChanges = CacheService.getPendingChanges();
      const mergedChanges = [...backup.pendingChanges, ...currentChanges];
      localStorage.setItem(
        CacheService.config.pendingChangesKey,
        JSON.stringify(mergedChanges)
      );

      this.emit('backup-restored', backup);
      LoggingService.info('Ripristino backup completato', {
        timestamp: backup.timestamp,
        numeroOrdini: backup.ordini.length
      });

      return true;
    } catch (error) {
      LoggingService.error('Errore durante il ripristino del backup', error);
      this.emit('restore-error', error);
      throw error;
    }
  }

  exportBackups() {
    try {
      LoggingService.info('Inizio esportazione backup');
      
      const backups = this.getBackups();
      const dataStr = JSON.stringify(backups, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `pastificio_backup_${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.emit('backups-exported', backups.length);
      LoggingService.info('Esportazione backup completata', {
        numeroBackup: backups.length
      });
    } catch (error) {
      LoggingService.error('Errore durante l\'esportazione dei backup', error);
      this.emit('export-error', error);
      throw error;
    }
  }

  async importBackups(file) {
    try {
      LoggingService.info('Inizio importazione backup');
      
      const content = await file.text();
      const backups = JSON.parse(content);

      if (!Array.isArray(backups)) {
        throw new Error('Formato backup non valido');
      }

      localStorage.setItem(this.config.backupKey, JSON.stringify(backups));

      this.emit('backups-imported', backups.length);
      LoggingService.info('Importazione backup completata', {
        numeroBackup: backups.length
      });

      return backups;
    } catch (error) {
      LoggingService.error('Errore durante l\'importazione dei backup', error);
      this.emit('import-error', error);
      throw error;
    }
  }

  configura(configurazione) {
    if (configurazione) {
      // Aggiorna configurazione backup automatico
      this.config.autoBackupInterval = configurazione.frequenza === 'giornaliero' 
        ? 1000 * 60 * 60 * 24 // 24 ore
        : configurazione.frequenza === 'settimanale'
          ? 1000 * 60 * 60 * 24 * 7 // 7 giorni
          : 1000 * 60 * 60 * 24 * 30; // 30 giorni
      
      // Se l'ora di backup è specificata, calcola quando eseguire il backup
      if (configurazione.oraBackup) {
        const [hour, minute] = configurazione.oraBackup.split(':').map(Number);
        const now = new Date();
        const backupTime = new Date(now);
        backupTime.setHours(hour, minute, 0, 0);
        
        // Se l'ora è già passata oggi, programma per domani
        if (backupTime < now) {
          backupTime.setDate(backupTime.getDate() + 1);
        }
        
        // Calcola millisecondi fino al prossimo backup
        const msUntilBackup = backupTime.getTime() - now.getTime();
        
        // Imposta timeout per avviare il backup all'ora specificata
        clearTimeout(this.initialTimerId);
        this.initialTimerId = setTimeout(() => {
          this.createBackup();
          this.startAutoBackup(); // Riprogramma i backup successivi
        }, msUntilBackup);
      }
      
      // Aggiorna il numero massimo di backup
      if (configurazione.conservazione) {
        this.config.maxBackups = parseInt(configurazione.conservazione);
      }
      
      // Avvia o ferma il backup automatico in base alla configurazione
      if (configurazione.backupAutomatico) {
        this.startAutoBackup();
      } else {
        this.stopAutoBackup();
      }
      
      LoggingService.info('Configurazione backup aggiornata', {
        frequenza: configurazione.frequenza,
        oraBackup: configurazione.oraBackup,
        maxBackups: this.config.maxBackups,
        backupAutomatico: configurazione.backupAutomatico
      });
    }
  }

  startAutoBackup() {
    LoggingService.info('Avvio backup automatico', {
      intervallo: this.config.autoBackupInterval
    });

    this.stopAutoBackup();

    this.timerId = setInterval(async () => {
      try {
        await this.createBackup();
      } catch (error) {
        LoggingService.error('Errore nel backup automatico', error);
      }
    }, this.config.autoBackupInterval);

    this.emit('auto-backup-started');
  }

  stopAutoBackup() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
      this.emit('auto-backup-stopped');
      LoggingService.info('Backup automatico fermato');
    }
    
    if (this.initialTimerId) {
      clearTimeout(this.initialTimerId);
      this.initialTimerId = null;
    }
  }
}

export const BackupService = new BackupServiceClass();