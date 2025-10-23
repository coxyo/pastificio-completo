// pastificio-frontend-final/src/hooks/useIncomingCalls.js
import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { toast } from 'react-toastify';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-backend-production.up.railway.app';

export const useIncomingCalls = (onIncomingCall) => {
  const [isConnected, setIsConnected] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const socketRef = useRef(null);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('Token non trovato, WebSocket non connesso');
      return;
    }
    
    // Connessione WebSocket
    socketRef.current = io(API_URL, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });
    
    const socket = socketRef.current;
    
    // Eventi connessione
    socket.on('connect', () => {
      console.log('✅ WebSocket connesso per chiamate');
      setIsConnected(true);
      
      // Registra per eventi chiamate
      socket.emit('register:phone', { 
        extension: process.env.NEXT_PUBLIC_CX3_EXTENSION || '19810' 
      });
    });
    
    socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnesso');
      setIsConnected(false);
    });
    
    socket.on('connect_error', (error) => {
      console.error('WebSocket errore connessione:', error);
      setIsConnected(false);
    });
    
    // 📞 EVENTO: Chiamata in arrivo
    socket.on('call:incoming', (data) => {
      console.log('📞 Chiamata in arrivo:', data);
      
      setIncomingCall(data.chiamata);
      
      if (onIncomingCall) {
        onIncomingCall(data.chiamata);
      }
      
      // Notifica browser
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Chiamata in arrivo', {
          body: `${data.chiamata.clienteNome} - ${data.chiamata.numero}`,
          icon: '/icons/phone.png',
          tag: data.chiamata.callId
        });
      }
      
      // Suona campanella (opzionale)
      playNotificationSound();
    });
    
    // 📞 EVENTO: Chiamata risposta
    socket.on('call:answered', (data) => {
      console.log('✅ Chiamata risposta:', data);
      
      if (incomingCall && incomingCall.callId === data.callId) {
        setIncomingCall(null);
      }
      
      toast.info('Chiamata in corso');
    });
    
    // 📞 EVENTO: Chiamata terminata
    socket.on('call:ended', (data) => {
      console.log('📴 Chiamata terminata:', data);
      
      if (incomingCall && incomingCall.callId === data.callId) {
        setIncomingCall(null);
      }
      
      toast.success(`Chiamata terminata (${data.duration}s)`);
    });
    
    // 📞 EVENTO: Chiamata persa
    socket.on('call:missed', (data) => {
      console.log('⚠️ Chiamata persa:', data);
      
      if (incomingCall && incomingCall.callId === data.callId) {
        setIncomingCall(null);
      }
      
      toast.warning(`Chiamata persa da ${data.numero}`);
    });
    
    // 📞 EVENTO: Stato interno cambiato
    socket.on('extension:status', (data) => {
      console.log('📊 Stato interno:', data);
    });
    
    // Cleanup
    return () => {
      if (socket) {
        socket.emit('unregister:phone');
        socket.disconnect();
      }
    };
  }, [onIncomingCall]);
  
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.play().catch(e => console.log('Audio play error:', e));
    } catch (error) {
      console.error('Errore riproduzione suono:', error);
    }
  };
  
  const clearIncomingCall = () => {
    setIncomingCall(null);
  };
  
  return {
    isConnected,
    incomingCall,
    clearIncomingCall
  };
};

export default useIncomingCalls;