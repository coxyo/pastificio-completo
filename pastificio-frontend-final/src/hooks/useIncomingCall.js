// src/hooks/useIncomingCall.js
'use client';

import { useEffect, useState } from 'react';

/**
 * Hook per gestire chiamate in arrivo via Pusher
 * Ascolta eventi custom window 'chiamata:arrivo' triggerati da pusherService
 * 
 * @returns {Object} { chiamataCorrente, clearChiamata, connected }
 */
export function useIncomingCall() {
  const [chiamataCorrente, setChiamataCorrente] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    console.log('[useIncomingCall] Hook inizializzato');
    
    // Verifica Pusher connessione (se disponibile)
    if (typeof window !== 'undefined' && window.pusherDebug) {
      const status = window.pusherDebug.status();
      setConnected(status.connected);
      console.log('[useIncomingCall] Pusher status:', status);
    }

    // Ascolta evento custom 'chiamata:arrivo' triggerato da Pusher
    const handleChiamataArrivo = (event) => {
      console.log('[useIncomingCall] 📞 Chiamata ricevuta!', event.detail);
      
      // Aggiorna stato con dati chiamata
      setChiamataCorrente(event.detail);

      // Notifica browser (se supportato e permesso)
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Chiamata in Arrivo', {
          body: event.detail.cliente 
            ? `${event.detail.cliente.nome} ${event.detail.cliente.cognome}\n${event.detail.numero}`
            : `Numero: ${event.detail.numero}`,
          icon: '/phone-icon.png',
          tag: event.detail.callId,
          requireInteraction: true
        });
      }

      // Suono notifica (opzionale)
      playRingtone();
    };

    // Aggiungi listener
    window.addEventListener('chiamata:arrivo', handleChiamataArrivo);
    console.log('[useIncomingCall] ✅ Listener aggiunto per chiamata:arrivo');

    // Richiedi permesso notifiche (se non già fatto)
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('[useIncomingCall] Permesso notifiche:', permission);
      });
    }

    // Cleanup
    return () => {
      window.removeEventListener('chiamata:arrivo', handleChiamataArrivo);
      stopRingtone();
      console.log('[useIncomingCall] Listener rimosso');
    };
  }, []);

  const clearChiamata = () => {
    console.log('[useIncomingCall] Chiamata chiusa');
    setChiamataCorrente(null);
    stopRingtone();
  };

  return {
    chiamataCorrente,
    clearChiamata,
    connected
  };
}

// Audio ringtone
let audio = null;

function playRingtone() {
  try {
    if (!audio) {
      audio = new Audio('/ringtone.mp3'); // Aggiungi file suoneria in /public
      audio.loop = true;
      audio.volume = 0.5; // 50% volume
    }
    audio.play().catch(err => {
      console.warn('[AUDIO] Impossibile riprodurre suoneria:', err);
      // Ignora errore se autoplay bloccato dal browser
    });
  } catch (error) {
    console.error('[AUDIO] Errore suoneria:', error);
  }
}

function stopRingtone() {
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
}

export default useIncomingCall;