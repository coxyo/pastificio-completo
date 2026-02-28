// controllers/alertsController.js - Controller API alert
import Alert from '../models/Alert.js';
import AlertConfig from '../models/AlertConfig.js';
import alertsChecker from '../jobs/alertsChecker.js';
import logger from '../config/logger.js';

const alertsController = {

  // ═══════════════════════════════════════════════════════════════
  // GET /api/alerts - Lista alert (filtro: non letti, ultimi 7 giorni)
  // ═══════════════════════════════════════════════════════════════
  getAlerts: async (req, res) => {
    try {
      const { 
        letto, 
        tipo, 
        priorita, 
        limit = 50, 
        skip = 0,
        giorni = 30  // Default: ultimi 30 giorni
      } = req.query;
      
      const filtro = {};
      
      // Filtro per stato lettura
      if (letto === 'false') filtro.letto = false;
      if (letto === 'true') filtro.letto = true;
      
      // Filtro per tipo
      if (tipo) filtro.tipo = tipo;
      
      // Filtro per priorità
      if (priorita) filtro.priorita = priorita;
      
      // Filtro temporale
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - parseInt(giorni));
      filtro.createdAt = { $gte: dataLimite };
      
      const [alerts, totale, nonLetti] = await Promise.all([
        Alert.find(filtro)
          .sort({ createdAt: -1 })
          .limit(parseInt(limit))
          .skip(parseInt(skip))
          .lean(),
        Alert.countDocuments(filtro),
        Alert.countNonLetti()
      ]);
      
      res.json({
        success: true,
        alerts,
        totale,
        nonLetti,
        pagina: Math.floor(parseInt(skip) / parseInt(limit)) + 1,
        pagineTotali: Math.ceil(totale / parseInt(limit))
      });
      
    } catch (error) {
      logger.error('[ALERTS API] Errore getAlerts:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // GET /api/alerts/count - Conteggio non letti (per badge)
  // ═══════════════════════════════════════════════════════════════
  getCount: async (req, res) => {
    try {
      const nonLetti = await Alert.countNonLetti();
      
      // Conta anche per priorità
      const critici = await Alert.countDocuments({ letto: false, priorita: 'critico' });
      const attenzione = await Alert.countDocuments({ letto: false, priorita: 'attenzione' });
      const informativi = await Alert.countDocuments({ letto: false, priorita: 'informativo' });
      
      res.json({
        success: true,
        nonLetti,
        critici,
        attenzione,
        informativi
      });
      
    } catch (error) {
      logger.error('[ALERTS API] Errore getCount:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // PUT /api/alerts/:id/read - Segna come letto
  // ═══════════════════════════════════════════════════════════════
  segnaLetto: async (req, res) => {
    try {
      const alert = await Alert.findByIdAndUpdate(
        req.params.id,
        {
          letto: true,
          lettoDa: req.user?.nome || 'utente',
          lettoIl: new Date()
        },
        { new: true }
      );
      
      if (!alert) {
        return res.status(404).json({ success: false, message: 'Alert non trovato' });
      }
      
      const nonLetti = await Alert.countNonLetti();
      
      res.json({ success: true, alert, nonLetti });
      
    } catch (error) {
      logger.error('[ALERTS API] Errore segnaLetto:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // PUT /api/alerts/read-all - Segna tutti come letti
  // ═══════════════════════════════════════════════════════════════
  segnaLettiTutti: async (req, res) => {
    try {
      const result = await Alert.segnaLettiTutti(req.user?.nome || 'utente');
      
      res.json({
        success: true,
        modificati: result.modifiedCount,
        nonLetti: 0
      });
      
    } catch (error) {
      logger.error('[ALERTS API] Errore segnaLettiTutti:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // DELETE /api/alerts/:id - Elimina singolo alert
  // ═══════════════════════════════════════════════════════════════
  eliminaAlert: async (req, res) => {
    try {
      const alert = await Alert.findByIdAndDelete(req.params.id);
      
      if (!alert) {
        return res.status(404).json({ success: false, message: 'Alert non trovato' });
      }
      
      res.json({ success: true, message: 'Alert eliminato' });
      
    } catch (error) {
      logger.error('[ALERTS API] Errore eliminaAlert:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // GET /api/alerts/config - Configurazione attuale
  // ═══════════════════════════════════════════════════════════════
  getConfig: async (req, res) => {
    try {
      // Assicurati che i defaults esistano
      await AlertConfig.inizializzaDefaults();
      
      const configs = await AlertConfig.find().sort({ tipo: 1 }).lean();
      
      res.json({ success: true, configs });
      
    } catch (error) {
      logger.error('[ALERTS API] Errore getConfig:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // PUT /api/alerts/config - Aggiorna configurazione
  // ═══════════════════════════════════════════════════════════════
  updateConfig: async (req, res) => {
    try {
      const { configs } = req.body;
      
      if (!configs || !Array.isArray(configs)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Array "configs" richiesto' 
        });
      }
      
      const risultati = [];
      
      for (const config of configs) {
        const aggiornamento = {
          attivo: config.attivo,
          modificatoDa: req.user?.nome || 'admin',
          modificatoIl: new Date()
        };
        
        if (config.soglia !== undefined) aggiornamento.soglia = config.soglia;
        if (config.sogliaMax !== undefined) aggiornamento.sogliaMax = config.sogliaMax;
        
        const updated = await AlertConfig.findOneAndUpdate(
          { tipo: config.tipo },
          { $set: aggiornamento },
          { new: true }
        );
        
        if (updated) risultati.push(updated);
      }
      
      res.json({
        success: true,
        message: `${risultati.length} configurazioni aggiornate`,
        configs: risultati
      });
      
    } catch (error) {
      logger.error('[ALERTS API] Errore updateConfig:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // POST /api/alerts/check - Trigger manuale controlli (per test)
  // ═══════════════════════════════════════════════════════════════
  triggerCheck: async (req, res) => {
    try {
      const { tipo = 'tutti' } = req.body;
      
      const alerts = await alertsChecker.eseguiOra(tipo);
      
      res.json({
        success: true,
        message: `Controllo "${tipo}" completato`,
        alertsGenerati: alerts.length,
        alerts: alerts.map(a => ({
          _id: a._id,
          tipo: a.tipo,
          priorita: a.priorita,
          titolo: a.titolo
        }))
      });
      
    } catch (error) {
      logger.error('[ALERTS API] Errore triggerCheck:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // GET /api/alerts/status - Status sistema alert
  // ═══════════════════════════════════════════════════════════════
  getStatus: async (req, res) => {
    try {
      const checkerStatus = alertsChecker.getStatus();
      const nonLetti = await Alert.countNonLetti();
      const totaleAlert = await Alert.countDocuments();
      
      res.json({
        success: true,
        checker: checkerStatus,
        alert: { nonLetti, totale: totaleAlert }
      });
      
    } catch (error) {
      logger.error('[ALERTS API] Errore getStatus:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

export default alertsController;