// src/services/pushNotificationService.js - ✅ NUOVO: Client-side Web Push
// Gestisce: registrazione Service Worker, permesso notifiche, subscription

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app/api';

class PushNotificationService {
  constructor() {
    this.swRegistration = null;
    this.subscription = null;
    this.initialized = false;
  }

  // ═══════════════════════════════════════════════════════════════
  // CHECK SUPPORTO BROWSER
  // ═══════════════════════════════════════════════════════════════
  isSupported() {
    if (typeof window === 'undefined') return false;
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  // iOS non supporta Web Push in PWA/browser
  isIOS() {
    if (typeof navigator === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  }

  // Permesso attuale: 'granted', 'denied', 'default'
  getPermissionState() {
    if (typeof Notification === 'undefined') return 'unsupported';
    return Notification.permission;
  }

  // ═══════════════════════════════════════════════════════════════
  // REGISTRA SERVICE WORKER
  // ═══════════════════════════════════════════════════════════════
  async registraServiceWorker() {
    if (!this.isSupported()) {
      console.warn('[PUSH] Service Worker o Push API non supportati');
      return null;
    }

    try {
      this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('[PUSH] Service Worker registrato:', this.swRegistration.scope);

      // Aggiorna SW se disponibile nuova versione
      this.swRegistration.addEventListener('updatefound', () => {
        const newWorker = this.swRegistration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              console.log('[PUSH] Nuovo Service Worker attivato');
            }
          });
        }
      });

