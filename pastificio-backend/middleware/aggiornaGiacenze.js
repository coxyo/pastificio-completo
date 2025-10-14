// middleware/aggiornaGiacenze.js
import Prodotto from '../models/Prodotto.js';
import Ingrediente from '../models/Ingrediente.js';
import logger from '../config/logger.js';
import notificationService from '../services/NotificationService.js';

/**
 * Middleware per aggiornare giacenze prodotti dopo creazione ordine
 */
export const aggiornaGiacenzeOrdine = async (req, res, next) => {
  try {
    const ordine = res.locals.ordineCreato || req.body;
    
    if (!ordine || !ordine.prodotti) {
      return next();
    }
    
    logger.info(`📦 Aggiornamento giacenze per ordine: ${ordine._id || 'temp'}`);
    
    for (const prodottoOrdine of ordine.prodotti) {
      try {
        // Trova prodotto nel database
        const prodotto = await Prodotto.findOne({ nome: prodottoOrdine.nome });
        
        if (!prodotto) {
          logger.warn(`⚠️ Prodotto non trovato nel DB: ${prodottoOrdine.nome}`);
          continue;
        }
        
        // Calcola quantità da scalare
        let quantitaDaScalare = 0;
        
        if (prodottoOrdine.unita === 'Kg' || prodottoOrdine.unita === 'kg') {
          quantitaDaScalare = prodottoOrdine.quantita;
        } else if (prodottoOrdine.unita === 'pz' || prodottoOrdine.unita === 'Pezzi' || prodottoOrdine.unita === 'pezzi') {
          // Converti pezzi in kg se possibile
          if (prodotto.pezziPerKg) {
            quantitaDaScalare = prodottoOrdine.quantita / prodotto.pezziPerKg;
          } else {
            quantitaDaScalare = prodottoOrdine.quantita; // Scala direttamente i pezzi
          }
        } else if (prodottoOrdine.unita === 'g') {
          quantitaDaScalare = prodottoOrdine.quantita / 1000; // Converti grammi in kg
        } else {
          quantitaDaScalare = prodottoOrdine.quantita;
        }
        
        // Aggiorna giacenza
        const giacenzaPrecedente = prodotto.giacenzaAttuale || 0;
        const nuovaGiacenza = Math.max(0, giacenzaPrecedente - quantitaDaScalare);
        
        await Prodotto.findByIdAndUpdate(prodotto._id, {
          giacenzaAttuale: nuovaGiacenza,
          updatedAt: new Date()
        });
        
        logger.info(`✅ Giacenza aggiornata: ${prodotto.nome} - ${giacenzaPrecedente.toFixed(2)} → ${nuovaGiacenza.toFixed(2)}`);
        
        // ✅ ALERT SCORTE CRITICHE IN TEMPO REALE
        if (nuovaGiacenza <= prodotto.giacenzaMinima && prodotto.giacenzaMinima > 0) {
          logger.warn(`🚨 ALERT CRITICO: ${prodotto.nome} sotto scorta minima!`);
          
          // Notifica tramite service
          try {
            await notificationService.sendCustomAlert({
              title: '🚨 Scorta Critica',
              message: `${prodotto.nome}: ${nuovaGiacenza.toFixed(2)} unità rimaste (minimo: ${prodotto.giacenzaMinima})`,
              type: 'warning',
              priority: 'high',
              sendToAll: true,
              data: {
                prodottoId: prodotto._id,
                prodottoNome: prodotto.nome,
                giacenzaAttuale: nuovaGiacenza,
                giacenzaMinima: prodotto.giacenzaMinima
              }
            });
          } catch (notifError) {
            logger.error('Errore invio notifica:', notifError);
          }
          
          // Notifica WebSocket real-time
          if (global.io) {
            global.io.emit('alert-scorte', {
              prodotto: prodotto.nome,
              quantita: nuovaGiacenza,
              unita: prodottoOrdine.unita,
              minimo: prodotto.giacenzaMinima,
              categoria: prodotto.categoria,
              timestamp: new Date()
            });
          }
        }
        
        // Alert se prodotto esaurito
        if (nuovaGiacenza === 0) {
          logger.error(`🔴 PRODOTTO ESAURITO: ${prodotto.nome}`);
          
          if (global.io) {
            global.io.emit('prodotto-esaurito', {
              prodotto: prodotto.nome,
              categoria: prodotto.categoria,
              timestamp: new Date()
            });
          }
        }
        
      } catch (error) {
        logger.error(`❌ Errore aggiornamento giacenza ${prodottoOrdine.nome}:`, error);
        // Non bloccare l'ordine per errori di giacenza
      }
    }
    
    next();
    
  } catch (error) {
    logger.error('❌ Errore generale middleware giacenze:', error);
    next(); // Non bloccare l'ordine se fallisce l'aggiornamento giacenze
  }
};

export default { aggiornaGiacenzeOrdine };