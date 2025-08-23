// hooks/useMagazzinoNotifications.js
import { useEffect } from 'react';
import webSocketService from '@/services/webSocketService';
import notificationService from '@/services/notificationService';

export const useMagazzinoNotifications = () => {
  useEffect(() => {
    console.log('🔔 Inizializzazione notifiche magazzino');
    
    // Richiedi permesso notifiche all'avvio
    notificationService.requestPermission();
    
    // Se non c'è il webSocketService, esci
    if (!webSocketService) {
      console.log('⚠️ WebSocketService non disponibile');
      return;
    }
    
    // Ascolta eventi scorte basse
    webSocketService.on('low-stock', (data) => {
      console.log('📉 Evento scorta bassa ricevuto:', data);
      if (data.prodotto) {
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
          notificationService.notifyLowStock(prodotto);
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
      } else if (notificationService.notify) {
        notificationService.notify('✅ Successo', messaggio);
      }
    });
    
    webSocketService.on('movimento:eliminato', (data) => {
      console.log('🗑️ Movimento eliminato:', data);
      const messaggio = 'Movimento eliminato dal magazzino';
      
      if (notificationService.notifyWarning) {
        notificationService.notifyWarning(messaggio);
      } else if (notificationService.notify) {
        notificationService.notify('⚠️ Attenzione', messaggio);
      }
    });
    
    // Cleanup
    return () => {
      console.log('🧹 Pulizia listener notifiche magazzino');
      webSocketService.off('low-stock');
      webSocketService.off('products-expiring');
      webSocketService.off('scheduled-low-stock-check');
      webSocketService.off('scheduled-expiry-check');
      webSocketService.off('movimento:creato');
      webSocketService.off('movimento:aggiornato');
      webSocketService.off('movimento:eliminato');
    };
  }, []);
  
  return {
    webSocketService,
    isConnected: webSocketService.isConnected(),
    notificationService
  };
};

export default useMagazzinoNotifications;