// services/notificationService.js
class NotificationService {
  constructor() {
    this.permission = 'default';
    this.checkPermission();
  }

  checkPermission() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      console.log('Questo browser non supporta le notifiche desktop');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Errore nella richiesta del permesso:', error);
      return false;
    }
  }

  showNotification(title, options = {}) {
    if (this.permission !== 'granted') {
      console.log('Permesso notifiche non concesso');
      return false;
    }

    try {
      const notification = new Notification(title, {
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        ...options
      });

      notification.onclick = function(event) {
        event.preventDefault();
        window.focus();
        notification.close();
      };

      setTimeout(() => notification.close(), 5000);
      return true;
    } catch (error) {
      console.error('Errore nella creazione della notifica:', error);
      return false;
    }
  }

  testNotification() {
    return this.showNotification('Test Notifica', {
      body: 'Le notifiche sono attive! 🎉',
      tag: 'test-notification'
    });
  }

  nuovoOrdine(ordine) {
    return this.showNotification('Nuovo Ordine', {
      body: `Ordine da ${ordine.nomeCliente} - €${ordine.totale}`,
      tag: 'nuovo-ordine',
      requireInteraction: true
    });
  }

  ordineCompletato(ordine) {
    return this.showNotification('Ordine Completato', {
      body: `L'ordine di ${ordine.nomeCliente} è pronto per il ritiro`,
      tag: 'ordine-completato'
    });
  }

  scorteInEsaurimento(prodotto) {
    return this.showNotification('⚠️ Scorte in Esaurimento', {
      body: `${prodotto.nome} sta per terminare (${prodotto.quantita} rimanenti)`,
      tag: 'scorte-basse',
      requireInteraction: true
    });
  }

  // ✅ METODI MANCANTI AGGIUNTI
  notifyLowStock(prodotto) {
    const { nome, quantitaAttuale, unitaMisura, scortaMinima } = prodotto;
    return this.showNotification('🔔 Scorta Bassa', {
      body: `${nome}: ${quantitaAttuale} ${unitaMisura} (minimo: ${scortaMinima})`,
      tag: 'low-stock',
      requireInteraction: true
    });
  }

  notifyStockMovement(movimento) {
    const { tipo, prodotto, quantita, unitaMisura } = movimento;
    const emoji = tipo === 'carico' ? '📥' : '📤';
    const azione = tipo === 'carico' ? 'Carico' : 'Scarico';
    
    return this.showNotification(`${emoji} ${azione} Magazzino`, {
      body: `${prodotto}: ${quantita} ${unitaMisura}`,
      tag: 'stock-movement'
    });
  }

  notifyExpiringProducts(prodotti) {
    if (!Array.isArray(prodotti) || prodotti.length === 0) return false;
    
    const count = prodotti.length;
    const firstProduct = prodotti[0];
    
    return this.showNotification('⏰ Prodotti in Scadenza', {
      body: count === 1 
        ? `${firstProduct.nome} scade il ${new Date(firstProduct.dataScadenza).toLocaleDateString()}`
        : `${count} prodotti stanno per scadere`,
      tag: 'expiring-products',
      requireInteraction: true
    });
  }

  notifySuccess(message) {
    return this.showNotification('✅ Successo', {
      body: message,
      tag: 'success'
    });
  }

  notifyWarning(message) {
    return this.showNotification('⚠️ Attenzione', {
      body: message,
      tag: 'warning'
    });
  }

  notifyError(message) {
    return this.showNotification('❌ Errore', {
      body: message,
      tag: 'error',
      requireInteraction: true
    });
  }
}

const notificationService = new NotificationService();
export default notificationService;