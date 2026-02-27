// routes/auth.js - ✅ AGGIORNATO: Sicurezza completa + blocco tentativi
import express from 'express';
import User from '../models/User.js';
import { protect, generateToken, adminOnly } from '../middleware/auth.js';
import logger from '../config/logger.js';

const router = express.Router();

// ═══════════════════════════════════════════════
// POST /api/auth/login - Login con blocco tentativi
// ═══════════════════════════════════════════════
router.post('/login', async (req, res) => {
  try {
    const { email, password, username } = req.body;
    const loginField = email || username;

    // Validazione input
    if (!loginField || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username/email e password sono richiesti'
      });
    }

    // Cerca utente - accetta email o username
    const user = await User.findOne({
      $or: [
        { email: loginField.toLowerCase() },
        { username: loginField.toLowerCase() }
      ]
    }).select('+password');
    
    if (!user) {
      logger.warn(`[AUTH] Tentativo login - utente non trovato: ${loginField}`);
      return res.status(401).json({
        success: false,
        message: 'Credenziali non valide'
      });
    }

    // ✅ CONTROLLO BLOCCO ACCOUNT
    if (user.isLocked) {
      const minutiRimanenti = Math.ceil((user.lockUntil - Date.now()) / 60000);
      logger.warn(`[AUTH] Account bloccato per: ${loginField} (${minutiRimanenti} min rimanenti)`);
      return res.status(423).json({
        success: false,
        message: `Troppi tentativi falliti. Riprova tra ${minutiRimanenti} minut${minutiRimanenti === 1 ? 'o' : 'i'}`,
        locked: true,
        lockUntil: user.lockUntil,
        minutiRimanenti
      });
    }

    // ✅ Verifica se l'utente è attivo
    if (user.isActive === false) {
      return res.status(401).json({
        success: false,
        message: 'Account disattivato. Contatta l\'amministratore.'
      });
    }

    // ✅ Verifica password
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      // ✅ INCREMENTA TENTATIVI FALLITI
      await user.incrementLoginAttempts();
      
      const tentativiRimanenti = Math.max(0, 5 - (user.loginAttempts + 1));
      
      logger.warn(`[AUTH] Password errata per: ${loginField} (tentativi: ${user.loginAttempts + 1}/5)`);
      
      // Se appena bloccato (5° tentativo)
      if (user.loginAttempts + 1 >= 5) {
        return res.status(423).json({
          success: false,
          message: 'Troppi tentativi falliti. Account bloccato per 15 minuti.',
          locked: true,
          minutiRimanenti: 15
        });
      }
      
      return res.status(401).json({
        success: false,
        message: tentativiRimanenti <= 2 
          ? `Credenziali non valide. ${tentativiRimanenti} tentativ${tentativiRimanenti === 1 ? 'o' : 'i'} rimanent${tentativiRimanenti === 1 ? 'e' : 'i'} prima del blocco.`
          : 'Credenziali non valide'
      });
    }

    // ✅ LOGIN RIUSCITO - Reset tentativi
    await user.resetLoginAttempts();

    // Aggiorna ultimo accesso
    user.lastLogin = Date.now();
    user.ultimoAccesso = Date.now();
    await user.save({ validateBeforeSave: false });

    // ✅ Genera token (scadenza 12h)
    const token = generateToken(user);

    const userResponse = {
      id: user._id,
      nome: user.nome,
      email: user.email,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
      telefono: user.telefono,
      passwordTemporanea: user.passwordTemporanea || false
    };

    logger.info(`[AUTH] ✅ Login riuscito: ${loginField} (ruolo: ${user.role})`);

    res.json({
      success: true,
      token,
      user: userResponse
    });

  } catch (error) {
    logger.error('[AUTH] Errore login:', error);
    res.status(500).json({
      success: false,
      message: 'Errore del server durante il login'
    });
  }
});

