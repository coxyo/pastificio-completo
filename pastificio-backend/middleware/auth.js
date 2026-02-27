// middleware/auth.js - ✅ AGGIORNATO: Controllo sessione attiva + Ruoli
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Session from '../models/Session.js';

// ✅ Middleware di protezione principale - ORA VERIFICA ANCHE LA SESSIONE
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

    // Verifica il token JWT
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

    // ✅ Verifica tokenVersion (per invalidazione sessioni legacy)
    if (decoded.tokenVersion !== undefined && user.tokenVersion !== undefined) {
      if (decoded.tokenVersion !== user.tokenVersion) {
        return res.status(401).json({ 
          success: false, 
          message: 'Sessione scaduta, effettua nuovamente l\'accesso',
          sessionInvalid: true
        });
      }
    }

    // ✅ NUOVO: Verifica che la sessione sia ancora attiva nel database
    const session = await Session.verificaSessione(token);
    if (!session) {
      // Controlla se esiste come disconnessa (logout remoto)
      const tokenHash = Session.hashToken(token);
      const disconnectedSession = await Session.findOne({ 
        tokenHash, 
        stato: { $in: ['disconnessa', 'scaduta'] } 
      }).lean();

      if (disconnectedSession) {
        const messaggio = disconnectedSession.stato === 'disconnessa'
          ? `Sessione terminata da ${disconnectedSession.disconnessoDa || 'un amministratore'}`
          : 'Sessione scaduta per inattività';
        
        return res.status(401).json({ 
          success: false, 
          message: messaggio,
          sessionInvalid: true,
          remoteLogout: disconnectedSession.stato === 'disconnessa'
        });
      }

      // Sessione non trovata affatto - potrebbe essere un token vecchio (pre-sistema sessioni)
      // Per retrocompatibilità, permettiamo il passaggio ma loggiamo un warning
      // Quando tutti i token saranno rinnovati, questa sezione potrà diventare un blocco
      // Per ora: crea una sessione retroattiva
      try {
        await Session.creaSessione(user, token, req);
      } catch (sessionError) {
        // Se il token hash esiste già (duplicate key), ignora silenziosamente
        if (sessionError.code !== 11000) {
          console.warn('[AUTH] Errore creazione sessione retroattiva:', sessionError.message);
        }
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
        expired: true,
        sessionInvalid: true
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token non valido',
        sessionInvalid: true
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

// ✅ Middleware per verificare ruolo admin
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

// ✅ Middleware per verificare ruoli specifici
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

// ✅ Middleware per bloccare i visualizzatori dalle operazioni di scrittura
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
    { expiresIn: '12h' }
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