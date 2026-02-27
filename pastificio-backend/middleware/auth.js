// middleware/auth.js - ✅ AGGIORNATO: Sicurezza + Controllo Ruoli
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// ✅ Middleware di protezione principale
export const protect = async (req, res, next) => {
  let token;

  try {
    // Controlla header Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.headers.authorization) {
      token = req.headers.authorization;
    }

    if (!token) {
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
      return res.status(401).json({ 
        success: false, 
        message: 'Utente non trovato' 
      });
    }

    // ✅ Verifica se l'utente è attivo
    if (user.isActive === false) {
      return res.status(401).json({ 
        success: false, 
        message: 'Account disattivato. Contatta l\'amministratore.' 
      });
    }

    // ✅ Verifica tokenVersion (per invalidazione sessioni)
    if (decoded.tokenVersion !== undefined && user.tokenVersion !== undefined) {
      if (decoded.tokenVersion !== user.tokenVersion) {
        return res.status(401).json({ 
          success: false, 
          message: 'Sessione scaduta, effettua nuovamente l\'accesso' 
        });
      }
    }

    // Aggiungi l'utente alla request
    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Sessione scaduta, effettua nuovamente l\'accesso',
        expired: true  // ✅ Flag per il frontend
      });
    } else if (error.name === 'JsonWebTokenError') {
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

// ✅ Middleware opzionale - non blocca se non c'è token
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
  }
  
  next();
};

// ✅ NUOVO: Middleware per verificare ruolo admin
export const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Non autorizzato' 
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Accesso negato - Solo amministratori' 
    });
  }

  next();
};

// ✅ NUOVO: Middleware per verificare ruoli specifici
// Uso: authorize('admin', 'operatore')
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
        message: `Il ruolo "${req.user.role}" non è autorizzato per questa operazione` 
      });
    }

    next();
  };
};

// ✅ NUOVO: Middleware per bloccare i visualizzatori dalle operazioni di scrittura
export const noViewer = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Non autorizzato' });
  }

  if (req.user.role === 'visualizzatore') {
    return res.status(403).json({ 
      success: false, 
      message: 'Non hai i permessi per questa operazione (solo lettura)' 
    });
  }

  next();
};

// ✅ Genera token (helper per routes)
export const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,
      role: user.role,
      tokenVersion: user.tokenVersion || 0 
    },
    process.env.JWT_SECRET || 'pastificio-secret-key-2024',
    { expiresIn: '12h' }  // ✅ 12 ORE
  );
};

// ✅ Verifica token senza middleware
export const verifyToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'pastificio-secret-key-2024');
    const user = await User.findById(decoded.id).select('-password');
    return user;
  } catch (error) {
    return null;
  }
};

export default { 
  protect, 
  optionalAuth, 
  adminOnly, 
  authorize, 
  noViewer,
  generateToken, 
  verifyToken 
};