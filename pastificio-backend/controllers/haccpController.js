// controllers/haccpController.js
// ✅ CONTROLLER COMPLETO HACCP - MONGODB INTEGRATION

import RegistrazioneHACCP from '../models/RegistrazioneHACCP.js';

// ============================================
// SALVA TEMPERATURA
// ============================================
export const salvaTemperatura = async (req, res) => {
  try {
    const { dispositivo, tipo, temperatura, conforme, automatico, note } = req.body;

    console.log('📊 [HACCP Controller] Salvataggio temperatura:', {
      dispositivo,
      tipo,
      temperatura,
      conforme,
      automatico
    });

    // Crea registrazione
    const registrazione = new RegistrazioneHACCP({
      tipo: tipo === 'frigorifero' ? 'temperatura_frigo' : 
            tipo === 'congelatore' ? 'temperatura_congelatore' : 
            'abbattimento',
      dataOra: new Date(),
      operatore: req.user?.nome || 'Maurizio Mameli',
      temperatura: {
        valore: temperatura,
        unitaMisura: '°C',
        dispositivo: dispositivo,
        conforme: conforme,
        limiteMin: tipo === 'frigorifero' ? 0 : tipo === 'congelatore' ? -22 : -40,
        limiteMax: tipo === 'frigorifero' ? 4 : tipo === 'congelatore' ? -18 : -30
      },
      conforme: conforme,
      richiedeAttenzione: !conforme,
      note: note || (automatico ? 'Registrazione automatica martedì' : '')
    });

    await registrazione.save();

    console.log('✅ [HACCP Controller] Temperatura salvata con successo:', registrazione._id);

    res.status(201).json({
      success: true,
      message: 'Temperatura registrata con successo',
      data: registrazione
    });

  } catch (error) {
    console.error('❌ [HACCP Controller] Errore salvataggio temperatura:', error);
    res.status(500).json({
      success: false,
      message: 'Errore salvataggio temperatura',
      error: error.message
    });
  }
};

// ============================================
// CHECK SE GIÀ REGISTRATO OGGI
// ============================================
export const checkRegistrazioneOggi = async (req, res) => {
  try {
    const { data } = req.query;

    console.log('🔍 [HACCP Controller] Check registrazione per data:', data);

    // Parse data
    const dataTarget = new Date(data);
    const inizioGiorno = new Date(dataTarget.setHours(0, 0, 0, 0));
    const fineGiorno = new Date(dataTarget.setHours(23, 59, 59, 999));

    // Cerca registrazioni nel giorno
    const registrazioni = await RegistrazioneHACCP.find({
      tipo: { $in: ['temperatura_frigo', 'temperatura_congelatore', 'abbattimento'] },
      dataOra: {
        $gte: inizioGiorno,
        $lte: fineGiorno
      }
    });

    const giaRegistrato = registrazioni.length >= 6; // 6 dispositivi

    console.log(`✅ [HACCP Controller] Trovate ${registrazioni.length} registrazioni, già registrato: ${giaRegistrato}`);

    res.json({
      success: true,
      giaRegistrato: giaRegistrato,
      registrazioni: registrazioni.length,
      data: data
    });

  } catch (error) {
    console.error('❌ [HACCP Controller] Errore check registrazione:', error);
    res.status(500).json({
      success: false,
      message: 'Errore verifica registrazione',
      error: error.message
    });
  }
};

