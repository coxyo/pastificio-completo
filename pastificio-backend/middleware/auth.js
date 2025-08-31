// middleware/auth.js - ES6 MODULES VERSION
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Middleware di protezione principale
export const protect = async (req, res, next) => {
  let token;

  try {
    // Controlla se c'è l'header Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // Estrai il token
      token = req.headers.authorization.split(' ')[1];
    } else if (req.headers.authorization) {
      // Se manca "Bearer", usa direttamente il token
      token = req.headers.authorization;
    }

    // Se non c'è token
    if (!token) {
      console.log('[AUTH] Nessun token fornito');
      return res.status(401).json({ 
        success: false, 
        message: 'Non autorizzato - Token mancante' 
      });
    }

    // Verifica il token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'pastificio-secret-key-2024');
    
    // Trova l'utente
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      console.log('[AUTH] Utente non trovato per token:', decoded.id);
      return res.status(401).json({ 
        success: false, 
        message: 'Utente non trovato' 
      });
    }

    // Verifica se l'utente è attivo
    if (user.isActive === false) {
      console.log('[AUTH] Utente disattivato:', user.email);
      return res.status(401).json({ 
        success: false, 
        message: 'Account disattivato' 
      });
    }

    // Aggiungi l'utente alla request
    req.user = user;
    next();

  } catch (error) {
    // Log solo se è un vero errore, non per token scaduti normali
    if (error.name === 'TokenExpiredError') {
      console.log('[AUTH] Token scaduto');
      return res.status(401).json({ 
        success: false, 
        message: 'Token scaduto - Effettua nuovamente il login' 
      });
    } else if (error.name === 'JsonWebTokenError') {
      console.log('[AUTH] Token non valido');
      return res.status(401).json({ 
        success: false, 
        message: 'Token non valido' 
      });
    } else {
      console.error('[AUTH] Errore verifica token:', error.message);
      return res.status(500).json({ 
        success: false, 
        message: 'Errore server durante autenticazione' 
      });
    }
  }
};

// Middleware opzionale - non blocca se non c'è token
export const optionalAuth = async (req, res, next) => {
  let token;

  try {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.headers.authorization) {
      token = req.headers.authorization;
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'pastificio-secret-key-2024');
      const user = await User.findById(decoded.id).select('-password');
      if (user && user.isActive !== false) {
        req.user = user;
      }
    }
  } catch (error) {
    // Ignora errori, è opzionale
    console.log('[AUTH] Token opzionale non valido, continuo senza auth');
  }
  
  next();
};

// Middleware per verificare ruoli admin
export const adminOnly = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Non autorizzato' 
    });
  }

  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Accesso negato - Solo amministratori' 
    });
  }

  next();
};

// Middleware per verificare ruoli specifici
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Non autorizzato' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Ruolo ${req.user.role} non autorizzato per questa operazione` 
      });
    }

    next();
  };
};

// Genera nuovo token
export const generateToken = (id) => {
  return jwt.sign(
    { id, tokenVersion: 0 },
    process.env.JWT_SECRET || 'pastificio-secret-key-2024',
    { expiresIn: '30d' }
  );
};

// Verifica token senza middleware
export const verifyToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'pastificio-secret-key-2024');
    const user = await User.findById(decoded.id).select('-password');
    return user;
  } catch (error) {
    return null;
  }
};

// Export di default per compatibilità
export default { 
  protect, 
  optionalAuth, 
  adminOnly, 
  authorize, 
  generateToken, 
  verifyToken 
};