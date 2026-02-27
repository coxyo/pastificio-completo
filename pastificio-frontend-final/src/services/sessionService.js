// src/services/sessionService.js - ✅ NUOVO: Ping attività + rilevamento logout remoto
'use client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app/api';

let pingInterval = null;
let isInitialized = false;

const sessionService = {
  /**
   * Inizializza il servizio sessioni:
   * 1. Ping ogni 2 minuti per aggiornare ultimaAttivita
   * 2. Intercetta risposte 401 con sessionInvalid per logout remoto
   */
  inizializza() {
    if (typeof window === 'undefined' || isInitialized) return;
    isInitialized = true;

    // Avvia ping periodico (ogni 2 minuti)
    this.avviaPing();

    // Intercetta fetch per rilevare logout remoto
    this.intercettaFetch();

    console.log('[SESSION SERVICE] ✅ Inizializzato');
  },

  /**
   * Ping silenzioso ogni 2 minuti per aggiornare ultimaAttivita
   */
  avviaPing() {
    // Pulisci eventuale intervallo precedente
    if (pingInterval) clearInterval(pingInterval);

    const doPing = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`${API_URL}/sessions/ping`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          
          // Se la sessione è stata invalidata (logout remoto)
          if (data.sessionInvalid || response.status === 401) {
            console.warn('[SESSION SERVICE] ⚠️ Sessione invalidata remotamente');
            this.gestisciLogoutRemoto(data.message);
          }
        }
      } catch (error) {
        // Errore di rete - non fare nulla, riprova al prossimo ciclo
        console.debug('[SESSION SERVICE] Ping fallito (rete?):', error.message);
      }
    };

    // Primo ping dopo 30 secondi (non subito per non sovraccaricare al login)
    setTimeout(doPing, 30000);
    
    // Poi ogni 2 minuti
    pingInterval = setInterval(doPing, 2 * 60 * 1000);
  },

  /**
   * Intercetta le risposte fetch per rilevare logout remoto su QUALSIASI chiamata API
   */
  intercettaFetch() {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      
      // Controlla solo le risposte 401 alle nostre API
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
      
      if (response.status === 401 && url.includes('/api/')) {
        try {
          // Clona la response per leggerla senza consumarla
          const cloned = response.clone();
          const data = await cloned.json();
          
          if (data.sessionInvalid || data.remoteLogout) {
            console.warn('[SESSION SERVICE] ⚠️ Logout remoto rilevato via API');
            this.gestisciLogoutRemoto(data.message);
          }
        } catch (e) {
          // Ignora errori di parsing
        }
      }
      
      return response;
    };
  },

  /**
   * Gestisce il logout remoto: mostra messaggio e redirect al login
   */
  gestisciLogoutRemoto(messaggio) {
    // Evita di eseguire più volte
    if (sessionService._logoutInCorso) return;
    sessionService._logoutInCorso = true;

    // Ferma il ping
    this.ferma();

    // Messaggio personalizzato
    const msg = messaggio || 'Sessione terminata da un amministratore';

    // Salva il messaggio per mostrarlo nella pagina di login
    localStorage.setItem('sessionLogoutMessage', msg);
    
    // Pulisci token e dati utente
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Mostra alert e redirect
    if (typeof window !== 'undefined') {
      // Usa un piccolo delay per assicurarsi che eventuali operazioni in corso terminino
      setTimeout(() => {
        alert(`⚠️ ${msg}\n\nDovrai rifare il login.`);
        window.location.href = '/';
        sessionService._logoutInCorso = false;
      }, 100);
    }
  },

  /**
   * Ferma il servizio (da chiamare al logout volontario)
   */
  ferma() {
    if (pingInterval) {
      clearInterval(pingInterval);
      pingInterval = null;
    }
    isInitialized = false;
    console.log('[SESSION SERVICE] ⏹️ Fermato');
  },

  _logoutInCorso: false
};

export default sessionService;