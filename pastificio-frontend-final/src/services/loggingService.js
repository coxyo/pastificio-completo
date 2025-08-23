// services/loggingService.js
class LoggingService {
  constructor() {
    this.logs = [];
  }

  info(message, data = {}) {
    this.log('INFO', message, data);
  }

  error(message, data = {}) {
    this.log('ERROR', message, data);
    console.error(message, data);
  }

  warning(message, data = {}) {
    this.log('WARNING', message, data);
    console.warn(message, data);
  }

  debug(message, data = {}) {
    this.log('DEBUG', message, data);
    console.debug(message, data);
  }

  log(level, message, data = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      url: window.location.pathname,
      userAgent: navigator.userAgent
    };

    // Salva in memoria
    this.logs.push(logEntry);

    // Salva in localStorage (mantieni solo gli ultimi 100 log)
    try {
      const storedLogs = JSON.parse(localStorage.getItem('systemLogs') || '[]');
      storedLogs.push(logEntry);
      if (storedLogs.length > 100) {
        storedLogs.shift();
      }
      localStorage.setItem('systemLogs', JSON.stringify(storedLogs));
    } catch (error) {
      console.error('Errore nel salvare i log:', error);
    }

    // Log in console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${level}] ${message}`, data);
    }
  }

  getLogs(filters = {}) {
    try {
      const logs = JSON.parse(localStorage.getItem('systemLogs') || '[]');
      
      return logs.filter(log => {
        if (filters.level && log.level !== filters.level) return false;
        if (filters.startDate && new Date(log.timestamp) < new Date(filters.startDate)) return false;
        if (filters.endDate && new Date(log.timestamp) > new Date(filters.endDate)) return false;
        if (filters.search && !log.message.toLowerCase().includes(filters.search.toLowerCase())) return false;
        return true;
      });
    } catch (error) {
      console.error('Errore nel recuperare i log:', error);
      return [];
    }
  }

  clearLogs() {
    this.logs = [];
    localStorage.removeItem('systemLogs');
  }

  exportLogs() {
    const logs = this.getLogs();
    const dataStr = JSON.stringify(logs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `system-logs-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }
}

// IMPORTANTE: Esporta come named export
export const loggingService = new LoggingService();