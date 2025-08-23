// monitoring/monitor.js
import { Metrics } from '@opentelemetry/metrics';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { AlertManager } from './alertManager.js';
import { DashboardServer } from './dashboard.js';

class SystemMonitor {
  constructor() {
    this.metrics = new Metrics();
    this.exporter = new PrometheusExporter();
    this.alertManager = new AlertManager();
    this.dashboard = new DashboardServer();
    
    // Metriche chiave
    this.connections = this.metrics.createCounter('websocket_connections');
    this.messageLatency = this.metrics.createHistogram('message_latency_ms');
    this.errorRate = this.metrics.createCounter('error_rate');
    this.memoryUsage = this.metrics.createGauge('memory_usage_mb');
    this.cpuUsage = this.metrics.createGauge('cpu_usage_percent');
    
    this.setupAlerts();
    this.startCollection();
  }

  setupAlerts() {
    // Alert per latenza alta
    this.alertManager.addRule({
      metric: 'message_latency_ms',
      threshold: 1000,
      duration: '5m',
      severity: 'warning',
      message: 'High message latency detected'
    });

    // Alert per errori
    this.alertManager.addRule({
      metric: 'error_rate',
      threshold: 0.01,
      duration: '1m',
      severity: 'critical',
      message: 'High error rate detected'
    });

    // Alert per memoria
    this.alertManager.addRule({
      metric: 'memory_usage_mb',
      threshold: 2048,
      duration: '5m',
      severity: 'warning',
      message: 'High memory usage'
    });
  }

  startCollection() {
    // Collezione metriche ogni 10 secondi
    setInterval(() => {
      this.collectMetrics();
    }, 10000);

    // Healthcheck ogni minuto
    setInterval(() => {
      this.performHealthcheck();
    }, 60000);
  }

  async collectMetrics() {
    try {
      const metrics = await this.gatherSystemMetrics();
      this.updateMetrics(metrics);
      this.dashboard.updateMetrics(metrics);
      await this.exporter.export(metrics);
    } catch (error) {
      this.alertManager.sendAlert({
        severity: 'critical',
        message: 'Metrics collection failed',
        error
      });
    }
  }

  async performHealthcheck() {
    const checks = {
      websocket: await this.checkWebsocket(),
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
      api: await this.checkAPI()
    };

    this.dashboard.updateHealth(checks);

    if (Object.values(checks).some(check => !check.healthy)) {
      this.alertManager.sendAlert({
        severity: 'critical',
        message: 'System healthcheck failed',
        checks
      });
    }
  }
}

// monitoring/alertManager.js
class AlertManager {
  constructor() {
    this.rules = new Map();
    this.channels = {
      email: new EmailNotifier(),
      slack: new SlackNotifier(),
      pagerduty: new PagerDutyNotifier()
    };
  }

  addRule(rule) {
    this.rules.set(rule.metric, rule);
  }

  async sendAlert(alert) {
    // Notifica tutti i canali configurati
    await Promise.all(
      Object.values(this.channels).map(channel =>
        channel.notify(alert)
      )
    );
  }
}

// monitoring/dashboard/server.js
class DashboardServer {
  constructor() {
    this.app = express();
    this.setupRoutes();
    this.setupWebSocket();
  }

  setupRoutes() {
    this.app.get('/metrics', async (req, res) => {
      const metrics = await this.getMetrics();
      res.json(metrics);
    });

    this.app.get('/health', async (req, res) => {
      const health = await this.getHealth();
      res.json(health);
    });

    this.app.get('/alerts', async (req, res) => {
      const alerts = await this.getAlerts();
      res.json(alerts);
    });
  }

  setupWebSocket() {
    this.io = new Server(this.app);
    this.io.on('connection', (socket) => {
      socket.on('subscribe', (metrics) => {
        metrics.forEach(metric => {
          socket.join(`metric:${metric}`);
        });
      });
    });
  }

  updateMetrics(metrics) {
    Object.entries(metrics).forEach(([metric, value]) => {
      this.io.to(`metric:${metric}`).emit('metric-update', {
        metric,
        value,
        timestamp: Date.now()
      });
    });
  }
}

export default new SystemMonitor();