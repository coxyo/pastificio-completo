// routes/export.js
import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import exportService from '../services/exportService.js';
import logger from '../config/logger.js';

const router = express.Router();

// Tutte le route richiedono autenticazione
router.use(protect);

// Export ordini
router.post('/ordini', async (req, res) => {
  try {
    const { format = 'excel', startDate, endDate } = req.body;
    
    const result = await exportService.exportPeriodData(
      new Date(startDate),
      new Date(endDate),
      format
    );
    
    res.json({
      success: true,
      ...result,
      downloadUrl: `/exports/${result.filename}`
    });
    
  } catch (error) {
    logger.error('Errore export ordini:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante l\'export'
    });
  }
});

// Download file export
router.get('/download/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filepath = path.join(exportService.exportPath, filename);
    
    // Verifica che il file esista
    await fs.access(filepath);
    
    res.download(filepath);
    
  } catch (error) {
    res.status(404).json({
      success: false,
      error: 'File non trovato'
    });
  }
});

export default router;