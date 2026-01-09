// controllers/haccpController.js
import RegistrazioneHACCP from '../models/RegistrazioneHACCP.js';
import logger from '../config/logger.js';
import emailService from '../services/emailService.js';

/**
 * CONTROLLER HACCP
 * Gestisce tutte le operazioni HACCP
 */

/**
 * @route   POST /api/haccp/temperatura
 * @desc    Registra temperatura frigorifero/congelatore
 */
export const registraTemperatura = async (req, res) => {
  try {
    const {
      dispositivo, // "Frigo 1", "Congelatore principale"
      temperatura,
      tipo = 'temperatura_frigo'
    } = req.body;

    // Limiti standard HACCP
    const limiti = {
      temperatura_frigo: { min: 0, max: 4 },
      temperatura_congelatore: { min: -25, max: -18 }
    };

    const limite = limiti[tipo];
    const conforme = temperatura >= limite.min && temperatura <= limite.max;

    const registrazione = new RegistrazioneHACCP({
      tipo,
      operatore: req.user?.nome || 'Sistema Automatico',
      temperatura: {
        valore: temperatura,
        unitaMisura: '°C',
        dispositivo,
        conforme,
        limiteMin: limite.min,
        limiteMax: limite.max
      },
      conforme,
      richiedeAttenzione: !conforme
    });

    await registrazione.save();

    // Se non conforme, invia alert
    if (!conforme) {
      logger.warn(`⚠️ TEMPERATURA NON CONFORME: ${dispositivo} = ${temperatura}°C`);
      await inviaAlertTemperatura(registrazione);
    }

    logger.info(`✅ Temperatura registrata: ${dispositivo} = ${temperatura}°C`);
    
    res.status(201).json({
      success: true,
      data: registrazione,
      conforme,
      messaggio: conforme 
        ? 'Temperatura nei limiti' 
        : `⚠️ ATTENZIONE: Temperatura fuori range (${limite.min}°C - ${limite.max}°C)`
    });

  } catch (error) {
    logger.error('❌ Errore registrazione temperatura:', error);
    res.status(500).json({
      success: false,
      error: 'Errore registrazione temperatura',
      dettagli: error.message
    });
  }
};

/**
 * @route   POST /api/haccp/controllo-igienico
 * @desc    Registra controllo igienico
 */
export const registraControlloIgienico = async (req, res) => {
  try {
    const { area, elementi, azioneCorrettiva } = req.body;

    const tuttiConformi = elementi.every(el => el.conforme);

    const registrazione = new RegistrazioneHACCP({
      tipo: 'controllo_igienico',
      operatore: req.user?.nome || 'Maurizio Mameli',
      controlloIgienico: {
        area,
        elementi,
        azioneCorrettiva: tuttiConformi ? null : azioneCorrettiva
      },
      conforme: tuttiConformi,
      richiedeAttenzione: !tuttiConformi
    });

    await registrazione.save();

    if (!tuttiConformi) {
      logger.warn(`⚠️ CONTROLLO IGIENICO NON CONFORME: ${area}`);
    }

    res.status(201).json({
      success: true,
      data: registrazione,
      messaggio: tuttiConformi 
        ? 'Controllo igienico conforme' 
        : 'Registrate non conformità, richieste azioni correttive'
    });

  } catch (error) {
    logger.error('❌ Errore registrazione controllo igienico:', error);
    res.status(500).json({
      success: false,
      error: 'Errore registrazione controllo igienico'
    });
  }
};

/**
 * @route   POST /api/haccp/scadenza-prodotto
 * @desc    Registra controllo scadenze
 */
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
      conforme = true; // Tecnicamente conforme ma va monitorato
    }

    const registrazione = new RegistrazioneHACCP({
      tipo: 'scadenza_prodotto',
      operatore: req.user?.nome || 'Sistema Automatico',
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
      logger.warn(`⚠️ PRODOTTO SCADUTO: ${nomeProdotto} (Lotto: ${lotto})`);
      await inviaAlertScadenza(registrazione);
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
    logger.error('❌ Errore registrazione scadenza:', error);
    res.status(500).json({
      success: false,
      error: 'Errore registrazione scadenza'
    });
  }
};

/**
 * @route   GET /api/haccp/temperature/:dispositivo
 * @desc    Ottieni storico temperature dispositivo
 */
