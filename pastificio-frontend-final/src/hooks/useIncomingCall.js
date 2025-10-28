// hooks/useIncomingCall.js - VERSIONE FIXATA con debouncing

import { useState, useEffect, useRef } from 'react';

export const useIncomingCall = () => {
  const [incomingCall, setIncomingCall] = useState(null);
  const [isCallPopupOpen, setIsCallPopupOpen] = useState(false);
  const lastCallIdRef = useRef(null);
  const debounceTimerRef = useRef(null);

  useEffect(() => {
    console.log('[useIncomingCall] Hook inizializzato');

    const handleIncomingCall = (event) => {
      const callData = event.detail;
      
      console.log('[useIncomingCall] 📞 Evento chiamata ricevuto:', callData);
      
      // ✅ DEBOUNCING: Ignora eventi troppo ravvicinati
      if (debounceTimerRef.current) {
        console.log('[useIncomingCall] ⏭️ Evento ignorato (debouncing attivo)');
        return;
      }
      
      // ✅ DEDUPLICAZIONE: Ignora se è la stessa chiamata
      if (lastCallIdRef.current === callData.callId) {
        console.log('[useIncomingCall] ⏭️ Chiamata duplicata, skip:', callData.callId);
        return;
      }
      
      // ✅ Aggiorna riferimento ultima chiamata
      lastCallIdRef.current = callData.callId;
      
      // ✅ Imposta timer debounce di 3 secondi
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        console.log('[useIncomingCall] ⏰ Debounce timer scaduto, pronto per nuova chiamata');
      }, 3000);
      
      console.log('[useIncomingCall] ✅ Chiamata accettata, apertura popup...');
      
      // Aggiorna stato
      setIncomingCall(callData);
      setIsCallPopupOpen(true);
      
      // Reset dopo 2 minuti (chiamata probabilmente terminata)
      setTimeout(() => {
        lastCallIdRef.current = null;
        console.log('[useIncomingCall] 🗑️ Reset chiamata dopo 2 minuti');
      }, 120000);
    };

    // Listener evento custom
    window.addEventListener('chiamata:arrivo', handleIncomingCall);

    console.log('[useIncomingCall] ✅ Listener aggiunto per chiamata:arrivo');

    // Cleanup
    return () => {
      window.removeEventListener('chiamata:arrivo', handleIncomingCall);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      console.log('[useIncomingCall] 🧹 Cleanup listener');
    };
  }, []);

  const closeCallPopup = () => {
    console.log('[useIncomingCall] 🔒 Chiusura popup chiamata');
    setIsCallPopupOpen(false);
    setIncomingCall(null);
  };

  return {
    incomingCall,
    isCallPopupOpen,
    closeCallPopup
  };
};

export default useIncomingCall;