// ═══════════════════════════════════════════════
// POST /api/auth/register - Solo Admin può creare utenti
// ═══════════════════════════════════════════════
router.post('/register', protect, adminOnly, async (req, res) => {
  try {
    const { nome, email, password, username, role = 'operatore', telefono } = req.body;

    // Validazione input
    if (!nome || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nome, email e password sono richiesti'
      });
    }

    // Validazione password
    if (password.length < 8 || !/\d/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'La password deve avere almeno 8 caratteri e contenere almeno un numero'
      });
    }

    // Validazione ruolo
    if (!['admin', 'operatore', 'visualizzatore'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Ruolo non valido. Scegli tra: admin, operatore, visualizzatore'
      });
    }

    // Verifica duplicati
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        ...(username ? [{ username: username.toLowerCase() }] : [])
      ]
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email.toLowerCase() 
          ? 'Email già registrata' 
          : 'Username già in uso'
      });
    }

    // Crea utente
    const user = await User.create({
      nome,
      email: email.toLowerCase(),
      password,
      username: username ? username.toLowerCase() : undefined,
      role,
      telefono,
      isActive: true,
      passwordTemporanea: true  // ✅ Password da cambiare al primo accesso
    });

    const userResponse = {
      id: user._id,
      nome: user.nome,
      email: user.email,
      username: user.username,
      role: user.role,
      isActive: user.isActive
    };

    logger.info(`[AUTH] ✅ Nuovo utente creato da ${req.user.nome}: ${email} (ruolo: ${role})`);

    res.status(201).json({
      success: true,
      user: userResponse
    });

  } catch (error) {
    logger.error('[AUTH] Errore registrazione:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Errore del server durante la registrazione'
    });
  }
});

// ═══════════════════════════════════════════════
// GET /api/auth/me - Utente corrente
// ═══════════════════════════════════════════════
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -notificationHistory');
    
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
        lastLogin: user.lastLogin,
        passwordTemporanea: user.passwordTemporanea || false
      }
    });
  } catch (error) {
    logger.error('[AUTH] Errore getMe:', error);
    res.status(500).json({ success: false, message: 'Errore nel recupero dati utente' });
  }
});

// ═══════════════════════════════════════════════
// POST /api/auth/changepassword - Cambio password
// ═══════════════════════════════════════════════
router.post('/changepassword', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password attuale e nuova sono richieste'
      });
    }

    // ✅ Validazione nuova password
    if (newPassword.length < 8 || !/\d/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'La password deve avere almeno 8 caratteri e contenere almeno un numero'
      });
    }

    const user = await User.findById(req.user.id).select('+password');
    const isMatch = await user.matchPassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Password attuale non corretta'
      });
    }

    // Aggiorna password
    user.password = newPassword;
    user.passwordTemporanea = false;  // ✅ Non più temporanea
    await user.save();

    // Genera nuovo token
    const token = generateToken(user);

    logger.info(`[AUTH] ✅ Password cambiata per: ${user.email}`);

    res.json({
      success: true,
      message: 'Password cambiata con successo',
      token
    });

  } catch (error) {
    logger.error('[AUTH] Errore cambio password:', error);
    res.status(500).json({ success: false, message: 'Errore nel cambio password' });
  }
});

// ═══════════════════════════════════════════════
// POST /api/auth/logout
// ═══════════════════════════════════════════════
router.post('/logout', protect, async (req, res) => {
  try {
    // Incrementa tokenVersion per invalidare tutti i token
    const user = await User.findById(req.user.id);
    if (user) {
      user.tokenVersion = (user.tokenVersion || 0) + 1;
      await user.save({ validateBeforeSave: false });
    }
    
    logger.info(`[AUTH] Logout: ${req.user.nome || req.user.email}`);
    
    res.json({ success: true, message: 'Logout effettuato con successo' });
  } catch (error) {
    logger.error('[AUTH] Errore logout:', error);
    res.status(500).json({ success: false, message: 'Errore durante il logout' });
  }
});

// ═══════════════════════════════════════════════
// GET /api/auth/verify - Verifica validità token
// ═══════════════════════════════════════════════
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.json({ valid: false });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'pastificio-secret-key-2024');
    const user = await User.findById(decoded.id);
    
    const isValid = user && 
                   user.isActive !== false && 
                   (user.tokenVersion === undefined || user.tokenVersion === decoded.tokenVersion);

    res.json({ 
      valid: isValid,
      user: isValid ? {
        id: user._id,
        nome: user.nome,
        email: user.email,
        username: user.username,
        role: user.role
      } : null
    });
  } catch (error) {
    res.json({ valid: false, expired: error.name === 'TokenExpiredError' });
  }
});

// Importa jwt per verify endpoint
import jwt from 'jsonwebtoken';

export default router;