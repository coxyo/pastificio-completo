// pastificio-backend/middleware/auth.js
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import logger from '../config/logger.js';

export const protect = async (req, res, next) => {
  try {
    // Estrai il token dall'header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token non fornito'
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Verifica se è un token JWT standard o il formato semplificato
    let decoded;
    let userId;
    
    try {
      // Prima prova a decodificare come JWT
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
    } catch (jwtError) {
      // Se fallisce, prova con il formato semplificato
      const tokenParts = token.split('_');
      
      if (tokenParts.length < 4 || tokenParts[0] !== 'simple' || tokenParts[1] !== 'token') {
        logger.error('Token non valido:', token);
        return res.status(401).json({
          success: false,
          error: 'Token non valido'
        });
      }
      
      userId = tokenParts[2];
    }
    
    // Verifica che userId sia un ObjectId valido
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      logger.error('UserId non valido:', userId);
      return res.status(401).json({
        success: false,
        error: 'Token non valido - ID utente non valido'
      });
    }
    
    // Trova l'utente
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Utente non trovato'
      });
    }
    
    // Aggiungi l'utente alla request con tutti i campi necessari
    req.user = {
      id: user._id.toString(),
      _id: user._id,
      username: user.username,
      email: user.email,
      ruolo: user.ruolo,
      nome: user.nome,
      cognome: user.cognome
    };
    
    logger.debug('Utente autenticato:', {
      id: req.user.id,
      username: req.user.username
    });
    
    next();
    
  } catch (error) {
    logger.error('Errore middleware auth:', error);
    res.status(500).json({
      success: false,
      error: 'Errore di autenticazione'
    });
  }
};

export const authorize = (...ruoli) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Non autenticato'
      });
    }
    
    if (!ruoli.includes(req.user.ruolo)) {
      logger.warn('Tentativo di accesso non autorizzato:', {
        userId: req.user.id,
        ruolo: req.user.ruolo,
        ruoliRichiesti: ruoli
      });
      
      return res.status(403).json({
        success: false,
        error: 'Non autorizzato per questa operazione'
      });
    }
    
    next();
  };
};

// Middleware opzionale per verificare se l'utente è attivo
export const checkUserActive = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user || !user.attivo) {
      return res.status(403).json({
        success: false,
        error: 'Account non attivo'
      });
    }
    
    next();
  } catch (error) {
    logger.error('Errore verifica utente attivo:', error);
    res.status(500).json({
      success: false,
      error: 'Errore di verifica account'
    });
  }
};

// Middleware per logging delle azioni
export const logAction = (action) => {
  return (req, res, next) => {
    logger.info(`Azione: ${action}`, {
      userId: req.user?.id,
      username: req.user?.username,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
    next();
  };
};