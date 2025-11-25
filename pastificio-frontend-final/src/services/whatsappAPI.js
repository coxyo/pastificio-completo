// services/whatsappAPI.js
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app';

class WhatsAppAPI {
  async getStatus() {
    try {
      const response = await fetch(`${API_URL}/api/whatsapp/status`);
      return await response.json();
    } catch (error) {
      console.error('Errore recupero stato WhatsApp:', error);
      return { connected: false, status: 'error' };
    }
  }

  async getQRCode() {
    try {
      const response = await fetch(`${API_URL}/api/whatsapp/qr`);
      return await response.json();
    } catch (error) {
      console.error('Errore recupero QR:', error);
      return { qrCode: null, needsScan: false };
    }
  }

  async inviaMessaggio(numero, messaggio) {
    try {
      const response = await fetch(`${API_URL}/api/whatsapp/invia-messaggio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ numero, messaggio })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        return { success: true, ...result };
      } else {
        throw new Error(result.error || 'Errore invio messaggio');
      }
    } catch (error) {
      console.error('Errore invio messaggio:', error);
      return { 
        success: false, 
        error: error.message,
        fallback: true // Indica di usare il metodo manuale
      };
    }
  }

  async inviaConfermaOrdine(ordine) {
    try {
      const response = await fetch(`${API_URL}/api/whatsapp/invia-conferma-ordine`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ ordine })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        return { success: true, ...result };
      } else {
        throw new Error(result.error || 'Errore invio conferma');
      }
    } catch (error) {
      console.error('Errore invio conferma ordine:', error);
      return { 
        success: false, 
        error: error.message,
        fallback: true
      };
    }
  }

  async inviaOrdineProno(ordineId, datiOrdine) {
    try {
      const response = await fetch(`${API_URL}/api/whatsapp/invia-ordine-pronto/${ordineId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(datiOrdine)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        return { success: true, ...result };
      } else {
        throw new Error(result.error || 'Errore invio notifica');
      }
    } catch (error) {
      console.error('Errore invio ordine pronto:', error);
      return { 
        success: false, 
        error: error.message,
        fallback: true
      };
    }
  }

  async inviaPromemoria(ordineId, datiOrdine) {
    try {
      const response = await fetch(`${API_URL}/api/whatsapp/invia-promemoria/${ordineId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(datiOrdine)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        return { success: true, ...result };
      } else {
        throw new Error(result.error || 'Errore invio promemoria');
      }
    } catch (error) {
      console.error('Errore invio promemoria:', error);
      return { 
        success: false, 
        error: error.message,
        fallback: true
      };
    }
  }

  async restart() {
    try {
      const response = await fetch(`${API_URL}/api/whatsapp/restart`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      return await response.json();
    } catch (error) {
      console.error('Errore riavvio WhatsApp:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new WhatsAppAPI();
