// services/googleDriveService.js - SERVICE ACCOUNT VERSION
import { google } from 'googleapis';
import logger from '../config/logger.js';

const BACKUP_FOLDER_NAME = 'Pastificio_Backup';
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

class GoogleDriveService {
  constructor() {
    this.drive = null;
    this.auth = null;
    this.folderId = null;
    logger.info('GoogleDriveService inizializzato');
  }

  async authorize() {
    try {
      if (!process.env.GOOGLE_SERVICE_ACCOUNT_BASE64) {
        throw new Error('GOOGLE_SERVICE_ACCOUNT_BASE64 non configurato');
      }

      // Decodifica base64
      const serviceAccountJson = Buffer.from(
        process.env.GOOGLE_SERVICE_ACCOUNT_BASE64,
        'base64'
      ).toString('utf8');

      const serviceAccount = JSON.parse(serviceAccountJson);

      // Crea JWT client
      const auth = new google.auth.JWT({
        email: serviceAccount.client_email,
        key: serviceAccount.private_key,
        scopes: SCOPES,
      });

      // Autorizza
      await auth.authorize();
      
      logger.info('✅ Service Account autorizzato:', {
        email: serviceAccount.client_email
      });

      return auth;
    } catch (error) {
      logger.error('❌ Errore autorizzazione Service Account:', error.message);
      throw error;
    }
  }

  async initialize() {
    try {
      if (!process.env.GOOGLE_SERVICE_ACCOUNT_BASE64) {
        logger.error('GOOGLE_SERVICE_ACCOUNT_BASE64 non configurato');
        return false;
      }

      // Autorizza
      this.auth = await this.authorize();
      this.drive = google.drive({ version: 'v3', auth: this.auth });

      // Usa ID diretto se disponibile
      if (process.env.GOOGLE_DRIVE_FOLDER_ID) {
        this.folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
        logger.info(`✅ Uso cartella con ID: ${this.folderId}`);
        
        // Verifica che la cartella esista
        try {
          const folder = await this.drive.files.get({
            fileId: this.folderId,
            fields: 'id, name'
          });
          logger.info(`✅ Cartella verificata: ${folder.data.name}`);
        } catch (error) {
          logger.error('❌ Cartella non accessibile. Verifica ID e permessi.');
          return false;
        }
      } else {
        // Cerca per nome
        logger.info(`Ricerca cartella "${BACKUP_FOLDER_NAME}"...`);

        const response = await this.drive.files.list({
          q: `name='${BACKUP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
          fields: 'files(id, name)',
          spaces: 'drive'
        });

        if (response.data.files && response.data.files.length > 0) {
          this.folderId = response.data.files[0].id;
          logger.info(`✅ Cartella trovata: ${BACKUP_FOLDER_NAME} (ID: ${this.folderId})`);
        } else {
          logger.warn(`❌ Cartella "${BACKUP_FOLDER_NAME}" non trovata`);
          logger.info('Assicurati di aver condiviso la cartella con il service account');
          return false;
        }
      }

      logger.info('✅ Google Drive inizializzato con successo (Service Account)');
      return true;
    } catch (error) {
      logger.error('❌ Errore inizializzazione Google Drive:', error.message);
      return false;
    }
  }

  async uploadBackup(fileName, fileContent) {
    if (!this.drive || !this.folderId) {
      throw new Error('Google Drive non inizializzato');
    }

    try {
      logger.info(`📤 Upload: ${fileName}`);

      const fileMetadata = {
        name: fileName,
        parents: [this.folderId]
      };

      const media = {
        mimeType: 'application/json',
        body: fileContent
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, name, createdTime, webViewLink, size'
      });

      logger.info(`✅ Backup caricato: ${fileName}`, {
        id: response.data.id,
        size: `${(response.data.size / 1024).toFixed(2)} KB`
      });

      return response.data;
    } catch (error) {
      logger.error('❌ Errore upload:', error.message);
      throw error;
    }
  }

  async listBackups(limit = 10) {
    if (!this.drive || !this.folderId) {
      return [];
    }

    try {
      const response = await this.drive.files.list({
        q: `'${this.folderId}' in parents and trashed=false`,
        fields: 'files(id, name, createdTime, size, webViewLink)',
        orderBy: 'createdTime desc',
        pageSize: limit
      });

      logger.info(`📋 Trovati ${response.data.files.length} backup`);
      return response.data.files || [];
    } catch (error) {
      logger.error('❌ Errore lista backup:', error.message);
      return [];
    }
  }

  async downloadBackup(fileId) {
    if (!this.drive) {
      throw new Error('Google Drive non inizializzato');
    }

    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        alt: 'media'
      }, { responseType: 'stream' });

      return new Promise((resolve, reject) => {
        let data = '';
        response.data.on('data', chunk => {
          data += chunk;
        });
        response.data.on('end', () => {
          resolve(JSON.parse(data));
        });
        response.data.on('error', reject);
      });
    } catch (error) {
      logger.error('❌ Errore download:', error.message);
      throw error;
    }
  }

  async deleteOldBackups(daysToKeep = 30) {
    if (!this.drive || !this.folderId) {
      return;
    }

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const response = await this.drive.files.list({
        q: `'${this.folderId}' in parents and createdTime < '${cutoffDate.toISOString()}' and trashed=false`,
        fields: 'files(id, name, createdTime)'
      });

      if (!response.data.files || response.data.files.length === 0) {
        logger.info('✅ Nessun backup vecchio da eliminare');
        return;
      }

      logger.info(`🗑️ Eliminazione ${response.data.files.length} backup vecchi...`);

      for (const file of response.data.files) {
        await this.drive.files.delete({ fileId: file.id });
        logger.info(`✅ Eliminato: ${file.name}`);
      }

      logger.info(`✅ Pulizia completata`);
    } catch (error) {
      logger.error('❌ Errore pulizia:', error.message);
    }
  }
}

export default new GoogleDriveService();