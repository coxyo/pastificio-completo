// src/services/loggingService.js

class LoggingServiceClass {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000;
    this.isEnabled = true;
  }

  log(type, message, data = {}) {
    if (!this.isEnabled) return;

    const logEntry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      type,
      message,
      data,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
      url: typeof window !== 'undefined' ? window.location.href : 'Server'
    };

    // Aggiungi al buffer locale
    this.logs.unshift(logEntry);
    
    // Mantieni solo gli ultimi N log
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Log in console per debug
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${type.toUpperCase()}] ${message}`, data);
    }

    // Salva in localStorage se disponibile
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const storedLogs = JSON.parse(localStorage.getItem('app_logs') || '[]');
        storedLogs.unshift(logEntry);
        const trimmedLogs = storedLogs.slice(0, 100); // Mantieni solo 100 log in localStorage
        localStorage.setItem('app_logs', JSON.stringify(trimmedLogs));
      } catch (e) {
        console.error('Errore salvataggio log:', e);
      }
    }

    // Invia al server se critico
    if (type === 'error' || type === 'critical') {
      this.sendToServer(logEntry);
    }
  }

  async sendToServer(logEntry) {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app';
      
      await fetch(`${apiUrl}/api/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`
        },
        body: JSON.stringify(logEntry)
      });
    } catch (error) {
      console.error('Impossibile inviare log al server:', error);
    }
  }

  // Metodi di convenienza
  info(message, data) {
    this.log('info', message, data);
  }

  warn(message, data) {
    this.log('warning', message, data);
  }

  error(message, data) {
    this.log('error', message, data);
  }

  debug(message, data) {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, data);
    }
  }

  success(message, data) {
    this.log('success', message, data);
  }

  // Recupera i log
  getLogs(type = null, limit = 50) {
    let logs = this.logs;
    
    if (type) {
      logs = logs.filter(log => log.type === type);
    }
    
    return logs.slice(0, limit);
  }

  // Pulisci i log
  clearLogs() {
    this.logs = [];
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('app_logs');
    }
  }

  // Esporta i log
  exportLogs() {
    const logs = this.getLogs(null, this.maxLogs);
    const dataStr = JSON.stringify(logs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `logs-${new Date().toISOString().split('T')[0]}.json`;
    
    if (typeof window !== 'undefined') {
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
    
    return dataStr;
  }

  // Abilita/disabilita logging
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }

  // Ottieni statistiche sui log
  getStats() {
    const stats = {
      total: this.logs.length,
      byType: {},
      recentErrors: []
    };

    this.logs.forEach(log => {
      if (!stats.byType[log.type]) {
        stats.byType[log.type] = 0;
      }
      stats.byType[log.type]++;
      
      if (log.type === 'error' && stats.recentErrors.length < 5) {
        stats.recentErrors.push({
          message: log.message,
          timestamp: log.timestamp
        });
      }
    });

    return stats;
  }
}

// Crea un'istanza singleton
const LoggingService = new LoggingServiceClass();

// Export sia come default che come named export per compatibilità
export { LoggingService };
export default LoggingService;