      return this.swRegistration;
    } catch (error) {
      console.error('[PUSH] Errore registrazione Service Worker:', error);
      return null;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // INIZIALIZZAZIONE COMPLETA
  // ═══════════════════════════════════════════════════════════════
  async inizializza() {
    if (this.initialized) return;
    if (typeof window === 'undefined') return;

    // Registra SW
    await this.registraServiceWorker();

    // Ascolta messaggi dal SW (click su notifica)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'PUSH_NOTIFICATION_CLICK') {
          this.gestisciClickNotifica(event.data.data);
        }
      });
    }

    // Verifica se già sottoscritto
    if (this.swRegistration && Notification.permission === 'granted') {
      try {
        this.subscription = await this.swRegistration.pushManager.getSubscription();
        if (this.subscription) {
          console.log('[PUSH] Subscription esistente trovata');
        }
      } catch (e) {
        console.warn('[PUSH] Errore verifica subscription:', e);
      }
    }

    this.initialized = true;
  }

  // ═══════════════════════════════════════════════════════════════
  // RICHIEDI PERMESSO + SUBSCRIBE
  // ═══════════════════════════════════════════════════════════════
  async attivaNotifiche(preferenze = null) {
    if (!this.isSupported()) {
      throw new Error('Notifiche push non supportate dal browser');
    }

    if (this.isIOS()) {
      throw new Error('Le notifiche push non sono supportate su iPhone/iPad');
    }

    // Assicurati che SW sia registrato
    if (!this.swRegistration) {
      await this.registraServiceWorker();
    }

    if (!this.swRegistration) {
      throw new Error('Service Worker non disponibile');
    }

    // Chiedi permesso
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      throw new Error('Permesso notifiche negato dall\'utente');
    }

    // Ottieni VAPID key dal backend
    const token = localStorage.getItem('token');
    const vapidResponse = await fetch(`${API_URL}/api/push/vapid-key`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!vapidResponse.ok) {
      throw new Error('Impossibile ottenere VAPID key dal server');
    }

    const { vapidPublicKey } = await vapidResponse.json();

    // Converti VAPID key da base64 a Uint8Array
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

    // Crea subscription
    this.subscription = await this.swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey
    });

    console.log('[PUSH] Subscription creata:', this.subscription.endpoint.substring(0, 60) + '...');

    // Invia al backend
    const subJSON = this.subscription.toJSON();
    const response = await fetch(`${API_URL}/api/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        subscription: {
          endpoint: subJSON.endpoint,
          keys: {
            p256dh: subJSON.keys.p256dh,
            auth: subJSON.keys.auth
          }
        },
        dispositivo: detectDispositivo(),
        preferenze: preferenze || {
          chiamate: true,
          alertCritici: true,
          nuoviOrdini: false,
          ordiniModificati: false
        }
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || 'Errore registrazione sul server');
    }

    const data = await response.json();
    console.log('[PUSH] ✅ Notifiche attivate:', data);
    return data;
  }

  // ═══════════════════════════════════════════════════════════════
  // DISATTIVA NOTIFICHE
  // ═══════════════════════════════════════════════════════════════
  async disattivaNotifiche() {
    if (!this.subscription) {
      // Prova a recuperare subscription esistente
      if (this.swRegistration) {
        this.subscription = await this.swRegistration.pushManager.getSubscription();
      }
    }

    if (!this.subscription) {
      console.warn('[PUSH] Nessuna subscription da rimuovere');
      return;
    }

    const endpoint = this.subscription.endpoint;

    // Unsubscribe lato browser
    await this.subscription.unsubscribe();
    this.subscription = null;

    // Rimuovi dal backend
    const token = localStorage.getItem('token');
    await fetch(`${API_URL}/api/push/unsubscribe`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ endpoint })
    });

    console.log('[PUSH] 🔕 Notifiche disattivate');
  }

  // ═══════════════════════════════════════════════════════════════
  // AGGIORNA PREFERENZE
  // ═══════════════════════════════════════════════════════════════
  async aggiornaPreferenze(preferenze) {
    if (!this.subscription) {
      throw new Error('Nessuna subscription attiva');
    }

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/push/preferenze`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        endpoint: this.subscription.endpoint,
        preferenze
      })
    });

    if (!response.ok) {
      throw new Error('Errore aggiornamento preferenze');
    }

    const data = await response.json();
    console.log('[PUSH] Preferenze aggiornate:', data.preferenze);
    return data;
  }

  // ═══════════════════════════════════════════════════════════════
  // STATO ATTUALE
  // ═══════════════════════════════════════════════════════════════
  async getStato() {
    const supported = this.isSupported();
    const ios = this.isIOS();
    const permission = this.getPermissionState();
    
    let isSubscribed = false;
    if (this.swRegistration && permission === 'granted') {
      try {
        const sub = await this.swRegistration.pushManager.getSubscription();
        isSubscribed = !!sub;
        this.subscription = sub;
      } catch (e) {
        // ignore
      }
    }

    return {
      supported,
      ios,
      permission,
      isSubscribed,
      swRegistered: !!this.swRegistration
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST NOTIFICA
  // ═══════════════════════════════════════════════════════════════
  async inviaTest() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/push/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    return response.json();
  }

  // ═══════════════════════════════════════════════════════════════
  // GESTISCI CLICK NOTIFICA (dal Service Worker)
  // ═══════════════════════════════════════════════════════════════
  gestisciClickNotifica(data) {
    if (!data) return;
    
    console.log('[PUSH] Click notifica ricevuto:', data);

    // Dispatch evento custom per i componenti React
    window.dispatchEvent(new CustomEvent('push-notification-click', {
      detail: data
    }));
  }

  // ═══════════════════════════════════════════════════════════════
  // MOSTRA PROMPT DI RICHIESTA PERMESSO?
  // ═══════════════════════════════════════════════════════════════
  shouldShowPrompt() {
    if (!this.isSupported()) return false;
    if (this.isIOS()) return false;
    
    const permission = this.getPermissionState();
    if (permission === 'denied') return false; // Non chiedere più
    if (permission === 'granted') return false; // Già concesso
    
    // Controlla se l'utente ha già chiuso il prompt
    const dismissed = localStorage.getItem('push-prompt-dismissed');
    if (dismissed) return false;

    return true; // permission === 'default'
  }

  // L'utente ha chiuso il prompt senza rispondere
  dismissPrompt() {
    localStorage.setItem('push-prompt-dismissed', 'true');
  }

  // Reset: mostra di nuovo il prompt (dalle impostazioni)
  resetPromptDismissal() {
    localStorage.removeItem('push-prompt-dismissed');
  }
}

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

// Converte base64 URL-safe in Uint8Array (necessario per applicationServerKey)
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Rileva tipo dispositivo
function detectDispositivo() {
  const ua = navigator.userAgent;
  
  let device = 'PC';
  if (/Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)) device = 'Mobile';
  else if (/iPad|tablet/i.test(ua)) device = 'Tablet';
  
  let browser = 'Browser';
  if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari')) browser = 'Safari';
  
  return `${device} - ${browser}`;
}

// Singleton
const pushNotificationService = new PushNotificationService();
export default pushNotificationService;