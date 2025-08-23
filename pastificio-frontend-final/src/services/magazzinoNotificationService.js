// pastificio-frontend/src/services/magazzinoNotificationService.js
import { io } from 'socket.io-client';
import notificationService from './notificationService';

class MagazzinoNotificationService {
  constructor() {
    this.socket = null;
    this.isInitialized = false;
  }

  init(userId) {
    if (this.isInitialized) return;
    
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    this.socket = io(`${API_URL}/magazzino`, {
      auth: {
        token: localStorage.getItem('token'),
        userId: userId
      }
    });
    
    this.socket.on('scorte-basse', (data) => {
      notificationService.showNotification({
        title: 'Scorte Basse',
        message: `${data.prodotto} è sotto la scorta minima (${data.scorteAttuali}/${data.scorteMinime})`,
        type: 'warning',
        action: {
          label: 'Genera Ordine',
          callback: () => window.location.href = '/magazzino/ordini'
        }
      });
    });

    this.socket.on('ordine-in-consegna', (data) => {
      notificationService.showNotification({
        title: 'Ordine in Consegna',
        message: `L'ordine ${data.numeroOrdine} è in consegna`,
        type: 'info'
      });
    });

    this.socket.on('scadenza-prossima', (data) => {
      notificationService.showNotification({
        title: 'Prodotto in Scadenza',
        message: `${data.prodotto} scade tra ${data.giorniAllaScadenza} giorni`,
        type: 'warning'
      });
    });

    this.isInitialized = true;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isInitialized = false;
    }
  }
}

export default new MagazzinoNotificationService();