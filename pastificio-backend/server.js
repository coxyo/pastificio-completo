// server.js - ✅ VERSIONE COMPLETA CON ROUTE LIMITI
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import compression from 'compression';
import fileUpload from 'express-fileupload';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import fs from 'fs';
import cron from 'node-cron';
import usersRoutes from './routes/users.js';

// Import routes
import authRoutes from './routes/auth.js';
import ordiniRoutes from './routes/ordini.js';
import limitiRoutes from './routes/limiti.js'; // ✅ NUOVO
import dashboardRoutes from './routes/dashboard.js';
import backupRoutes from './routes/backup.js';
import magazzinoRoutes from './routes/magazzino.js';
import ingredientiRoutes from './routes/ingredienti.js';
import fornitoriRoutes from './routes/fornitori.js';
import reportRoutes from './routes/report.js';
import notificheRoutes from './routes/notifiche.js';
import exportRoutes from './routes/export.js';
import statisticsRoutes from './routes/statistics.js';
import clientiRoutes from './routes/clienti.js';
import comunicazioniRoutes from './routes/comunicazioni.js';
import whatsappRoutes from './routes/whatsapp.js';
import whatsappDashboardRoutes from './routes/whatsapp-dashboard.js'; // ✅ AGGIUNGI
import whatsappPublicRoutes from './routes/whatsapp-public.js';
import templateRoutes from './routes/templates.js';
import testRoutes from './routes/test.js';
import adminRoutes from './routes/admin.js';
import prodottiRoutes from './routes/prodotti.js';
import cx3Routes from './routes/cx3.js';
import webhookRoutes from './routes/webhook.js'; // ✅ WEBHOOK 3CX
import chiamateRoutes from './routes/chiamate.js'; // ✅ NUOVO - Gestione chiamate e tag
import statisticheRoutes from './routes/statistiche.js'; // ✅ NUOVO - Statistiche chiamate (incluso /api/statistiche/chiamate)
import pusherRoutes from './routes/pusher.js';
import fixPrezziRoutes from './routes/fix-prezzi-routes.js';
import corrispettiviRoutes from './routes/corrispettivi.js';
import emailRoutes from './routes/email.js';
import haccpRoutes from './routes/haccp.js';
import emailCorrispettiviRoutes from './routes/emailCorrispettivi.routes.js'; // ✅ NUOVO - Email corrispettivi

// Import Danea Monitor


// Import middleware
import { protect } from './middleware/auth.js';

// Import logger
import logger from './config/logger.js';

// Import models per i cron jobs
import Movimento from './models/Movimento.js';
import Ordine from './models/Ordine.js';

// Import services
import pdfService from './services/pdfService.js';
import notificationService from './services/NotificationService.js';
import exportService from './services/exportService.js';
import googleDriveService from './services/googleDriveService.js';
import backupService from './services/backupService.js';
import * as whatsappService from './services/whatsappService.js';
import schedulerService from './services/schedulerService.js';
import schedulerWhatsApp from './services/schedulerWhatsApp.js';
import pusherService from './services/pusherService.js'; // ✅ PUSHER
import schedulerEmail from './services/schedulerEmail.js';
import schedulerCorrespettivi from './services/schedulerCorrespettivi.js';
import schedulerHACCP from './services/schedulerHACCP.js';
import cronJobsEmail from './services/cronJobsEmail.js'; // ✅ NUOVO - Cron jobs email
import pdfCorrispettiviService from './services/pdfCorrispettivi.js'; // ✅ NUOVO - PDF corrispettivi
import importFattureRoutes from './routes/importFatture.js';
import rintracciabilitaRoutes from './routes/rintracciabilita.js'; 
import sessionsRoutes from './routes/sessions.js';
// ✅ NUOVO - Rintracciabilità ingredienti



// Configurazione path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carica variabili ambiente
dotenv.config();

// Configura Mongoose
mongoose.set('strictQuery', false);

// Crea app Express
const app = express();
const server = createServer(app);

// Configura Socket.IO con CORS sicuro
const io = new Server(server, {
  cors: {
    origin: function(origin, callback) {
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://pastificio-frontend-final.vercel.app',
        'https://pastificio-nonna-claudia.vercel.app',
        process.env.FRONTEND_URL
      ].filter(Boolean);
      
      // IMPORTANTE: Permetti SEMPRE le richieste senza origin per Render
      if (!origin) return callback(null, true);
      
      // Permetti tutti i domini Vercel per preview deployments
      if (origin.includes('.vercel.app')) {
        return callback(null, true);
      }
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        // NON BLOCCARE, solo loggare
        logger.warn('WebSocket request from unknown origin:', origin);
        callback(null, true); // PERMETTI COMUNQUE per debug
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["*"],
    transports: ['polling', 'websocket'] // IMPORTANTE: polling prima per Render
  },
  // Configurazioni aggiuntive per Render.com
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['polling', 'websocket'], // Supporta entrambi
  allowEIO3: true
});

