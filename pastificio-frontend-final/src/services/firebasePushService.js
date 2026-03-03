// src/services/firebasePushService.js
// Firebase Cloud Messaging - Servizio notifiche push
// Pastificio Nonna Claudia
// NOTA: Import dinamici per evitare crash SSR con Next.js

const FIREBASE_CONFIG = {
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
    this.onMessageCallback = null;
  }

  async inizializza() {
    if (this.inizializzato) return;
    if (typeof window === 'undefined') return;

    try {
      if (!('serviceWorker' in navigator)) {
        console.warn('[FCM] Service Worker non supportato');
        return;
      }
      if (!('Notification' in window)) {
        console.warn('[FCM] Notifications API non supportata');
        return;
      }

      // Import dinamici - evita crash SSR
      const { initializeApp } = await import('firebase/app');
      const { getMessaging, onMessage } = await import('firebase/messaging');

      this.app = initializeApp(FIREBASE_CONFIG);
      this.messaging = getMessaging(this.app);

      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('[FCM] Service Worker registrato:', registration.scope);

      onMessage(this.messaging, (payload) => {
        console.log('[FCM] Messaggio foreground:', payload);
        this._gestisciForegroundMessage(payload);
      });

      this.inizializzato = true;
      console.log('[FCM] Firebase Messaging inizializzato');

      if (Notification.permission === 'granted') {
        await this._ottieniERegistraToken(registration);
      }
    } catch (error) {
      console.error('[FCM] Errore inizializzazione:', error);
    }
  }

  async attivaNotifiche() {
    try {
      if (!this.messaging) {
        await this.inizializza();
      }
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('[FCM] Permesso negato');
        return { success: false, motivo: 'permesso_negato' };
      }
      const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
      if (!registration) {
        throw new Error('Service Worker non registrato');
      }
      const token = await this._ottieniERegistraToken(registration);
      return { success: true, token };
    } catch (error) {
      console.error('[FCM] Errore attivazione:', error);
      return { success: false, motivo: error.message };
    }
  }

  async disattivaNotifiche() {
    try {
      if (this.messaging) {
        const { deleteToken } = await import('firebase/messaging');
        await deleteToken(this.messaging);
      }
      if (this.token) {
        const authToken = localStorage.getItem('token');
        await fetch(API_URL + '/push/unsubscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + authToken },
          body: JSON.stringify({ fcmToken: this.token })
        });
      }
      this.token = null;
      localStorage.removeItem('fcm_token');
      console.log('[FCM] Notifiche disattivate');
      return { success: true };
    } catch (error) {
      console.error('[FCM] Errore disattivazione:', error);
      return { success: false, motivo: error.message };
    }
  }

  async aggiornaPreferenze(preferenze) {
    try {
      const authToken = localStorage.getItem('token');
      const response = await fetch(API_URL + '/push/preferenze', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + authToken },
        body: JSON.stringify({ preferenze })
      });
      return await response.json();
    } catch (error) {
      console.error('[FCM] Errore aggiornamento preferenze:', error);
      return { success: false };
    }
  }

  async inviaTest() {
    try {
      const authToken = localStorage.getItem('token');
      const response = await fetch(API_URL + '/push/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + authToken }
      });
      return await response.json();
    } catch (error) {
      console.error('[FCM] Errore test:', error);
      return { success: false, message: error.message };
    }
  }

  getStato() {
    return {
      supportato: typeof window !== 'undefined' && 'serviceWorker' in navigator && 'Notification' in window,
      permesso: typeof window !== 'undefined' ? Notification.permission : 'default',
      tokenAttivo: !!this.token,
      inizializzato: this.inizializzato,
      isIOS: this._isIOS()
    };
  }

  setOnMessage(callback) {
    this.onMessageCallback = callback;
  }

  async _ottieniERegistraToken(registration) {
    try {
      const { getToken } = await import('firebase/messaging');
      const token = await getToken(this.messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration
      });
      if (!token) {
        console.warn('[FCM] Nessun token ottenuto');
        return null;
      }
      console.log('[FCM] Token FCM ottenuto:', token.substring(0, 30) + '...');
      this.token = token;
      localStorage.setItem('fcm_token', token);
      await this._registraTokenBackend(token);
      return token;
    } catch (error) {
      console.error('[FCM] Errore ottenimento token:', error);
      throw error;
    }
  }

  async _registraTokenBackend(fcmToken) {
    try {
      const authToken = localStorage.getItem('token');
      if (!authToken) {
        console.warn('[FCM] No auth token, skip registrazione backend');
        return;
      }
      const response = await fetch(API_URL + '/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + authToken },
        body: JSON.stringify({
          fcmToken,
          dispositivo: this._detectDevice(),
          preferenze: { chiamate: true, alertCritici: true, nuoviOrdini: true, ordiniModificati: false }
        })
      });
      const data = await response.json();
      console.log('[FCM] Token registrato sul backend:', data.success);
      return data;
    } catch (error) {
      console.error('[FCM] Errore registrazione backend:', error);
    }
  }

  _gestisciForegroundMessage(payload) {
    const data = payload.data || {};
    const notification = payload.notification || {};
    if ('Notification' in window && Notification.permission === 'granted') {
      const titolo = data.titolo || notification.title || 'Pastificio';
      const options = {
        body: data.corpo || notification.body,
        icon: '/icons/icon-192.png',
        badge: '/icons/badge-72.png',
        tag: data.tag || 'fg-' + Date.now(),
        data: data
      };
      try {
        new Notification(titolo, options);
      } catch (e) {
        navigator.serviceWorker.ready.then(function(reg) {
          reg.showNotification(titolo, options);
        });
      }
    }
    if (this.onMessageCallback) {
      this.onMessageCallback(payload);
    }
  }

  _detectDevice() {
    if (typeof navigator === 'undefined') return 'Sconosciuto';
    var ua = navigator.userAgent;
    var device = 'Sconosciuto';
    if (/iPad|Tablet/i.test(ua)) device = 'Tablet';
    else if (/Mobile|Android/i.test(ua)) device = 'Mobile';
    else device = 'PC';
    var browser = 'Browser';
    if (/Edg/i.test(ua)) browser = 'Edge';
    else if (/Chrome/i.test(ua)) browser = 'Chrome';
    else if (/Firefox/i.test(ua)) browser = 'Firefox';
    else if (/Safari/i.test(ua)) browser = 'Safari';
    return device + ' - ' + browser;
  }

  _isIOS() {
    if (typeof navigator === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }
}

var firebasePushService = new FirebasePushService();
export default firebasePushService;