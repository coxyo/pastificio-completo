import logger from '../config/logger.js';
class WhatsAppService {
  isReady() { return true; }
  async inviaMessaggio(n, m) {
    logger.info(`Mock message to ${n}: ${m}`);
    return { success: true, messageId: 'mock-' + Date.now() };
  }
  async inviaMessaggioConTemplate(n, t, v) { 
    return this.inviaMessaggio(n, 'Mock'); 
  }
  getStatus() { return { connected: true, status: 'active' }; }
  getInfo() { return { connected: true }; }
  async initialize() { return true; }
  disconnect() {}
  restart() { return Promise.resolve(true); }
}
export default new WhatsAppService();