// Rendi io disponibile globalmente
global.io = io;

// ✅ CORS Middleware - FIX COMPLETO
// ✅ CORS Middleware - CONFIGURAZIONE UNICA CON 3CX
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://pastificio-frontend-final.vercel.app',
      'https://pastificio-nonna-claudia.vercel.app',
      'https://1655.3cx.cloud', // ✅ AGGIUNTO PER 3CX!
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    // Permetti richieste senza origin (es. Postman, app mobile, server-to-server, extension)
    if (!origin) {
      return callback(null, true);
    }
    
    // Permetti tutti i domini Vercel per preview deployments
    if (origin.includes('.vercel.app')) {
      return callback(null, true);
    }
    
    // Permetti domini 3CX
    if (origin.includes('3cx.cloud')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked origin:', origin);
      callback(null, true); // Permetti comunque per debug
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-KEY', 'X-Extension-Version', 'x-corrispettivi-password'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // Cache preflight per 24 ore
};

// Applica CORS
app.use(cors(corsOptions));

// Gestione OPTIONS per preflight
app.options('*', cors(corsOptions));

// Middleware parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(compression());
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

// Rendi io disponibile nell'app
app.set('io', io);
app.locals.io = io;

// ═══════════════════════════════════════════════════════════════════════════
// 📊 MONITORING: Tracciamento tempi risposta API
// ═══════════════════════════════════════════════════════════════════════════
const apiMetrics = {
  totalRequests: 0,
  totalTime: 0,
  slowRequests: 0,    // > 1s
  errorRequests: 0,   // > 3s
  startTime: Date.now(),
  last24h: [],        // Array circolare ultimi tempi
  getAvgResponseTime() {
    if (this.last24h.length === 0) return 0;
    const sum = this.last24h.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.last24h.length);
  },
  addTiming(ms) {
    this.totalRequests++;
    this.totalTime += ms;
    this.last24h.push(ms);
    // Mantieni solo ultimi 10.000 record (~24h di attività)
    if (this.last24h.length > 10000) {
      this.last24h.shift();
    }
    if (ms > 1000) this.slowRequests++;
    if (ms > 3000) this.errorRequests++;
  }
};

// Inizializza servizio notifiche con socket.io
notificationService.setSocketIO(io);

// Directory statiche
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/exports', express.static(path.join(__dirname, 'exports')));
app.use('/sounds', express.static(path.join(__dirname, 'sounds')));

// Crea directory se non esistono
const dirs = [
  'uploads', 
  'exports', 
  'backups', 
  'logs',
  'temp',           
  'assets',
  'assets/fonts',   
  'assets/images',  
  'templates',      
  'sounds',         
  'services',
  '.wwebjs_auth'   // Per WhatsApp Web
];

dirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    logger.info(`Directory creata: ${dirPath}`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ⏱️ MIDDLEWARE TIMING: Logga tempo risposta + warning se lento
// ═══════════════════════════════════════════════════════════════════════════
app.use((req, res, next) => {
  const start = Date.now();
  
  // Intercetta la fine della risposta
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Traccia metriche solo per API (escludi health/static)
    if (req.path.startsWith('/api/') && !req.path.includes('/health')) {
      apiMetrics.addTiming(duration);
    }
    
    // Log in base alla durata
    if (duration > 3000) {
      logger.error(`🐌 API LENTA (${duration}ms): ${req.method} ${req.path}`, {
        duration,
        statusCode: res.statusCode,
        ip: req.ip,
        query: Object.keys(req.query).length > 0 ? req.query : undefined
      });
    } else if (duration > 1000) {
      logger.warn(`⚠️ API lenta (${duration}ms): ${req.method} ${req.path}`, {
        duration,
        statusCode: res.statusCode
      });
    } else if (process.env.NODE_ENV === 'development' || res.statusCode >= 400) {
      logger.info(`${req.method} ${req.path} (${duration}ms)`, {
        duration,
        statusCode: res.statusCode,
        ip: req.ip,
        userAgent: req.get('user-agent')?.substring(0, 50)
      });
    }
  });
  
  next();
});

