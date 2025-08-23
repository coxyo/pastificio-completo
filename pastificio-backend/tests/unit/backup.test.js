// tests/unit/backup.test.js
import { backupService } from '../../services/backupService.js';
import { Ordine } from '../../models/Ordine.js';
import fs from 'fs/promises';
import path from 'path';

describe('Backup System Tests', () => {
  const testBackupDir = path.join(process.cwd(), 'test-backups');
  
  beforeAll(async () => {
    await fs.mkdir(testBackupDir, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(testBackupDir, { recursive: true, force: true });
  });

  beforeEach(async () => {
    await Ordine.deleteMany({});
  });

  describe('Backup Creation', () => {
    it('dovrebbe creare un backup completo', async () => {
      // Crea alcuni ordini di test
      await Ordine.create({
        nomeCliente: 'Test Cliente',
        telefono: '1234567890',
        dataRitiro: new Date(),
        oraRitiro: '10:00',
        prodotti: [{
          categoria: 'pasta',
          prodotto: 'Test Prodotto',
          quantita: 1,
          prezzo: 10,
          unitaMisura: 'kg'
        }]
      });

      const backup = await backupService.createBackup('test-backup');
      expect(backup.filename).toBeDefined();
      
      const fileExists = await fs.access(backup.path)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(true);
    });

    it('dovrebbe comprimere il backup', async () => {
      const backup = await backupService.createBackup('test-backup', { compress: true });
      expect(backup.filename.endsWith('.gz')).toBe(true);
    });
  });

  describe('Backup Restore', () => {
    it('dovrebbe ripristinare un backup', async () => {
      // Prima crea un backup
      const ordineOriginale = await Ordine.create({
        nomeCliente: 'Test Cliente',
        telefono: '1234567890',
        dataRitiro: new Date(),
        oraRitiro: '10:00',
        prodotti: [{
          categoria: 'pasta',
          prodotto: 'Test Prodotto',
          quantita: 1,
          prezzo: 10,
          unitaMisura: 'kg'
        }]
      });

      const backup = await backupService.createBackup('test-backup');
      
      // Cancella tutti i dati
      await Ordine.deleteMany({});
      
      // Ripristina dal backup
      await backupService.restoreBackup(backup.filename);
      
      const ordiniRipristinati = await Ordine.find({});
      expect(ordiniRipristinati).toHaveLength(1);
      expect(ordiniRipristinati[0].nomeCliente).toBe(ordineOriginale.nomeCliente);
    });
  });

  describe('Backup Management', () => {
    it('dovrebbe elencare i backup disponibili', async () => {
      await backupService.createBackup('test-1');
      await backupService.createBackup('test-2');
      
      const backups = await backupService.listBackups();
      expect(backups).toHaveLength(2);
    });

    it('dovrebbe eliminare i backup vecchi', async () => {
      await backupService.createBackup('old-backup');
      await backupService.createBackup('new-backup');
      
      const deletedCount = await backupService.cleanupOldBackups(0); // elimina tutti i backup più vecchi di 0 giorni
      expect(deletedCount).toBeGreaterThan(0);
      
      const remainingBackups = await backupService.listBackups();
      expect(remainingBackups).toHaveLength(1);
    });
  });
});
