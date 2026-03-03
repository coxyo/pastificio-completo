// middleware/auth.js - ✅ OTTIMIZZATO PERFORMANCE 03/03/2026
// Rimossa verifica sessione dal DB ad ogni richiesta (causa principale rallentamento)
// Aggiunta cache utenti in-memory per ridurre query MongoDB
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// ✅ Cache utenti in-memory (evita query MongoDB ad ogni richiesta)
const userCache = new Map();
const USER_CACHE_TTL = 5 * 60 * 1000; // 5 minuti

function getCachedUser(userId) {
  const cached = userCache.get(userId);
  if (cached && Date.now() - cached.timestamp < USER_CACHE_TTL) {
    return cached.user;
  }
  userCache.delete(userId);
  return null;
}

function setCachedUser(userId, user) {
  // Limita cache a 50 utenti max (per sicurezza memoria)
  if (userCache.size > 50) {
    const firstKey = userCache.keys().next().value;
    userCache.delete(firstKey);
  }
  userCache.set(userId, { user, timestamp: Date.now() });
}

// ✅ Invalida cache per un utente specifico (chiamare dopo modifiche utente)
export function invalidateUserCache(userId) {
  userCache.delete(userId?.toString());
}

// ✅ Invalida tutta la cache (chiamare dopo operazioni admin bulk)
export function invalidateAllUserCache() {
  userCache.clear();
}

// ✅ Middleware di protezione principale - OTTIMIZZATO
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

    // Verifica il token JWT (operazione locale, veloce)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'pastificio-secret-key-2024');
    
    // ✅ OTTIMIZZATO: Prima controlla la cache in-memory
    let user = getCachedUser(decoded.id);
    
    if (!user) {
      // Solo se non in cache, interroga MongoDB
      user = await User.findById(decoded.id).select('-password').lean();
      
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Utente non trovato' 
        });
      }
      
      // Salva in cache per le prossime richieste
      setCachedUser(decoded.id, user);
    }

    // Verifica se l'utente è attivo
    if (user.isActive === false) {
      return res.status(401).json({ 
        success: false, 
        message: 'Account disattivato. Contatta l\'amministratore.' 
      });
    }

    // Verifica tokenVersion (per invalidazione sessioni)
    if (decoded.tokenVersion !== undefined && user.tokenVersion !== undefined) {
      if (decoded.tokenVersion !== user.tokenVersion) {
        // Invalida cache per questo utente
        invalidateUserCache(decoded.id);
        return res.status(401).json({ 
          success: false, 
          message: 'Sessione scaduta, effettua nuovamente l\'accesso',
          sessionInvalid: true
        });
      }
    }

    // ✅ RIMOSSA: Session.verificaSessione(token)
    // La verifica sessione nel DB ad ogni richiesta causava:
    // - 1 query extra MongoDB per OGNI chiamata API
    // - Rallentamento critico su dispositivi lenti (Raspberry Pi, tablet)
    // - Effetto moltiplicativo: 20+ API calls/min × query sessione = 20+ query extra
    // 
    // La sessione viene ora verificata SOLO al login e al logout remoto.
    // Il tokenVersion nel JWT è sufficiente per invalidare le sessioni.

    // Aggiungi l'utente alla request
    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Sessione scaduta, effettua nuovamente l\'accesso',
        expired: true
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
      
      // Usa cache anche qui
      let user = getCachedUser(decoded.id);
      if (!user) {
        user = await User.findById(decoded.id).select('-password').lean();
        if (user) setCachedUser(decoded.id, user);
      }
      
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
    return res.status(401).json({ success: false, message: 'Non autorizzato' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Accesso riservato agli amministratori' 
    });
  }

  next();
};

// ✅ Middleware per autorizzazione per ruolo
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non autorizzato' });
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

// ✅ Verifica token senza middleware (per WebSocket etc)
export const verifyToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'pastificio-secret-key-2024');
    let user = getCachedUser(decoded.id);
    if (!user) {
      user = await User.findById(decoded.id).select('-password').lean();
      if (user) setCachedUser(decoded.id, user);
    }
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
  verifyToken,
  invalidateUserCache,
  invalidateAllUserCache
};