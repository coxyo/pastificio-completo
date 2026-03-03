// services/firebasePushService.js
// ✅ Firebase Cloud Messaging - Backend Push Service
// Pastificio Nonna Claudia - Invio notifiche via FCM Admin SDK

import admin from 'firebase-admin';
import logger from '../config/logger.js';
import PushSubscription from '../models/PushSubscription.js';

class FirebasePushService {
  constructor() {
    this.initialized = false;
  }

  // ═══════════════════════════════════════════════════════════════
  // INIZIALIZZAZIONE
  // ═══════════════════════════════════════════════════════════════
  inizializza() {
    if (this.initialized) return;

    try {
      // Inizializza Firebase Admin con credenziali da environment
      const serviceAccount = {
        type: 'service_account',
        project_id: process.env.FIREBASE_PROJECT_ID || 'pastificio-nonna-claudia',
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
      };

      // Verifica che le credenziali essenziali siano presenti
      if (!serviceAccount.private_key || !serviceAccount.client_email) {
        logger.warn('[FCM] ⚠️ Credenziali Firebase mancanti, push disabilitato');
        logger.warn('[FCM] Imposta FIREBASE_PRIVATE_KEY e FIREBASE_CLIENT_EMAIL su Railway');
        return;
      }

      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
      }

      this.initialized = true;
      logger.info('[FCM] ✅ Firebase Admin SDK inizializzato');

    } catch (error) {
      logger.error('[FCM] ❌ Errore inizializzazione Firebase Admin:', error.message);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // INVIO NOTIFICA GENERICA
  // ═══════════════════════════════════════════════════════════════
  async inviaNotifica(fcmToken, payload) {
    if (!this.initialized) {
      logger.warn('[FCM] Non inizializzato, skip invio');
      return;
    }

    try {
      const message = {
        token: fcmToken,
        // Usa data (non notification) per avere controllo totale nel SW
        data: {
          titolo: String(payload.titolo || '🍝 Pastificio Nonna Claudia'),
          corpo: String(payload.corpo || ''),
          tipo: String(payload.tipo || 'generico'),
          tag: String(payload.tag || `notifica-${Date.now()}`),
          ...(payload.data ? Object.fromEntries(
            Object.entries(payload.data).map(([k, v]) => [k, String(v)])
          ) : {})
        },
        webpush: {
          headers: {
            Urgency: payload.urgenza || 'normal',
            TTL: '86400'
          },
          fcmOptions: {
            link: payload.url || 'https://pastificio-frontend-final.vercel.app'
          }
        }
      };

      const response = await admin.messaging().send(message);
      logger.info(`[FCM] ✅ Notifica inviata: ${response}`);
      return { success: true, messageId: response };

    } catch (error) {
      logger.error(`[FCM] ❌ Errore invio a token ${fcmToken.substring(0, 20)}...:`, error.code || error.message);

      // Token scaduto o invalido
      if (error.code === 'messaging/invalid-registration-token' ||
          error.code === 'messaging/registration-token-not-registered') {
        await this._rimuoviTokenScaduto(fcmToken);
      }

      return { success: false, error: error.message };
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // INVIO A TUTTI (per tipo notifica)
  // ═══════════════════════════════════════════════════════════════
  async inviaATutti(payload, tipoNotifica, escludiUserId = null) {
    if (!this.initialized) return;

    try {
      // Trova tutte le subscription attive con questo tipo di notifica abilitato
      const filtro = { attiva: true };
      if (tipoNotifica) {
        filtro[`preferenze.${tipoNotifica}`] = true;
      }
      if (escludiUserId) {
        filtro.userId = { $ne: escludiUserId };
      }

      const subscriptions = await PushSubscription.find(filtro);

      if (subscriptions.length === 0) {
        logger.info(`[FCM] Nessun destinatario per tipo: ${tipoNotifica}`);
        return { inviati: 0, errori: 0 };
      }

      let inviati = 0;
      let errori = 0;

      for (const sub of subscriptions) {
        const result = await this.inviaNotifica(sub.fcmToken, payload);
        if (result?.success) {
          inviati++;
        } else {
          errori++;
        }
      }

      logger.info(`[FCM] Invio completato: ${inviati} ok, ${errori} errori (tipo: ${tipoNotifica})`);
      return { inviati, errori };

    } catch (error) {
      logger.error('[FCM] Errore invio a tutti:', error);
      return { inviati: 0, errori: -1 };
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // NOTIFICHE SPECIFICHE
  // ═══════════════════════════════════════════════════════════════

  async notificaChiamata({ callId, numero, cliente }) {
    const nomeCliente = cliente ? `${cliente.nome} ${cliente.cognome || ''}`.trim() : 'Sconosciuto';
    return this.inviaATutti({
      titolo: '📞 Chiamata in arrivo',
      corpo: cliente ? `${nomeCliente} - ${numero}` : `Numero: ${numero}`,
      tipo: 'chiamata',
      urgenza: 'high',
      tag: `chiamata-${callId || Date.now()}`,
      data: { callId: callId || '', numero: numero || '', clienteNome: nomeCliente }
    }, 'chiamate');
  }

  async notificaAlert({ _id, titolo, messaggio, priorita }) {
    return this.inviaATutti({
      titolo: `⚠️ ${titolo}`,
      corpo: messaggio,
      tipo: 'alert',
      urgenza: priorita === 'critico' ? 'high' : 'normal',
      tag: `alert-${_id}`,
      data: { alertId: String(_id) }
    }, 'alertCritici');
  }

  async notificaNuovoOrdine(ordine, creatoreaId) {
    const nome = ordine.nomeCliente || 'Cliente';
    return this.inviaATutti({
      titolo: '📦 Nuovo ordine',
      corpo: `${nome} - €${ordine.totale?.toFixed(2) || '0.00'}`,
      tipo: 'nuovo_ordine',
      tag: `ordine-${ordine._id}`,
      data: { ordineId: String(ordine._id), nomeCliente: nome }
    }, 'nuoviOrdini', creatoreaId);
  }

  async notificaOrdineModificato(ordine, modificatoDaId, modificatoDaNome) {
    const nome = ordine.nomeCliente || 'Cliente';
    return this.inviaATutti({
      titolo: '✏️ Ordine modificato',
      corpo: `${nome} - modificato da ${modificatoDaNome || 'operatore'}`,
      tipo: 'ordine_modificato',
      tag: `ordine-mod-${ordine._id}`,
      data: { ordineId: String(ordine._id), nomeCliente: nome }
    }, 'ordiniModificati', modificatoDaId);
  }

  // ═══════════════════════════════════════════════════════════════
  // METODI PRIVATI
  // ═══════════════════════════════════════════════════════════════
  async _rimuoviTokenScaduto(fcmToken) {
    try {
      await PushSubscription.deleteMany({ fcmToken });
      logger.info(`[FCM] Token scaduto rimosso: ${fcmToken.substring(0, 20)}...`);
    } catch (error) {
      logger.error('[FCM] Errore rimozione token:', error);
    }
  }
}

const firebasePushService = new FirebasePushService();
export default firebasePushService;