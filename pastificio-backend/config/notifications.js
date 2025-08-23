// config/notifications.js
export default {
  email: {
    templates: {
      lowStock: {
        subject: 'Avviso Scorte Basse - {{prodotto}}',
        priority: 'alta'
      },
      expiring: {
        subject: 'Prodotti in Scadenza - Azione Richiesta',
        priority: 'alta'
      },
      dailyReport: {
        subject: 'Report Giornaliero Magazzino - {{data}}',
        priority: 'bassa'
      },
      orderConfirm: {
        subject: 'Nuovo Ordine #{{ordineId}}',
        priority: 'media'
      }
    }
  },
  sms: {
    maxLength: 160,
    onlyHighPriority: true,
    templates: {
      lowStock: '⚠️ SCORTE: {{prodotto}} - Solo {{quantita}} {{unita}} rimanenti',
      critical: '🚨 URGENTE: {{messaggio}}'
    }
  },
  priorities: {
    bassa: { email: true, sms: false, color: '#4caf50' },
    media: { email: true, sms: false, color: '#2196f3' },
    alta: { email: true, sms: true, color: '#ff9800' },
    critica: { email: true, sms: true, color: '#f44336' }
  }
};