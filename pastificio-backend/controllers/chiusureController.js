// controllers/chiusureController.js
import Chiusura from '../models/Chiusura.js';
import ConfigChiusure from '../models/ConfigChiusure.js';
import { getFestivitaAnno, formatDate } from '../utils/calcoloPasqua.js';
import logger from '../config/logger.js';

// ─────────────────────────────────────────────
// Helper: ottieni config (o crea default)
// ─────────────────────────────────────────────
async function getConfig() {
  let config = await ConfigChiusure.findOne().lean();
  if (!config) {
    config = await ConfigChiusure.create({});
    config = config.toObject();
  }
  return config;
}

// ─────────────────────────────────────────────
// Helper: verifica se una data ISO è chiusa
// Restituisce { chiuso: bool, motivo: string|null }
// ─────────────────────────────────────────────
export async function verificaDataChiusa(dataStr) {
  // dataStr: 'YYYY-MM-DD'
  const anno = parseInt(dataStr.substring(0, 4));
  const config = await getConfig();

  // 1. Festività fisse
  const festivita = getFestivitaAnno(anno, config.festivitaAttive);
  const festMatch = festivita.find(f => f.data === dataStr);
  if (festMatch) return { chiuso: true, motivo: festMatch.motivo };

  // 2. Giorno settimana (0=Dom)
  const dateObj = new Date(dataStr + 'T12:00:00');
  const dowNum = dateObj.getDay();
  if (config.giorniChiusuraSettimanale?.includes(dowNum)) {
    const nomiGiorni = ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'];
    return { chiuso: true, motivo: `Chiusura settimanale (${nomiGiorni[dowNum]})` };
  }

  // 3. Chiusure personalizzate (incluso ripetiOgniAnno)
  const start = new Date(dataStr + 'T00:00:00');
  const end   = new Date(dataStr + 'T23:59:59');

  const chiusurePersonalizzate = await Chiusura.find({
    tipo: 'personalizzata',
    attivo: true
  }).lean();

  for (const c of chiusurePersonalizzate) {
    let dInizio = new Date(c.dataInizio);
    let dFine   = new Date(c.dataFine);

    if (c.ripetiOgniAnno) {
      // Normalizza anno corrente
      dInizio = new Date(anno, dInizio.getMonth(), dInizio.getDate(), 0, 0, 0);
      dFine   = new Date(anno, dFine.getMonth(), dFine.getDate(), 23, 59, 59);
    }

    if (start >= dInizio && end <= dFine) {
      return { chiuso: true, motivo: c.motivo };
    }
  }

  // 4. Chiusure settimanali custom (in Chiusura collection)
  const chiusureSettimanali = await Chiusura.find({
    tipo: 'settimanale',
    attivo: true,
    giornoSettimana: dowNum
  }).lean();

  if (chiusureSettimanali.length > 0) {
    return { chiuso: true, motivo: chiusureSettimanali[0].motivo };
  }

  return { chiuso: false, motivo: null };
}

