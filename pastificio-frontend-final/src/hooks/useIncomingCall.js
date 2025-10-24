// src/hooks/useIncomingCall.js
'use client';

import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-backend-production.up.railway.app';

/**
 * Hook per gestire chiamate in arrivo via WebSocket
 * 
 * @returns {Object} { chiamataCorrente, clearChiamata }
 */
export function useIncomingCall() {
  const [socket, setSocket] = useState(null);
  const [chiamataCorrente, setChiamataCorrente] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Inizializza connessione WebSocket
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('[WEBSOCKET] Connesso per chiamate');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('[WEBSOCKET] Disconnesso');
      setConnected(false);
    });

    // Evento: chiamata in arrivo
    newSocket.on('chiamata:inbound', (data) => {
      console.log('[WEBSOCKET] Chiamata in arrivo:', data);
      
      // Mostra popup
      setChiamataCorrente(data);

      // Notifica browser (se supportato e permesso)
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Chiamata in Arrivo', {
          body: data.cliente 
            ? `${data.cliente.nome} ${data.cliente.cognome}\n${data.numero}`
            : `Numero: ${data.numero}`,
          icon: '/phone-icon.png',
          tag: data.callId
        });
      }

      // Suono notifica (opzionale)
      playRingtone();
    });

    // Evento: chiamata risposta
    newSocket.on('chiamata:answered', (data) => {
      console.log('[WEBSOCKET] Chiamata risposta:', data);
      
      // Chiudi popup se ancora aperto
      if (chiamataCorrente?.callId === data.callId) {
        stopRingtone();
      }
    });

    // Evento: chiamata terminata
    newSocket.on('chiamata:ended', (data) => {
      console.log('[WEBSOCKET] Chiamata terminata:', data);
      
      // Chiudi popup
      if (chiamataCorrente?.callId === data.callId) {
        setTimeout(() => {
          setChiamataCorrente(null);
        }, 2000); // Attendi 2 sec prima di chiudere
      }
      
      stopRingtone();
    });

    // Evento: chiamata persa
    newSocket.on('chiamata:missed', (data) => {
      console.log('[WEBSOCKET] Chiamata persa:', data);
      
      // Notifica chiamata persa
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Chiamata Persa', {
          body: data.cliente 
            ? `${data.cliente.nome} ${data.cliente.cognome}`
            : `Numero: ${data.numero}`,
          icon: '/phone-missed-icon.png',
          tag: `missed-${data.callId}`
        });
      }

      stopRingtone();
      
      // Chiudi popup
      setChiamataCorrente(null);
    });

    setSocket(newSocket);

    // Cleanup
    return () => {
      newSocket.disconnect();
      stopRingtone();
    };
  }, []);

  // Richiedi permesso notifiche
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('[NOTIFICHE] Permesso:', permission);
      });
    }
  }, []);

  const clearChiamata = () => {
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
    }
    audio.play().catch(err => {
      console.warn('[AUDIO] Impossibile riprodurre suoneria:', err);
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