// services/pusherService.js - BACKEND
// Pusher service per notifiche real-time

import Pusher from 'pusher';
import logger from '../config/logger.js';

class PusherService {
  constructor() {
    this.pusher = null;
    this.initialized = false;
    this.enabled = false;
  }

  initialize() {
    try {
      // Verifica variabili ambiente
      const appId = process.env.PUSHER_APP_ID;
      const key = process.env.PUSHER_KEY;
      const secret = process.env.PUSHER_SECRET;
      const cluster = process.env.PUSHER_CLUSTER || 'eu';

      if (!appId || !key || !secret) {
        logger.warn('⚠️ Pusher non configurato (variabili ambiente mancanti)');
        this.enabled = false;
        return;
      }

      this.pusher = new Pusher({
        appId,
        key,
        secret,
        cluster,
        useTLS: true
      });

      this.initialized = true;
      this.enabled = true;

      logger.info('✅ Pusher inizializzato', {
        appId,
        cluster,
        key: key.substring(0, 8) + '...'
      });

    } catch (error) {
      logger.error('❌ Errore inizializzazione Pusher:', error);
      this.enabled = false;
    }
  }

  /**
   * ✅ METODO TRIGGER UNIVERSALE (FIX PER CX3.JS)
   * Questo è il metodo che mancava!
   */
  async trigger(channel, event, data) {
    if (!this.enabled) {
      logger.warn('⚠️ Pusher non abilitato, evento non inviato');
      return { success: false, reason: 'pusher_disabled' };
    }

    try {
      await this.pusher.trigger(channel, event, {
        ...data,
        timestamp: data.timestamp || new Date().toISOString()
      });

      logger.info(`✅ Evento Pusher inviato: ${channel}/${event}`, {
        channel,
        event,
        dataKeys: Object.keys(data)
      });

      return { success: true };

    } catch (error) {
      logger.error('❌ Errore trigger Pusher:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Invia notifica chiamata in arrivo
   */
  async notifyIncomingCall(chiamataData) {
    if (!this.enabled) {
      logger.warn('⚠️ Pusher non abilitato, chiamata non notificata');
      return { success: false, reason: 'pusher_disabled' };
    }

    try {
      await this.pusher.trigger('chiamate', 'nuova-chiamata', {
        callId: chiamataData.callId,
        numero: chiamataData.numero,
        cliente: chiamataData.cliente,
        timestamp: chiamataData.timestamp || new Date().toISOString()
      });

      logger.info('📞 Chiamata notificata via Pusher', {
        callId: chiamataData.callId,
        numero: chiamataData.numero
      });

      return { success: true };

    } catch (error) {
      logger.error('❌ Errore notifica Pusher:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Notifica ordine creato
   */
  async notifyOrderCreated(ordine) {
    if (!this.enabled) return;

    try {
      await this.pusher.trigger('ordini', 'ordine-creato', {
        ordineId: ordine._id,
        cliente: ordine.cliente,
        totale: ordine.totale,
        timestamp: new Date().toISOString()
      });

      logger.info('📦 Ordine creato notificato via Pusher');
    } catch (error) {
      logger.error('❌ Errore notifica ordine:', error);
    }
  }

  /**
   * Notifica ordine aggiornato
   */
  async notifyOrderUpdated(ordine) {
    if (!this.enabled) return;

    try {
      await this.pusher.trigger('ordini', 'ordine-aggiornato', {
        ordineId: ordine._id,
        stato: ordine.stato,
        timestamp: new Date().toISOString()
      });

      logger.info('📝 Ordine aggiornato notificato via Pusher');
    } catch (error) {
      logger.error('❌ Errore notifica update ordine:', error);
    }
  }

  /**
   * Notifica magazzino
   */
  async notifyInventoryUpdate(movimento) {
    if (!this.enabled) return;

    try {
      await this.pusher.trigger('magazzino', 'movimento-creato', {
        movimentoId: movimento._id,
        tipo: movimento.tipo,
        prodotto: movimento.prodotto,
        timestamp: new Date().toISOString()
      });

      logger.info('📊 Movimento magazzino notificato via Pusher');
    } catch (error) {
      logger.error('❌ Errore notifica magazzino:', error);
    }
  }

  /**
   * Notifica generica (alias di trigger per retrocompatibilità)
   */
  async notify(channel, event, data) {
    return await this.trigger(channel, event, data);
  }

  /**
   * Status check
   */
  isEnabled() {
    return this.enabled;
  }

  getStatus() {
    return {
      enabled: this.enabled,
      initialized: this.initialized
    };
  }
}

// Singleton
const pusherService = new PusherService();

export default pusherService;