// ─────────────────────────────────────────────
// GET /api/chiusure - Lista tutte le chiusure
// ─────────────────────────────────────────────
export const getChiusure = async (req, res) => {
  try {
    const chiusure = await Chiusura.find({ attivo: true }).sort({ dataInizio: 1 }).lean();
    const config = await getConfig();

    res.json({
      success: true,
      chiusure,
      config: {
        festivitaAttive: config.festivitaAttive,
        giorniChiusuraSettimanale: config.giorniChiusuraSettimanale
      }
    });
  } catch (error) {
    logger.error('[CHIUSURE] getChiusure error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/chiusure/verifica?data=YYYY-MM-DD
// ─────────────────────────────────────────────
export const verificaChiusura = async (req, res) => {
  try {
    const { data } = req.query;
    if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      return res.status(400).json({ success: false, message: 'Parametro data non valido (formato: YYYY-MM-DD)' });
    }

    const risultato = await verificaDataChiusa(data);
    res.json({ success: true, ...risultato });
  } catch (error) {
    logger.error('[CHIUSURE] verificaChiusura error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/chiusure/prossimo-disponibile?data=YYYY-MM-DD
// ─────────────────────────────────────────────
export const prossimoGiornoDisponibile = async (req, res) => {
  try {
    const { data } = req.query;
    if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      return res.status(400).json({ success: false, message: 'Parametro data non valido' });
    }

    let dataCorrente = new Date(data + 'T12:00:00');
    dataCorrente.setDate(dataCorrente.getDate() + 1); // Inizia dal giorno DOPO

    let trovato = null;
    for (let i = 0; i < 60; i++) { // Max 60 giorni di ricerca
      const dataStr = formatDate(dataCorrente);
      const { chiuso } = await verificaDataChiusa(dataStr);
      if (!chiuso) {
        trovato = dataStr;
        break;
      }
      dataCorrente.setDate(dataCorrente.getDate() + 1);
    }

    res.json({ success: true, prossimaData: trovato });
  } catch (error) {
    logger.error('[CHIUSURE] prossimoGiornoDisponibile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/chiusure/mese?anno=2026&mese=12
// Ritorna tutte le date chiuse in un mese (per il date picker)
// ─────────────────────────────────────────────
export const getChiusureMese = async (req, res) => {
  try {
    const anno  = parseInt(req.query.anno  || new Date().getFullYear());
    const mese  = parseInt(req.query.mese  || (new Date().getMonth() + 1)); // 1-12
    const config = await getConfig();

    const dateChiuse = [];
    const numGiorni = new Date(anno, mese, 0).getDate();

    for (let g = 1; g <= numGiorni; g++) {
      const dataStr = `${anno}-${String(mese).padStart(2,'0')}-${String(g).padStart(2,'0')}`;
      const { chiuso, motivo } = await verificaDataChiusa(dataStr);
      if (chiuso) {
        dateChiuse.push({ data: dataStr, motivo });
      }
    }

    res.json({ success: true, dateChiuse });
  } catch (error) {
    logger.error('[CHIUSURE] getChiusureMese error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// POST /api/chiusure - Crea nuova chiusura
// ─────────────────────────────────────────────
export const creaChiusura = async (req, res) => {
  try {
    const { tipo, dataInizio, dataFine, giornoSettimana, motivo, ripetiOgniAnno } = req.body;

    if (!tipo || !motivo) {
      return res.status(400).json({ success: false, message: 'tipo e motivo sono obbligatori' });
    }

    const dati = {
      tipo,
      motivo: motivo.trim(),
      ripetiOgniAnno: Boolean(ripetiOgniAnno),
      attivo: true,
      creatoDA: req.user?.nome || 'admin'
    };

    if (tipo === 'personalizzata') {
      if (!dataInizio) return res.status(400).json({ success: false, message: 'dataInizio obbligatoria' });
      dati.dataInizio = new Date(dataInizio + 'T00:00:00');
      dati.dataFine   = new Date((dataFine || dataInizio) + 'T23:59:59');
    }

    if (tipo === 'settimanale') {
      if (giornoSettimana === undefined || giornoSettimana === null) {
        return res.status(400).json({ success: false, message: 'giornoSettimana obbligatorio per tipo settimanale' });
      }
      dati.giornoSettimana = parseInt(giornoSettimana);
    }

    const chiusura = await Chiusura.create(dati);
    logger.info(`[CHIUSURE] Creata chiusura: ${motivo} (${tipo})`);

    res.status(201).json({ success: true, chiusura });
  } catch (error) {
    logger.error('[CHIUSURE] creaChiusura error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// PUT /api/chiusure/:id - Modifica chiusura
// ─────────────────────────────────────────────
export const aggiornaChiusura = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo, dataInizio, dataFine, ripetiOgniAnno, attivo } = req.body;

    const chiusura = await Chiusura.findById(id);
    if (!chiusura) return res.status(404).json({ success: false, message: 'Chiusura non trovata' });

    if (motivo !== undefined)         chiusura.motivo          = motivo.trim();
    if (dataInizio !== undefined)     chiusura.dataInizio      = new Date(dataInizio + 'T00:00:00');
    if (dataFine !== undefined)       chiusura.dataFine        = new Date(dataFine + 'T23:59:59');
    if (ripetiOgniAnno !== undefined) chiusura.ripetiOgniAnno = Boolean(ripetiOgniAnno);
    if (attivo !== undefined)         chiusura.attivo          = Boolean(attivo);

    await chiusura.save();
    res.json({ success: true, chiusura });
  } catch (error) {
    logger.error('[CHIUSURE] aggiornaChiusura error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/chiusure/:id - Elimina chiusura
// ─────────────────────────────────────────────
export const eliminaChiusura = async (req, res) => {
  try {
    const { id } = req.params;
    const chiusura = await Chiusura.findByIdAndDelete(id);
    if (!chiusura) return res.status(404).json({ success: false, message: 'Chiusura non trovata' });

    logger.info(`[CHIUSURE] Eliminata chiusura: ${chiusura.motivo}`);
    res.json({ success: true, message: 'Chiusura eliminata' });
  } catch (error) {
    logger.error('[CHIUSURE] eliminaChiusura error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/chiusure/config - Configurazione festività
// ─────────────────────────────────────────────
export const getConfigChiusure = async (req, res) => {
  try {
    const config = await getConfig();
    res.json({
      success: true,
      festivitaAttive: config.festivitaAttive,
      giorniChiusuraSettimanale: config.giorniChiusuraSettimanale
    });
  } catch (error) {
    logger.error('[CHIUSURE] getConfigChiusure error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// PUT /api/chiusure/config - Aggiorna configurazione festività
// ─────────────────────────────────────────────
export const aggiornaConfigChiusure = async (req, res) => {
  try {
    const { festivitaAttive, giorniChiusuraSettimanale } = req.body;

    let config = await ConfigChiusure.findOne();
    if (!config) config = new ConfigChiusure();

    if (festivitaAttive) {
      config.festivitaAttive = { ...config.festivitaAttive.toObject?.() || config.festivitaAttive, ...festivitaAttive };
    }
    if (giorniChiusuraSettimanale !== undefined) {
      config.giorniChiusuraSettimanale = giorniChiusuraSettimanale;
    }
    config.modificatoDA = req.user?.nome || 'admin';

    await config.save();
    logger.info('[CHIUSURE] Configurazione aggiornata');

    res.json({ success: true, config: { festivitaAttive: config.festivitaAttive, giorniChiusuraSettimanale: config.giorniChiusuraSettimanale } });
  } catch (error) {
    logger.error('[CHIUSURE] aggiornaConfigChiusure error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  getChiusure,
  verificaChiusura,
  prossimoGiornoDisponibile,
  getChiusureMese,
  creaChiusura,
  aggiornaChiusura,
  eliminaChiusura,
  getConfigChiusure,
  aggiornaConfigChiusure,
  verificaDataChiusa
};