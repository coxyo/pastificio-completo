// hooks/useMagazzinoNotifications.js - FIX DEFINITIVO
// ✅ Gestisce webSocketService stub + usa Pusher se disponibile
import { useEffect } from 'react';
import webSocketService from '@/services/webSocketService';
import notificationService from '@/services/notificationService';

export const useMagazzinoNotifications = () => {
  useEffect(() => {
    console.log('🔔 Inizializzazione notifiche magazzino');
    
    // Richiedi permesso notifiche all'avvio
    if (notificationService && typeof notificationService.requestPermission === 'function') {
      notificationService.requestPermission();
    }
    
    // ✅ FIX: Verifica se webSocketService è uno stub o reale
    const isWebSocketActive = webSocketService && 
                              typeof webSocketService.on === 'function' &&
                              !webSocketService.getStatus?.()?.disabled;
    
    if (!isWebSocketActive) {
      console.log('ℹ️ WebSocketService disabilitato, notifiche magazzino via Pusher (se configurate)');
      
      // ✅ TODO: Se necessario, qui si possono aggiungere listener Pusher per magazzino
      // Esempio:
      // pusherService.subscribe('magazzino').bind('low-stock', callback);
      
      return;
    }
    
    // ✅ WebSocket attivo (scenario legacy, probabilmente mai usato ora)
    console.log('🌐 WebSocket attivo, registro listener magazzino');
    
    // Ascolta eventi scorte basse
    webSocketService.on('low-stock', (data) => {
      console.log('📉 Evento scorta bassa ricevuto:', data);
      if (data.prodotto && notificationService.notifyLowStock) {
        notificationService.notifyLowStock(data.prodotto);
      }
    });
    
    // Ascolta eventi prodotti in scadenza
    webSocketService.on('products-expiring', (data) => {
      console.log('⏰ Evento prodotti in scadenza:', data);
      if (data.prodotti && notificationService.notifyExpiringProducts) {
        notificationService.notifyExpiringProducts(data.prodotti);
      }
    });
    
    // Ascolta controlli schedulati
    webSocketService.on('scheduled-low-stock-check', (data) => {
      console.log('📊 Controllo schedulato scorte:', data);
      if (data.prodotti && Array.isArray(data.prodotti)) {
        data.prodotti.forEach(prodotto => {
          if (notificationService.notifyLowStock) {
            notificationService.notifyLowStock(prodotto);
          }
        });
      }
    });
    
    webSocketService.on('scheduled-expiry-check', (data) => {
      console.log('📅 Controllo schedulato scadenze:', data);
      if (data.prodotti && notificationService.notifyExpiringProducts) {
        notificationService.notifyExpiringProducts(data.prodotti);
      }
    });
    
    // Ascolta movimenti magazzino
    webSocketService.on('movimento:creato', (data) => {
      console.log('➕ Movimento creato:', data);
      if (notificationService.notifyStockMovement) {
        notificationService.notifyStockMovement(data);
      }
    });
    
    webSocketService.on('movimento:aggiornato', (data) => {
      console.log('✏️ Movimento aggiornato:', data);
      const messaggio = data.prodotto?.nome 
        ? `Movimento aggiornato: ${data.prodotto.nome}`
        : 'Movimento aggiornato';
      
      if (notificationService.notifySuccess) {
        notificationService.notifySuccess(messaggio);
      } else if (notificationService.showNotification) {
        notificationService.showNotification('✅ Successo', { body: messaggio });
      }
    });
    
    webSocketService.on('movimento:eliminato', (data) => {
      console.log('🗑️ Movimento eliminato:', data);
      const messaggio = 'Movimento eliminato dal magazzino';
      
      if (notificationService.notifyWarning) {
        notificationService.notifyWarning(messaggio);
      } else if (notificationService.showNotification) {
        notificationService.showNotification('⚠️ Attenzione', { body: messaggio });
      }
    });
    
    // Cleanup
    return () => {
      console.log('🧹 Pulizia listener notifiche magazzino');
      if (isWebSocketActive) {
        webSocketService.off('low-stock');
        webSocketService.off('products-expiring');
        webSocketService.off('scheduled-low-stock-check');
        webSocketService.off('scheduled-expiry-check');
        webSocketService.off('movimento:creato');
        webSocketService.off('movimento:aggiornato');
        webSocketService.off('movimento:eliminato');
      }
    };
  }, []);
  
  // ✅ FIX: Ritorna valori sicuri anche se webSocketService è stub
  return {
    webSocketService,
    isConnected: Boolean(webSocketService?.connected || webSocketService?.isConnected?.()), 
    notificationService
  };
};

export default useMagazzinoNotifications;
