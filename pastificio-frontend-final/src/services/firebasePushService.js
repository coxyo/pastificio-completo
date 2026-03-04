// src/services/firebasePushService.js
// ✅ Firebase Cloud Messaging - Servizio notifiche push
// Pastificio Nonna Claudia
// ✅ FIX 04/03: Silenziato errori push service non disponibile

import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, deleteToken } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyCyL4LWgD1dKiGRHmLrj2gJ9OFHdHDDZ-E",
  authDomain: "pastificio-nonna-claudia.firebaseapp.com",
  projectId: "pastificio-nonna-claudia",
  storageBucket: "pastificio-nonna-claudia.firebasestorage.app",
  messagingSenderId: "434978137418",
  appId: "1:434978137418:web:70936b4313e10a79ed0db3"
};

const VAPID_KEY = 'BMMU8H1MpvQLh3Zo9IkFRIrnciZpRatFABxOgb76k2tNRmg72_n8yHB-cVtgmtenKbbRu1pUYp5iM7iHMaw4l2s';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app/api';

class FirebasePushService {
  constructor() {
    this.app = null;
    this.messaging = null;
    this.token = null;
    this.inizializzato = false;
    this.pushDisponibile = false;  // ✅ Track se push è disponibile
    this.onMessageCallback = null;
  }

  // ═══════════════════════════════════════════════════════════════
  // INIZIALIZZAZIONE - Silenzioso se push non disponibile
  // ═══════════════════════════════════════════════════════════════
  async inizializza() {
    if (this.inizializzato) return;
    if (typeof window === 'undefined') return; // SSR guard

    try {
      // Controlla supporto
      if (!('serviceWorker' in navigator) || !('Notification' in window)) {
        this.inizializzato = true;
        this.pushDisponibile = false;
        return;
      }

      // Inizializza Firebase
      this.app = initializeApp(firebaseConfig);
      this.messaging = getMessaging(this.app);

      // Registra Service Worker Firebase
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

      // Ascolta messaggi in foreground
      onMessage(this.messaging, (payload) => {
        this._gestisciForegroundMessage(payload);
      });

      this.inizializzato = true;

      // Se il permesso è già granted, prova a ottenere token (silenziosamente)
      if (Notification.permission === 'granted') {
        try {
          await this._ottieniERegistraToken(registration);
          this.pushDisponibile = true;
        } catch (err) {
          // ✅ Push service non disponibile su questo dispositivo - silenzioso
          this.pushDisponibile = false;
        }
      }

    } catch (error) {
      // ✅ Silenzioso - non mostrare errori in console
      this.inizializzato = true;
      this.pushDisponibile = false;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // ATTIVA NOTIFICHE
  // ═══════════════════════════════════════════════════════════════
  async attivaNotifiche() {
    try {
      if (!this.messaging) {
        await this.inizializza();
      }

      // Chiedi permesso
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return { success: false, motivo: 'permesso_negato' };
      }

      // Ottieni registration
      const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
      if (!registration) {
        return { success: false, motivo: 'sw_non_registrato' };
      }

      // Ottieni e registra token
      const token = await this._ottieniERegistraToken(registration);
      this.pushDisponibile = true;
      return { success: true, token };

    } catch (error) {
      // ✅ Errore silenzioso con messaggio chiaro
      const isPushServiceError = error.message?.includes('push service') || 
                                  error.name === 'AbortError';
      
      if (isPushServiceError) {
        return { 
          success: false, 
          motivo: 'push_non_disponibile',
          messaggio: 'Le notifiche push non sono disponibili su questo dispositivo. Le notifiche in-app continuano a funzionare normalmente.'
        };
      }
      
      return { success: false, motivo: error.message };
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // DISATTIVA NOTIFICHE
  // ═══════════════════════════════════════════════════════════════
  async disattivaNotifiche() {
    try {
      if (this.messaging) {
        await deleteToken(this.messaging);
      }

      // Rimuovi dal backend
      if (this.token) {
        const authToken = localStorage.getItem('token');
        await fetch(`${API_URL}/push/unsubscribe`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({ fcmToken: this.token })
        });
      }

      this.token = null;
      this.pushDisponibile = false;
      localStorage.removeItem('fcm_token');
      return { success: true };

    } catch (error) {
      return { success: false, motivo: error.message };
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // AGGIORNA PREFERENZE
  // ═══════════════════════════════════════════════════════════════
  async aggiornaPreferenze(preferenze) {
    try {
      const authToken = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/push/preferenze`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ preferenze })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false };
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST NOTIFICA
  // ═══════════════════════════════════════════════════════════════
  async inviaTest() {
    try {
      const authToken = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/push/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // STATO
  // ═══════════════════════════════════════════════════════════════
  getStato() {
    return {
      supportato: typeof window !== 'undefined' && 'serviceWorker' in navigator && 'Notification' in window,
      permesso: typeof window !== 'undefined' ? Notification.permission : 'default',
      tokenAttivo: !!this.token,
      inizializzato: this.inizializzato,
      pushDisponibile: this.pushDisponibile,  // ✅ Nuovo
      isIOS: this._isIOS()
    };
  }

  // Callback per messaggi foreground
  setOnMessage(callback) {
    this.onMessageCallback = callback;
  }

  // ═══════════════════════════════════════════════════════════════
  // METODI PRIVATI
  // ═══════════════════════════════════════════════════════════════
  async _ottieniERegistraToken(registration) {
    const token = await getToken(this.messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (!token) {
      return null;
    }

    this.token = token;
    localStorage.setItem('fcm_token', token);

    // Registra sul backend
    await this._registraTokenBackend(token);

    return token;
  }

  async _registraTokenBackend(fcmToken) {
    try {
      const authToken = localStorage.getItem('token');
      if (!authToken) return;

      await fetch(`${API_URL}/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          fcmToken,
          dispositivo: this._detectDevice(),
          preferenze: {
            chiamate: true,
            alertCritici: true,
            nuoviOrdini: true,
            ordiniModificati: false
          }
        })
      });
    } catch (error) {
      // Silenzioso
    }
  }

  _gestisciForegroundMessage(payload) {
    const data = payload.data || {};
    const notification = payload.notification || {};

    // Mostra notifica anche in foreground tramite SW
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        payload: {
          titolo: data.titolo || notification.title || '🍝 Pastificio',
          corpo: data.corpo || notification.body,
          tipo: data.tipo || 'generico',
          data: data
        }
      });
    }

    // Callback custom
    if (this.onMessageCallback) {
      this.onMessageCallback(payload);
    }
  }

  _detectDevice() {
    const ua = navigator.userAgent;
    let device = 'Sconosciuto';
    if (/iPad|Tablet/i.test(ua)) device = 'Tablet';
    else if (/Mobile|Android/i.test(ua)) device = 'Mobile';
    else device = 'PC';

    let browser = 'Browser';
    if (/Edg/i.test(ua)) browser = 'Edge';
    else if (/Chrome/i.test(ua)) browser = 'Chrome';
    else if (/Firefox/i.test(ua)) browser = 'Firefox';
    else if (/Safari/i.test(ua)) browser = 'Safari';

    return `${device} - ${browser}`;
  }

  _isIOS() {
    if (typeof navigator === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }
}

const firebasePushService = new FirebasePushService();
export default firebasePushService;