import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../config/logger.js';
import googleDriveService from './googleDriveService.js';
import s3Service from './s3Service.js';
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

  /**
   * Upload backup su storage cloud (S3 o Google Drive)
   */
  async uploadToCloud(fileName, fileContent) {
    try {
      const provider = process.env.BACKUP_PROVIDER || 'drive'; // 's3' or 'drive'
      
      if (provider === 's3') {
        // Upload su AWS S3
        logger.info('📤 Upload su AWS S3...');
        const result = await s3Service.uploadFile(fileName, fileContent);
        return {
          success: true,
          provider: 's3',
          ...result
        };
      } else {
        // Upload su Google Drive (vecchio metodo)
        logger.info('📤 Upload su Google Drive...');
        return await this.uploadToDrive(fileName, fileContent);
      }
    } catch (error) {
      logger.error('❌ Errore upload cloud:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Upload su Google Drive (metodo originale - mantenuto per compatibilità)
   */
  async uploadToDrive(fileName, fileContent) {
    try {
      if (!this.driveEnabled) {
        throw new Error('Google Drive non abilitato');
      }

      logger.info('📤 Upload: ' + fileName);
      const driveResult = await googleDriveService.uploadBackup(fileName, fileContent);
      logger.info(`✅ Backup caricato su Google Drive: ${fileName} (ID: ${driveResult.id})`);
      
      return {
        success: true,
        provider: 'drive',
        id: driveResult.id,
        fileName
      };
    } catch (error) {
      logger.error('❌ Errore upload: ' + error.message);
      logger.error('Errore dettagliato upload Google Drive:', {
        message: error.message,
        code: error.code,
        status: error.status,
        errors: error.errors
      });
      throw error;
    }
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

      // Carica su cloud (S3 o Google Drive)
      const provider = process.env.BACKUP_PROVIDER || 'drive';
      let cloudResult = { success: false };

      if (provider === 's3') {
        // Usa AWS S3
        try {
          logger.info('Inizio upload su AWS S3...');
          cloudResult = await this.uploadToCloud(fileName, jsonContent);
          if (cloudResult.success) {
            logger.info(`✅ Backup caricato su S3: ${fileName}`);
          }
        } catch (error) {
          logger.error('❌ Errore upload S3:', error);
        }
      } else if (this.driveEnabled) {
        // Usa Google Drive
        try {
          logger.info('Inizio upload su Google Drive...');
          cloudResult = await this.uploadToCloud(fileName, jsonContent);
          if (cloudResult.success) {
            logger.info(`✅ Backup caricato su Google Drive: ${fileName}`);
          }
        } catch (error) {
          logger.error('❌ Errore upload Google Drive:', error);
        }
      } else {
        logger.warn('⚠️ Nessun cloud storage configurato, backup salvato solo localmente');
      }

      // Pulisci vecchi backup
      await this.cleanupOldBackups();

      return {
        success: true,
        fileName,
        localPath,
        cloudUploaded: cloudResult.success,
        cloudProvider: cloudResult.provider || provider,
        data: cloudResult
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

      let deletedLocal = 0;
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.backupDir, file);
          const stats = await fs.stat(filePath);
          
          if (stats.mtime < cutoffDate) {
            await fs.unlink(filePath);
            logger.info(`Backup locale eliminato: ${file}`);
            deletedLocal++;
          }
        }
      }

      logger.info(`✅ Puliti ${deletedLocal} backup locali vecchi`);

      // Pulisci backup su cloud
      const provider = process.env.BACKUP_PROVIDER || 'drive';
      
      if (provider === 's3') {
        // Pulisci S3
        const result = await s3Service.cleanupOldBackups(30); // 30 giorni su S3
        logger.info(`✅ Puliti ${result.deleted} backup S3 vecchi`);
      } else if (this.driveEnabled) {
        // Pulisci Google Drive
        await googleDriveService.deleteOldBackups(daysToKeep * 4); // Tieni più a lungo su Drive
        logger.info(`✅ Puliti backup Google Drive vecchi`);
      }

      logger.info(`✅ Nessun backup vecchio da eliminare`);
    } catch (error) {
      logger.error('Errore pulizia vecchi backup:', error);
    }
  }

  async listBackups() {
    try {
      const provider = process.env.BACKUP_PROVIDER || 'drive';

      // Backup locali
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

      // Backup cloud
      let cloudBackups = [];
      
      if (provider === 's3') {
        // Lista backup S3
        logger.info('Recupero lista backup da S3...');
        cloudBackups = await s3Service.listBackups();
        logger.info(`Trovati ${cloudBackups.length} backup su S3`);
      } else if (this.driveEnabled) {
        // Lista backup Google Drive
        logger.info('Recupero lista backup da Google Drive...');
        const driveFiles = await googleDriveService.listBackups(20);
        logger.info(`Trovati ${driveFiles.length} backup su Google Drive`);
        cloudBackups = driveFiles.map(file => ({
          ...file,
          location: 'drive'
        }));
      }

      return {
        local: localBackups.sort((a, b) => b.createdAt - a.createdAt),
        drive: cloudBackups, // Manteniamo "drive" per compatibilità frontend
        cloud: cloudBackups,
        provider: provider
      };
    } catch (error) {
      logger.error('Errore lista backup:', error);
      return { local: [], drive: [], cloud: [], provider: 'none' };
    }
  }

  async restoreBackup(fileName, fromDrive = false) {
    try {
      let backupData;
      const provider = process.env.BACKUP_PROVIDER || 'drive';

      if (fromDrive) {
        if (provider === 's3') {
          // Ripristina da S3
          logger.info(`📥 Download backup da S3: ${fileName}`);
          const result = await s3Service.downloadFile(fileName);
          backupData = JSON.parse(result.content);
        } else if (this.driveEnabled) {
          // Ripristina da Google Drive
          const driveFiles = await googleDriveService.listBackups();
          const file = driveFiles.find(f => f.name === fileName);
          
          if (!file) {
            throw new Error('Backup non trovato su Google Drive');
          }

          backupData = await googleDriveService.downloadBackup(file.id);
        } else {
          throw new Error('Cloud storage non configurato');
        }
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