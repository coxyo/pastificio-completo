import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import backupService from '../services/backupService.js';
import logger from '../config/logger.js';

const router = express.Router();

// Solo admin possono gestire i backup
router.use(protect);

// GET /api/backup/list
router.get('/list', async (req, res) => {
  try {
    const backups = await backupService.listBackups();
    res.json({ success: true, data: backups });
  } catch (error) {
    logger.error('Errore lista backup:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/backup/create
router.post('/create', async (req, res) => {
  try {
    const result = await backupService.createBackup();
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Errore creazione backup:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/backup/restore
router.post('/restore', async (req, res) => {
  try {
    const { fileName, fromDrive } = req.body;
    const result = await backupService.restoreBackup(fileName, fromDrive);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Errore ripristino backup:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;