// ============================================
// OTTIENI DASHBOARD HACCP
// ============================================
export const getDashboard = async (req, res) => {
  try {
    console.log('📊 [HACCP Controller] Caricamento dashboard...');

    // Ultimi 30 giorni
    const dataInizio = new Date();
    dataInizio.setDate(dataInizio.getDate() - 30);

    // Statistiche generali
    const totali = await RegistrazioneHACCP.countDocuments({
      dataOra: { $gte: dataInizio }
    });

    const conformi = await RegistrazioneHACCP.countDocuments({
      dataOra: { $gte: dataInizio },
      conforme: true
    });

    const nonConformi = await RegistrazioneHACCP.countDocuments({
      dataOra: { $gte: dataInizio },
      conforme: false
    });

    const daVerificare = await RegistrazioneHACCP.countDocuments({
      dataOra: { $gte: dataInizio },
      richiedeAttenzione: true
    });

    // Ultimi controlli per dispositivo
    const ultimiControlliPromises = [
      'frigo1_isa',
      'frigo2_icecool',
      'frigo3_samsung',
      'freezer_samsung',
      'congelatore',
      'abbattitore'
    ].map(async (dispositivo) => {
      const ultimo = await RegistrazioneHACCP.findOne({
        'temperatura.dispositivo': dispositivo
      }).sort({ dataOra: -1 }).limit(1);

      return ultimo;
    });

    const ultimiControlli = (await Promise.all(ultimiControlliPromises))
      .filter(c => c !== null);

    // Raggruppa per tipo
    const frigoriferi = ultimiControlli.filter(c => 
      c.tipo === 'temperatura_frigo'
    );

    const congelatori = ultimiControlli.filter(c => 
      c.tipo === 'temperatura_congelatore'
    );

    const abbattitori = ultimiControlli.filter(c => 
      c.tipo === 'abbattimento'
    );

    console.log('✅ [HACCP Controller] Dashboard caricata con successo');

    res.json({
      success: true,
      data: {
        registrazioni: {
          totali,
          conformi,
          nonConformi,
          daVerificare
        },
        ultimiControlli: {
          frigoriferi,
          congelatori,
          abbattitori
        },
        statistiche: {
          totaleRegistrazioni: totali,
          conformi,
          nonConformi,
          percentualeConformita: totali > 0 ? ((conformi / totali) * 100).toFixed(1) : 0
        }
      }
    });

  } catch (error) {
    console.error('❌ [HACCP Controller] Errore caricamento dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Errore caricamento dashboard',
      error: error.message
    });
  }
};

// ============================================
// OTTIENI STORICO TEMPERATURE
// ============================================
export const getStoricoTemperature = async (req, res) => {
  try {
    const { dataInizio, dataFine, dispositivo, tipo } = req.query;

    console.log('📊 [HACCP Controller] Richiesta storico temperature:', {
      dataInizio,
      dataFine,
      dispositivo,
      tipo
    });

    // Build query
    const query = {
      tipo: { $in: ['temperatura_frigo', 'temperatura_congelatore', 'abbattimento'] }
    };

    if (dataInizio && dataFine) {
      query.dataOra = {
        $gte: new Date(dataInizio),
        $lte: new Date(dataFine)
      };
    }

    if (dispositivo) {
      query['temperatura.dispositivo'] = dispositivo;
    }

    if (tipo) {
      query.tipo = tipo;
    }

    // Query
    const registrazioni = await RegistrazioneHACCP
      .find(query)
      .sort({ dataOra: -1 })
      .limit(1000);

    console.log(`✅ [HACCP Controller] Trovate ${registrazioni.length} registrazioni`);

    res.json({
      success: true,
      data: registrazioni,
      count: registrazioni.length
    });

  } catch (error) {
    console.error('❌ [HACCP Controller] Errore storico temperature:', error);
    res.status(500).json({
      success: false,
      message: 'Errore recupero storico',
      error: error.message
    });
  }
};

// ============================================
// ESPORTA REPORT HACCP
// ============================================
export const esportaReport = async (req, res) => {
  try {
    const { dataInizio, dataFine } = req.query;

    console.log('📄 [HACCP Controller] Esportazione report:', {
      dataInizio,
      dataFine
    });

    const registrazioni = await RegistrazioneHACCP
      .find({
        dataOra: {
          $gte: new Date(dataInizio),
          $lte: new Date(dataFine)
        }
      })
      .sort({ dataOra: -1 });

    // Prepara dati per export
    const datiExport = registrazioni.map(reg => ({
      Data: new Date(reg.dataOra).toLocaleString('it-IT'),
      Tipo: reg.tipo,
      Dispositivo: reg.temperatura?.dispositivo || 'N/A',
      Temperatura: reg.temperatura?.valore ? `${reg.temperatura.valore}°C` : 'N/A',
      Conforme: reg.conforme ? 'Sì' : 'No',
      Note: reg.note || '',
      Operatore: reg.operatore
    }));

    console.log(`✅ [HACCP Controller] Report esportato: ${datiExport.length} record`);

    res.json({
      success: true,
      data: datiExport,
      count: datiExport.length
    });

  } catch (error) {
    console.error('❌ [HACCP Controller] Errore esportazione report:', error);
    res.status(500).json({
      success: false,
      message: 'Errore esportazione report',
      error: error.message
    });
  }
};

// Export default
export default {
  salvaTemperatura,
  checkRegistrazioneOggi,
  getDashboard,
  getStoricoTemperature,
  esportaReport
};