// hooks/useWhatsAppMessage.js - v1.0
// ✅ Hook Pusher per messaggi WhatsApp in arrivo dal bot VPS
// ✅ Pattern identico a useIncomingCall.js
// ✅ Canale: "pastificio" | Evento: "whatsapp-messaggio"
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ✅ CONFIGURAZIONE ANTI-SPAM
const DEBOUNCE_TIME = 10000; // 10 secondi tra messaggi stesso numero
const RESET_TIMEOUT = 120000; // Reset cache dopo 2 minuti

export default function useWhatsAppMessage() {
  const [messaggioCorrente, setMessaggioCorrente] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // ANTI-SPAM: Traccia ultimo messaggio per numero
  const lastMsgByNumberRef = useRef(new Map());
  const autoCloseTimerRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // PULIZIA PERIODICA CACHE ANTI-SPAM
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      const map = lastMsgByNumberRef.current;
      for (const [numero, data] of map.entries()) {
        if (now - data.time > RESET_TIMEOUT) {
          map.delete(numero);
        }
      }
    }, 30000);

    return () => clearInterval(cleanupInterval);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;

    console.log('[useWhatsAppMessage] Inizializzazione...');

    let whatsappChannel = null;
    let cleanupDone = false;

    import('@/services/pusherService').then((module) => {
      if (cleanupDone) return;
      
      const service = module.default;
      console.log('[useWhatsAppMessage] pusherService importato');

      const handleWhatsAppMessage = (data) => {
        console.log('💬 [useWhatsAppMessage] Messaggio WhatsApp ricevuto:', data);

        // ANTI-SPAM: Controlla per numero
        const numero = data.telefono || data.numero || '';
        const now = Date.now();
        const lastMsg = lastMsgByNumberRef.current.get(numero);

        if (lastMsg && (now - lastMsg.time) < DEBOUNCE_TIME) {
          console.log('🚫 [useWhatsAppMessage] Spam bloccato, stesso numero entro', DEBOUNCE_TIME / 1000, 's');
          return;
        }

        // Registra questo messaggio
        lastMsgByNumberRef.current.set(numero, { time: now });

        console.log('✅ [useWhatsAppMessage] Messaggio accettato:', {
          nome: data.nome || 'Sconosciuto',
          telefono: numero,
          testo: (data.testo || '').substring(0, 50) + '...'
        });

        // Salva in localStorage per storico
        try {
          const storageKey = 'pastificio_whatsapp_recenti';
          const esistenti = JSON.parse(localStorage.getItem(storageKey) || '[]');
          const nuovo = {
            ...data,
            id: `wa_${Date.now()}`,
            receivedAt: new Date().toISOString()
          };
          const aggiornati = [nuovo, ...esistenti].slice(0, 50);
          localStorage.setItem(storageKey, JSON.stringify(aggiornati));
        } catch (err) {
          console.error('[useWhatsAppMessage] Errore salvataggio locale:', err);
        }

        // Mostra popup SOLO se il bot non risponde automaticamente
        if (data.botRisponde === true) {
          console.log('[useWhatsAppMessage] Bot risponde autonomamente - popup soppresso');
          return;
        }

        setMessaggioCorrente(data);
        setIsPopupOpen(true);
      };

      // Subscribe al canale "pastificio" e ascolta evento "whatsapp-messaggio"
      const setupListener = () => {
        const status = service.getStatus();
        if (!status.connected || !service.pusher) {
          return false;
        }

        try {
          // Subscribe al canale pastificio (separato dal canale "chiamate")
          whatsappChannel = service.pusher.subscribe('pastificio');

          whatsappChannel.bind('pusher:subscription_succeeded', () => {
            console.log('✅ [useWhatsAppMessage] Subscribe canale "pastificio" OK');
          });

          whatsappChannel.bind('pusher:subscription_error', (status) => {
            console.error('❌ [useWhatsAppMessage] Errore subscribe:', status);
          });

          whatsappChannel.bind('whatsapp-messaggio', (data) => {
            console.log('📱 [useWhatsAppMessage] Evento Pusher "whatsapp-messaggio":', data);
            handleWhatsAppMessage(data);
          });

          console.log('👂 [useWhatsAppMessage] Listener "whatsapp-messaggio" registrato su canale "pastificio"');
          return true;
        } catch (error) {
          console.error('❌ [useWhatsAppMessage] Errore setup listener:', error);
          return false;
        }
      };

      // Anche evento custom per test locale
      const handleCustomEvent = (event) => {
        handleWhatsAppMessage(event.detail);
      };
      window.addEventListener('whatsapp-incoming-message', handleCustomEvent);

      // Tenta setup, con retry se Pusher non è ancora pronto
      if (!setupListener()) {
        console.log('[useWhatsAppMessage] Pusher non pronto, retry...');
        const retryInterval = setInterval(() => {
          if (cleanupDone) {
            clearInterval(retryInterval);
            return;
          }
          if (setupListener()) {
            clearInterval(retryInterval);
          }
        }, 1500);

        // Timeout dopo 30s
        setTimeout(() => clearInterval(retryInterval), 30000);
      }

      // Cleanup
      return () => {
        cleanupDone = true;
        window.removeEventListener('whatsapp-incoming-message', handleCustomEvent);
        if (whatsappChannel && service.pusher) {
          whatsappChannel.unbind_all();
          try {
            service.pusher.unsubscribe('pastificio');
          } catch (e) {
            console.warn('[useWhatsAppMessage] Errore unsubscribe:', e);
          }
        }
      };
    });
  }, [mounted]);

  const handleClosePopup = useCallback(() => {
    console.log('[useWhatsAppMessage] Chiusura popup');
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
    setIsPopupOpen(false);
    setMessaggioCorrente(null);
  }, []);

  const getStoricoMessaggi = useCallback(() => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('pastificio_whatsapp_recenti') || '[]');
    } catch {
      return [];
    }
  }, []);

  return {
    messaggioCorrente,
    isPopupOpen,
    handleClosePopup,
    getStoricoMessaggi
  };
}