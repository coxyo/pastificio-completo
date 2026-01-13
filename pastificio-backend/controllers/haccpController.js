// controllers/haccpController.js
// ✅ VERSIONE COMPLETA CON TUTTE LE SCHEDE DEL MANUALE HACCP
// Pastificio Nonna Claudia di Mameli Maurizio

import RegistrazioneHACCP from '../models/RegistrazioneHACCP.js';
import logger from '../config/logger.js';

/**
 * CONTROLLER HACCP COMPLETO
 * Gestisce tutte le operazioni HACCP secondo il manuale
 */

// ============================================
// LIMITI DAL MANUALE HACCP
// ============================================

const LIMITI_TEMPERATURA = {
  temperatura_frigo: { min: 0, max: 4, descrizione: 'Frigorifero' },
  temperatura_congelatore: { min: -25, max: -18, descrizione: 'Congelatore' },
  abbattitore: { min: null, max: 10, descrizione: 'Abbattitore (target finale)' },
  cottura: { min: 75, max: null, descrizione: 'Cottura (al cuore)' }
};

// ============================================
// REGISTRAZIONE TEMPERATURA (CCP1, CCP2, CCP5)
// ============================================

export const registraTemperatura = async (req, res) => {
  try {
    const {
      dispositivo,
      temperatura,
      tipo = 'temperatura_frigo',
      note
    } = req.body;

    const limite = LIMITI_TEMPERATURA[tipo];
    let conforme = true;

    // Verifica conformità
    if (limite.min !== null && temperatura < limite.min) {
      conforme = false;
    }
    if (limite.max !== null && temperatura > limite.max) {
      conforme = false;
    }

    const registrazione = new RegistrazioneHACCP({
      tipo,
      operatore: req.user?.nome || 'Maurizio Mameli',
      temperatura: {
        valore: temperatura,
        unitaMisura: '°C',
        dispositivo,
        conforme,
        limiteMin: limite.min,
        limiteMax: limite.max
      },
      conforme,
      richiedeAttenzione: !conforme,
      note
    });

    await registrazione.save();

    // Log e alert se non conforme
    if (!conforme) {
      logger.warn(`⚠️ HACCP - TEMPERATURA NON CONFORME: ${dispositivo} = ${temperatura}°C (limite: ${limite.min}°C - ${limite.max}°C)`);
    } else {
      logger.info(`✅ HACCP - Temperatura registrata: ${dispositivo} = ${temperatura}°C`);
    }

    res.status(201).json({
      success: true,
      data: registrazione,
      conforme,
      messaggio: conforme
        ? '✅ Temperatura nei limiti'
        : `⚠️ ATTENZIONE: Temperatura fuori range (${limite.min}°C - ${limite.max}°C)`
    });

  } catch (error) {
    logger.error('❌ HACCP - Errore registrazione temperatura:', error);
    res.status(500).json({
      success: false,
      error: 'Errore registrazione temperatura',
      dettagli: error.message
    });
  }
};

// ============================================
// CONTROLLO IGIENICO / PULIZIA
// ============================================

export const registraControlloIgienico = async (req, res) => {
  try {
    const { area, elementi, operatore, note } = req.body;

    const tuttiConformi = elementi.every(el => el.conforme !== false);

    const registrazione = new RegistrazioneHACCP({
      tipo: 'controllo_igienico',
      operatore: operatore || req.user?.nome || 'Maurizio Mameli',
      controlloIgienico: {
        area,
        elementi,
        azioneCorrettiva: tuttiConformi ? null : 'Richiesta pulizia aggiuntiva'
      },
      conforme: tuttiConformi,
      richiedeAttenzione: !tuttiConformi,
      note
    });

    await registrazione.save();

    if (!tuttiConformi) {
      logger.warn(`⚠️ HACCP - Controllo igienico NON CONFORME: ${area}`);
    } else {
      logger.info(`✅ HACCP - Controllo igienico registrato: ${area} (${elementi.length} aree)`);
    }

    res.status(201).json({
      success: true,
      data: registrazione,
      messaggio: tuttiConformi
        ? '✅ Controllo igienico conforme'
        : '⚠️ Registrate non conformità, richieste azioni correttive'
    });

  } catch (error) {
    logger.error('❌ HACCP - Errore registrazione controllo igienico:', error);
    res.status(500).json({
      success: false,
      error: 'Errore registrazione controllo igienico'
    });
  }
};

