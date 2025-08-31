// routes/auth.js - ES6 MODULE VERSION
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect, generateToken, adminOnly } from '../middleware/auth.js';
import logger from '../config/logger.js';

const router = express.Router();

// @desc    Login utente
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validazione input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email e password sono richiesti'
      });
    }

    // Cerca utente - accetta email o username
    const user = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: email } // Permetti login anche con username
      ]
    }).select('+password');
    
    if (!user) {
      logger.warn(`[AUTH] Tentativo di login fallito per: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Credenziali non valide'
      });
    }

    // Verifica password
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      logger.warn(`[AUTH] Password errata per: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Credenziali non valide'
      });
    }

    // Verifica se l'utente è attivo
    if (user.isActive === false) {
      return res.status(401).json({
        success: false,
        message: 'Account disattivato'
      });
    }

    // Aggiorna ultimo login
    user.lastLogin = Date.now();
    user.ultimoAccesso = Date.now();
    await user.save();

    // Genera token
    const token = generateToken(user._id);

    // Rimuovi password dalla risposta
    const userResponse = {
      id: user._id,
      nome: user.nome,
      email: user.email,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
      telefono: user.telefono
    };

    logger.info(`[AUTH] Login riuscito per: ${email}`);

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
};

// @desc    Registra nuovo utente
// @route   POST /api/auth/register
// @access  Private/Admin
const register = async (req, res) => {
  try {
    const { nome, email, password, username, role = 'operatore', telefono } = req.body;

    // Validazione input
    if (!nome || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nome, email e password sono richiesti'
      });
    }

    // Verifica se l'email esiste già
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email già registrata'
      });
    }

    // Verifica se username esiste (se fornito)
    if (username) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: 'Username già in uso'
        });
      }
    }

    // Crea nuovo utente
    const user = await User.create({
      nome,
      email: email.toLowerCase(),
      password, // Verrà hashata dal pre-save hook
      username,
      role,
      telefono,
      isActive: true
    });

    // Genera token
    const token = generateToken(user._id);

    // Rimuovi password dalla risposta
    const userResponse = {
      id: user._id,
      nome: user.nome,
      email: user.email,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
      telefono: user.telefono
    };

    logger.info(`[AUTH] Nuovo utente registrato: ${email}`);

    res.status(201).json({
      success: true,
      token,
      user: userResponse
    });

  } catch (error) {
    logger.error('[AUTH] Errore registrazione:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Errore del server durante la registrazione'
    });
  }
};

// @desc    Ottieni utente corrente
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    logger.error('[AUTH] Errore getMe:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero dati utente'
    });
  }
};

// @desc    Cambia password
// @route   POST /api/auth/changepassword
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password attuale e nuova sono richieste'
      });
    }

    // Validazione lunghezza password
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La nuova password deve essere almeno 6 caratteri'
      });
    }

    // Trova utente con password
    const user = await User.findById(req.user.id).select('+password');

    // Verifica password attuale
    const isMatch = await user.matchPassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Password attuale non corretta'
      });
    }

    // Aggiorna password (verrà hashata dal pre-save hook)
    user.password = newPassword;
    await user.save();

    // Genera nuovo token
    const token = generateToken(user._id);

    logger.info(`[AUTH] Password cambiata per: ${user.email}`);

    res.json({
      success: true,
      message: 'Password cambiata con successo',
      token // Nuovo token dopo cambio password
    });

  } catch (error) {
    logger.error('[AUTH] Errore cambio password:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel cambio password'
    });
  }
};

// @desc    Logout utente
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    // In un'app con sessioni, qui puoi invalidare il token
    // Per JWT stateless, il logout è gestito lato client rimuovendo il token
    
    // Opzionale: incrementa tokenVersion per invalidare tutti i token esistenti
    const user = await User.findById(req.user.id);
    if (user) {
      user.tokenVersion = (user.tokenVersion || 0) + 1;
      await user.save();
    }
    
    logger.info(`[AUTH] Logout per: ${req.user.email}`);
    
    res.json({
      success: true,
      message: 'Logout effettuato con successo'
    });
  } catch (error) {
    logger.error('[AUTH] Errore logout:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il logout'
    });
  }
};

// @desc    Verifica validità token
// @route   GET /api/auth/verify
// @access  Public
const verifyToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.json({ valid: false });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'pastificio-secret-key-2024');
    const user = await User.findById(decoded.id);
    
    // Verifica anche tokenVersion se implementato
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
    res.json({ valid: false });
  }
};

// Configurazione routes
router.post('/login', login);
router.post('/register', protect, register); // Rimosso adminOnly per ora
router.get('/me', protect, getMe);
router.post('/changepassword', protect, changePassword);
router.post('/logout', protect, logout);
router.get('/verify', verifyToken);

export default router;