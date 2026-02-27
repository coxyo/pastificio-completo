// controllers/haccpController.js
// ✅ CONTROLLER COMPLETO HACCP - VERSIONE FINALE

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

      // ✅ NUOVO: Recupera ultime temperature per ogni dispositivo
      const ultimeTempPipeline = await RegistrazioneHACCP.aggregate([
        { 
          $match: { 
            tipo: { $in: ['temperatura_frigo', 'temperatura_congelatore', 'abbattimento'] },
            'temperatura.dispositivo': { $exists: true, $ne: null }
          } 
        },
        { $sort: { dataOra: -1 } },
        { 
          $group: { 
            _id: '$temperatura.dispositivo', 
            valore: { $first: '$temperatura.valore' },
            conforme: { $first: '$conforme' },
            dataOra: { $first: '$dataOra' }
          } 
        }
      ]);

      // Mappa le temperature per nome dispositivo E per ID compatibile col frontend
      const temperatureAttuali = {};
      const mapNomeToId = {
        'Frigo 1 Isa': 'frigo1',
        'Frigo 2 Icecool': 'frigo2',
        'Frigo 3 Samsung': 'frigo3',
        'Freezer Samsung': 'congelatore',
        'Congelatore Principale': 'congelatore',
        // Nomi legacy
        'Frigorifero 1 (Principale)': 'frigo1',
        'Frigorifero 2': 'frigo2',
        'Frigorifero 3': 'frigo3',
        'Frigorifero 1': 'frigo1'
      };

      ultimeTempPipeline.forEach(t => {
        const id = mapNomeToId[t._id] || t._id;
        temperatureAttuali[id] = {
          valore: t.valore,
          conforme: t.conforme,
          dataOra: t.dataOra,
          dispositivo: t._id
        };
        // Salva anche con nome originale per compatibilità
        temperatureAttuali[t._id] = temperatureAttuali[id];
      });

      console.log('🌡️ [HACCP Controller] Temperature attuali:', temperatureAttuali);

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
          temperatureAttuali,
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

      const registrato = registrazioni >= 3; // Almeno 3 dispositivi (3 frigo + 1 freezer = 4 totali)

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
  // 3. SALVA TEMPERATURA (⚠️ FUNZIONE MANCANTE!)
  // ============================================
  salvaTemperatura: async (req, res) => {
    try {
      console.log('🌡️ [HACCP Controller] ========================================');
      console.log('🌡️ [HACCP Controller] RICEVUTA RICHIESTA SALVATAGGIO TEMPERATURE');
      console.log('🌡️ [HACCP Controller] ========================================');
      console.log('📊 [HACCP Controller] Body completo:', JSON.stringify(req.body, null, 2));
      console.log('👤 [HACCP Controller] User:', req.user?.nome || req.user?.email || 'Non autenticato');

      // Estrai dati dal body
      const { temperature, data, operatore, note } = req.body;

      // ⚠️ VALIDAZIONE CRITICA
      if (!temperature) {
        console.error('❌ [HACCP Controller] Campo "temperature" mancante');
        return res.status(400).json({
          success: false,
          message: 'Campo "temperature" mancante nel body della richiesta'
        });
      }

      if (!Array.isArray(temperature)) {
        console.error('❌ [HACCP Controller] Campo "temperature" non è un array:', typeof temperature);
        return res.status(400).json({
          success: false,
          message: 'Campo "temperature" deve essere un array di oggetti'
        });
      }

      if (temperature.length === 0) {
        console.error('❌ [HACCP Controller] Array "temperature" vuoto');
        return res.status(400).json({
          success: false,
          message: 'Array "temperature" vuoto. Inserire almeno una temperatura.'
        });
      }

      console.log(`📊 [HACCP Controller] ✅ Validazione OK - Temperature da salvare: ${temperature.length}`);

      // Prepara data registrazione
      const dataRegistrazione = data ? new Date(data) : new Date();
      dataRegistrazione.setHours(9, 0, 0, 0); // Normalizza a ore 9:00
      
      console.log(`📅 [HACCP Controller] Data registrazione: ${dataRegistrazione.toISOString()}`);

      // Array per risultati
      const risultati = [];
      const errori = [];

      // Salva ogni temperatura
      for (let i = 0; i < temperature.length; i++) {
        const temp = temperature[i];
        
        console.log(`\n📝 [HACCP Controller] --- Elaborazione ${i + 1}/${temperature.length} ---`);
        console.log(`📝 [HACCP Controller] Dispositivo: ${temp.dispositivo}`);
        console.log(`📝 [HACCP Controller] Temperatura: ${temp.temperatura}°C`);
        console.log(`📝 [HACCP Controller] Conforme: ${temp.conforme}`);

        try {
          // Validazione singola temperatura
          if (!temp.dispositivo) {
            console.warn(`⚠️ [HACCP Controller] Dispositivo mancante per temperatura ${i + 1}, skip`);
            errori.push({
              indice: i,
              dispositivo: 'sconosciuto',
              errore: 'Dispositivo mancante'
            });
            continue;
          }

          if (temp.temperatura === undefined || temp.temperatura === null) {
            console.warn(`⚠️ [HACCP Controller] Valore temperatura mancante per ${temp.dispositivo}, skip`);
            errori.push({
              indice: i,
              dispositivo: temp.dispositivo,
              errore: 'Valore temperatura mancante'
            });
            continue;
          }

          // Determina tipo basandosi sul nome dispositivo
          let tipo = 'temperatura_frigo';
          const dispositivoLower = temp.dispositivo.toLowerCase();
          
          if (dispositivoLower.includes('freezer') || dispositivoLower.includes('congelatore')) {
            tipo = 'temperatura_congelatore';
          } else if (dispositivoLower.includes('abbattitore')) {
            tipo = 'abbattimento';
          }

          console.log(`🔍 [HACCP Controller] Tipo determinato: ${tipo}`);

          // Determina limiti temperatura
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

          console.log(`🌡️ [HACCP Controller] Limiti: ${limiteMin}°C - ${limiteMax}°C`);

          // Verifica conformità
          const temperaturaValore = parseFloat(temp.temperatura);
          const conforme = temp.conforme !== undefined 
            ? temp.conforme 
            : (temperaturaValore >= limiteMin && temperaturaValore <= limiteMax);

          console.log(`✓ [HACCP Controller] Conformità: ${conforme ? 'SÌ ✅' : 'NO ❌'}`);

          // Crea documento MongoDB
          const registrazione = new RegistrazioneHACCP({
            tipo,
            dataOra: dataRegistrazione,
            operatore: operatore || req.user?.nome || req.user?.email || 'Maurizio Mameli',
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

          console.log(`💾 [HACCP Controller] Salvataggio su MongoDB...`);

          // Salva in database
          const salvato = await registrazione.save();
          
          console.log(`✅ [HACCP Controller] SALVATO! ID: ${salvato._id}`);
          
          risultati.push({
            dispositivo: temp.dispositivo,
            temperatura: temperaturaValore,
            conforme,
            tipo,
            id: salvato._id
          });

        } catch (errSalvataggio) {
          console.error(`❌ [HACCP Controller] ERRORE SALVATAGGIO temperatura ${i + 1}:`, errSalvataggio);
          console.error(`❌ [HACCP Controller] Stack:`, errSalvataggio.stack);
          errori.push({
            indice: i,
            dispositivo: temp.dispositivo,
            errore: errSalvataggio.message
          });
        }
      }

      // Response finale
      console.log(`\n🏁 [HACCP Controller] ========================================`);
      console.log(`🏁 [HACCP Controller] SALVATAGGIO COMPLETATO`);
      console.log(`🏁 [HACCP Controller] ========================================`);
      console.log(`📊 [HACCP Controller] Successi: ${risultati.length}/${temperature.length}`);
      console.log(`📊 [HACCP Controller] Errori: ${errori.length}`);

      if (risultati.length > 0) {
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
        console.error('❌ [HACCP Controller] NESSUNA temperatura salvata!');
        res.status(400).json({
          success: false,
          message: 'Nessuna temperatura è stata salvata. Verifica i dati inviati.',
          errori
        });
      }

    } catch (error) {
      console.error('💥 [HACCP Controller] ========================================');
      console.error('💥 [HACCP Controller] ERRORE CATCH GENERALE');
      console.error('💥 [HACCP Controller] ========================================');
      console.error('💥 [HACCP Controller] Message:', error.message);
      console.error('💥 [HACCP Controller] Stack:', error.stack);
      
      res.status(500).json({
        success: false,
        message: 'Errore interno del server durante il salvataggio temperature',
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

      console.log('🔍 [HACCP Controller] Filtro query:', JSON.stringify(filtro, null, 2));

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

      console.log(`📊 [HACCP Controller] Esportando ${registrazioni.length} registrazioni`);

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
            (r.note || '').replace(/,/g, ';') // Escape virgole
          ].join(',');
        })
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="haccp_report_${Date.now()}.csv"`);
      res.send('\uFEFF' + csv); // BOM per UTF-8

      console.log('✅ [HACCP Controller] Report CSV generato con successo');

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