// ============================================
// ABBATTIMENTO TEMPERATURA (CCP4)
// ============================================

export const registraAbbattimento = async (req, res) => {
  try {
    const {
      prodotto,
      lotto,
      oraInizio,
      oraFine,
      temperaturaIniziale,
      temperaturaFinale,
      note
    } = req.body;

    // Calcola durata abbattimento
    let durataMinuti = null;
    if (oraInizio && oraFine) {
      const [hI, mI] = oraInizio.split(':').map(Number);
      const [hF, mF] = oraFine.split(':').map(Number);
      durataMinuti = (hF * 60 + mF) - (hI * 60 + mI);
    }

    // CCP4: Da 60°C a 10°C in max 2 ore (120 minuti)
    const conforme = temperaturaFinale <= 10 && (durataMinuti === null || durataMinuti <= 120);

    const registrazione = new RegistrazioneHACCP({
      tipo: 'abbattimento',
      operatore: req.user?.nome || 'Maurizio Mameli',
      abbattimento: {
        prodotto,
        lotto,
        oraInizio,
        oraFine,
        temperaturaIniziale,
        temperaturaFinale,
        durataMinuti
      },
      conforme,
      richiedeAttenzione: !conforme,
      note
    });

    await registrazione.save();

    if (!conforme) {
      logger.warn(`⚠️ HACCP CCP4 - Abbattimento NON CONFORME: ${prodotto} - Temp finale: ${temperaturaFinale}°C, Durata: ${durataMinuti} min`);
    } else {
      logger.info(`✅ HACCP - Abbattimento registrato: ${prodotto} - ${temperaturaFinale}°C in ${durataMinuti} min`);
    }

    res.status(201).json({
      success: true,
      data: registrazione,
      conforme,
      messaggio: conforme
        ? '✅ Abbattimento conforme (≤10°C entro 2h)'
        : '⚠️ ATTENZIONE: Abbattimento fuori parametri CCP4'
    });

  } catch (error) {
    logger.error('❌ HACCP - Errore registrazione abbattimento:', error);
    res.status(500).json({
      success: false,
      error: 'Errore registrazione abbattimento'
    });
  }
};

// ============================================
// CONTROLLO MATERIE PRIME (CCP1)
// ============================================

export const registraMateriePrime = async (req, res) => {
  try {
    const {
      fornitore,
      prodotto,
      lotto,
      dataScadenza,
      temperatura,
      conforme,
      note
    } = req.body;

    // CCP1: Temperatura materie prime deperibili ≤ 4°C
    const temperaturaConforme = temperatura === undefined || temperatura === null || temperatura <= 4;
    const conformeFinale = conforme && temperaturaConforme;

    const registrazione = new RegistrazioneHACCP({
      tipo: 'materie_prime',
      operatore: req.user?.nome || 'Maurizio Mameli',
      materiePrime: {
        fornitore,
        prodotto,
        lotto,
        dataScadenza: dataScadenza ? new Date(dataScadenza) : null,
        temperatura,
        integritaConfezioni: conforme,
        azione: conformeFinale ? 'accettato' : 'rifiutato'
      },
      conforme: conformeFinale,
      richiedeAttenzione: !conformeFinale,
      note
    });

    await registrazione.save();

    if (!conformeFinale) {
      logger.warn(`⚠️ HACCP CCP1 - Materie prime RIFIUTATE: ${prodotto} da ${fornitore} - Temp: ${temperatura}°C`);
    } else {
      logger.info(`✅ HACCP - Materie prime accettate: ${prodotto} da ${fornitore}`);
    }

    res.status(201).json({
      success: true,
      data: registrazione,
      conforme: conformeFinale,
      messaggio: conformeFinale
        ? '✅ Materie prime accettate'
        : '❌ Materie prime RIFIUTATE - Non conformi'
    });

  } catch (error) {
    logger.error('❌ HACCP - Errore registrazione materie prime:', error);
    res.status(500).json({
      success: false,
      error: 'Errore registrazione materie prime'
    });
  }
};

// ============================================
// CONTROLLO SCADENZE PRODOTTI
// ============================================

