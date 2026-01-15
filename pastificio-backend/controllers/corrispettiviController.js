// controllers/corrispettiviController.js
import Corrispettivo from '../models/Corrispettivo.js';
import logger from '../config/logger.js';

// GET - Ottieni corrispettivi per mese/anno
export const getCorrispettivi = async (req, res) => {
  try {
    const { anno, mese } = req.query;
    
    const query = {};
    if (anno) query.anno = parseInt(anno);
    if (mese) query.mese = parseInt(mese);
    
    const corrispettivi = await Corrispettivo.find(query).sort({ giorno: 1 });
    
    res.json({
      success: true,
      data: corrispettivi
    });
  } catch (error) {
    logger.error('Errore getCorrispettivi:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET - Ottieni singolo corrispettivo
export const getCorrispettivo = async (req, res) => {
  try {
    const { anno, mese, giorno } = req.params;
    
    const corrispettivo = await Corrispettivo.findOne({
      anno: parseInt(anno),
      mese: parseInt(mese),
      giorno: parseInt(giorno)
    });
    
    if (!corrispettivo) {
      return res.status(404).json({
        success: false,
        message: 'Corrispettivo non trovato'
      });
    }
    
    res.json({
      success: true,
      data: corrispettivo
    });
  } catch (error) {
    logger.error('Errore getCorrispettivo:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// POST - Crea o aggiorna corrispettivo (UPSERT)
export const creaCorrispettivo = async (req, res) => {
  try {
    const { anno, mese, giorno, totale, dettaglioIva, note, operatore } = req.body;
    
    if (!anno || !mese || !giorno) {
      return res.status(400).json({
        success: false,
        message: 'Anno, mese e giorno sono obbligatori'
      });
    }
    
    const iva = dettaglioIva || {
      iva22: 0,
      iva10: totale || 0,
      iva4: 0,
      esente: 0
    };
    
    // UPSERT
    const corrispettivo = await Corrispettivo.findOneAndUpdate(
      { anno: parseInt(anno), mese: parseInt(mese), giorno: parseInt(giorno) },
      {
        $set: {
          totale: totale || 0,
          dettaglioIva: iva,
          note: note || '',
          operatore: operatore || 'Sistema',
          updatedAt: new Date()
        },
        $setOnInsert: {
          createdAt: new Date(),
          chiusoMese: false,
          dataChiusura: null,
          fatture: {}
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    
    logger.info(`Corrispettivo salvato: ${anno}-${mese}-${giorno} = €${totale}`);
    
    res.status(201).json({
      success: true,
      message: 'Corrispettivo salvato',
      data: corrispettivo
    });
  } catch (error) {
    logger.error('Errore creaCorrispettivo:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// PUT - Aggiorna corrispettivo
export const aggiornaCorrispettivo = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const corrispettivo = await Corrispettivo.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true }
    );
    
    if (!corrispettivo) {
      return res.status(404).json({
        success: false,
        message: 'Corrispettivo non trovato'
      });
    }
    
    res.json({
      success: true,
      message: 'Corrispettivo aggiornato',
      data: corrispettivo
    });
  } catch (error) {
    logger.error('Errore aggiornaCorrispettivo:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// DELETE - Elimina corrispettivo
export const eliminaCorrispettivo = async (req, res) => {
  try {
    const { id } = req.params;
    
    const corrispettivo = await Corrispettivo.findByIdAndDelete(id);
    
    if (!corrispettivo) {
      return res.status(404).json({
        success: false,
        message: 'Corrispettivo non trovato'
      });
    }
    
    res.json({
      success: true,
      message: 'Corrispettivo eliminato'
    });
  } catch (error) {
    logger.error('Errore eliminaCorrispettivo:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// POST - Import bulk corrispettivi (UPSERT per ogni record)
export const importBulk = async (req, res) => {
  try {
    const { dati } = req.body;
    
    if (!dati || !Array.isArray(dati)) {
      return res.status(400).json({
        success: false,
        message: 'Dati non validi - deve essere un array'
      });
    }
    
    logger.info(`Import bulk: ${dati.length} record da importare`);
    
    let importati = 0;
    let errori = 0;
    
    for (const d of dati) {
      try {
        if (!d.anno || !d.mese || !d.giorno) {
          errori++;
          continue;
        }
        
        const dettaglioIva = d.dettaglioIva || {
          iva22: 0,
          iva10: d.totale || 0,
          iva4: 0,
          esente: 0
        };
        
        // UPSERT
        await Corrispettivo.findOneAndUpdate(
          { 
            anno: parseInt(d.anno), 
            mese: parseInt(d.mese), 
            giorno: parseInt(d.giorno) 
          },
          {
            $set: {
              totale: d.totale || 0,
              dettaglioIva: dettaglioIva,
              note: d.note || '',
              operatore: d.operatore || 'Import bulk',
              updatedAt: new Date()
            },
            $setOnInsert: {
              createdAt: new Date(),
              chiusoMese: false,
              dataChiusura: null,
              fatture: {}
            }
          },
          { upsert: true, new: true }
        );
        
        importati++;
        
      } catch (err) {
        errori++;
        logger.error(`Errore import record ${d.anno}-${d.mese}-${d.giorno}: ${err.message}`);
      }
    }
    
    logger.info(`Import bulk completato: ${importati} importati, ${errori} errori`);
    
    res.json({
      success: true,
      messaggio: `Import completato: ${importati} record importati, ${errori} errori`,
      importati,
      errori
    });
    
  } catch (error) {
    logger.error('Errore importBulk:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET - Riepilogo mensile
export const getRiepilogoMensile = async (req, res) => {
  try {
    const { anno, mese } = req.query;
    
    const corrispettivi = await Corrispettivo.find({
      anno: parseInt(anno),
      mese: parseInt(mese)
    });
    
    const riepilogo = {
      anno: parseInt(anno),
      mese: parseInt(mese),
      totaleMese: 0,
      iva22: 0,
      iva10: 0,
      iva4: 0,
      esente: 0,
      giorniRegistrati: corrispettivi.length
    };
    
    corrispettivi.forEach(c => {
      riepilogo.totaleMese += c.totale || 0;
      if (c.dettaglioIva) {
        riepilogo.iva22 += c.dettaglioIva.iva22 || 0;
        riepilogo.iva10 += c.dettaglioIva.iva10 || 0;
        riepilogo.iva4 += c.dettaglioIva.iva4 || 0;
        riepilogo.esente += c.dettaglioIva.esente || 0;
      }
    });
    
    res.json({
      success: true,
      data: riepilogo
    });
  } catch (error) {
    logger.error('Errore getRiepilogoMensile:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET - Riepilogo annuale
export const getRiepilogoAnnuale = async (req, res) => {
  try {
    const { anno } = req.query;
    
    const pipeline = [
      { $match: { anno: parseInt(anno) } },
      {
        $group: {
          _id: '$mese',
          totaleMese: { $sum: '$totale' },
          iva22: { $sum: '$dettaglioIva.iva22' },
          iva10: { $sum: '$dettaglioIva.iva10' },
          iva4: { $sum: '$dettaglioIva.iva4' },
          esente: { $sum: '$dettaglioIva.esente' },
          giorniRegistrati: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ];
    
    const mesi = await Corrispettivo.aggregate(pipeline);
    
    const totaleAnno = mesi.reduce((sum, m) => sum + m.totaleMese, 0);
    
    res.json({
      success: true,
      data: {
        anno: parseInt(anno),
        totaleAnno,
        mesi
      }
    });
  } catch (error) {
    logger.error('Errore getRiepilogoAnnuale:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// POST - Chiudi mese
export const chiudiMese = async (req, res) => {
  try {
    const { anno, mese } = req.body;
    
    await Corrispettivo.updateMany(
      { anno: parseInt(anno), mese: parseInt(mese) },
      { 
        $set: { 
          chiusoMese: true, 
          dataChiusura: new Date() 
        } 
      }
    );
    
    res.json({
      success: true,
      message: `Mese ${mese}/${anno} chiuso con successo`
    });
  } catch (error) {
    logger.error('Errore chiudiMese:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export default {
  getCorrispettivi,
  getCorrispettivo,
  creaCorrispettivo,
  aggiornaCorrispettivo,
  eliminaCorrispettivo,
  importBulk,
  getRiepilogoMensile,
  getRiepilogoAnnuale,
  chiudiMese
};