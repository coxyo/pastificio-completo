// src/services/sessionService.js - ✅ OTTIMIZZATO PERFORMANCE 03/03/2026
// Ping ogni 10 minuti invece di 2 (riduce 80% chiamate API)
// Rimosso intercettore fetch globale (causava overhead su OGNI chiamata API)
'use client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app/api';

let pingInterval = null;
let isInitialized = false;

const sessionService = {
  /**
   * Inizializza il servizio sessioni:
   * 1. Ping ogni 10 minuti per aggiornare ultimaAttivita (era 2 min)
   * 2. Controlla logout remoto solo durante il ping (non su ogni fetch)
   */
  inizializza() {
    if (typeof window === 'undefined' || isInitialized) return;
    isInitialized = true;

    // Avvia ping periodico
    this.avviaPing();

    console.log('[SESSION SERVICE] ✅ Inizializzato (ping ogni 10 min)');
  },

  /**
   * ✅ OTTIMIZZATO: Ping ogni 10 minuti (era 2 minuti)
   * Su 3 dispositivi: da 90 ping/ora a 18 ping/ora = -80%
   */
  avviaPing() {
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

    // Primo ping dopo 60 secondi (era 30s - meno pressione al caricamento)
    setTimeout(doPing, 60000);
    
    // ✅ Poi ogni 10 minuti (era 2 minuti)
    pingInterval = setInterval(doPing, 10 * 60 * 1000);
  },

  // ✅ RIMOSSO: intercettaFetch()
  // L'intercettore globale di fetch aggiungeva overhead su OGNI chiamata API.
  // Il controllo logout remoto ora avviene solo durante il ping (ogni 10 min).
  // In caso di logout remoto, l'utente riceverà un 401 alla prossima operazione
  // e AuthContext gestirà il redirect al login.

  /**
   * Gestisce il logout remoto: mostra messaggio e redirect al login
   */
  gestisciLogoutRemoto(messaggio) {
    if (sessionService._logoutInCorso) return;
    sessionService._logoutInCorso = true;

    this.ferma();

    const msg = messaggio || 'Sessione terminata da un amministratore';
    localStorage.setItem('sessionLogoutMessage', msg);
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    if (typeof window !== 'undefined') {
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