export const registraScadenzaProdotto = async (req, res) => {
  try {
    const { nomeProdotto, lotto, dataScadenza, quantita, unitaMisura } = req.body;

    const oggi = new Date();
    const scadenza = new Date(dataScadenza);
    const giorniMancanti = Math.floor((scadenza - oggi) / (1000 * 60 * 60 * 24));

    let azione = 'conforme';
    let conforme = true;

    if (giorniMancanti < 0) {
      azione = 'scaduto';
      conforme = false;
    } else if (giorniMancanti <= 7) {
      azione = 'prossimo_scadenza';
      conforme = true;
    }

    const registrazione = new RegistrazioneHACCP({
      tipo: 'scadenza_prodotto',
      operatore: req.user?.nome || 'Maurizio Mameli',
      scadenzaProdotto: {
        nomeProdotto,
        lotto,
        dataScadenza: scadenza,
        quantita,
        unitaMisura,
        azione
      },
      conforme,
      richiedeAttenzione: azione !== 'conforme',
      note: giorniMancanti <= 7 ? `Prodotto in scadenza tra ${giorniMancanti} giorni` : null
    });

    await registrazione.save();

    if (azione === 'scaduto') {
      logger.warn(`⚠️ HACCP - PRODOTTO SCADUTO: ${nomeProdotto} (Lotto: ${lotto})`);
    }

    res.status(201).json({
      success: true,
      data: registrazione,
      giorniMancanti,
      messaggio: azione === 'scaduto'
        ? '❌ PRODOTTO SCADUTO - Procedere con smaltimento'
        : azione === 'prossimo_scadenza'
        ? `⚠️ In scadenza tra ${giorniMancanti} giorni`
        : '✅ Prodotto conforme'
    });

  } catch (error) {
    logger.error('❌ HACCP - Errore registrazione scadenza:', error);
    res.status(500).json({
      success: false,
      error: 'Errore registrazione scadenza'
    });
  }
};

// ============================================
// REGISTRA NON CONFORMITÀ
// ============================================

export const registraNonConformita = async (req, res) => {
  try {
    const {
      tipo,
      descrizione,
      azioneCorrettiva,
      responsabile
    } = req.body;

    const registrazione = new RegistrazioneHACCP({
      tipo: 'non_conformita',
      operatore: responsabile || req.user?.nome || 'Maurizio Mameli',
      nonConformita: {
        tipoNC: tipo,
        descrizione,
        azioneCorrettiva,
        dataRilevazione: new Date(),
        risolto: false
      },
      conforme: false,
      richiedeAttenzione: true,
      note: descrizione
    });

    await registrazione.save();

    logger.warn(`⚠️ HACCP - NON CONFORMITÀ REGISTRATA: ${tipo} - ${descrizione}`);

    res.status(201).json({
      success: true,
      data: registrazione,
      messaggio: '⚠️ Non conformità registrata - Azione correttiva richiesta'
    });

  } catch (error) {
    logger.error('❌ HACCP - Errore registrazione non conformità:', error);
    res.status(500).json({
      success: false,
      error: 'Errore registrazione non conformità'
    });
  }
};

// ============================================
// SANIFICAZIONE
// ============================================

export const registraSanificazione = async (req, res) => {
  try {
    const { area, prodottoUsato, concentrazione, durata, verificaEfficacia } = req.body;

    const registrazione = new RegistrazioneHACCP({
      tipo: 'sanificazione',
      operatore: req.user?.nome || 'Maurizio Mameli',
      sanificazione: {
        area,
        prodottoUsato,
        concentrazione,
        durata,
        verificaEfficacia
      },
      conforme: verificaEfficacia !== false
    });

    await registrazione.save();

    logger.info(`✅ HACCP - Sanificazione registrata: ${area}`);

    res.status(201).json({
      success: true,
      data: registrazione,
      messaggio: '✅ Sanificazione registrata correttamente'
    });

  } catch (error) {
    logger.error('❌ HACCP - Errore registrazione sanificazione:', error);
    res.status(500).json({
      success: false,
      error: 'Errore registrazione sanificazione'
    });
  }
};

// ============================================
// DASHBOARD HACCP
// ============================================

