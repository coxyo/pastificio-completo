import { google } from 'googleapis';
import { authenticate } from '@google-cloud/local-auth';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Percorsi dei file
const CREDENTIALS_PATH = path.join(__dirname, '..', 'google-credentials-oauth.json');
const TOKEN_PATH = path.join(__dirname, '..', 'google-token.json');

// Nome della cartella di backup
const BACKUP_FOLDER_NAME = 'Pastificio_Backup';

// Scopes necessari
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

class GoogleDriveService {
  constructor() {
    this.drive = null;
    this.auth = null;
    this.folderId = null;
    logger.info(`GoogleDriveService inizializzato`);
  }

  async loadSavedCredentialsIfExist() {
    try {
      const content = await fs.readFile(TOKEN_PATH);
      const credentials = JSON.parse(content.toString());
      return google.auth.fromJSON(credentials);
    } catch (err) {
      return null;
    }
  }

  async saveCredentials(client) {
    const content = await fs.readFile(CREDENTIALS_PATH);
    const keys = JSON.parse(content.toString());
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
      type: 'authorized_user',
      client_id: key.client_id,
      client_secret: key.client_secret,
      refresh_token: client.credentials.refresh_token,
    });
    await fs.writeFile(TOKEN_PATH, payload);
  }

  async authorize() {
    let client = await this.loadSavedCredentialsIfExist();
    if (client) {
      return client;
    }
    
    logger.info('Prima autenticazione OAuth2 richiesta. Segui le istruzioni nel browser...');
    
    client = await authenticate({
      scopes: SCOPES,
      keyfilePath: CREDENTIALS_PATH,
    });
    
    if (client.credentials) {
      await this.saveCredentials(client);
    }
    
    return client;
  }

  async initialize() {
    try {
      // Verifica che il file delle credenziali OAuth esista
      try {
        await fs.access(CREDENTIALS_PATH);
      } catch (error) {
        logger.error('File credenziali OAuth non trovato. Scarica le credenziali OAuth2 da Google Cloud Console.');
        logger.error(`Percorso atteso: ${CREDENTIALS_PATH}`);
        return false;
      }

      // Autorizza
      this.auth = await this.authorize();
      this.drive = google.drive({ version: 'v3', auth: this.auth });
      
      // Cerca o crea la cartella di backup
      try {
        logger.info(`Ricerca cartella "${BACKUP_FOLDER_NAME}"...`);
        
        const response = await this.drive.files.list({
          q: `name='${BACKUP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
          fields: 'files(id, name)',
          spaces: 'drive'
        });

        if (response.data.files && response.data.files.length > 0) {
          this.folderId = response.data.files[0].id;
          logger.info(`Cartella trovata: ${BACKUP_FOLDER_NAME} (ID: ${this.folderId})`);
        } else {
          logger.info(`Cartella "${BACKUP_FOLDER_NAME}" non trovata. Creo una nuova cartella...`);
          
          const createResponse = await this.drive.files.create({
            requestBody: {
              name: BACKUP_FOLDER_NAME,
              mimeType: 'application/vnd.google-apps.folder'
            },
            fields: 'id, webViewLink'
          });
          
          this.folderId = createResponse.data.id;
          logger.info(`Cartella creata: ${BACKUP_FOLDER_NAME} (ID: ${this.folderId})`);
          logger.info(`Link alla cartella: ${createResponse.data.webViewLink}`);
        }
      } catch (error) {
        logger.error('Errore nella gestione della cartella:', error.message);
        return false;
      }
      
      logger.info('Google Drive inizializzato con successo con OAuth2');
      return true;
    } catch (error) {
      logger.error('Errore inizializzazione Google Drive:', error);
      return false;
    }
  }

  async uploadBackup(fileName, fileContent) {
    if (!this.drive || !this.folderId) {
      throw new Error('Google Drive non inizializzato');
    }

    try {
      logger.info(`Tentativo upload in cartella: ${this.folderId}`);
      
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
        fields: 'id, name, createdTime, webViewLink'
      });

      logger.info(`Backup caricato su Google Drive: ${fileName} (ID: ${response.data.id})`);
      logger.info(`Link al file: ${response.data.webViewLink}`);
      return response.data;
    } catch (error) {
      logger.error('Errore dettagliato upload Google Drive:', {
        message: error.message,
        code: error.code,
        errors: error.errors
      });
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
        fields: 'files(id, name, createdTime, size)',
        orderBy: 'createdTime desc',
        pageSize: limit
      });

      logger.info(`Lista backup recuperata: ${response.data.files.length} file trovati`);
      return response.data.files || [];
    } catch (error) {
      logger.error('Errore lista backup Google Drive:', error);
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
      });

      return response.data;
    } catch (error) {
      logger.error('Errore download backup da Google Drive:', error);
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

      for (const file of response.data.files) {
        await this.drive.files.delete({ 
          fileId: file.id
        });
        logger.info(`Backup eliminato da Google Drive: ${file.name}`);
      }
    } catch (error) {
      logger.error('Errore eliminazione vecchi backup:', error);
    }
  }
}

export default new GoogleDriveService();