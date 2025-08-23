// controllers/authController.js
import User from '../models/User.js';
import logger from '../config/logger.js';
import jwt from 'jsonwebtoken';

// @desc    Registrazione utente
// @route   POST /api/auth/register
// @access  Pubblico
export const register = async (req, res) => {
  try {
    const { nome, cognome, username, email, password, ruolo = 'user' } = req.body;
    
    // Verifica se l'utente esiste già
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    
    if (userExists) {
      return res.status(400).json({
        success: false,
        error: 'Utente già registrato con questa email o username'
      });
    }
    
    // Crea l'utente
    const user = await User.create({
      nome,
      cognome,
      username,
      email,
      password,
      ruolo
    });
    
    // Log della registrazione
    logger.info(`Nuovo utente registrato: ${user._id}`, {
      service: 'authController',
      userId: user._id,
      email
    });
    
    // Genera token
    const token = user.getSignedJwtToken();
    
    // Risposta con token
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        nome: user.nome,
        cognome: user.cognome,
        email: user.email,
        username: user.username,
        ruolo: user.ruolo
      }
    });
  } catch (error) {
    logger.error(`Errore nella registrazione: ${error.message}`, {
      service: 'authController',
      error
    });
    
    res.status(500).json({
      success: false,
      error: 'Errore durante la registrazione'
    });
  }
};

// @desc    Login utente
// @route   POST /api/auth/login
// @access  Pubblico
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Valida email e password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Fornire email e password'
      });
    }
    
    // Cerca l'utente
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Credenziali non valide'
      });
    }
    
    // Verifica se l'utente è attivo
    if (!user.attivo) {
      return res.status(401).json({
        success: false,
        error: 'Account disattivato'
      });
    }
    
    // Controlla la password
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Credenziali non valide'
      });
    }
    
    // Aggiorna l'ultimo accesso
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });
    
    // Genera token
    const token = user.getSignedJwtToken();
    
    // Log del login
    logger.info(`Utente loggato: ${user._id}`, {
      service: 'authController',
      userId: user._id,
      email
    });
    
    // Risposta con token
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        nome: user.nome,
        cognome: user.cognome,
        email: user.email,
        username: user.username,
        ruolo: user.ruolo
      }
    });
  } catch (error) {
    logger.error(`Errore nel login: ${error.message}`, {
      service: 'authController',
      error
    });
    
    res.status(500).json({
      success: false,
      error: 'Errore durante il login'
    });
  }
};

// @desc    Get utente corrente
// @route   GET /api/auth/me
// @access  Privato
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        nome: user.nome,
        cognome: user.cognome,
        email: user.email,
        username: user.username,
        ruolo: user.ruolo,
        lastLogin: user.lastLogin,
        notificationPreferences: user.notificationPreferences
      }
    });
  } catch (error) {
    logger.error(`Errore nel recupero utente: ${error.message}`, {
      service: 'authController',
      error,
      userId: req.user.id
    });
    
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dati utente'
    });
  }
};

// @desc    Aggiorna profilo utente
// @route   PUT /api/auth/me
// @access  Privato
export const updateMe = async (req, res) => {
  try {
    const { nome, cognome, phone } = req.body;
    
    // Crea oggetto con campi da aggiornare
    const fieldsToUpdate = {};
    if (nome) fieldsToUpdate.nome = nome;
    if (cognome) fieldsToUpdate.cognome = cognome;
    if (phone) fieldsToUpdate.phone = phone;
    
    // Aggiorna utente
    const user = await User.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    );
    
    // Log dell'aggiornamento
    logger.info(`Profilo utente aggiornato: ${user._id}`, {
      service: 'authController',
      userId: user._id
    });
    
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        nome: user.nome,
        cognome: user.cognome,
        email: user.email,
        username: user.username,
        phone: user.phone,
        ruolo: user.ruolo
      }
    });
  } catch (error) {
    logger.error(`Errore nell'aggiornamento utente: ${error.message}`, {
      service: 'authController',
      error,
      userId: req.user.id
    });
    
    res.status(500).json({
      success: false,
      error: 'Errore nell\'aggiornamento profilo'
    });
  }
};

// @desc    Aggiorna preferenze notifiche
// @route   PUT /api/auth/me/notifications
// @access  Privato
export const updateNotificationPreferences = async (req, res) => {
  try {
    const { notificationPreferences } = req.body;
    
    // Aggiorna utente
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { notificationPreferences },
      { new: true, runValidators: true }
    );
    
    // Log dell'aggiornamento
    logger.info(`Preferenze notifiche aggiornate: ${user._id}`, {
      service: 'authController',
      userId: user._id
    });
    
    res.status(200).json({
      success: true,
      data: {
        notificationPreferences: user.notificationPreferences
      }
    });
  } catch (error) {
    logger.error(`Errore nell'aggiornamento preferenze notifiche: ${error.message}`, {
      service: 'authController',
      error,
      userId: req.user.id
    });
    
    res.status(500).json({
      success: false,
      error: 'Errore nell\'aggiornamento preferenze notifiche'
    });
  }
};

// @desc    Logout utente (invalidazione token)
// @route   POST /api/auth/logout
// @access  Privato
export const logout = async (req, res) => {
  try {
    // Incrementa version del token per invalidare tutte le sessioni
    await req.user.incrementTokenVersion();
    
    // Log del logout
    logger.info(`Utente logout: ${req.user.id}`, {
      service: 'authController',
      userId: req.user.id
    });
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    logger.error(`Errore nel logout: ${error.message}`, {
      service: 'authController',
      error,
      userId: req.user.id
    });
    
    res.status(500).json({
      success: false,
      error: 'Errore durante il logout'
    });
  }
};

// @desc    Lista utenti (solo admin)
// @route   GET /api/auth/users
// @access  Privato/Admin
export const getUsers = async (req, res) => {
  try {
    // Verifica che l'utente sia admin
    if (req.user.ruolo !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Non autorizzato ad accedere a questa risorsa'
      });
    }
    
    const users = await User.find().select('-notificationPreferences');
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    logger.error(`Errore nel recupero utenti: ${error.message}`, {
      service: 'authController',
      error,
      userId: req.user.id
    });
    
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero utenti'
    });
  }
};

// @desc    Cambio password
// @route   PUT /api/auth/me/password
// @access  Privato
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Valida input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Fornire password attuale e nuova password'
      });
    }
    
    // Ottieni l'utente con la password
    const user = await User.findById(req.user.id).select('+password');
    
    // Verifica password attuale
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Password attuale non corretta'
      });
    }
    
    // Aggiorna password
    user.password = newPassword;
    await user.save();
    
    // Incrementa version del token per invalidare tutte le sessioni eccetto quella corrente
    await user.incrementTokenVersion();
    
    // Genera nuovo token
    const token = user.getSignedJwtToken();
    
    // Log del cambio password
    logger.info(`Password cambiata: ${user._id}`, {
      service: 'authController',
      userId: user._id
    });
    
    res.status(200).json({
      success: true,
      token
    });
  } catch (error) {
    logger.error(`Errore nel cambio password: ${error.message}`, {
      service: 'authController',
      error,
      userId: req.user.id
    });
    
    res.status(500).json({
      success: false,
      error: 'Errore durante il cambio password'
    });
  }
};