export const getStoricoTemperature = async (req, res) => {
  try {
    const { dispositivo } = req.params;
    const { limit = 30 } = req.query;

    const registrazioni = await RegistrazioneHACCP.getUltimeTemperature(
      dispositivo,
      parseInt(limit)
    );

    // Calcola statistiche
    const temperature = registrazioni
      .map(r => r.temperatura.valore)
      .filter(t => t !== undefined);

    const stats = {
      media: temperature.reduce((a, b) => a + b, 0) / temperature.length,
      min: Math.min(...temperature),
      max: Math.max(...temperature),
      conformi: registrazioni.filter(r => r.conforme).length,
      nonConformi: registrazioni.filter(r => !r.conforme).length
    };

    res.json({
      success: true,
      dispositivo,
      totaleRegistrazioni: registrazioni.length,
      statistiche: stats,
      registrazioni
    });

  } catch (error) {
    logger.error('❌ Errore recupero storico temperature:', error);
    res.status(500).json({
      success: false,
      error: 'Errore recupero storico'
    });
  }
};

/**
 * @route   GET /api/haccp/dashboard
 * @desc    Dashboard HACCP con tutte le statistiche
 */
export const getDashboardHACCP = async (req, res) => {
  try {
    const oggi = new Date();
    const setteGiorniFa = new Date(oggi);
    setteGiorniFa.setDate(setteGiorniFa.getDate() - 7);

    // Registrazioni ultimi 7 giorni
    const registrazioniRecenti = await RegistrazioneHACCP.find({
      dataOra: { $gte: setteGiorniFa }
    }).sort({ dataOra: -1 });

    // Non conformità
    const nonConformita = await RegistrazioneHACCP.getNonConformi(7);

    // Registrazioni che richiedono attenzione
    const richiedonoAttenzione = await RegistrazioneHACCP.find({
      richiedeAttenzione: true,
      dataOra: { $gte: setteGiorniFa }
    }).sort({ dataOra: -1 });

    // Statistiche mensili
    const statsMensili = await RegistrazioneHACCP.getStatisticheMensili(
      oggi.getFullYear(),
      oggi.getMonth() + 1
    );

    // Ultime temperature frigoriferi
    const frigoPrincipale = await RegistrazioneHACCP.getUltimeTemperature('Frigo 1', 1);
    const congelatorePrincipale = await RegistrazioneHACCP.getUltimeTemperature('Congelatore principale', 1);

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
        temperatureAttuali: {
          frigo: frigoPrincipale[0]?.temperatura || null,
          congelatore: congelatorePrincipale[0]?.temperatura || null
        },
        statisticheMensili: statsMensili,
        nonConformita: nonConformita.slice(0, 10),
        richiedonoAttenzione: richiedonoAttenzione.slice(0, 10)
      }
    });

  } catch (error) {
    logger.error('❌ Errore dashboard HACCP:', error);
    res.status(500).json({
      success: false,
      error: 'Errore caricamento dashboard'
    });
  }
};

/**
 * @route   POST /api/haccp/sanificazione
 * @desc    Registra sanificazione
 */
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

    res.status(201).json({
      success: true,
      data: registrazione,
      messaggio: 'Sanificazione registrata correttamente'
    });

  } catch (error) {
    logger.error('❌ Errore registrazione sanificazione:', error);
    res.status(500).json({
      success: false,
      error: 'Errore registrazione sanificazione'
    });
  }
};

/**
 * UTILITY: Invia alert temperatura
 */
async function inviaAlertTemperatura(registrazione) {
  try {
    const messaggio = `⚠️ ALERT HACCP - Temperatura Fuori Range

Dispositivo: ${registrazione.temperatura.dispositivo}
Temperatura: ${registrazione.temperatura.valore}°C
Limiti: ${registrazione.temperatura.limiteMin}°C - ${registrazione.temperatura.limiteMax}°C
Data/Ora: ${registrazione.dataOra.toLocaleString('it-IT')}

⚠️ AZIONE RICHIESTA: Verificare il dispositivo immediatamente!`;

    // TODO: Inviare via WhatsApp, Email, Push Notification
    logger.warn(messaggio);

  } catch (error) {
    logger.error('❌ Errore invio alert temperatura:', error);
  }
}

/**
 * UTILITY: Invia alert scadenza
 */
async function inviaAlertScadenza(registrazione) {
  try {
    const messaggio = `⚠️ ALERT HACCP - Prodotto Scaduto

Prodotto: ${registrazione.scadenzaProdotto.nomeProdotto}
Lotto: ${registrazione.scadenzaProdotto.lotto}
Scadenza: ${registrazione.scadenzaProdotto.dataScadenza.toLocaleDateString('it-IT')}
Quantità: ${registrazione.scadenzaProdotto.quantita} ${registrazione.scadenzaProdotto.unitaMisura}

❌ AZIONE RICHIESTA: Smaltire immediatamente il prodotto!`;

    // TODO: Inviare via WhatsApp, Email
    logger.warn(messaggio);

  } catch (error) {
    logger.error('❌ Errore invio alert scadenza:', error);
  }
}

export default {
  registraTemperatura,
  registraControlloIgienico,
  registraScadenzaProdotto,
  getStoricoTemperature,
  getDashboardHACCP,
  registraSanificazione
};