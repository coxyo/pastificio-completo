// routes/users.js - ✅ NUOVO: Gestione Utenti (solo Admin)
import express from 'express';
import User from '../models/User.js';
import { protect, adminOnly } from '../middleware/auth.js';
import logger from '../config/logger.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Tutte le routes richiedono admin
router.use(protect);
router.use(adminOnly);

// ═══════════════════════════════════════════════
// GET /api/users - Lista tutti gli utenti
// ═══════════════════════════════════════════════
router.get('/', async (req, res) => {
  try {
    const users = await User.find()
      .select('-password -notificationHistory -resetPasswordToken -resetPasswordExpire')
      .sort({ role: 1, nome: 1 });

    res.json({
      success: true,
      count: users.length,
      users: users.map(u => ({
        id: u._id,
        nome: u.nome,
        email: u.email,
        username: u.username,
        role: u.role,
        isActive: u.isActive,
        telefono: u.telefono,
        lastLogin: u.lastLogin || u.ultimoAccesso,
        loginAttempts: u.loginAttempts || 0,
        isLocked: !!(u.lockUntil && u.lockUntil > Date.now()),
        lockUntil: u.lockUntil,
        passwordTemporanea: u.passwordTemporanea || false,
        createdAt: u.createdAt
      }))
    });
  } catch (error) {
    logger.error('[USERS] Errore lista utenti:', error);
    res.status(500).json({ success: false, message: 'Errore nel recupero utenti' });
  }
});

// ═══════════════════════════════════════════════
// GET /api/users/:id - Dettaglio utente
// ═══════════════════════════════════════════════
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -notificationHistory -resetPasswordToken -resetPasswordExpire');

    if (!user) {
      return res.status(404).json({ success: false, message: 'Utente non trovato' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        nome: user.nome,
        email: user.email,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
        telefono: user.telefono,
        lastLogin: user.lastLogin || user.ultimoAccesso,
        loginAttempts: user.loginAttempts || 0,
        isLocked: !!(user.lockUntil && user.lockUntil > Date.now()),
        passwordTemporanea: user.passwordTemporanea || false,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    logger.error('[USERS] Errore dettaglio utente:', error);
    res.status(500).json({ success: false, message: 'Errore nel recupero utente' });
  }
});

// ═══════════════════════════════════════════════
// PUT /api/users/:id - Modifica utente (ruolo, nome, telefono, attivo)
// ═══════════════════════════════════════════════
router.put('/:id', async (req, res) => {
  try {
    const { nome, role, telefono, isActive } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utente non trovato' });
    }

    // ✅ Non permettere di modificare se stessi (per evitare auto-downgrade)
    if (req.params.id === req.user.id.toString() && role && role !== req.user.role) {
      return res.status(400).json({ 
        success: false, 
        message: 'Non puoi modificare il tuo stesso ruolo' 
      });
    }

    // Aggiorna campi
    if (nome !== undefined) user.nome = nome;
    if (role !== undefined) {
      if (!['admin', 'operatore', 'visualizzatore'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Ruolo non valido' });
      }
      user.role = role;
    }
    if (telefono !== undefined) user.telefono = telefono;
    if (isActive !== undefined) {
      // ✅ Non permettere di disattivare se stessi
      if (req.params.id === req.user.id.toString() && !isActive) {
        return res.status(400).json({ 
          success: false, 
          message: 'Non puoi disattivare il tuo stesso account' 
        });
      }
      user.isActive = isActive;
      
      // Se disattivato, invalida le sessioni
      if (!isActive) {
        user.tokenVersion = (user.tokenVersion || 0) + 1;
      }
    }

    await user.save({ validateBeforeSave: false });

    logger.info(`[USERS] ✅ Utente modificato da ${req.user.nome}: ${user.nome} (${user.email})`);

    res.json({
      success: true,
      message: 'Utente aggiornato con successo',
      user: {
        id: user._id,
        nome: user.nome,
        email: user.email,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
        telefono: user.telefono
      }
    });
  } catch (error) {
    logger.error('[USERS] Errore modifica utente:', error);
    res.status(500).json({ success: false, message: 'Errore nella modifica utente' });
  }
});

// ═══════════════════════════════════════════════
// POST /api/users/:id/reset-password - Reset password (genera temporanea)
// ═══════════════════════════════════════════════
router.post('/:id/reset-password', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utente non trovato' });
    }

    // Genera password temporanea: nome + 4 cifre casuali
    const nomeBase = user.nome.toLowerCase().replace(/\s+/g, '');
    const randomNum = Math.floor(1000 + Math.random() * 9000); // 4 cifre
    const tempPassword = `${nomeBase}${randomNum}`;

    // Aggiorna password
    user.password = tempPassword;
    user.passwordTemporanea = true;
    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    logger.info(`[USERS] ✅ Password resettata per ${user.nome} da ${req.user.nome}`);

    res.json({
      success: true,
      message: `Password resettata con successo`,
      tempPassword  // ✅ Mostra la password temporanea all'admin
    });
  } catch (error) {
    logger.error('[USERS] Errore reset password:', error);
    res.status(500).json({ success: false, message: 'Errore nel reset password' });
  }
});

// ═══════════════════════════════════════════════
// POST /api/users/:id/unlock - Sblocca account
// ═══════════════════════════════════════════════
router.post('/:id/unlock', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utente non trovato' });
    }

    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save({ validateBeforeSave: false });

    logger.info(`[USERS] ✅ Account sbloccato per ${user.nome} da ${req.user.nome}`);

    res.json({
      success: true,
      message: `Account di ${user.nome} sbloccato con successo`
    });
  } catch (error) {
    logger.error('[USERS] Errore sblocco account:', error);
    res.status(500).json({ success: false, message: 'Errore nello sblocco account' });
  }
});

// ═══════════════════════════════════════════════
// POST /api/users/:id/force-logout - Logout forzato (invalida sessioni)
// ═══════════════════════════════════════════════
router.post('/:id/force-logout', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utente non trovato' });
    }

    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save({ validateBeforeSave: false });

    logger.info(`[USERS] ✅ Logout forzato per ${user.nome} da ${req.user.nome}`);

    res.json({
      success: true,
      message: `Sessioni di ${user.nome} terminate`
    });
  } catch (error) {
    logger.error('[USERS] Errore force-logout:', error);
    res.status(500).json({ success: false, message: 'Errore nel logout forzato' });
  }
});

export default router;