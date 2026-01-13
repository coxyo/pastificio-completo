// controllers/corrispettiviController.js
// ✅ VERSIONE DEBUG - CONTROLLER CORRISPETTIVI
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
    logger.info('📊 GET Corrispettivi chiamato', { query: req.query });
    
    const { anno, mese } = req.query;
    
    if (!anno || !mese) {
      logger.warn('❌ Anno o mese mancanti');
      return res.status(400).json({
        success: false,
        error: 'Anno e mese sono obbligatori'
      });
    }

    logger.info(`📊 Cerco corrispettivi per ${mese}/${anno}`);

    const corrispettivi = await Corrispettivo.find({
      anno: parseInt(anno),
      mese: parseInt(mese)
    }).sort({ giorno: 1 });

    logger.info(`📊 Trovati ${corrispettivi.length} corrispettivi`);

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
    logger.error('❌ Errore recupero corrispettivi:', { 
      message: error.message, 
      stack: error.stack 
    });
    res.status(500).json({
      success: false,
      error: 'Errore recupero corrispettivi',
      dettagli: error.message
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
    logger.info('📝 POST Corrispettivo chiamato', { body: req.body });
    
    const { anno, mese, giorno, totale, dettaglioIva, fatture, note } = req.body;

    // Validazione base
    if (!anno || !mese || !giorno) {
      logger.warn('❌ Dati mancanti', { anno, mese, giorno });
      return res.status(400).json({
        success: false,
        error: 'Anno, mese e giorno sono obbligatori'
      });
    }

    logger.info(`📝 Salvo corrispettivo ${giorno}/${mese}/${anno} - €${totale}`);

    // Verifica se esiste già un corrispettivo per questo giorno
    let corrispettivo = await Corrispettivo.findOne({
      anno: parseInt(anno),
      mese: parseInt(mese),
      giorno: parseInt(giorno)
    });

    if (corrispettivo) {
      // Aggiorna esistente
      logger.info('📝 Aggiorno corrispettivo esistente');
      corrispettivo.totale = totale || 0;
      corrispettivo.dettaglioIva = dettaglioIva || { iva22: 0, iva10: 0, iva4: 0, esente: 0 };
      corrispettivo.fatture = fatture || { da: null, a: null };
      corrispettivo.note = note || '';
      corrispettivo.updatedAt = new Date();
      
      await corrispettivo.save();
      
      logger.info(`✅ Corrispettivo aggiornato: ${giorno}/${mese}/${anno} - €${totale}`);
    } else {
      // Crea nuovo
      logger.info('📝 Creo nuovo corrispettivo');
      corrispettivo = new Corrispettivo({
        anno: parseInt(anno),
        mese: parseInt(mese),
        giorno: parseInt(giorno),
        totale: totale || 0,
        dettaglioIva: dettaglioIva || { iva22: 0, iva10: 0, iva4: 0, esente: 0 },
        fatture: fatture || { da: null, a: null },
        note: note || '',
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
    logger.error('❌ Errore salvataggio corrispettivo:', { 
      message: error.message, 
      stack: error.stack,
      body: req.body 
    });
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
    logger.info(`🗑️ DELETE Corrispettivo: ${id}`);

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
    logger.error('❌ Errore eliminazione corrispettivo:', { message: error.message });
    res.status(500).json({
      success: false,
      error: 'Errore eliminazione corrispettivo',
      dettagli: error.message
    });
  }
};

// ============================================
// CHIUSURA MENSILE
// ============================================

export const chiusuraMensile = async (req, res) => {
  try {
    const { anno, mese } = req.body;
    logger.info(`📧 Chiusura mensile: ${mese}/${anno}`);

    const corrispettivi = await Corrispettivo.find({
      anno: parseInt(anno),
      mese: parseInt(mese)
    });

    const totali = corrispettivi.reduce((acc, c) => {
      acc.totale += c.totale || 0;
      acc.iva22 += c.dettaglioIva?.iva22 || 0;
      acc.iva10 += c.dettaglioIva?.iva10 || 0;
      acc.iva4 += c.dettaglioIva?.iva4 || 0;
      acc.esente += c.dettaglioIva?.esente || 0;
      acc.giorniConIncasso += (c.totale > 0) ? 1 : 0;
      return acc;
    }, { totale: 0, iva22: 0, iva10: 0, iva4: 0, esente: 0, giorniConIncasso: 0 });

    const ivaCalcolata = {
      iva22: totali.iva22 - (totali.iva22 / 1.22),
      iva10: totali.iva10 - (totali.iva10 / 1.10),
      iva4: totali.iva4 - (totali.iva4 / 1.04)
    };
    ivaCalcolata.totaleIva = ivaCalcolata.iva22 + ivaCalcolata.iva10 + ivaCalcolata.iva4;

    await Corrispettivo.updateMany(
      { anno: parseInt(anno), mese: parseInt(mese) },
      { $set: { chiusoMese: true, dataChiusura: new Date() } }
    );

    const mesiNomi = ['', 'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 
                      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

    logger.info(`✅ Chiusura mensile completata: ${mesiNomi[mese]} ${anno}`);

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
    logger.error('❌ Errore chiusura mensile:', { message: error.message });
    res.status(500).json({
      success: false,
      error: 'Errore chiusura mensile',
      dettagli: error.message
    });
  }
};

// ============================================
// REPORT ANNUALE
// ============================================

export const reportAnnuale = async (req, res) => {
  try {
    const { anno } = req.params;
    logger.info(`📊 Report annuale: ${anno}`);

    const corrispettivi = await Corrispettivo.find({
      anno: parseInt(anno)
    });

    const perMese = {};
    for (let m = 1; m <= 12; m++) {
      perMese[m] = { totale: 0, iva22: 0, iva10: 0, iva4: 0, esente: 0, giorni: 0 };
    }

    corrispettivi.forEach(c => {
      if (perMese[c.mese]) {
        perMese[c.mese].totale += c.totale || 0;
        perMese[c.mese].iva22 += c.dettaglioIva?.iva22 || 0;
        perMese[c.mese].iva10 += c.dettaglioIva?.iva10 || 0;
        perMese[c.mese].iva4 += c.dettaglioIva?.iva4 || 0;
        perMese[c.mese].esente += c.dettaglioIva?.esente || 0;
        if (c.totale > 0) perMese[c.mese].giorni++;
      }
    });

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
    logger.error('❌ Errore report annuale:', { message: error.message });
    res.status(500).json({
      success: false,
      error: 'Errore generazione report annuale',
      dettagli: error.message
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

    const corrispettiviMese = await Corrispettivo.find({
      anno: annoCorrente,
      mese: meseCorrente
    });

    const totaleMese = corrispettiviMese.reduce((acc, c) => acc + (c.totale || 0), 0);

    const corrispettiviAnno = await Corrispettivo.find({
      anno: annoCorrente
    });

    const totaleAnno = corrispettiviAnno.reduce((acc, c) => acc + (c.totale || 0), 0);

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
    logger.error('❌ Errore statistiche corrispettivi:', { message: error.message });
    res.status(500).json({
      success: false,
      error: 'Errore recupero statistiche',
      dettagli: error.message
    });
  }
};

// ============================================
// IMPORT BULK (per dati storici)
// ============================================

export const importBulk = async (req, res) => {
  try {
    const { dati } = req.body;
    logger.info(`📥 Import bulk: ${dati?.length || 0} record`);

    if (!dati || !Array.isArray(dati)) {
      return res.status(400).json({
        success: false,
        error: 'Dati non validi - deve essere un array'
      });
    }

    let importati = 0;
    let errori = 0;

    for (const d of dati) {
      try {
        await Corrispettivo.findOneAndUpdate(
          { anno: d.anno, mese: d.mese, giorno: d.giorno },
          {
            $set: {
              totale: d.totale || 0,
              dettaglioIva: d.dettaglioIva || { iva22: 0, iva10: d.totale || 0, iva4: 0, esente: 0 },
              operatore: 'Import bulk'
            }
          },
          { upsert: true, new: true }
        );
        importati++;
      } catch (err) {
        errori++;
        logger.warn(`Errore import ${d.giorno}/${d.mese}/${d.anno}: ${err.message}`);
      }
    }

    logger.info(`✅ Import completato: ${importati} OK, ${errori} errori`);

    res.json({
      success: true,
      messaggio: `Import completato: ${importati} record importati, ${errori} errori`,
      importati,
      errori
    });

  } catch (error) {
    logger.error('❌ Errore import bulk:', { message: error.message });
    res.status(500).json({
      success: false,
      error: 'Errore import bulk',
      dettagli: error.message
    });
  }
};

export default {
  getCorrispettivi,
  creaCorrispettivo,
  eliminaCorrispettivo,
  chiusuraMensile,
  reportAnnuale,
  getStatistiche,
  importBulk
};