// Health check endpoint - DEVE ESSERE PUBBLICO E VELOCE
app.get('/health', (req, res) => {
  const uptimeSeconds = process.uptime();
  const giorni = Math.floor(uptimeSeconds / 86400);
  const ore = Math.floor((uptimeSeconds % 86400) / 3600);
  const minuti = Math.floor((uptimeSeconds % 3600) / 60);
  
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: `${giorni}g ${ore}h ${minuti}m`,
    uptimeSeconds: Math.floor(uptimeSeconds),
    server: 'Pastificio Backend',
    version: '3.1.0',
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'connesso' : 'disconnesso',
    metriche: {
      richiesteAPI: apiMetrics.totalRequests,
      tempoMedioMs: apiMetrics.getAvgResponseTime(),
      richiesteLente: apiMetrics.slowRequests,
      richiesteErrore: apiMetrics.errorRequests,
      campioni: apiMetrics.last24h.length
    }
  });
});

// Root endpoint per wake up
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Pastificio Backend</title>
      <style>
        body { font-family: Arial; padding: 40px; background: #f0f0f0; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
        h1 { color: #333; }
        .status { color: green; font-weight: bold; }
        .info { margin: 20px 0; padding: 15px; background: #f9f9f9; border-left: 4px solid #4CAF50; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🍝 Pastificio Nonna Claudia Backend</h1>
        <p class="status">✅ Server Online e Operativo</p>
        <div class="info">
          <p><strong>Uptime:</strong> ${Math.floor(process.uptime() / 60)} minuti</p>
          <p><strong>Avviato:</strong> ${new Date(Date.now() - process.uptime() * 1000).toLocaleString()}</p>
          <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
        </div>
        <p>API Endpoint: <code>/api/*</code></p>
        <p>Health Check: <code>/health</code></p>
      </div>
    </body>
    </html>
  `);
});

// Routes API esistenti
app.get('/api/health', async (req, res) => {
  // Ultimo ordine inserito
  let ultimoOrdine = null;
  let ordiniOggi = 0;
  try {
    const ultimo = await Ordine.findOne().sort({ createdAt: -1 }).select('createdAt').lean();
    if (ultimo) {
      const diffMs = Date.now() - new Date(ultimo.createdAt).getTime();
      const diffMin = Math.floor(diffMs / 60000);
      ultimoOrdine = diffMin < 60 ? `${diffMin} minuti fa` : `${Math.floor(diffMin / 60)} ore fa`;
    }
    
    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);
    ordiniOggi = await Ordine.countDocuments({ createdAt: { $gte: oggi } });
  } catch (e) {
    // Non bloccare health check per errori DB
  }
  
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime() / 86400)}g ${Math.floor((process.uptime() % 86400) / 3600)}h`,
    database: mongoose.connection.readyState === 1 ? 'connesso' : 'disconnesso',
    whatsapp: whatsappService.isReady() ? 'connected' : 'disconnected',
    schedulerWhatsApp: schedulerWhatsApp && schedulerWhatsApp.jobs ? schedulerWhatsApp.jobs.size : 0,
    ultimoOrdine,
    ordiniOggi,
    tempoMedioAPI: `${apiMetrics.getAvgResponseTime()}ms`,
    erroriUltime24h: apiMetrics.errorRequests
  });
});

// Auth routes - NON PROTETTE
app.use('/api/auth', authRoutes);
app.use('/api/whatsapp-public', whatsappPublicRoutes);


// Routes pubbliche per test (TEMPORANEO - aggiungere protect in produzione)
app.use('/api/ordini', ordiniRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/clienti', clientiRoutes);
app.use('/api/limiti', limitiRoutes); // ✅ NUOVO

// Routes protette
app.use('/api/webhook', webhookRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/magazzino', magazzinoRoutes);
app.use('/api/magazzino/ingredienti', ingredientiRoutes);
app.use('/api/fornitori', protect, fornitoriRoutes);
app.use('/api/report', protect, reportRoutes);
app.use('/api/notifiche', protect, notificheRoutes);
app.use('/api/export', protect, exportRoutes);
app.use('/api/statistics', protect, statisticsRoutes);
app.use('/api/comunicazioni', protect, comunicazioniRoutes);
app.use('/api/whatsapp/qr', whatsappRoutes);
app.use('/api/whatsapp/status', whatsappRoutes);
app.use('/api/whatsapp', protect, whatsappRoutes);
app.use('/api/whatsapp-dashboard', whatsappDashboardRoutes); // ✅ AGGIUNGI (PUBBLICO)
app.use('/api/templates', protect, templateRoutes);
app.use('/api/test', testRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/prodotti', prodottiRoutes);
app.use('/api/cx3', cx3Routes);
app.use('/api/chiamate', chiamateRoutes); // ✅ NUOVO - Gestione chiamate e tag
app.use('/api/statistiche', statisticheRoutes); // ✅ NUOVO - Statistiche chiamate
app.use('/api/corrispettivi', corrispettiviRoutes);
app.use('/api/email-corrispettivi', emailCorrispettiviRoutes); // ✅ NUOVO - Route email corrispettivi
app.use('/api/email', emailRoutes);
app.use('/api/haccp', haccpRoutes);
app.use('/api/fix', fixPrezziRoutes);
app.use('/api/import-fatture', importFattureRoutes);
app.use('/api/rintracciabilita', rintracciabilitaRoutes); // ✅ NUOVO - Rintracciabilità ingredienti
app.use('/api/sessions', sessionsRoutes);
app.use('/api/users', usersRoutes);

// Route Danea



// Test route
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API funzionante!',
    timestamp: new Date().toISOString(),
    services: {
      whatsapp: whatsappService.isReady(),
      scheduler: schedulerService.jobs ? schedulerService.jobs.size > 0 : false,
      schedulerWhatsApp: schedulerWhatsApp && schedulerWhatsApp.jobs ? schedulerWhatsApp.jobs.size : 0
    }
  });
});

// ============================
// WEBSOCKET HANDLERS COMPLETI
// ============================
const connectedUsers = new Map();

io.on('connection', (socket) => {
  logger.info('✅ Nuova connessione WebSocket', { 
    socketId: socket.id,
    transport: socket.conn.transport.name 
  });

  // IMPORTANTE: Conferma immediata di connessione
  socket.emit('connected', { 
    socketId: socket.id,
    timestamp: new Date().toISOString() 
  });

  // Handler autenticazione
  socket.on('authenticate', (data) => {
    if (data.userId) {
      connectedUsers.set(socket.id, {
        userId: data.userId,
        socket: socket,
        connectedAt: new Date()
      });
      socket.join(`user:${data.userId}`);
      logger.info('Utente autenticato via WebSocket', { 
        socketId: socket.id, 
        userId: data.userId 
      });
      
      // Invia stato WhatsApp
      socket.emit('whatsapp:status', {
        connected: whatsappService.isReady()
      });
    }
  });

  // NUOVO: Handler per ping/pong
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: Date.now() });
  });

  // NUOVO: Handler per sincronizzazione
  socket.on('request-sync', async () => {
    try {
      logger.info(`🔄 Sincronizzazione richiesta da ${socket.id}`);
      
      // Recupera ultimi dati
      const [ordini, movimenti] = await Promise.all([
        Ordine.find().sort('-createdAt').limit(50).lean(),
        Movimento.find().sort('-createdAt').limit(50).lean()
      ]);
      
      socket.emit('sync-data', {
        ordini,
        movimenti,
        timestamp: new Date().toISOString()
      });
      
      logger.info(`✅ Dati sincronizzati inviati a ${socket.id}`);
    } catch (error) {
      logger.error('❌ Errore durante sincronizzazione:', error);
      socket.emit('sync-error', { message: error.message });
    }
  });

  // NUOVO: Handler per eventi ordini
  socket.on('ordine-creato', (data) => {
    logger.info('📦 Nuovo ordine ricevuto via WebSocket:', data);
    socket.broadcast.emit('ordine-creato', data);
  });

  socket.on('ordine-aggiornato', (data) => {
    logger.info('📝 Ordine aggiornato via WebSocket:', data);
    socket.broadcast.emit('ordine-aggiornato', data);
  });

  socket.on('ordine-eliminato', (data) => {
    logger.info('🗑️ Ordine eliminato via WebSocket:', data);
    socket.broadcast.emit('ordine-eliminato', data);
  });

  // NUOVO: Handler per eventi magazzino
  socket.on('movimento-creato', (data) => {
    logger.info('📦 Nuovo movimento magazzino:', data);
    socket.broadcast.emit('movimento-creato', data);
  });

  socket.on('inventario_aggiornato', (data) => {
    logger.info('📊 Inventario aggiornato:', data);
    socket.broadcast.emit('inventario_aggiornato', data);
  });

  socket.on('movimento_aggiunto', (data) => {
    logger.info('➕ Movimento aggiunto:', data);
    socket.broadcast.emit('movimento_aggiunto', data);
  });

  socket.on('movimento_eliminato', (data) => {
    logger.info('🗑️ Movimento eliminato:', data);
    socket.broadcast.emit('movimento_eliminato', data);
  });

  socket.on('movimenti_caricati', (data) => {
    logger.info('📋 Movimenti caricati:', data);
    socket.broadcast.emit('movimenti_caricati', data);
  });

  // Handler room
  socket.on('join', (room) => {
    socket.join(room);
    logger.info('Socket joined room', { socketId: socket.id, room });
  });

  socket.on('leave', (room) => {
    socket.leave(room);
    logger.info('Socket left room', { socketId: socket.id, room });
  });

  // Handler disconnessione
  socket.on('disconnect', (reason) => {
    connectedUsers.delete(socket.id);
    logger.info('❌ Disconnessione WebSocket', { 
      socketId: socket.id,
      reason: reason 
    });
  });

  // Handler errori
  socket.on('error', (error) => {
    logger.error(`⚠️ Errore socket ${socket.id}:`, error);
  });
});

// Funzioni di notifica globali
export const notifyOrderUpdate = (ordine, action) => {
  io.emit('ordine:update', { ordine, action });
  logger.info('Notifica ordine inviata', { ordineId: ordine._id, action });
};

export const notifyInventoryUpdate = (prodotto, action) => {
  io.emit('magazzino:update', { prodotto, action });
  logger.info('Notifica magazzino inviata', { prodottoId: prodotto._id, action });
};

export const notifyAlert = (alert) => {
  io.emit('alert', alert);
  logger.info('Alert inviato', { alert });
};

export const notifyReportGenerated = (report) => {
  io.emit('report:generated', report);
  logger.info('Notifica report generato', { reportType: report.type });
};

export const notifyWhatsAppStatus = (status) => {
  io.emit('whatsapp:status', status);
  logger.info('Stato WhatsApp aggiornato', status);
};

// Helper function per ottenere il numero della settimana
Date.prototype.getWeek = function() {
  const d = new Date(Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
};

// ====================
// CRON JOBS
// ====================

// Backup automatico giornaliero - ogni giorno alle 2:00
cron.schedule('0 2 * * *', async () => {
  logger.info('Avvio backup automatico giornaliero');
  try {
    const result = await backupService.createBackup();
    
    if (result.success) {
      io.emit('backup:created', {
        fileName: result.fileName,
        driveUploaded: result.driveUploaded,
        timestamp: new Date()
      });
      
      logger.info('Backup automatico completato con successo', {
        fileName: result.fileName,
        driveUploaded: result.driveUploaded
      });
    }
  } catch (error) {
    logger.error('Errore durante il backup automatico', { error: error.message });
    
    io.emit('backup:error', {
      message: 'Errore durante il backup automatico',
      timestamp: new Date()
    });
  }
});

// Pulizia backup locali e Google Drive - ogni domenica alle 3:00
cron.schedule('0 3 * * 0', async () => {
  logger.info('Avvio pulizia backup vecchi');
  try {
    await backupService.cleanupOldBackups(30);
    
    if (exportService && exportService.cleanupOldExports) {
      await exportService.cleanupOldExports(30);
    }
    
    logger.info('Pulizia backup completata');
  } catch (error) {
    logger.error('Errore pulizia backup:', error);
  }
});

// Controlla scorte ogni ora
cron.schedule('0 * * * *', async () => {
  logger.info('Avvio controllo scorte automatico');
  try {
    const prodottiSottoScorta = await Movimento.aggregate([
      {
        $group: {
          _id: '$prodotto.nome',
          quantitaAttuale: {
            $sum: {
              $cond: [
                { $in: ['$tipo', ['carico', 'inventario']] },
                '$quantita',
                { $multiply: ['$quantita', -1] }
              ]
            }
          },
          unita: { $first: '$unita' },
          categoria: { $first: '$prodotto.categoria' }
        }
      },
      {
        $match: {
          quantitaAttuale: { $lt: 10 }
        }
      }
    ]);
    
    if (prodottiSottoScorta.length > 0) {
      io.emit('scheduled-low-stock-check', {
        prodotti: prodottiSottoScorta.map(p => ({
          id: `stock-${p._id}`,
          nome: p._id,
          quantitaAttuale: p.quantitaAttuale,
          unitaMisura: p.unita,
          scortaMinima: 10,
          categoria: p.categoria
        })),
        timestamp: new Date()
      });
      
      for (const prodotto of prodottiSottoScorta) {
        await notificationService.notifyLowStock({
          nome: prodotto._id,
          quantitaAttuale: prodotto.quantitaAttuale,
          unitaMisura: prodotto.unita,
          scortaMinima: 10
        });
      }
      
      logger.warn(`Controllo scorte: ${prodottiSottoScorta.length} prodotti sotto scorta minima`);
    }
  } catch (error) {
    logger.error('Errore controllo scorte:', error);
  }
});

// Controlla scadenze ogni giorno alle 8:00
cron.schedule('0 8 * * *', async () => {
  logger.info('Avvio controllo scadenze automatico');
  try {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() + 7);
    
    const prodottiInScadenza = await Movimento.find({
      dataScadenza: { 
        $gte: new Date(),
        $lte: dataLimite 
      },
      tipo: { $in: ['carico', 'inventario'] }
    }).select('prodotto dataScadenza lotto');
    
    if (prodottiInScadenza.length > 0) {
      io.emit('scheduled-expiry-check', {
        prodotti: prodottiInScadenza.map(p => ({
          id: p._id,
          nome: p.prodotto.nome,
          dataScadenza: p.dataScadenza,
          lotto: p.lotto,
          categoria: p.prodotto.categoria
        })),
        timestamp: new Date()
      });
      
      await notificationService.notifyExpiringProducts(
        prodottiInScadenza.map(p => ({
          nome: p.prodotto.nome,
          dataScadenza: p.dataScadenza,
          lotto: p.lotto
        }))
      );
      
      logger.warn(`Controllo scadenze: ${prodottiInScadenza.length} prodotti in scadenza nei prossimi 7 giorni`);
    }
  } catch (error) {
    logger.error('Errore controllo scadenze:', error);
  }
});

// Report giornaliero - ogni giorno alle 7:00
cron.schedule('0 7 * * *', async () => {
  logger.info('Invio report giornaliero');
  try {
    await notificationService.sendDailyReport();
  } catch (error) {
    logger.error('Errore invio report giornaliero:', error);
  }
});

// Report settimanale scorte critiche - ogni lunedì alle 9:00
cron.schedule('0 9 * * 1', async () => {
  logger.info('Generazione report settimanale scorte critiche');
  try {
    const scorteCritiche = await Movimento.aggregate([
      {
        $group: {
          _id: '$prodotto.nome',
          quantitaAttuale: {
            $sum: {
              $cond: [
                { $in: ['$tipo', ['carico', 'inventario']] },
                '$quantita',
                { $multiply: ['$quantita', -1] }
              ]
            }
          },
          unita: { $first: '$unita' },
          valoreMedio: { $avg: '$prezzoUnitario' },
          categoria: { $first: '$prodotto.categoria' }
        }
      },
      {
        $match: {
          quantitaAttuale: { $lt: 5 }
        }
      }
    ]);
    
    if (scorteCritiche.length > 0) {
      io.emit('weekly-critical-stock-report', {
        prodotti: scorteCritiche,
        timestamp: new Date(),
        settimana: `${new Date().getWeek()}-${new Date().getFullYear()}`
      });
      
      await notificationService.sendCustomAlert({
        title: 'Report Settimanale Scorte Critiche',
        message: `${scorteCritiche.length} prodotti hanno scorte critiche (< 5 unità)`,
        type: 'warning',
        priority: 'high',
        data: { prodotti: scorteCritiche }
      });
      
      logger.info(`Report scorte critiche: ${scorteCritiche.length} prodotti critici`);
    }
  } catch (error) {
    logger.error('Errore generazione report scorte critiche:', error);
  }
});

// Controllo urgente scorte - ogni 30 minuti
cron.schedule('*/30 * * * *', async () => {
  try {
    const scorteUrgenti = await Movimento.aggregate([
      {
        $group: {
          _id: '$prodotto.nome',
          quantitaAttuale: {
            $sum: {
              $cond: [
                { $in: ['$tipo', ['carico', 'inventario']] },
                '$quantita',
                { $multiply: ['$quantita', -1] }
              ]
            }
          },
          categoria: { $first: '$prodotto.categoria' }
        }
      },
      {
        $match: {
          quantitaAttuale: { $lte: 0 }
        }
      }
    ]);
    
    if (scorteUrgenti.length > 0) {
      io.emit('urgent-stock-alert', {
        prodotti: scorteUrgenti,
        timestamp: new Date(),
        livello: 'CRITICO'
      });
      
      await notificationService.sendCustomAlert({
        title: '🚨 ALERT CRITICO: Prodotti Esauriti',
        message: `${scorteUrgenti.length} prodotti sono COMPLETAMENTE ESAURITI!`,
        type: 'error',
        priority: 'critical',
        sendToAll: true,
        data: { prodotti: scorteUrgenti }
      });
      
      logger.error(`ALERT CRITICO: ${scorteUrgenti.length} prodotti ESAURITI`);
    }
  } catch (error) {
    logger.error('Errore controllo scorte urgenti:', error);
  }
});

// Pulizia file temporanei ogni ora
cron.schedule('0 * * * *', () => {
  logger.info('Avvio pulizia file temporanei');
  
  const tempDir = '/tmp/';
  fs.readdir(tempDir, (err, files) => {
    if (err) {
      logger.error('Errore lettura directory temp', { error: err });
      return;
    }
    
    const now = Date.now();
    files.forEach(file => {
      const filePath = path.join(tempDir, file);
      fs.stat(filePath, (err, stat) => {
        if (err) return;
        
        // Rimuovi file più vecchi di 1 ora
        if (now - stat.mtime.getTime() > 3600000) {
          fs.unlink(filePath, (err) => {
            if (err) {
              logger.error('Errore rimozione file temp', { error: err, file });
            } else {
              logger.info('File temp rimosso', { file });
            }
          });
        }
      });
    });
  });

  // Pulizia PDF temporanei
  if (pdfService && pdfService.cleanupTempFiles) {
    pdfService.cleanupTempFiles(24).catch(err => {
      logger.error('Errore pulizia PDF temporanei', { error: err });
    });
  }

  // Pulizia export vecchi
  if (exportService && exportService.cleanupOldExports) {
    exportService.cleanupOldExports(7).catch(err => {
      logger.error('Errore pulizia export:', err);
    });
  }
});

// Generazione report giornaliero automatico - ogni giorno alle 6:00
cron.schedule('0 6 * * *', async () => {
  logger.info('Avvio generazione report giornaliero automatico');
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const reportData = {
      data: yesterday.toISOString().split('T')[0],
      autoGenerato: true
    };
    
    io.emit('daily-report-generated', {
      data: reportData.data,
      timestamp: new Date()
    });
    
    logger.info('Report giornaliero automatico programmato', { data: reportData.data });
  } catch (error) {
    logger.error('Errore generazione report automatico', { error });
  }
});

