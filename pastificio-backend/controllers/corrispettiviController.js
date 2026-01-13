// controllers/corrispettiviController.js
// ✅ VERSIONE COMPLETA - CONTROLLER CORRISPETTIVI
import Corrispettivo from '../models/Corrispettivo.js';
import logger from '../config/logger.js';

/**
 * CONTROLLER CORRISPETTIVI
 * Gestisce registro corrispettivi giornalieri con calcolo IVA
 */

// ============================================
// GET CORRISPETTIVI
// ============================================

/**
 * Ottiene i corrispettivi per un mese/anno specifico
 */
export const getCorrispettivi = async (req, res) => {
  try {
    const { anno, mese } = req.query;
    
    if (!anno || !mese) {
      return res.status(400).json({
        success: false,
        error: 'Anno e mese sono obbligatori'
      });
    }

    const corrispettivi = await Corrispettivo.find({
      anno: parseInt(anno),
      mese: parseInt(mese)
    }).sort({ giorno: 1 });

    // Calcola totali mensili
    const totali = corrispettivi.reduce((acc, c) => {
      acc.totale += c.totale || 0;
      acc.iva22 += c.dettaglioIva?.iva22 || 0;
      acc.iva10 += c.dettaglioIva?.iva10 || 0;
      acc.iva4 += c.dettaglioIva?.iva4 || 0;
      acc.esente += c.dettaglioIva?.esente || 0;
      return acc;
    }, { totale: 0, iva22: 0, iva10: 0, iva4: 0, esente: 0 });

    res.json({
      success: true,
      corrispettivi,
      totali,
      mese: parseInt(mese),
      anno: parseInt(anno)
    });

  } catch (error) {
    logger.error('❌ Errore recupero corrispettivi:', error);
    res.status(500).json({
      success: false,
      error: 'Errore recupero corrispettivi'
    });
  }
};

// ============================================
// CREA/AGGIORNA CORRISPETTIVO
// ============================================

/**
 * Crea o aggiorna un corrispettivo giornaliero
 */
export const creaCorrispettivo = async (req, res) => {
  try {
    const { anno, mese, giorno, totale, dettaglioIva, fatture, note } = req.body;

    // Verifica se esiste già un corrispettivo per questo giorno
    let corrispettivo = await Corrispettivo.findOne({
      anno,
      mese,
      giorno
    });

    if (corrispettivo) {
      // Aggiorna esistente
      corrispettivo.totale = totale;
      corrispettivo.dettaglioIva = dettaglioIva;
      corrispettivo.fatture = fatture;
      corrispettivo.note = note;
      corrispettivo.updatedAt = new Date();
      
      await corrispettivo.save();
      
      logger.info(`✅ Corrispettivo aggiornato: ${giorno}/${mese}/${anno} - €${totale}`);
    } else {
      // Crea nuovo
      corrispettivo = new Corrispettivo({
        anno,
        mese,
        giorno,
        totale,
        dettaglioIva,
        fatture,
        note,
        operatore: req.user?.nome || 'Maurizio Mameli'
      });

      await corrispettivo.save();
      
      logger.info(`✅ Corrispettivo creato: ${giorno}/${mese}/${anno} - €${totale}`);
    }

    res.status(201).json({
      success: true,
      data: corrispettivo,
      messaggio: '✅ Corrispettivo salvato con successo'
    });

  } catch (error) {
    logger.error('❌ Errore salvataggio corrispettivo:', error);
    res.status(500).json({
      success: false,
      error: 'Errore salvataggio corrispettivo',
      dettagli: error.message
    });
  }
};

// ============================================
// ELIMINA CORRISPETTIVO
// ============================================

export const eliminaCorrispettivo = async (req, res) => {
  try {
    const { id } = req.params;

    const corrispettivo = await Corrispettivo.findByIdAndDelete(id);

    if (!corrispettivo) {
      return res.status(404).json({
        success: false,
        error: 'Corrispettivo non trovato'
      });
    }

    logger.info(`✅ Corrispettivo eliminato: ${corrispettivo.giorno}/${corrispettivo.mese}/${corrispettivo.anno}`);

    res.json({
      success: true,
      messaggio: '✅ Corrispettivo eliminato'
    });

  } catch (error) {
    logger.error('❌ Errore eliminazione corrispettivo:', error);
    res.status(500).json({
      success: false,
      error: 'Errore eliminazione corrispettivo'
    });
  }
};

// ============================================
// CHIUSURA MENSILE
// ============================================

/**
 * Chiude il mese e prepara il report per il commercialista
 */
