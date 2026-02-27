// routes/sessions.js - ✅ NUOVO: API sessioni attive e logout remoto
import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import Session from '../models/Session.js';
import logger from '../config/logger.js';

const router = express.Router();

// Tutte le route richiedono autenticazione
router.use(protect);

// ═══════════════════════════════════════════════
// GET /api/sessions - Lista sessioni
// Admin: vede tutte | Operatore: solo le sue
// ═══════════════════════════════════════════════
router.get('/', async (req, res) => {
  try {
    // Prima, pulisci le sessioni scadute
    await Session.pulisciSessioniScadute();

    const filtro = { stato: { $in: ['attiva', 'scaduta'] } };

    // Se NON è admin, mostra solo le proprie sessioni
    if (req.user.role !== 'admin') {
      filtro.userId = req.user._id;
    }

    const sessions = await Session.find(filtro)
      .sort({ ultimaAttivita: -1 })
      .select('-tokenHash -userAgent')
      .lean();

    // Aggiungi info sullo stato calcolato e identifica sessione corrente
    const token = req.headers.authorization?.replace('Bearer ', '');
    const currentTokenHash = token ? Session.hashToken(token) : null;

    const sessionsWithStatus = sessions.map(s => {
      const now = Date.now();
      const lastActivity = new Date(s.ultimaAttivita).getTime();
      const diffMinuti = (now - lastActivity) / 60000;

      let statoVisuale;
      if (s.stato === 'disconnessa') {
        statoVisuale = 'disconnesso';
      } else if (s.stato === 'scaduta') {
        statoVisuale = 'scaduto';
      } else if (diffMinuti < 5) {
        statoVisuale = 'attivo';
      } else {
        statoVisuale = 'inattivo';
      }

      return {
        _id: s._id,
        userId: s.userId,
        username: s.username,
        dispositivo: s.dispositivo,
        browser: s.browser,
        ip: s.ip,
        loginAt: s.loginAt,
        ultimaAttivita: s.ultimaAttivita,
        stato: s.stato,
        statoVisuale,
        disconnessoDa: s.disconnessoDa,
        disconnessoAt: s.disconnessoAt,
        isCurrentSession: false // Sarà sovrascritto sotto
      };
    });

    // Identifica la sessione corrente tramite un check separato
    if (currentTokenHash) {
      const currentSession = await Session.findOne({ tokenHash: currentTokenHash, stato: 'attiva' }).select('_id').lean();
      if (currentSession) {
        const idx = sessionsWithStatus.findIndex(s => s._id.toString() === currentSession._id.toString());
        if (idx !== -1) {
          sessionsWithStatus[idx].isCurrentSession = true;
        }
      }
    }

    res.json({
      success: true,
      count: sessionsWithStatus.length,
      sessions: sessionsWithStatus
    });

  } catch (error) {
    logger.error('[SESSIONS] Errore lista sessioni:', error);
    res.status(500).json({ success: false, message: 'Errore nel recupero sessioni' });
  }
});

// ═══════════════════════════════════════════════
// POST /api/sessions/ping - Aggiorna ultima attività
// ═══════════════════════════════════════════════
router.post('/ping', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(400).json({ success: false, message: 'Token mancante' });
    }

    const session = await Session.aggiornaAttivita(token);
    
    if (!session) {
      return res.status(401).json({ 
        success: false, 
        message: 'Sessione non valida o scaduta',
        sessionInvalid: true
      });
    }

    res.json({ success: true, ultimaAttivita: session.ultimaAttivita });

  } catch (error) {
    logger.error('[SESSIONS] Errore ping:', error);
    res.status(500).json({ success: false, message: 'Errore aggiornamento attività' });
  }
});

// ═══════════════════════════════════════════════
// DELETE /api/sessions/:id - Disconnetti sessione specifica
// Admin: qualsiasi | Operatore: solo le sue
// ═══════════════════════════════════════════════
router.delete('/:id', async (req, res) => {
  try {
    const sessionId = req.params.id;

    // Trova la sessione da disconnettere
    const sessionTarget = await Session.findById(sessionId);
    if (!sessionTarget) {
      return res.status(404).json({ success: false, message: 'Sessione non trovata' });
    }

    // Verifica che non stia disconnettendo la propria sessione corrente
    const token = req.headers.authorization?.replace('Bearer ', '');
    const currentTokenHash = token ? Session.hashToken(token) : null;
    
    // Confronta tramite query diretta (tokenHash non è in select(-tokenHash) della GET)
    const currentSession = await Session.findOne({ tokenHash: currentTokenHash }).select('_id');
    if (currentSession && currentSession._id.toString() === sessionId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Non puoi disconnettere la tua sessione corrente. Usa il logout normale.' 
      });
    }

    // Operatore: può disconnettere solo le SUE sessioni
    if (req.user.role !== 'admin' && sessionTarget.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Non hai i permessi per disconnettere sessioni di altri utenti' 
      });
    }

    // Disconnetti
    await Session.disconnettiSessione(sessionId, req.user.nome || req.user.username);

    logger.info(`[SESSIONS] ✅ Sessione disconnessa: ${sessionTarget.username} (${sessionTarget.dispositivo}) da ${req.user.nome}`);

    res.json({
      success: true,
      message: `Sessione di ${sessionTarget.username} disconnessa con successo`
    });

  } catch (error) {
    logger.error('[SESSIONS] Errore disconnessione sessione:', error);
    res.status(500).json({ success: false, message: 'Errore nella disconnessione' });
  }
});

// ═══════════════════════════════════════════════
// DELETE /api/sessions/all/other - Disconnetti TUTTE le altre sessioni
// Admin: tutte di tutti | Operatore: solo le sue altre
// ═══════════════════════════════════════════════
router.delete('/all/other', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const currentTokenHash = token ? Session.hashToken(token) : null;

    if (!currentTokenHash) {
      return res.status(400).json({ success: false, message: 'Token mancante' });
    }

    let result;
    const disconnessoDa = req.user.nome || req.user.username;

    if (req.user.role === 'admin') {
      // Admin: disconnetti TUTTE le sessioni attive tranne la corrente
      result = await Session.disconnettiTutteLeAltre(currentTokenHash, disconnessoDa);
    } else {
      // Operatore: disconnetti solo le SUE altre sessioni
      result = await Session.disconnettiTutteTranneCorrente(req.user._id, currentTokenHash, disconnessoDa);
    }

    logger.info(`[SESSIONS] ✅ Disconnesse ${result.modifiedCount} sessioni da ${disconnessoDa} (admin: ${req.user.role === 'admin'})`);

    res.json({
      success: true,
      message: `${result.modifiedCount} session${result.modifiedCount === 1 ? 'e' : 'i'} disconness${result.modifiedCount === 1 ? 'a' : 'e'}`,
      disconnesse: result.modifiedCount
    });

  } catch (error) {
    logger.error('[SESSIONS] Errore disconnessione multipla:', error);
    res.status(500).json({ success: false, message: 'Errore nella disconnessione multipla' });
  }
});

export default router;