// Controllo connessione WhatsApp - ogni 5 minuti
cron.schedule('*/5 * * * *', async () => {
  if (whatsappService.isReady()) {
    logger.debug('WhatsApp connesso e funzionante');
  } else {
    logger.warn('WhatsApp non connesso, tentativo di riconnessione...');
    try {
      await whatsappService.initialize();
    } catch (error) {
      logger.error('Errore riconnessione WhatsApp:', error);
    }
  }
});

// ====================
// ERROR HANDLING
// ====================

app.use((req, res, next) => {
  res.status(404).json({ 
    success: false, 
    error: 'Endpoint non trovato' 
  });
});

// Error handler finale
app.use((err, req, res, next) => {
  logger.error('Errore del server', { 
    error: err.message, 
    stack: err.stack,
    url: req.url,
    method: req.method
  });
  
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Errore interno del server' 
      : err.message
  });
});

// ====================
// DATABASE CONNECTION
// ====================

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('Errore connessione MongoDB', { error });
    process.exit(1);
  }
};

// ====================
// START SERVER
// ====================

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connetti al database
    await connectDB();

// ✅ Inizializza Pusher
    try {
      pusherService.initialize();
      logger.info('✅ Pusher service inizializzato');
    } catch (pusherError) {
      logger.warn('⚠️ Pusher service non disponibile:', pusherError.message);
    }
    
    // Inizializza servizio backup - non bloccare se fallisce
    try {
      if (backupService && backupService.initialize) {
        await backupService.initialize();
        logger.info('Servizio backup inizializzato');
      }
    } catch (backupError) {
      logger.warn('Backup service non disponibile:', backupError.message);
    }
    
    // Inizializza WhatsApp - non bloccare se fallisce
    try {
      if (whatsappService) {
        await whatsappService.initialize();
        logger.info('WhatsApp service caricato');
        
        // Inizializza scheduler WhatsApp se WhatsApp è pronto
        if (whatsappService.isReady() && schedulerWhatsApp) {
          schedulerWhatsApp.inizializza();
          logger.info('📅 Scheduler WhatsApp attivato con successo');
        } else {
          logger.info('⏸️ Scheduler WhatsApp in attesa - WhatsApp non pronto');
        }
      }
    } catch (whatsappError) {
      logger.warn('WhatsApp service non disponibile:', whatsappError.message);
    }
    
    // Inizializza scheduler generale - non bloccare se fallisce
    try {
      if (schedulerService && schedulerService.inizializza) {
        schedulerService.inizializza();
        logger.info('Scheduler generale caricato');
      }
    
    // Inizializza scheduler email
    try {
      if (schedulerEmail && schedulerEmail.start) {
        schedulerEmail.start();
        logger.info('✅ Scheduler Email attivato');
      }
    } catch (emailError) {
      logger.warn('⚠️ Scheduler Email non disponibile:', emailError.message);
    }
    
    // Inizializza scheduler corrispettivi
    try {
      if (schedulerCorrespettivi && schedulerCorrespettivi.start) {
        schedulerCorrespettivi.start();
        logger.info('✅ Scheduler Corrispettivi attivato');
      }
    } catch (corrispettiviError) {
      logger.warn('⚠️ Scheduler Corrispettivi non disponibile:', corrispettiviError.message);
    }
    
    // Inizializza scheduler HACCP
    try {
      if (schedulerHACCP && schedulerHACCP.start) {
        schedulerHACCP.start();
        logger.info('✅ Scheduler HACCP attivato');
      }
    } catch (haccpError) {
      logger.warn('⚠️ Scheduler HACCP non disponibile:', haccpError.message);
    }

    // ✅ Inizializza cron jobs email corrispettivi
    try {
      if (cronJobsEmail && cronJobsEmail.inizializza) {
        logger.info('🚀 Avvio cron jobs email automatici...');
        cronJobsEmail.inizializza();
      }
    } catch (cronEmailError) {
      logger.warn('⚠️ Cron jobs email non disponibile:', cronEmailError.message);
    }
    } catch (schedulerError) {
      logger.warn('Scheduler generale non disponibile:', schedulerError.message);
    }
    
    // Avvia server
    server.listen(PORT, () => {
      logger.info(`Server in esecuzione sulla porta ${PORT}`, {
        environment: process.env.NODE_ENV || 'development',
        mongoUri: process.env.MONGODB_URI?.substring(0, 20) + '...',
        whatsapp: whatsappService.isReady() ? 'connesso' : 'non connesso',
        schedulerWhatsApp: schedulerWhatsApp && schedulerWhatsApp.jobs ? schedulerWhatsApp.jobs.size : 0,
        frontendUrl: process.env.FRONTEND_URL || 'non configurato'
      });
      
      
      if (whatsappService && !whatsappService.isReady()) {
        const checkWhatsApp = setInterval(() => {
          if (whatsappService.isReady() && schedulerWhatsApp) {
            schedulerWhatsApp.inizializza();
            logger.info('📅 Scheduler WhatsApp attivato dopo connessione WhatsApp');
            clearInterval(checkWhatsApp);
          }
        }, 10000); // Controlla ogni 10 secondi
        
        // Timeout dopo 5 minuti
        setTimeout(() => clearInterval(checkWhatsApp), 300000);
      }
    });
  } catch (error) {
    logger.error('Errore avvio server', { error: error.message });
    process.exit(1);
  }
};

