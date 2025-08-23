// server.js
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

// Import routes
import authRoutes from './routes/auth.js';
import ordiniRoutes from './routes/ordini.js';
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
import templateRoutes from './routes/templates.js';
import testRoutes from './routes/test.js';

// Import middleware
import { protect } from './middleware/auth.js';

// Import logger
import logger from './config/logger.js';

// Import models per i cron jobs
import Movimento from './models/movimento.js';
import Ordine from './models/Ordine.js';

// Import services
import pdfService from './services/pdfService.js';
import notificationService from './services/NotificationService.js';
import exportService from './services/exportService.js';
import googleDriveService from './services/googleDriveService.js';
import backupService from './services/backupService.js';
import whatsappService from './services/whatsappService.js';
import schedulerService from './services/schedulerService.js';
import schedulerWhatsApp from './services/schedulerWhatsApp.js';

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

// Configura Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// Rendi io disponibile globalmente
global.io = io;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

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

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    whatsapp: whatsappService.isReady() ? 'connected' : 'disconnected',
    schedulerWhatsApp: schedulerWhatsApp && schedulerWhatsApp.jobs ? schedulerWhatsApp.jobs.size : 0
  });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/ordini', protect, ordiniRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/backup', protect, backupRoutes);
app.use('/api/magazzino', protect, magazzinoRoutes);
app.use('/api/magazzino/ingredienti', protect, ingredientiRoutes);
app.use('/api/fornitori', fornitoriRoutes);
app.use('/api/report', protect, reportRoutes);
app.use('/api/notifiche', notificheRoutes);
app.use('/api/export', protect, exportRoutes);
app.use('/api/statistics', protect, statisticsRoutes);
app.use('/api/clienti', protect, clientiRoutes);
app.use('/api/comunicazioni', protect, comunicazioniRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/templates', protect, templateRoutes);
app.use('/api/test', testRoutes);

// Test route
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API funzionante!',
    services: {
      whatsapp: whatsappService.isReady(),
      scheduler: schedulerService.jobs ? schedulerService.jobs.size > 0 : false,
      schedulerWhatsApp: schedulerWhatsApp && schedulerWhatsApp.jobs ? schedulerWhatsApp.jobs.size : 0
    }
  });
});

// WebSocket
const connectedUsers = new Map();

io.on('connection', (socket) => {
  logger.info('Nuova connessione WebSocket', { socketId: socket.id });

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

  socket.on('join', (room) => {
    socket.join(room);
    logger.info('Socket joined room', { socketId: socket.id, room });
  });

  socket.on('leave', (room) => {
    socket.leave(room);
    logger.info('Socket left room', { socketId: socket.id, room });
  });

  socket.on('disconnect', () => {
    connectedUsers.delete(socket.id);
    logger.info('Disconnessione WebSocket', { socketId: socket.id });
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

  if (pdfService && pdfService.cleanupTempFiles) {
    pdfService.cleanupTempFiles(24).catch(err => {
      logger.error('Errore pulizia PDF temporanei', { error: err });
    });
  }

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
    
    // Inizializza servizio backup - commenta se causa problemi
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
    } catch (schedulerError) {
      logger.warn('Scheduler generale non disponibile:', schedulerError.message);
    }
    
    // Avvia server
    server.listen(PORT, () => {
      logger.info(`Server in esecuzione sulla porta ${PORT}`, {
        environment: process.env.NODE_ENV,
        mongoUri: process.env.MONGODB_URI?.substring(0, 20) + '...',
        whatsapp: whatsappService.isReady() ? 'connesso' : 'non connesso',
        schedulerWhatsApp: schedulerWhatsApp && schedulerWhatsApp.jobs ? schedulerWhatsApp.jobs.size : 0
      });
      
      // Se WhatsApp si connette dopo, attiva lo scheduler
      if (whatsappService && !whatsappService.isReady()) {
        const checkWhatsApp = setInterval(() => {
          if (whatsappService.isReady() && schedulerWhatsApp) {
            schedulerWhatsApp.inizializza();
            logger.info('📅 Scheduler WhatsApp attivato dopo connessione WhatsApp');
            clearInterval(checkWhatsApp);
          }
        }, 10000); // Controlla ogni 10 secondi
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
    mongoose.connection.close(false, () => {
      logger.info('Connessione MongoDB chiusa');
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
  gracefulShutdown();
});

// ====================
// AVVIA IL SERVER
// ====================

startServer();

export default app;

