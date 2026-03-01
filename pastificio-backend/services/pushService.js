// services/pushService.js - ✅ NUOVO: Servizio invio notifiche Web Push
import webpush from 'web-push';
import PushSubscription from '../models/PushSubscription.js';
import logger from '../config/logger.js';

class PushService {
  constructor() {
    this.initialized = false;
  }

  // ═══════════════════════════════════════════════════════════════
  // INIZIALIZZAZIONE
  // ═══════════════════════════════════════════════════════════════
  inizializza() {
    const vapidPublic = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY;

    if (!vapidPublic || !vapidPrivate) {
      logger.warn('⚠️ [PUSH] VAPID keys non configurate - Push notifications disabilitate');
      logger.warn('⚠️ [PUSH] Genera con: npx web-push generate-vapid-keys');
      return;
    }

    try {
      webpush.setVapidDetails(
        'mailto:pastificiononnaclaudia@gmail.com',
        vapidPublic,
        vapidPrivate
      );
      this.initialized = true;
      logger.info('✅ [PUSH] Web Push inizializzato con VAPID keys');
    } catch (error) {
      logger.error('❌ [PUSH] Errore inizializzazione:', error.message);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // INVIO NOTIFICA GENERICA
  // ═══════════════════════════════════════════════════════════════
  async inviaNotifica(subscriptions, payload) {
    if (!this.initialized) {
      logger.warn('[PUSH] Servizio non inizializzato, notifica ignorata');
      return { inviate: 0, errori: 0 };
    }

    if (!subscriptions || subscriptions.length === 0) {
      return { inviate: 0, errori: 0 };
    }

    const payloadStr = JSON.stringify(payload);
    let inviate = 0;
    let errori = 0;

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(sub.subscription, payloadStr);
        await sub.segnaSuccesso();
        inviate++;
      } catch (error) {
        errori++;
        
        // 410 Gone o 404: subscription non più valida → rimuovi
        if (error.statusCode === 410 || error.statusCode === 404) {
          logger.info(`[PUSH] Subscription scaduta (${error.statusCode}), rimuovo: ${sub.dispositivo} (${sub.username})`);
          await PushSubscription.findByIdAndDelete(sub._id);
        } else {
          logger.warn(`[PUSH] Errore invio a ${sub.dispositivo} (${sub.username}):`, error.statusCode || error.message);
          await sub.segnaErrore();
        }
      }
    }

    logger.info(`[PUSH] Notifiche inviate: ${inviate}/${subscriptions.length} (errori: ${errori})`);
    return { inviate, errori };
  }

  // ═══════════════════════════════════════════════════════════════
  // 📞 NOTIFICA CHIAMATA IN ARRIVO
  // ═══════════════════════════════════════════════════════════════
  async notificaChiamata(datiChiamata) {
    try {
      // Trova tutte le subscription con preferenza "chiamate" attiva
      const subscriptions = await PushSubscription.trovaPerTipo('chiamate');

      if (subscriptions.length === 0) return;

      const nomeCliente = datiChiamata.cliente
        ? `${datiChiamata.cliente.nome} ${datiChiamata.cliente.cognome || ''}`.trim()
        : 'Numero sconosciuto';

      const payload = {
        tipo: 'chiamata',
        titolo: '📞 Chiamata in arrivo',
        corpo: `${nomeCliente} - ${datiChiamata.numero}`,
        icona: '/icons/phone-192.png',
        badge: '/icons/badge-72.png',
        tag: `chiamata-${datiChiamata.callId}`,
        data: {
          action: 'chiamata',
          callId: datiChiamata.callId,
          numero: datiChiamata.numero,
          clienteId: datiChiamata.cliente?._id || null
        },
        requireInteraction: true  // Rimane visibile finché non interagisci
      };

      return this.inviaNotifica(subscriptions, payload);
    } catch (error) {
      logger.error('[PUSH] Errore notificaChiamata:', error.message);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 🚨 NOTIFICA ALERT CRITICO
  // ═══════════════════════════════════════════════════════════════
  async notificaAlert(alert) {
    try {
      const subscriptions = await PushSubscription.trovaPerTipo('alertCritici');

      if (subscriptions.length === 0) return;

      const icona = alert.priorita === 'critico' ? '🚨' : '⚠️';

      const payload = {
        tipo: 'alert',
        titolo: `${icona} ${alert.titolo || 'Attenzione'}`,
        corpo: alert.messaggio || alert.descrizione || 'Controlla il gestionale',
        icona: '/icons/alert-192.png',
        badge: '/icons/badge-72.png',
        tag: `alert-${alert._id}`,
        data: {
          action: 'alert',
          alertId: alert._id?.toString()
        }
      };

      return this.inviaNotifica(subscriptions, payload);
    } catch (error) {
      logger.error('[PUSH] Errore notificaAlert:', error.message);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // ✅ NOTIFICA NUOVO ORDINE (da altro utente)
  // ═══════════════════════════════════════════════════════════════
  async notificaNuovoOrdine(ordine, creatoDaUserId) {
    try {
      // Escludi l'utente che ha creato l'ordine
      const subscriptions = await PushSubscription.trovaPerTipo('nuoviOrdini', creatoDaUserId);

      if (subscriptions.length === 0) return;

      // Formatta data ritiro
      let dataRitiroStr = '';
      try {
        const d = new Date(ordine.dataRitiro);
        const giorni = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
        dataRitiroStr = `${giorni[d.getDay()]} ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      } catch (e) {
        dataRitiroStr = ordine.dataRitiro || '';
      }

      const payload = {
        tipo: 'nuovo_ordine',
        titolo: '✅ Nuovo ordine',
        corpo: `${ordine.nomeCliente} - ${dataRitiroStr} ore ${ordine.oraRitiro || ''} - €${(ordine.totale || 0).toFixed(2)}`,
        icona: '/icons/order-192.png',
        badge: '/icons/badge-72.png',
        tag: `ordine-${ordine._id}`,
        data: {
          action: 'ordine',
          ordineId: ordine._id?.toString()
        }
      };

      return this.inviaNotifica(subscriptions, payload);
    } catch (error) {
      logger.error('[PUSH] Errore notificaNuovoOrdine:', error.message);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 📝 NOTIFICA ORDINE MODIFICATO (da altro utente)
  // ═══════════════════════════════════════════════════════════════
  async notificaOrdineModificato(ordine, modificatoDaUserId, nomeModificatore) {
    try {
      const subscriptions = await PushSubscription.trovaPerTipo('ordiniModificati', modificatoDaUserId);

      if (subscriptions.length === 0) return;

      const payload = {
        tipo: 'ordine_modificato',
        titolo: '📝 Ordine modificato',
        corpo: `${ordine.nomeCliente} - modificato da ${nomeModificatore || 'un operatore'}`,
        icona: '/icons/edit-192.png',
        badge: '/icons/badge-72.png',
        tag: `ordine-mod-${ordine._id}`,
        data: {
          action: 'ordine',
          ordineId: ordine._id?.toString()
        }
      };

      return this.inviaNotifica(subscriptions, payload);
    } catch (error) {
      logger.error('[PUSH] Errore notificaOrdineModificato:', error.message);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // STATUS
  // ═══════════════════════════════════════════════════════════════
  getStatus() {
    return {
      initialized: this.initialized,
      vapidConfigured: !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY)
    };
  }
}

// Singleton
const pushService = new PushService();
export default pushService;