export const getDashboardHACCP = async (req, res) => {
  try {
    const oggi = new Date();
    const setteGiorniFa = new Date(oggi);
    setteGiorniFa.setDate(setteGiorniFa.getDate() - 7);

    const inizioMese = new Date(oggi.getFullYear(), oggi.getMonth(), 1);

    // Registrazioni ultimi 7 giorni
    const registrazioniRecenti = await RegistrazioneHACCP.find({
      dataOra: { $gte: setteGiorniFa }
    }).sort({ dataOra: -1 });

    // Non conformità
    const nonConformita = await RegistrazioneHACCP.find({
      conforme: false,
      dataOra: { $gte: setteGiorniFa }
    }).sort({ dataOra: -1 });

    // Richiedono attenzione
    const richiedonoAttenzione = await RegistrazioneHACCP.find({
      richiedeAttenzione: true,
      dataOra: { $gte: setteGiorniFa }
    }).sort({ dataOra: -1 });

    // Statistiche mensili
    const registrazioniMese = await RegistrazioneHACCP.find({
      dataOra: { $gte: inizioMese }
    });

    const statsMensili = {
      totale: registrazioniMese.length,
      conformi: registrazioniMese.filter(r => r.conforme).length,
      nonConformi: registrazioniMese.filter(r => !r.conforme).length
    };

    // Ultime temperature per dispositivo
    const temperatureAttuali = {};
    const dispositivi = ['Frigorifero 1 (Principale)', 'Frigorifero 2', 'Frigorifero 3', 'Congelatore Principale'];
    
    for (const disp of dispositivi) {
      const ultimaTemp = await RegistrazioneHACCP.findOne({
        tipo: { $in: ['temperatura_frigo', 'temperatura_congelatore'] },
        'temperatura.dispositivo': disp
      }).sort({ dataOra: -1 });

      if (ultimaTemp) {
        const id = disp.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 10);
        temperatureAttuali[id] = ultimaTemp.temperatura;
      }
    }

    res.json({
      success: true,
      dashboard: {
        periodo: {
          da: setteGiorniFa,
          a: oggi
        },
        riepilogo: {
          totaleRegistrazioni: registrazioniRecenti.length,
          conformi: registrazioniRecenti.filter(r => r.conforme).length,
          nonConformi: nonConformita.length,
          richiedonoAttenzione: richiedonoAttenzione.length
        },
        temperatureAttuali,
        statisticheMensili: statsMensili,
        nonConformita: nonConformita.slice(0, 10),
        richiedonoAttenzione: richiedonoAttenzione.slice(0, 10)
      }
    });

  } catch (error) {
    logger.error('❌ HACCP - Errore dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Errore caricamento dashboard'
    });
  }
};

// ============================================
// GET REGISTRAZIONI
// ============================================

export const getRegistrazioni = async (req, res) => {
  try {
    const { limit = 50, tipo } = req.query;
    
    const query = {};
    if (tipo) {
      query.tipo = tipo;
    }

    const registrazioni = await RegistrazioneHACCP.find(query)
      .sort({ dataOra: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      registrazioni,
      totale: registrazioni.length
    });

  } catch (error) {
    logger.error('❌ HACCP - Errore recupero registrazioni:', error);
    res.status(500).json({
      success: false,
      error: 'Errore recupero registrazioni'
    });
  }
};

// ============================================
// GET STORICO TEMPERATURE
// ============================================

export const getStoricoTemperature = async (req, res) => {
  try {
    const { dispositivo } = req.params;
    const { limit = 30 } = req.query;

    const registrazioni = await RegistrazioneHACCP.find({
      tipo: { $in: ['temperatura_frigo', 'temperatura_congelatore'] },
      'temperatura.dispositivo': { $regex: dispositivo, $options: 'i' }
    })
    .sort({ dataOra: -1 })
    .limit(parseInt(limit));

    // Calcola statistiche
    const temperature = registrazioni
      .map(r => r.temperatura?.valore)
      .filter(t => t !== undefined);

    const stats = temperature.length > 0 ? {
      media: (temperature.reduce((a, b) => a + b, 0) / temperature.length).toFixed(1),
      min: Math.min(...temperature),
      max: Math.max(...temperature),
      conformi: registrazioni.filter(r => r.conforme).length,
      nonConformi: registrazioni.filter(r => !r.conforme).length
    } : null;

    res.json({
      success: true,
      dispositivo,
      totaleRegistrazioni: registrazioni.length,
      statistiche: stats,
      registrazioni
    });

  } catch (error) {
    logger.error('❌ HACCP - Errore recupero storico temperature:', error);
    res.status(500).json({
      success: false,
      error: 'Errore recupero storico'
    });
  }
};

// ============================================
// EXPORT
// ============================================

export default {
  registraTemperatura,
  registraControlloIgienico,
  registraAbbattimento,
  registraMateriePrime,
  registraScadenzaProdotto,
  registraNonConformita,
  registraSanificazione,
  getDashboardHACCP,
  getRegistrazioni,
  getStoricoTemperature
};