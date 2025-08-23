// middleware/permissions.js
import logger from '../config/logger.js';

// Middleware per verificare permessi
export const checkPermission = (module, action) => {
  return (req, res, next) => {
    try {
      // Verifica che utente sia autenticato
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Autenticazione richiesta'
        });
      }
      
      // Verifica che utente abbia un ruolo
      if (!req.user.ruolo) {
        return res.status(403).json({
          success: false,
          error: 'Utente senza ruolo'
        });
      }
      
      // Gli admin hanno sempre accesso
      if (req.user.ruolo.isAdmin) {
        return next();
      }
      
      // Verifica permesso specifico
      if (
        req.user.ruolo.permessi &&
        req.user.ruolo.permessi[module] &&
        req.user.ruolo.permessi[module][action]
      ) {
        return next();
      }
      
      // Permesso negato
      logger.warn(`Accesso negato: l'utente ${req.user.username} ha tentato di accedere a ${module}.${action}`, {
        userId: req.user.id,
        module,
        action
      });
      
      return res.status(403).json({
        success: false,
        error: 'Non hai i permessi per accedere a questa risorsa'
      });
    } catch (error) {
      logger.error(`Errore verifica permessi: ${error.message}`, {
        service: 'permissionsMiddleware',
        error: error.stack
      });
      return res.status(500).json({
        success: false,
        error: 'Errore nella verifica dei permessi'
      });
    }
  };
};