// ====================
// GRACEFUL SHUTDOWN
// ====================

const gracefulShutdown = () => {
  logger.info('Avvio graceful shutdown...');
  
  // Ferma scheduler WhatsApp se esiste
  try {
    if (schedulerWhatsApp && schedulerWhatsApp.ferma) {
      schedulerWhatsApp.ferma();
      logger.info('Scheduler WhatsApp fermato');
    }
  } catch (error) {
    logger.error('Errore fermando scheduler WhatsApp:', error);
  }
  
  // Ferma scheduler generale se esiste
  try {
    if (schedulerService && schedulerService.ferma) {
      schedulerService.ferma();
      logger.info('Scheduler generale fermato');
    }
    if (schedulerEmail && schedulerEmail.stop) {
      schedulerEmail.stop();
      logger.info('✅ Scheduler Email fermato');
    }
    if (schedulerCorrespettivi && schedulerCorrespettivi.stop) {
      schedulerCorrespettivi.stop();
      logger.info('✅ Scheduler Corrispettivi fermato');
    }
    if (schedulerHACCP && schedulerHACCP.stop) {
      schedulerHACCP.stop();
      logger.info('✅ Scheduler HACCP fermato');
    }
  } catch (error) {
    logger.error('Errore fermando scheduler generale:', error);
  }
  
  // Disconnetti WhatsApp se esiste
  try {
    if (whatsappService && whatsappService.disconnect) {
      whatsappService.disconnect();
      logger.info('WhatsApp disconnesso');
    }
  } catch (error) {
    logger.error('Errore disconnessione WhatsApp:', error);
  }
  
  // Chiudi server HTTP
  server.close(() => {
    logger.info('Server HTTP chiuso');
    
    // Chiudi connessione MongoDB
  mongoose.connection.close().then(() => {
  process.exit(0);
});
  });
  
  // Force exit dopo 10 secondi
  setTimeout(() => {
    logger.error('Chiusura forzata dopo timeout');
    process.exit(1);
  }, 10000);
};

// Gestione segnali di terminazione
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// ====================
// GESTIONE ERRORI NON CATTURATI
// ====================

process.on('uncaughtException', (err) => {
  logger.error('Eccezione non catturata', { error: err });
  gracefulShutdown();
});

process.on('unhandledRejection', (err) => {
  logger.error('Promise rejection non gestita', { error: err });
  // Non chiudere immediatamente per rejection non gestite
  logger.error('Stack trace:', err);
});

// ====================
// AVVIA IL SERVER
// ====================

startServer();

export default app;

// ✅ Gestione shutdown graceful
process.on('SIGTERM', () => {
  logger.info('⏹️ SIGTERM ricevuto, chiusura graceful...');
  if (cronJobsEmail && cronJobsEmail.fermatutti) {
    cronJobsEmail.fermatutti();
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('⏹️ SIGINT ricevuto, chiusura graceful...');
  if (cronJobsEmail && cronJobsEmail.fermatutti) {
    cronJobsEmail.fermatutti();
  }
  process.exit(0);
});