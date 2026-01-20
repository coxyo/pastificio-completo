// controllers/corrispettiviController.js
// ✅ VERSIONE CORRETTA - CON INVIO EMAIL
import Corrispettivo from '../models/Corrispettivo.js';
import logger from '../config/logger.js';

// GET - Ottieni corrispettivi per mese/anno
const getCorrispettivi = async (req, res) => {
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

// POST - Crea o aggiorna corrispettivo (UPSERT)
const creaCorrispettivo = async (req, res) => {
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
    
    // UPSERT - Aggiorna se esiste, crea se non esiste
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

// DELETE - Elimina corrispettivo
const eliminaCorrispettivo = async (req, res) => {
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

// POST - Chiusura mensile CON INVIO EMAIL
const chiusuraMensile = async (req, res) => {
  try {
    const { anno, mese } = req.body;
    
    logger.info(`📊 Chiusura mese ${mese}/${anno}...`);
    
    // Segna come chiuso
    await Corrispettivo.updateMany(
      { anno: parseInt(anno), mese: parseInt(mese) },
      { 
        $set: { 
          chiusoMese: true, 
          dataChiusura: new Date() 
        } 
      }
    );
    
    // Calcola totali per il report
    const corrispettivi = await Corrispettivo.find({
      anno: parseInt(anno),
      mese: parseInt(mese)
    });
    
    if (corrispettivi.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Nessun corrispettivo trovato per ${mese}/${anno}`
      });
    }
    
    const totali = {
      totaleMese: 0,
      iva22: 0,
      iva10: 0,
      iva4: 0,
      esente: 0
    };
    
    corrispettivi.forEach(c => {
      totali.totaleMese += c.totale || 0;
      if (c.dettaglioIva) {
        totali.iva22 += c.dettaglioIva.iva22 || 0;
        totali.iva10 += c.dettaglioIva.iva10 || 0;
        totali.iva4 += c.dettaglioIva.iva4 || 0;
        totali.esente += c.dettaglioIva.esente || 0;
      }
    });
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ✅ NUOVO: INVIO EMAIL AUTOMATICO
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    try {
      logger.info('📧 Invio email report corrispettivi...');
      
      // Importa servizi
      const pdfService = (await import('../services/pdfCorrispettivi.js')).default;
      const emailService = (await import('../services/emailService.js')).default;
      
      // Genera PDF
      const pdfBuffer = await pdfService.generaPdfCorrispettivi(parseInt(anno), parseInt(mese));
      
      // Genera CSV
      const csvBuffer = await pdfService.generaCsvCorrispettivi(parseInt(anno), parseInt(mese));
      
      // Invia email
      const emailResult = await emailService.inviaReportCorrispettiviMensile(
        parseInt(anno),
        parseInt(mese),
        pdfBuffer,
        csvBuffer
      );
      
      if (emailResult.success) {
        logger.info(`✅ Email inviata con successo! MessageID: ${emailResult.messageId}`);
        
        res.json({
          success: true,
          message: `Mese ${mese}/${anno} chiuso e email inviata con successo`,
          data: totali,
          email: {
            sent: true,
            messageId: emailResult.messageId,
            recipient: emailResult.recipient
          }
        });
      } else {
        logger.error(`❌ Errore invio email: ${emailResult.error}`);
        
        res.json({
          success: true,
          message: `Mese ${mese}/${anno} chiuso, ma errore invio email`,
          data: totali,
          email: {
            sent: false,
            error: emailResult.error
          }
        });
      }
      
    } catch (emailError) {
      logger.error('❌ Errore invio email:', emailError);
      
      // Mese chiuso comunque, ma email fallita
      res.json({
        success: true,
        message: `Mese ${mese}/${anno} chiuso, ma errore invio email: ${emailError.message}`,
        data: totali,
        email: {
          sent: false,
          error: emailError.message
        }
      });
    }
    
  } catch (error) {
    logger.error('Errore chiusuraMensile:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET - Report annuale
const reportAnnuale = async (req, res) => {
  try {
    const { anno } = req.params;
    
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
    
    res.json(mesi);  // ✅ Modificato: Ritorna array diretto per grafici
    
  } catch (error) {
    logger.error('Errore reportAnnuale:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET - Statistiche
const getStatistiche = async (req, res) => {
  try {
    const { anno } = req.query;
    const annoCorrente = anno ? parseInt(anno) : new Date().getFullYear();
    
    // Totale anno corrente
    const totaleAnno = await Corrispettivo.aggregate([
      { $match: { anno: annoCorrente } },
      { $group: { _id: null, totale: { $sum: '$totale' } } }
    ]);
    
    // Media giornaliera
    const countGiorni = await Corrispettivo.countDocuments({ anno: annoCorrente });
    const mediaGiornaliera = countGiorni > 0 ? (totaleAnno[0]?.totale || 0) / countGiorni : 0;
    
    // Mese migliore
    const meseMigliore = await Corrispettivo.aggregate([
      { $match: { anno: annoCorrente } },
      { $group: { _id: '$mese', totale: { $sum: '$totale' } } },
      { $sort: { totale: -1 } },
      { $limit: 1 }
    ]);
    
    // Giorno migliore
    const giornoMigliore = await Corrispettivo.findOne({ anno: annoCorrente })
      .sort({ totale: -1 })
      .limit(1);
    
    res.json({
      success: true,
      data: {
        anno: annoCorrente,
        totaleAnno: totaleAnno[0]?.totale || 0,
        mediaGiornaliera: Math.round(mediaGiornaliera * 100) / 100,
        giorniRegistrati: countGiorni,
        meseMigliore: meseMigliore[0] || null,
        giornoMigliore: giornoMigliore || null
      }
    });
  } catch (error) {
    logger.error('Errore getStatistiche:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// POST - Import bulk corrispettivi (UPSERT per ogni record)
const importBulk = async (req, res) => {
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
        
        // UPSERT - Aggiorna se esiste, crea se non esiste
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

// Export come oggetto (per import default)
export default {
  getCorrispettivi,
  creaCorrispettivo,
  eliminaCorrispettivo,
  chiusuraMensile,
  reportAnnuale,
  getStatistiche,
  importBulk
};