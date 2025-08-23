import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../config/logger.js';
import googleDriveService from './googleDriveService.js';
import Ordine from '../models/Ordine.js';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class BackupService {
  constructor() {
    this.backupDir = path.join(__dirname, '..', 'backups');
    this.driveEnabled = false;
  }

  async initialize() {
    // Crea directory locale se non esiste
    await fs.mkdir(this.backupDir, { recursive: true });
    
    // Inizializza Google Drive
    this.driveEnabled = await googleDriveService.initialize();
    
    logger.info(`Servizio backup inizializzato (Google Drive: ${this.driveEnabled ? 'ABILITATO' : 'DISABILITATO'})`);
  }

  async createBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `backup_${timestamp}.json`;

      // Raccogli tutti i dati
      const [ordini, users] = await Promise.all([
        Ordine.find().lean(),
        User.find().select('-password').lean()
      ]);

      const backupData = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        data: {
          ordini,
          users
        }
      };

      const jsonContent = JSON.stringify(backupData, null, 2);

      // Salva backup locale
      const localPath = path.join(this.backupDir, fileName);
      await fs.writeFile(localPath, jsonContent);
      logger.info(`Backup locale creato: ${fileName}`);

      // Carica su Google Drive se disponibile
      if (this.driveEnabled) {
        try {
          logger.info('Inizio upload su Google Drive...');
          const driveResult = await googleDriveService.uploadBackup(fileName, jsonContent);
          logger.info(`Backup caricato su Google Drive con successo: ${fileName} (ID: ${driveResult.id})`);
        } catch (error) {
          logger.error('Errore dettagliato upload Google Drive:', {
            message: error.message,
            code: error.code,
            status: error.status,
            errors: error.errors
          });
          // Non bloccare il processo se Google Drive fallisce
        }
      } else {
        logger.warn('Google Drive non abilitato, backup salvato solo localmente');
      }

      // Pulisci vecchi backup
      await this.cleanupOldBackups();

      return {
        success: true,
        fileName,
        localPath,
        driveUploaded: this.driveEnabled
      };
    } catch (error) {
      logger.error('Errore creazione backup:', error);
      throw error;
    }
  }

  async cleanupOldBackups(daysToKeep = 7) {
    try {
      // Pulisci backup locali
      const files = await fs.readdir(this.backupDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.backupDir, file);
          const stats = await fs.stat(filePath);
          
          if (stats.mtime < cutoffDate) {
            await fs.unlink(filePath);
            logger.info(`Backup locale eliminato: ${file}`);
          }
        }
      }

      // Pulisci backup su Google Drive
      if (this.driveEnabled) {
        await googleDriveService.deleteOldBackups(daysToKeep * 4); // Tieni più a lungo su Drive
      }
    } catch (error) {
      logger.error('Errore pulizia vecchi backup:', error);
    }
  }

  async listBackups() {
    try {
      const localBackups = [];
      const files = await fs.readdir(this.backupDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.backupDir, file);
          const stats = await fs.stat(filePath);
          localBackups.push({
            name: file,
            size: stats.size,
            createdAt: stats.mtime,
            location: 'local'
          });
        }
      }

      let driveBackups = [];
      if (this.driveEnabled) {
        logger.info('Recupero lista backup da Google Drive...');
        const driveFiles = await googleDriveService.listBackups(20);
        logger.info(`Trovati ${driveFiles.length} backup su Google Drive`);
        driveBackups = driveFiles.map(file => ({
          ...file,
          location: 'drive'
        }));
      }

      return {
        local: localBackups.sort((a, b) => b.createdAt - a.createdAt),
        drive: driveBackups
      };
    } catch (error) {
      logger.error('Errore lista backup:', error);
      return { local: [], drive: [] };
    }
  }

  async restoreBackup(fileName, fromDrive = false) {
    try {
      let backupData;

      if (fromDrive && this.driveEnabled) {
        // Scarica da Google Drive
        const driveFiles = await googleDriveService.listBackups();
        const file = driveFiles.find(f => f.name === fileName);
        
        if (!file) {
          throw new Error('Backup non trovato su Google Drive');
        }

        backupData = await googleDriveService.downloadBackup(file.id);
      } else {
        // Leggi da file locale
        const filePath = path.join(this.backupDir, fileName);
        const content = await fs.readFile(filePath, 'utf8');
        backupData = JSON.parse(content);
      }

      // Qui implementeresti la logica di restore
      logger.info(`Backup da ripristinare: ${fileName}`);
      logger.info(`Ordini nel backup: ${backupData.data.ordini.length}`);

      return {
        success: true,
        stats: {
          ordini: backupData.data.ordini.length,
          users: backupData.data.users.length
        }
      };
    } catch (error) {
      logger.error('Errore ripristino backup:', error);
      throw error;
    }
  }
}

export default new BackupService();
