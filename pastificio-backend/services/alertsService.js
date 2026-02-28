// services/alertsService.js - Logica calcolo anomalie
import Ordine from '../models/Ordine.js';
import Cliente from '../models/Cliente.js';
import Prodotto from '../models/Prodotto.js';
import Alert from '../models/Alert.js';
import AlertConfig from '../models/AlertConfig.js';
import logger from '../config/logger.js';

class AlertsService {

  // ═══════════════════════════════════════════════════════════════
  // HELPER: Calcola data inizio giornata (ora italiana)
  // ═══════════════════════════════════════════════════════════════
  _oggi() {
    const now = new Date();
    const oggi = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Rome' }));
    oggi.setHours(0, 0, 0, 0);
    return oggi;
  }

  _formatDate(date) {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  _giornoSettimana(date) {
    return date.getDay(); // 0=Dom, 1=Lun, ..., 6=Sab
  }

  // ═══════════════════════════════════════════════════════════════
  // HELPER: Media ordini per un dato giorno della settimana
  // Usa gli ultimi 4 stessi giorni (es: ultimi 4 sabati)
  // ═══════════════════════════════════════════════════════════════
  async _mediaOrdiniGiorno(giornoSettimana) {
    const oggi = this._oggi();
    const conteggi = [];
    
    for (let i = 1; i <= 4; i++) {
      const dataTarget = new Date(oggi);
      dataTarget.setDate(dataTarget.getDate() - (7 * i));
      
      // Trova il giorno della settimana corretto
      const diffGiorni = (dataTarget.getDay() - giornoSettimana + 7) % 7;
      dataTarget.setDate(dataTarget.getDate() - diffGiorni);
      
      const inizioGiorno = new Date(dataTarget);
      inizioGiorno.setHours(0, 0, 0, 0);
      const fineGiorno = new Date(dataTarget);
      fineGiorno.setHours(23, 59, 59, 999);
      
      const count = await Ordine.countDocuments({
        dataRitiro: { $gte: inizioGiorno, $lte: fineGiorno },
        stato: { $ne: 'annullato' }
      });
      
      conteggi.push(count);
    }
    
    // Escludi giorni con 0 ordini (probabilmente chiusi/festivi)
    const conteggiFiltrati = conteggi.filter(c => c > 0);
    if (conteggiFiltrati.length === 0) return 0;
    
    return Math.round(conteggiFiltrati.reduce((a, b) => a + b, 0) / conteggiFiltrati.length);
  }

  // ═══════════════════════════════════════════════════════════════
  // HELPER: Media incasso per un dato giorno della settimana
  // ═══════════════════════════════════════════════════════════════
  async _mediaIncassoGiorno(giornoSettimana) {
    const oggi = this._oggi();
    const incassi = [];
    
    for (let i = 1; i <= 4; i++) {
      const dataTarget = new Date(oggi);
      dataTarget.setDate(dataTarget.getDate() - (7 * i));
      
      const diffGiorni = (dataTarget.getDay() - giornoSettimana + 7) % 7;
      dataTarget.setDate(dataTarget.getDate() - diffGiorni);
      
      const inizioGiorno = new Date(dataTarget);
      inizioGiorno.setHours(0, 0, 0, 0);
      const fineGiorno = new Date(dataTarget);
      fineGiorno.setHours(23, 59, 59, 999);
      
      const result = await Ordine.aggregate([
        {
          $match: {
            dataRitiro: { $gte: inizioGiorno, $lte: fineGiorno },
            stato: { $ne: 'annullato' }
          }
        },
        {
          $group: {
            _id: null,
            totale: { $sum: '$totale' }
          }
        }
      ]);
      
      const totaleGiorno = result[0]?.totale || 0;
      if (totaleGiorno > 0) {
        incassi.push(totaleGiorno);
      }
    }
    
    if (incassi.length === 0) return 0;
    return Math.round((incassi.reduce((a, b) => a + b, 0) / incassi.length) * 100) / 100;
  }

  // ═══════════════════════════════════════════════════════════════
  // 1. CONTROLLO ORDINI GIORNATA
  // ═══════════════════════════════════════════════════════════════
  async controlloOrdiniGiornata() {
    try {
      const config = await AlertConfig.getConfig('ordini_pochi');
      const configEcce = await AlertConfig.getConfig('ordini_eccezionali');
      const configZero = await AlertConfig.getConfig('ordini_zero');
      
      const oggi = this._oggi();
      const domani = new Date(oggi);
      domani.setDate(domani.getDate() + 1);
      const oggiStr = this._formatDate(oggi);
      const giornoSettimana = this._giornoSettimana(oggi);
      
      // Giorni di apertura: Mart (2) - Sab (6) + Dom mattina (0)
      const giorniApertura = [0, 2, 3, 4, 5, 6];
      if (!giorniApertura.includes(giornoSettimana)) {
        logger.info('[ALERTS] Oggi è giorno di chiusura, skip controllo ordini');
        return [];
      }
      
      // Conta ordini di oggi
      const ordiniOggi = await Ordine.countDocuments({
        dataRitiro: { $gte: oggi, $lt: domani },
        stato: { $ne: 'annullato' }
      });
      
      const media = await this._mediaOrdiniGiorno(giornoSettimana);
      const nomiGiorni = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
      const nomeGiorno = nomiGiorni[giornoSettimana];
      
      const alerts = [];
      
      // ZERO ORDINI
      if (configZero?.attivo && ordiniOggi === 0) {
        const alert = await Alert.creaSeNonEsiste({
          tipo: 'ordini_zero',
          priorita: 'critico',
          titolo: 'Nessun ordine per oggi',
          messaggio: `Sono le ${new Date().getHours()}:00 e oggi non ci sono ordini. È normale?`,
          icona: '🚫',
          dati: { ordiniOggi: 0, mediaGiorno: media, giorno: nomeGiorno },
          chiaveUnicita: `ordini_zero_${oggiStr}`
        });
        if (alert) alerts.push(alert);
      }
      
      // POCHI ORDINI
      if (config?.attivo && media > 0 && ordiniOggi > 0) {
        const percentuale = Math.round((ordiniOggi / media) * 100);
        
        if (percentuale < config.soglia) {
          const alert = await Alert.creaSeNonEsiste({
            tipo: 'ordini_pochi',
            priorita: 'attenzione',
            titolo: `Solo ${ordiniOggi} ordini oggi`,
            messaggio: `Di solito il ${nomeGiorno} ne hai ${media}. Oggi sei al ${percentuale}%.`,
            icona: '📉',
            dati: { ordiniOggi, mediaGiorno: media, percentuale, giorno: nomeGiorno },
            chiaveUnicita: `ordini_pochi_${oggiStr}`
          });
          if (alert) alerts.push(alert);
        }
      }
      
      // GIORNATA ECCEZIONALE
      if (configEcce?.attivo && media > 0 && ordiniOggi > 0) {
        const percentuale = Math.round((ordiniOggi / media) * 100);
        
        if (percentuale > configEcce.soglia) {
          const alert = await Alert.creaSeNonEsiste({
            tipo: 'ordini_eccezionali',
            priorita: 'informativo',
            titolo: `Giornata record! ${ordiniOggi} ordini`,
            messaggio: `Media ${nomeGiorno}: ${media} ordini. Oggi ${percentuale}% in più!`,
            icona: '🎉',
            dati: { ordiniOggi, mediaGiorno: media, percentuale, giorno: nomeGiorno },
            chiaveUnicita: `ordini_eccezionali_${oggiStr}`
          });
          if (alert) alerts.push(alert);
        }
      }
      
      logger.info(`[ALERTS] Controllo ordini: ${ordiniOggi} oggi, media ${media}, ${alerts.length} alert generati`);
      return alerts;
      
    } catch (error) {
      logger.error('[ALERTS] Errore controllo ordini:', error);
      return [];
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 2. CONTROLLO INCASSO GIORNATA (fine giornata)
  // ═══════════════════════════════════════════════════════════════
  async controlloIncassoGiornata() {
    try {
      const config = await AlertConfig.getConfig('incasso_anomalo');
      if (!config?.attivo) return [];
      
      const oggi = this._oggi();
      const domani = new Date(oggi);
      domani.setDate(domani.getDate() + 1);
      const oggiStr = this._formatDate(oggi);
      const giornoSettimana = this._giornoSettimana(oggi);
      
      const nomiGiorni = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
      
      // Incasso di oggi
      const result = await Ordine.aggregate([
        {
          $match: {
            dataRitiro: { $gte: oggi, $lt: domani },
            stato: { $ne: 'annullato' }
          }
        },
        {
          $group: {
            _id: null,
            totale: { $sum: '$totale' }
          }
        }
      ]);
      
      const incassoOggi = result[0]?.totale || 0;
      if (incassoOggi === 0) return [];
      
      const mediaIncasso = await this._mediaIncassoGiorno(giornoSettimana);
      if (mediaIncasso === 0) return [];
      
      const percentuale = Math.round((incassoOggi / mediaIncasso) * 100);
      const alerts = [];
      
      // Sotto soglia minima
      if (percentuale < config.soglia) {
        const alert = await Alert.creaSeNonEsiste({
          tipo: 'incasso_anomalo_basso',
          priorita: 'attenzione',
          titolo: `Incasso sotto media: €${incassoOggi.toFixed(0)}`,
          messaggio: `Media ${nomiGiorni[giornoSettimana]}: €${mediaIncasso.toFixed(0)}. Oggi solo ${percentuale}%.`,
          icona: '💰',
          dati: { incassoOggi, mediaIncasso, percentuale },
          chiaveUnicita: `incasso_basso_${oggiStr}`
        });
        if (alert) alerts.push(alert);
      }
      
      // Sopra soglia massima
      const sogliaMax = config.sogliaMax || 150;
      if (percentuale > sogliaMax) {
        const alert = await Alert.creaSeNonEsiste({
          tipo: 'incasso_anomalo_alto',
          priorita: 'informativo',
          titolo: `Incasso record: €${incassoOggi.toFixed(0)}!`,
          messaggio: `Nuovo record per un ${nomiGiorni[giornoSettimana]}! Media: €${mediaIncasso.toFixed(0)}, oggi ${percentuale}%.`,
          icona: '💰',
          dati: { incassoOggi, mediaIncasso, percentuale },
          chiaveUnicita: `incasso_alto_${oggiStr}`
        });
        if (alert) alerts.push(alert);
      }
      
      logger.info(`[ALERTS] Controllo incasso: €${incassoOggi.toFixed(0)}, media €${mediaIncasso.toFixed(0)}, ${alerts.length} alert`);
      return alerts;
      
    } catch (error) {
      logger.error('[ALERTS] Errore controllo incasso:', error);
      return [];
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 3. CONTROLLO CLIENTI SPARITI (settimanale)
  // ═══════════════════════════════════════════════════════════════
  async controlloClientiSpariti() {
    try {
      const config = await AlertConfig.getConfig('cliente_sparito');
      if (!config?.attivo) return [];
      
      const sogliaGiorni = config.soglia || 45;
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - sogliaGiorni);
      
      const oggiStr = this._formatDate(new Date());
      const settimanaStr = `${oggiStr.substring(0, 7)}_W${Math.ceil(new Date().getDate() / 7)}`;
      
      // Trova clienti con almeno 3 ordini che non ordinano da X giorni
      const clientiAbituali = await Cliente.find({
        attivo: true,
        'statistiche.numeroOrdini': { $gte: 3 },
        'statistiche.ultimoOrdine': { $lt: dataLimite, $ne: null }
      }).lean();
      
      const alerts = [];
      
      for (const cliente of clientiAbituali) {
        const nomeCliente = cliente.tipo === 'azienda' 
          ? cliente.ragioneSociale 
          : `${cliente.nome} ${cliente.cognome || ''}`.trim();
        
        const ultimoOrdine = new Date(cliente.statistiche.ultimoOrdine);
        const giorniAssenza = Math.floor((Date.now() - ultimoOrdine.getTime()) / (1000 * 60 * 60 * 24));
        
        // Calcola frequenza media ordini (approssimativa)
        const primoOrdine = new Date(cliente.createdAt);
        const giorniDaIscrizione = Math.max(1, Math.floor((ultimoOrdine - primoOrdine) / (1000 * 60 * 60 * 24)));
        const frequenzaMedia = Math.round(giorniDaIscrizione / Math.max(1, cliente.statistiche.numeroOrdini));
        
        const alert = await Alert.creaSeNonEsiste({
          tipo: 'cliente_sparito',
          priorita: 'attenzione',
          titolo: `${nomeCliente} non ordina da ${giorniAssenza} giorni`,
          messaggio: `${cliente.statistiche.numeroOrdini} ordini totali (frequenza media: ogni ${frequenzaMedia} giorni). Ultimo ordine: ${ultimoOrdine.toLocaleDateString('it-IT')}.`,
          icona: '😴',
          dati: {
            clienteId: cliente._id,
            clienteNome: nomeCliente,
            clienteCodice: cliente.codiceCliente,
            telefono: cliente.telefono,
            giorniAssenza,
            frequenzaMedia,
            numeroOrdini: cliente.statistiche.numeroOrdini,
            ultimoOrdine: ultimoOrdine.toISOString()
          },
          chiaveUnicita: `cliente_sparito_${settimanaStr}_${cliente._id}`,
          azione: cliente.telefono ? {
            tipo: 'telefono',
            label: 'Chiama',
            valore: cliente.telefono
          } : { tipo: 'nessuna' }
        });
        
        if (alert) alerts.push(alert);
      }
      
      logger.info(`[ALERTS] Clienti spariti: ${clientiAbituali.length} trovati, ${alerts.length} nuovi alert`);
      return alerts;
      
    } catch (error) {
      logger.error('[ALERTS] Errore controllo clienti spariti:', error);
      return [];
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 4. CONTROLLO NUOVI CLIENTI TOP (settimanale)
  // ═══════════════════════════════════════════════════════════════
  async controlloNuoviClientiTop() {
    try {
      const config = await AlertConfig.getConfig('cliente_nuovo_top');
      if (!config?.attivo) return [];
      
      const sogliaOrdini = config.soglia || 3;
      const unMeseFa = new Date();
      unMeseFa.setMonth(unMeseFa.getMonth() - 1);
      
      const oggiStr = this._formatDate(new Date());
      
      // Clienti creati nell'ultimo mese con N+ ordini
      const nuoviClienti = await Cliente.find({
        attivo: true,
        createdAt: { $gte: unMeseFa },
        'statistiche.numeroOrdini': { $gte: sogliaOrdini }
      }).lean();
      
      const alerts = [];
      
      for (const cliente of nuoviClienti) {
        const nomeCliente = cliente.tipo === 'azienda'
          ? cliente.ragioneSociale
          : `${cliente.nome} ${cliente.cognome || ''}`.trim();
        
        const giorniDaIscrizione = Math.floor((Date.now() - new Date(cliente.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        
        const alert = await Alert.creaSeNonEsiste({
          tipo: 'cliente_nuovo_top',
          priorita: 'informativo',
          titolo: `Nuovo cliente fedele: ${nomeCliente}`,
          messaggio: `${cliente.statistiche.numeroOrdini} ordini in ${giorniDaIscrizione} giorni! Totale speso: €${(cliente.statistiche.totaleSpeso || 0).toFixed(0)}.`,
          icona: '⭐',
          dati: {
            clienteId: cliente._id,
            clienteNome: nomeCliente,
            numeroOrdini: cliente.statistiche.numeroOrdini,
            giorniDaIscrizione,
            totaleSpeso: cliente.statistiche.totaleSpeso
          },
          chiaveUnicita: `cliente_top_${oggiStr}_${cliente._id}`
        });
        
        if (alert) alerts.push(alert);
      }
      
      logger.info(`[ALERTS] Nuovi clienti top: ${nuoviClienti.length} trovati, ${alerts.length} nuovi alert`);
      return alerts;
      
    } catch (error) {
      logger.error('[ALERTS] Errore controllo nuovi clienti:', error);
      return [];
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 5. CONTROLLO PRODOTTI (settimanale)
  // ═══════════════════════════════════════════════════════════════
  async controlloProdotti() {
    try {
      const configNonVenduto = await AlertConfig.getConfig('prodotto_non_venduto');
      const configBoom = await AlertConfig.getConfig('prodotto_boom');
      
      const oggiStr = this._formatDate(new Date());
      const settimanaStr = `${oggiStr.substring(0, 7)}_W${Math.ceil(new Date().getDate() / 7)}`;
      
      const alerts = [];
      
      // ── PRODOTTI NON VENDUTI ──
      if (configNonVenduto?.attivo) {
        const sogliaGiorni = configNonVenduto.soglia || 14;
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() - sogliaGiorni);
        
        // Prodotti disponibili
        const prodottiDisponibili = await Prodotto.find({ 
          disponibile: true, 
          attivo: true 
        }).lean();
        
        for (const prodotto of prodottiDisponibili) {
          // Ultimo ordine con questo prodotto
          const ultimoOrdineConProdotto = await Ordine.findOne({
            'prodotti.nome': { $regex: new RegExp(prodotto.nome, 'i') },
            stato: { $ne: 'annullato' }
          })
          .sort({ dataRitiro: -1 })
          .select('dataRitiro')
          .lean();
          
          if (!ultimoOrdineConProdotto) continue;
          
          const ultimaVendita = new Date(ultimoOrdineConProdotto.dataRitiro);
          const giorniSenzaVendita = Math.floor((Date.now() - ultimaVendita.getTime()) / (1000 * 60 * 60 * 24));
          
          if (giorniSenzaVendita >= sogliaGiorni) {
            const alert = await Alert.creaSeNonEsiste({
              tipo: 'prodotto_non_venduto',
              priorita: 'attenzione',
              titolo: `${prodotto.nome} non venduto da ${giorniSenzaVendita} giorni`,
              messaggio: `Ultima vendita: ${ultimaVendita.toLocaleDateString('it-IT')}. Considerare promozione o disattivazione?`,
              icona: '📦',
              dati: {
                prodottoId: prodotto._id,
                prodottoNome: prodotto.nome,
                giorniSenzaVendita,
                ultimaVendita: ultimaVendita.toISOString()
              },
              chiaveUnicita: `prodotto_non_venduto_${settimanaStr}_${prodotto._id}`
            });
            if (alert) alerts.push(alert);
          }
        }
      }
      
      // ── PRODOTTI BOOM ──
      if (configBoom?.attivo) {
        const sogliaBoom = configBoom.soglia || 200;
        
        const unaSettimanaFa = new Date();
        unaSettimanaFa.setDate(unaSettimanaFa.getDate() - 7);
        
        const quattrSettimaneFa = new Date();
        quattrSettimaneFa.setDate(quattrSettimaneFa.getDate() - 28);
        
        // Vendite ultima settimana per prodotto
        const venditeSettimana = await Ordine.aggregate([
          {
            $match: {
              dataRitiro: { $gte: unaSettimanaFa },
              stato: { $ne: 'annullato' }
            }
          },
          { $unwind: '$prodotti' },
          {
            $group: {
              _id: '$prodotti.nome',
              quantitaTotale: { $sum: '$prodotti.quantita' },
              conteggioOrdini: { $sum: 1 }
            }
          }
        ]);
        
        // Media 4 settimane per prodotto
        const mediaSettimane = await Ordine.aggregate([
          {
            $match: {
              dataRitiro: { $gte: quattrSettimaneFa, $lt: unaSettimanaFa },
              stato: { $ne: 'annullato' }
            }
          },
          { $unwind: '$prodotti' },
          {
            $group: {
              _id: '$prodotti.nome',
              quantitaTotale: { $sum: '$prodotti.quantita' },
              conteggioOrdini: { $sum: 1 }
            }
          }
        ]);
        
        const mediaMap = {};
        mediaSettimane.forEach(m => {
          mediaMap[m._id] = {
            quantitaMedia: m.quantitaTotale / 3, // Media per settimana (3 settimane)
            ordiniMedia: m.conteggioOrdini / 3
          };
        });
        
        for (const vendita of venditeSettimana) {
          const media = mediaMap[vendita._id];
          if (!media || media.ordiniMedia < 1) continue;
          
          const percentualeAumento = Math.round((vendita.conteggioOrdini / media.ordiniMedia) * 100);
          
          if (percentualeAumento >= sogliaBoom) {
            const alert = await Alert.creaSeNonEsiste({
              tipo: 'prodotto_boom',
              priorita: 'informativo',
              titolo: `${vendita._id}: +${percentualeAumento - 100}% questa settimana!`,
              messaggio: `${vendita.conteggioOrdini} ordini vs media ${Math.round(media.ordiniMedia)}/settimana. Richiesta altissima!`,
              icona: '🔥',
              dati: {
                prodottoNome: vendita._id,
                venditeSettimana: vendita.conteggioOrdini,
                mediaSettimana: Math.round(media.ordiniMedia),
                percentualeAumento
              },
              chiaveUnicita: `prodotto_boom_${settimanaStr}_${vendita._id.replace(/\s/g, '_')}`
            });
            if (alert) alerts.push(alert);
          }
        }
      }
      
      logger.info(`[ALERTS] Controllo prodotti: ${alerts.length} alert generati`);
      return alerts;
      
    } catch (error) {
      logger.error('[ALERTS] Errore controllo prodotti:', error);
      return [];
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 6. CONTROLLO TREND NEGATIVO (settimanale)
  // ═══════════════════════════════════════════════════════════════
  async controlloTrendNegativo() {
    try {
      const config = await AlertConfig.getConfig('trend_negativo');
      if (!config?.attivo) return [];
      
      const sogliaSettimane = config.soglia || 3;
      const oggiStr = this._formatDate(new Date());
      const alerts = [];
      
      // Confronta ultime N+1 settimane
      const settimane = [];
      for (let i = 0; i <= sogliaSettimane; i++) {
        const inizio = new Date();
        inizio.setDate(inizio.getDate() - (7 * (i + 1)));
        const fine = new Date();
        fine.setDate(fine.getDate() - (7 * i));
        
        const result = await Ordine.aggregate([
          {
            $match: {
              dataRitiro: { $gte: inizio, $lt: fine },
              stato: { $ne: 'annullato' }
            }
          },
          {
            $group: {
              _id: null,
              totale: { $sum: '$totale' },
              numOrdini: { $sum: 1 }
            }
          }
        ]);
        
        settimane.push({
          inizio,
          fine,
          totale: result[0]?.totale || 0,
          numOrdini: result[0]?.numOrdini || 0
        });
      }
      
      // Verifica se tutte le ultime N settimane sono in calo progressivo
      let tutteInCalo = true;
      for (let i = 0; i < sogliaSettimane; i++) {
        if (settimane[i].totale >= settimane[i + 1].totale) {
          tutteInCalo = false;
          break;
        }
      }
      
      if (tutteInCalo && settimane[0].totale > 0) {
        const caloPercentuale = Math.round(
          ((settimane[sogliaSettimane].totale - settimane[0].totale) / 
            Math.max(1, settimane[sogliaSettimane].totale)) * 100
        );
        
        const alert = await Alert.creaSeNonEsiste({
          tipo: 'trend_negativo',
          priorita: 'attenzione',
          titolo: `Trend in calo: ${sogliaSettimane} settimane consecutive`,
          messaggio: `Incasso in diminuzione del ${Math.abs(caloPercentuale)}%. Da €${settimane[sogliaSettimane].totale.toFixed(0)} a €${settimane[0].totale.toFixed(0)} settimanali.`,
          icona: '📊',
          dati: {
            settimane: settimane.map(s => ({
              totale: s.totale,
              numOrdini: s.numOrdini
            })),
            caloPercentuale
          },
          chiaveUnicita: `trend_negativo_${oggiStr}`
        });
        
        if (alert) alerts.push(alert);
      }
      
      logger.info(`[ALERTS] Controllo trend: ${tutteInCalo ? 'CALO RILEVATO' : 'trend OK'}`);
      return alerts;
      
    } catch (error) {
      logger.error('[ALERTS] Errore controllo trend:', error);
      return [];
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // RUNNER: Esegui tutti i controlli giornalieri
  // ═══════════════════════════════════════════════════════════════
  async eseguiControlliGiornalieri() {
    logger.info('[ALERTS] ▶️ Inizio controlli giornalieri...');
    
    const risultati = [];
    
    const ordini = await this.controlloOrdiniGiornata();
    risultati.push(...ordini);
    
    const incasso = await this.controlloIncassoGiornata();
    risultati.push(...incasso);
    
    logger.info(`[ALERTS] ✅ Controlli giornalieri completati: ${risultati.length} alert generati`);
    return risultati;
  }

  // ═══════════════════════════════════════════════════════════════
  // RUNNER: Esegui tutti i controlli settimanali
  // ═══════════════════════════════════════════════════════════════
  async eseguiControlliSettimanali() {
    logger.info('[ALERTS] ▶️ Inizio controlli settimanali...');
    
    const risultati = [];
    
    const clientiSpariti = await this.controlloClientiSpariti();
    risultati.push(...clientiSpariti);
    
    const nuoviTop = await this.controlloNuoviClientiTop();
    risultati.push(...nuoviTop);
    
    const prodotti = await this.controlloProdotti();
    risultati.push(...prodotti);
    
    const trend = await this.controlloTrendNegativo();
    risultati.push(...trend);
    
    logger.info(`[ALERTS] ✅ Controlli settimanali completati: ${risultati.length} alert generati`);
    return risultati;
  }
}

const alertsService = new AlertsService();
export default alertsService;