export const chiusuraMensile = async (req, res) => {
  try {
    const { anno, mese } = req.body;

    // Recupera tutti i corrispettivi del mese
    const corrispettivi = await Corrispettivo.find({
      anno: parseInt(anno),
      mese: parseInt(mese)
    });

    // Calcola totali
    const totali = corrispettivi.reduce((acc, c) => {
      acc.totale += c.totale || 0;
      acc.iva22 += c.dettaglioIva?.iva22 || 0;
      acc.iva10 += c.dettaglioIva?.iva10 || 0;
      acc.iva4 += c.dettaglioIva?.iva4 || 0;
      acc.esente += c.dettaglioIva?.esente || 0;
      acc.giorniConIncasso += (c.totale > 0) ? 1 : 0;
      return acc;
    }, { totale: 0, iva22: 0, iva10: 0, iva4: 0, esente: 0, giorniConIncasso: 0 });

    // Calcola IVA dovuta (scorporo)
    const ivaCalcolata = {
      iva22: totali.iva22 - (totali.iva22 / 1.22),
      iva10: totali.iva10 - (totali.iva10 / 1.10),
      iva4: totali.iva4 - (totali.iva4 / 1.04)
    };
    ivaCalcolata.totaleIva = ivaCalcolata.iva22 + ivaCalcolata.iva10 + ivaCalcolata.iva4;

    // Segna il mese come chiuso
    await Corrispettivo.updateMany(
      { anno, mese },
      { $set: { chiusoMese: true, dataChiusura: new Date() } }
    );

    const mesiNomi = ['', 'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 
                      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

    logger.info(`✅ Chiusura mensile completata: ${mesiNomi[mese]} ${anno} - Totale: €${totali.totale.toFixed(2)}`);

    // TODO: Qui si può integrare l'invio email al commercialista
    // await inviaEmailCommercialista(totali, ivaCalcolata, anno, mese);

    res.json({
      success: true,
      messaggio: `✅ Mese ${mesiNomi[mese]} ${anno} chiuso con successo`,
      riepilogo: {
        anno,
        mese,
        nomeMese: mesiNomi[mese],
        totali,
        ivaCalcolata,
        dataChiusura: new Date()
      }
    });

  } catch (error) {
    logger.error('❌ Errore chiusura mensile:', error);
    res.status(500).json({
      success: false,
      error: 'Errore chiusura mensile'
    });
  }
};

// ============================================
// REPORT ANNUALE
// ============================================

/**
 * Genera report annuale corrispettivi
 */
export const reportAnnuale = async (req, res) => {
  try {
    const { anno } = req.params;

    const corrispettivi = await Corrispettivo.find({
      anno: parseInt(anno)
    });

    // Raggruppa per mese
    const perMese = {};
    for (let m = 1; m <= 12; m++) {
      perMese[m] = {
        totale: 0,
        iva22: 0,
        iva10: 0,
        iva4: 0,
        esente: 0,
        giorni: 0
      };
    }

    corrispettivi.forEach(c => {
      perMese[c.mese].totale += c.totale || 0;
      perMese[c.mese].iva22 += c.dettaglioIva?.iva22 || 0;
      perMese[c.mese].iva10 += c.dettaglioIva?.iva10 || 0;
      perMese[c.mese].iva4 += c.dettaglioIva?.iva4 || 0;
      perMese[c.mese].esente += c.dettaglioIva?.esente || 0;
      if (c.totale > 0) perMese[c.mese].giorni++;
    });

    // Totale annuale
    const totaleAnnuale = Object.values(perMese).reduce((acc, m) => {
      acc.totale += m.totale;
      acc.iva22 += m.iva22;
      acc.iva10 += m.iva10;
      acc.iva4 += m.iva4;
      acc.esente += m.esente;
      return acc;
    }, { totale: 0, iva22: 0, iva10: 0, iva4: 0, esente: 0 });

    res.json({
      success: true,
      anno: parseInt(anno),
      perMese,
      totaleAnnuale
    });

  } catch (error) {
    logger.error('❌ Errore report annuale:', error);
    res.status(500).json({
      success: false,
      error: 'Errore generazione report annuale'
    });
  }
};

// ============================================
// STATISTICHE
// ============================================

export const getStatistiche = async (req, res) => {
  try {
    const oggi = new Date();
    const annoCorrente = oggi.getFullYear();
    const meseCorrente = oggi.getMonth() + 1;

    // Totale mese corrente
    const corrispettiviMese = await Corrispettivo.find({
      anno: annoCorrente,
      mese: meseCorrente
    });

    const totaleMese = corrispettiviMese.reduce((acc, c) => acc + (c.totale || 0), 0);

    // Totale anno corrente
    const corrispettiviAnno = await Corrispettivo.find({
      anno: annoCorrente
    });

    const totaleAnno = corrispettiviAnno.reduce((acc, c) => acc + (c.totale || 0), 0);

    // Media giornaliera mese
    const giorniConDati = corrispettiviMese.filter(c => c.totale > 0).length;
    const mediaGiornaliera = giorniConDati > 0 ? totaleMese / giorniConDati : 0;

    res.json({
      success: true,
      statistiche: {
        totaleMeseCorrente: totaleMese,
        totaleAnnoCorrente: totaleAnno,
        mediaGiornaliera,
        giorniConIncasso: giorniConDati,
        annoCorrente,
        meseCorrente
      }
    });

  } catch (error) {
    logger.error('❌ Errore statistiche corrispettivi:', error);
    res.status(500).json({
      success: false,
      error: 'Errore recupero statistiche'
    });
  }
};

export default {
  getCorrispettivi,
  creaCorrispettivo,
  eliminaCorrispettivo,
  chiusuraMensile,
  reportAnnuale,
  getStatistiche
};