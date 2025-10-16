// services/s3Service.js
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import logger from '../config/logger.js';

class S3Service {
  constructor() {
    // Configurazione client S3
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'eu-north-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
    
    this.bucket = process.env.AWS_S3_BUCKET || 'pastificio-backups-2025';
    this.isConfigured = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
    
    if (this.isConfigured) {
      logger.info('✅ AWS S3 Service inizializzato', {
        bucket: this.bucket,
        region: process.env.AWS_REGION
      });
    } else {
      logger.warn('⚠️ AWS S3 non configurato - credenziali mancanti');
    }
  }

  /**
   * Carica un file su S3
   */
  async uploadFile(fileName, fileContent, metadata = {}) {
    try {
      if (!this.isConfigured) {
        throw new Error('AWS S3 non configurato');
      }

      logger.info(`📤 Upload S3: ${fileName}`);

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: fileName,
        Body: fileContent,
        ContentType: 'application/json',
        Metadata: {
          createdAt: new Date().toISOString(),
          ...metadata
        }
      });

      await this.s3Client.send(command);

      logger.info(`✅ File caricato su S3: ${fileName}`);

      return {
        success: true,
        fileName,
        bucket: this.bucket,
        url: `s3://${this.bucket}/${fileName}`
      };
    } catch (error) {
      logger.error('❌ Errore upload S3:', error);
      throw error;
    }
  }

  /**
   * Scarica un file da S3
   */
  async downloadFile(fileName) {
    try {
      if (!this.isConfigured) {
        throw new Error('AWS S3 non configurato');
      }

      logger.info(`📥 Download S3: ${fileName}`);

      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: fileName
      });

      const response = await this.s3Client.send(command);
      const fileContent = await response.Body.transformToString();

      logger.info(`✅ File scaricato da S3: ${fileName}`);

      return {
        success: true,
        fileName,
        content: fileContent,
        metadata: response.Metadata
      };
    } catch (error) {
      logger.error('❌ Errore download S3:', error);
      throw error;
    }
  }

  /**
   * Lista tutti i backup su S3
   */
  async listBackups() {
    try {
      if (!this.isConfigured) {
        logger.warn('AWS S3 non configurato');
        return [];
      }

      logger.info('📋 Recupero lista backup da S3...');

      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: 'backup_'
      });

      const response = await this.s3Client.send(command);
      const files = response.Contents || [];

      const backups = files
        .filter(file => file.Key.endsWith('.json'))
        .map(file => ({
          id: file.Key,
          name: file.Key,
          size: file.Size,
          createdAt: file.LastModified.toISOString(),
          createdTime: file.LastModified.toISOString(),
          location: 's3',
          bucket: this.bucket
        }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      logger.info(`📋 Trovati ${backups.length} backup su S3`);

      return backups;
    } catch (error) {
      logger.error('❌ Errore lista backup S3:', error);
      return [];
    }
  }

  /**
   * Elimina un file da S3
   */
  async deleteFile(fileName) {
    try {
      if (!this.isConfigured) {
        throw new Error('AWS S3 non configurato');
      }

      logger.info(`🗑️ Eliminazione S3: ${fileName}`);

      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: fileName
      });

      await this.s3Client.send(command);

      logger.info(`✅ File eliminato da S3: ${fileName}`);

      return { success: true };
    } catch (error) {
      logger.error('❌ Errore eliminazione S3:', error);
      throw error;
    }
  }

  /**
   * Elimina backup vecchi (retention policy)
   */
  async cleanupOldBackups(retentionDays = 30) {
    try {
      if (!this.isConfigured) {
        logger.warn('AWS S3 non configurato - skip cleanup');
        return { deleted: 0 };
      }

      const backups = await this.listBackups();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const toDelete = backups.filter(backup => 
        new Date(backup.createdAt) < cutoffDate
      );

      logger.info(`🗑️ Backup da eliminare: ${toDelete.length}/${backups.length}`);

      for (const backup of toDelete) {
        await this.deleteFile(backup.name);
      }

      logger.info(`✅ Cleanup completato: ${toDelete.length} backup eliminati`);

      return {
        deleted: toDelete.length,
        remaining: backups.length - toDelete.length
      };
    } catch (error) {
      logger.error('❌ Errore cleanup S3:', error);
      return { deleted: 0, error: error.message };
    }
  }
}

export default new S3Service();


