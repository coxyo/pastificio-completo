// controllers/haccpController.js
// ✅ CONTROLLER COMPLETO HACCP CON TUTTE LE FUNZIONI

import RegistrazioneHACCP from '../models/RegistrazioneHACCP.js';

const haccpController = {

  // ============================================
  // 1. DASHBOARD
  // ============================================
  getDashboard: async (req, res) => {
    try {
      console.log('📊 [HACCP Controller] Caricamento dashboard...');
      
      const oggi = new Date();
      oggi.setHours(0, 0, 0, 0);
      
      const dataInizio = new Date(oggi);
      dataInizio.setDate(dataInizio.getDate() - 30);

      // Conta registrazioni per tipo
      const registrazioni = await RegistrazioneHACCP.countDocuments({
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

      console.log('✅ [HACCP Controller] Dashboard caricata con successo');

      res.json({
        success: true,
        data: {
          registrazioni: {
            totale: registrazioni,
            conformi,
            nonConformi,
            daVerificare
          },
          periodo: {
            inizio: dataInizio,
            fine: oggi
          }
        }
      });

    } catch (error) {
      console.error('❌ [HACCP Controller] Errore dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Errore caricamento dashboard',
        error: error.message
      });
    }
  },

  // ============================================
  // 2. CHECK REGISTRAZIONE GIORNALIERA
  // ============================================
  checkRegistrazioneOggi: async (req, res) => {
    try {
      const { data } = req.query;
      console.log('🔍 [HACCP Controller] Check registrazione per data:', data);

      const dataRichiesta = data ? new Date(data) : new Date();
      const inizioGiorno = new Date(dataRichiesta.setHours(0, 0, 0, 0));
      const fineGiorno = new Date(dataRichiesta.setHours(23, 59, 59, 999));

      // Conta registrazioni di oggi
      const registrazioni = await RegistrazioneHACCP.countDocuments({
        dataOra: {
          $gte: inizioGiorno,
          $lte: fineGiorno
        },
        tipo: { $in: ['temperatura_frigo', 'temperatura_congelatore', 'abbattimento'] }
      });

      const registrato = registrazioni >= 6; // Almeno 1 per ogni dispositivo

      console.log(`✅ [HACCP Controller] Registrazioni trovate: ${registrazioni}, Completato: ${registrato}`);

      res.json({
        success: true,
        data: {
          registrato,
          numeroRegistrazioni: registrazioni,
          data: dataRichiesta
        }
      });

    } catch (error) {
      console.error('❌ [HACCP Controller] Errore check registrazione:', error);
      res.status(500).json({
        success: false,
        message: 'Errore verifica registrazione',
        error: error.message
      });
    }
  },

  // ============================================
  // 3. SALVA TEMPERATURA (⚠️ QUESTA MANCAVA!)
  // ============================================
  salvaTemperatura: async (req, res) => {
    try {
      console.log('🌡️ [HACCP Controller] Ricevuta richiesta salvataggio temperature');
      console.log('📊 [HACCP Controller] Body completo:', JSON.stringify(req.body, null, 2));
      console.log('👤 [HACCP Controller] User:', req.user?.nome || 'Non autenticato');

      // Estrai dati dal body
      const { temperature, data, operatore, note } = req.body;

      // ⚠️ VALIDAZIONE CRITICA
      if (!temperature || !Array.isArray(temperature)) {
        console.error('❌ [HACCP Controller] Validazione fallita: temperature non è un array');
        return res.status(400).json({
          success: false,
          message: 'Dati temperature mancanti o formato non valido. Atteso array di oggetti.'
        });
      }

      if (temperature.length === 0) {
        console.error('❌ [HACCP Controller] Validazione fallita: array temperature vuoto');
        return res.status(400).json({
          success: false,
          message: 'Array temperature vuoto. Inserire almeno una temperatura.'
        });
      }

      console.log(`📊 [HACCP Controller] Temperature da salvare: ${temperature.length}`);

      // Prepara data registrazione
      const dataRegistrazione = data ? new Date(data) : new Date();
      dataRegistrazione.setHours(9, 0, 0, 0); // Normalizza a ore 9:00

      // Array per risultati
      const risultati = [];
      const errori = [];

      // Salva ogni temperatura
      for (let i = 0; i < temperature.length; i++) {
        const temp = temperature[i];
        
        console.log(`📝 [HACCP Controller] Elaborazione temperatura ${i + 1}/${temperature.length}:`, temp);

        try {
          // Validazione singola temperatura
          if (!temp.dispositivo || temp.temperatura === undefined) {
            console.warn(`⚠️ [HACCP Controller] Temperatura ${i + 1} incompleta, skip`);
            errori.push({
              indice: i,
              dispositivo: temp.dispositivo || 'sconosciuto',
              errore: 'Dati incompleti'
            });
            continue;
          }

          // Determina tipo
          let tipo = 'temperatura_frigo';
          if (temp.dispositivo.toLowerCase().includes('freezer') || 
              temp.dispositivo.toLowerCase().includes('congelatore')) {
            tipo = 'temperatura_congelatore';
          } else if (temp.dispositivo.toLowerCase().includes('abbattitore')) {
            tipo = 'abbattimento';
          }

          // Determina limiti
          let limiteMin, limiteMax;
          if (tipo === 'temperatura_frigo') {
            limiteMin = 0;
            limiteMax = 4;
          } else if (tipo === 'temperatura_congelatore') {
            limiteMin = -22;
            limiteMax = -18;
          } else if (tipo === 'abbattimento') {
            limiteMin = -40;
            limiteMax = -30;
          }

          // Verifica conformità
          const temperaturaValore = parseFloat(temp.temperatura);
          const conforme = temp.conforme !== undefined 
            ? temp.conforme 
            : (temperaturaValore >= limiteMin && temperaturaValore <= limiteMax);

          // Crea documento
          const registrazione = new RegistrazioneHACCP({
            tipo,
            dataOra: dataRegistrazione,
            operatore: operatore || req.user?.nome || 'Maurizio Mameli',
            temperatura: {
              valore: temperaturaValore,
              unitaMisura: '°C',
              dispositivo: temp.dispositivo,
              conforme,
              limiteMin,
              limiteMax
            },
            conforme,
            richiedeAttenzione: !conforme,
            note: temp.note || note || null
          });

          // Salva in database
          const salvato = await registrazione.save();
          
          console.log(`✅ [HACCP Controller] Temperatura ${i + 1} salvata: ${temp.dispositivo} = ${temperaturaValore}°C`);
          
          risultati.push({
            dispositivo: temp.dispositivo,
            temperatura: temperaturaValore,
            conforme,
            id: salvato._id
          });

        } catch (errSalvataggio) {
          console.error(`❌ [HACCP Controller] Errore salvataggio temperatura ${i + 1}:`, errSalvataggio);
          errori.push({
            indice: i,
            dispositivo: temp.dispositivo,
            errore: errSalvataggio.message
          });
        }
      }

      // Response finale
      if (risultati.length > 0) {
        console.log(`✅ [HACCP Controller] Salvataggio completato: ${risultati.length}/${temperature.length} successi`);
        
        res.json({
          success: true,
          message: `Temperature salvate con successo (${risultati.length}/${temperature.length})`,
          data: {
            salvate: risultati.length,
            totali: temperature.length,
            dettagli: risultati,
            errori: errori.length > 0 ? errori : undefined
          }
        });
      } else {
        console.error('❌ [HACCP Controller] Nessuna temperatura salvata');
        res.status(400).json({
          success: false,
          message: 'Nessuna temperatura è stata salvata',
          errori
        });
      }

    } catch (error) {
      console.error('💥 [HACCP Controller] Errore CATCH generale:', error);
      res.status(500).json({
        success: false,
        message: 'Errore interno del server durante il salvataggio',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  },

  // ============================================
  // 4. STORICO TEMPERATURE
  // ============================================
  getStoricoTemperature: async (req, res) => {
    try {
      console.log('📜 [HACCP Controller] Richiesta storico temperature');
      
      const { dataInizio, dataFine, dispositivo, tipo } = req.query;

      // Costruisci filtro
      const filtro = {
        tipo: { $in: ['temperatura_frigo', 'temperatura_congelatore', 'abbattimento'] }
      };

      if (dataInizio || dataFine) {
        filtro.dataOra = {};
        if (dataInizio) filtro.dataOra.$gte = new Date(dataInizio);
        if (dataFine) filtro.dataOra.$lte = new Date(dataFine);
      }

      if (dispositivo) {
        filtro['temperatura.dispositivo'] = dispositivo;
      }

      if (tipo) {
        filtro.tipo = tipo;
      }

      // Query database
      const registrazioni = await RegistrazioneHACCP.find(filtro)
        .sort({ dataOra: -1 })
        .limit(1000)
        .lean();

      console.log(`✅ [HACCP Controller] Trovate ${registrazioni.length} registrazioni`);

      res.json({
        success: true,
        data: {
          totale: registrazioni.length,
          registrazioni
        }
      });

    } catch (error) {
      console.error('❌ [HACCP Controller] Errore storico:', error);
      res.status(500).json({
        success: false,
        message: 'Errore recupero storico',
        error: error.message
      });
    }
  },

  // ============================================
  // 5. ESPORTA REPORT
  // ============================================
  esportaReport: async (req, res) => {
    try {
      console.log('📄 [HACCP Controller] Richiesta esportazione report');
      
      const { dataInizio, dataFine } = req.query;

      const filtro = {
        dataOra: {
          $gte: new Date(dataInizio || Date.now() - 30 * 24 * 60 * 60 * 1000),
          $lte: new Date(dataFine || Date.now())
        }
      };

      const registrazioni = await RegistrazioneHACCP.find(filtro)
        .sort({ dataOra: -1 })
        .lean();

      // Prepara CSV
      const csv = [
        'Data,Ora,Tipo,Dispositivo,Temperatura,Conforme,Operatore,Note',
        ...registrazioni.map(r => {
          const data = new Date(r.dataOra);
          return [
            data.toLocaleDateString('it-IT'),
            data.toLocaleTimeString('it-IT'),
            r.tipo,
            r.temperatura?.dispositivo || '',
            r.temperatura?.valore || '',
            r.conforme ? 'Sì' : 'No',
            r.operatore,
            r.note || ''
          ].join(',');
        })
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="haccp_report_${Date.now()}.csv"`);
      res.send(csv);

      console.log('✅ [HACCP Controller] Report esportato con successo');

    } catch (error) {
      console.error('❌ [HACCP Controller] Errore export:', error);
      res.status(500).json({
        success: false,
        message: 'Errore esportazione report',
        error: error.message
      });
    }
  }

};

export default haccpController;