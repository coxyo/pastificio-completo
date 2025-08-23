// utils/monitoraggio.js
import { logger } from '../config/logger.js';

class NotificationMonitoring {
  constructor() {
    this.metrics = {
      connectionsTotal: 0,
      connectionsActive: 0,
      notificationsSent: 0,
      notificationsBuffered: 0,
      errors: 0,
      latency: []
    };

    this.startTime = Date.now();
    this.lastReset = Date.now();
  }

  trackConnection() {
    this.metrics.connectionsTotal++;
    this.metrics.connectionsActive++;
  }

  trackDisconnection() {
    this.metrics.connectionsActive--;
  }

  trackNotification(type) {
    this.metrics.notificationsSent++;
  }

  trackBuffered() {
    this.metrics.notificationsBuffered++;
  }

  trackError() {
    this.metrics.errors++;
  }

  trackLatency(ms) {
    this.metrics.latency.push(ms);
    if (this.metrics.latency.length > 1000) {
      this.metrics.latency.shift();
    }
  }

  getStats() {
    const uptime = Date.now() - this.startTime;
    const avgLatency = this.metrics.latency.length > 0
      ? this.metrics.latency.reduce((a, b) => a + b) / this.metrics.latency.length
      : 0;

    return {
      ...this.metrics,
      uptime,
      avgLatency,
      timestamp: new Date().toISOString()
    };
  }

  resetStats() {
    this.metrics = {
      connectionsTotal: 0,
      connectionsActive: 0,
      notificationsSent: 0,
      notificationsBuffered: 0,
      errors: 0,
      latency: []
    };
    this.lastReset = Date.now();
  }
}

export const monitoraggio = new NotificationMonitoring();