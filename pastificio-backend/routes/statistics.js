// routes/statistics.js
import express from 'express';
import { protect } from '../middleware/auth.js';
import statisticsService from '../services/statisticsService.js';
import logger from '../config/logger.js';

const router = express.Router();

router.use(protect);

// Statistiche vendite
router.get('/vendite', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const stats = await statisticsService.getVenditePeriodo(
      new Date(startDate),
      new Date(endDate)
    );
    
    res.json({ success: true, data: stats });
    
  } catch (error) {
    logger.error('Errore statistiche vendite:', error);
    res.status(500).json({
      success: false,
      error: 'Errore recupero statistiche'
    });
  }
});

// Top prodotti
router.get('/prodotti/top', async (req, res) => {
  try {
    const { limit = 10, periodo = 'mese' } = req.query;
    
    const topProdotti = await statisticsService.getTopProdotti(
      parseInt(limit),
      periodo
    );
    
    res.json({ success: true, data: topProdotti });
    
  } catch (error) {
    logger.error('Errore top prodotti:', error);
    res.status(500).json({
      success: false,
      error: 'Errore recupero top prodotti'
    });
  }
});

// Top clienti
router.get('/clienti/top', async (req, res) => {
  try {
    const { limit = 10, periodo = 'mese' } = req.query;
    
    const topClienti = await statisticsService.getTopClienti(
      parseInt(limit),
      periodo
    );
    
    res.json({ success: true, data: topClienti });
    
  } catch (error) {
    logger.error('Errore top clienti:', error);
    res.status(500).json({
      success: false,
      error: 'Errore recupero top clienti'
    });
  }
});

// Trend vendite
router.get('/trend', async (req, res) => {
  try {
    const { giorni = 30 } = req.query;
    
    const trend = await statisticsService.getTrendVendite(parseInt(giorni));
    
    res.json({ success: true, data: trend });
    
  } catch (error) {
    logger.error('Errore trend vendite:', error);
    res.status(500).json({
      success: false,
      error: 'Errore recupero trend'
    });
  }
});

// Previsioni
router.get('/previsioni', async (req, res) => {
  try {
    const { giorni = 7 } = req.query;
    
    const previsioni = await statisticsService.getPrevisioniVendite(
      parseInt(giorni)
    );
    
    res.json({ success: true, data: previsioni });
    
  } catch (error) {
    logger.error('Errore previsioni:', error);
    res.status(500).json({
      success: false,
      error: 'Errore calcolo previsioni'
    });
  }
});

// Report completo
router.get('/report', async (req, res) => {
  try {
    const { periodo = 'mese' } = req.query;
    
    const report = await statisticsService.getReportCompleto(periodo);
    
    res.json({ success: true, data: report });
    
  } catch (error) {
    logger.error('Errore report:', error);
    res.status(500).json({
      success: false,
      error: 'Errore generazione report'
    });
  }
});

export default router;