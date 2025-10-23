// pastificio-backend/services/cx3Service.js
import axios from 'axios';
import crypto from 'crypto';
import logger from '../config/logger.js';

class Cx3Service {
  constructor() {
    this.baseURL = process.env.CX3_URL;
    this.extension = process.env.CX3_EXTENSION;
    this.apiKey = process.env.CX3_API_KEY;
    this.adminUser = process.env.CX3_ADMIN_USER;
    this.adminPassword = process.env.CX3_ADMIN_PASSWORD;
    
    // Client axios configurato
    this.client = axios.create({
      baseURL: `${this.baseURL}/api/v1`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      timeout: 10000
    });
    
    // Interceptor per logging
    this.client.interceptors.response.use(
      response => {
        logger.info('3CX API Success', { 
          endpoint: response.config.url, 
          status: response.status 
        });
        return response;
      },
      error => {
        logger.error('3CX API Error', { 
          endpoint: error.config?.url, 
          error: error.message,
          status: error.response?.status 
        });
        throw error;
      }
    );
  }
  
  /**
   * 🔵 CLICK-TO-CALL: Inizia chiamata verso numero cliente
   */
  async makeCall(numeroDestinazione, clienteId = null, clienteNome = null) {
    try {
      logger.info('3CX: Iniziando click-to-call', { 
        numeroDestinazione, 
        clienteId, 
        clienteNome 
      });
      
      // Rimuovi spazi e caratteri speciali dal numero
      const numeroPulito = numeroDestinazione.replace(/\s+/g, '').replace(/[^\d+]/g, '');
      
      const payload = {
        destination: numeroPulito,
        extension: this.extension,
        callerId: clienteNome || 'Pastificio Nonna Claudia',
        timeout: 30 // secondi
      };
      
      const response = await this.client.post('/calls/make', payload);
      
      logger.info('3CX: Chiamata iniziata con successo', { 
        callId: response.data.callId,
        numeroDestinazione: numeroPulito
      });
      
      return {
        success: true,
        callId: response.data.callId,
        message: `Chiamata avviata verso ${numeroDestinazione}`,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      logger.error('3CX: Errore click-to-call', { 
        error: error.message,
        numeroDestinazione 
      });
      
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: 'Errore durante l\'avvio della chiamata'
      };
    }
  }
  
  /**
   * 🔵 STATO INTERNO: Verifica se l'interno è disponibile
   */
  async getExtensionStatus(extension = null) {
    try {
      const ext = extension || this.extension;
      
      const response = await this.client.get(`/extensions/${ext}/status`);
      
      return {
        success: true,
        extension: ext,
        status: response.data.status, // 'available', 'busy', 'ringing', 'offline'
        registered: response.data.registered,
        devices: response.data.devices || [],
        currentCall: response.data.currentCall || null
      };
      
    } catch (error) {
      logger.error('3CX: Errore stato interno', { error: error.message });
      
      return {
        success: false,
        error: error.message,
        status: 'unknown'
      };
    }
  }
  
  /**
   * 🔵 STORICO CHIAMATE: Ottieni ultime chiamate per interno
   */
  async getCallHistory(limit = 50, startDate = null, endDate = null) {
    try {
      const params = {
        extension: this.extension,
        limit,
        ...(startDate && { startDate: startDate.toISOString() }),
        ...(endDate && { endDate: endDate.toISOString() })
      };
      
      const response = await this.client.get('/calls/history', { params });
      
      return {
        success: true,
        calls: response.data.calls.map(call => ({
          id: call.id,
          direction: call.direction, // 'inbound', 'outbound'
          number: call.direction === 'inbound' ? call.callerNumber : call.destinationNumber,
          duration: call.duration,
          status: call.status, // 'answered', 'missed', 'busy'
          timestamp: new Date(call.startTime),
          recordingUrl: call.recordingUrl || null
        })),
        total: response.data.total
      };
      
    } catch (error) {
      logger.error('3CX: Errore storico chiamate', { error: error.message });
      
      return {
        success: false,
        error: error.message,
        calls: []
      };
    }
  }
  
  /**
   * 🔵 TERMINA CHIAMATA: Riaggancia chiamata attiva
   */
  async hangupCall(callId) {
    try {
      await this.client.post(`/calls/${callId}/hangup`);
      
      logger.info('3CX: Chiamata terminata', { callId });
      
      return {
        success: true,
        message: 'Chiamata terminata correttamente'
      };
      
    } catch (error) {
      logger.error('3CX: Errore terminazione chiamata', { 
        callId, 
        error: error.message 
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * 🔵 METTI IN ATTESA: Pausa chiamata
   */
  async holdCall(callId) {
    try {
      await this.client.post(`/calls/${callId}/hold`);
      
      return {
        success: true,
        message: 'Chiamata in attesa'
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * 🔵 RIPRENDI CHIAMATA: Riprendi chiamata in attesa
   */
  async unholdCall(callId) {
    try {
      await this.client.post(`/calls/${callId}/unhold`);
      
      return {
        success: true,
        message: 'Chiamata ripresa'
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * 🔵 TRASFERISCI CHIAMATA: Trasferimento a interno/numero
   */
  async transferCall(callId, destination) {
    try {
      const payload = {
        destination: destination.toString()
      };
      
      await this.client.post(`/calls/${callId}/transfer`, payload);
      
      return {
        success: true,
        message: `Chiamata trasferita a ${destination}`
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * 🔵 VERIFICA WEBHOOK SIGNATURE: Valida autenticità webhook
   */
  verifyWebhookSignature(payload, signature) {
    const secret = process.env.CX3_WEBHOOK_SECRET;
    
    const hash = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    return hash === signature;
  }
  
  /**
   * 🔵 HEALTH CHECK: Verifica connessione 3CX
   * ⭐ MIGLIORATO: Funziona anche senza 3CX configurato
   */
  async healthCheck() {
    try {
      // Verifica configurazione
      const isConfigured = !!(this.baseURL && this.extension && this.apiKey);
      
      if (!isConfigured) {
        return {
          success: false,
          status: 'not-configured',
          message: 'Servizio 3CX non configurato (variabili ambiente mancanti)',
          config: {
            baseURL: !!this.baseURL,
            extension: !!this.extension,
            apiKey: !!this.apiKey
          }
        };
      }
      
      // Prova connessione reale (con timeout breve)
      try {
        const response = await this.client.get('/system/status', { timeout: 3000 });
        
        return {
          success: true,
          status: 'connected',
          message: '3CX connesso e operativo',
          version: response.data.version || 'unknown',
          uptime: response.data.uptime || 0,
          config: {
            baseURL: this.baseURL,
            extension: this.extension
          }
        };
      } catch (connectionError) {
        // 3CX non raggiungibile ma servizio configurato
        return {
          success: true,
          status: 'configured-but-offline',
          message: '3CX configurato ma server non raggiungibile',
          config: {
            baseURL: this.baseURL,
            extension: this.extension
          },
          lastError: connectionError.message
        };
      }
      
    } catch (error) {
      logger.error('3CX: Errore health check', { error: error.message });
      
      return {
        success: false,
        status: 'error',
        message: 'Errore durante health check',
        error: error.message
      };
    }
  }
}

// Export singleton instance
const cx3Service = new Cx3Service();
export default cx3Service;
