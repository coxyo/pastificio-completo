// server-test.js - Server con database in memoria per test rapidi
// Salva come server-test.js nella cartella pastificio-backend

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

// Carica variabili ambiente
dotenv.config();

// Database in memoria (solo per test)
let users = [
  {
    _id: 'admin_id',
    username: 'admin',
    password: 'admin123',
    ruolo: 'admin',
    createdAt: new Date()
  }
];

let ordini = [];
let nextId = 1;

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

// Middleware base
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: 'in-memory',
    ordini: ordini.length,
    users: users.length
  });
});

// ===== ROUTES AUTH =====

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = users.find(u => u.username === username);
    
    if (!user || user.password !== password) {
      return res.status(401).json({
        success: false,
        error: 'Credenziali non valide'
      });
    }
    
    const token = `simple_token_${user._id}_${Date.now()}`;
    
    console.log(`✅ Login riuscito: ${username}`);
    
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        ruolo: user.ruolo
      }
    });
    
  } catch (error) {
    console.error('Errore login:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// Middleware di autenticazione semplificato
const protect = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token richiesto'
    });
  }
  
  if (token.startsWith('simple_token_')) {
    req.user = { id: token.split('_')[2] };
    next();
  } else {
    res.status(401).json({
      success: false,
      error: 'Token non valido'
    });
  }
};

// ===== ROUTES ORDINI =====

// GET tutti gli ordini
app.get('/api/ordini', protect, async (req, res) => {
  try {
    const { page = 1, limit = 50, data } = req.query;
    
    let ordiniFiltrati = [...ordini];
    
    if (data) {
      ordiniFiltrati = ordini.filter(o => 
        o.dataRitiro && o.dataRitiro.includes(data)
      );
    }
    
    // Ordinamento per data creazione (più recenti prima)
    ordiniFiltrati.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Paginazione
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const ordiniPaginati = ordiniFiltrati.slice(startIndex, endIndex);
    
    console.log(`📋 Caricati ${ordiniPaginati.length} ordini (totali: ${ordini.length})`);
    
    res.json({
      success: true,
      data: ordiniPaginati,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: ordiniFiltrati.length,
        pages: Math.ceil(ordiniFiltrati.length / limit)
      }
    });
    
  } catch (error) {
    console.error('Errore caricamento ordini:', error);
    res.status(500).json({
      success: false,
      error: 'Errore caricamento ordini'
    });
  }
});

// POST nuovo ordine
app.post('/api/ordini', protect, async (req, res) => {
  try {
    const ordineData = req.body;
    
    // Calcola totale se non fornito
    if (!ordineData.totale && ordineData.prodotti) {
      ordineData.totale = ordineData.prodotti.reduce((sum, p) => sum + (p.totale || 0), 0);
    }
    
    const nuovoOrdine = {
      _id: `ordine_${nextId++}`,
      ...ordineData,
      stato: ordineData.stato || 'in_attesa',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    ordini.push(nuovoOrdine);
    
    console.log(`➕ Nuovo ordine creato: ${nuovoOrdine._id} - ${nuovoOrdine.nomeCliente}`);
    console.log(`📨 Emissione evento: nuovo-ordine a ${io.engine.clientsCount} client connessi`);
    
    // Notifica WebSocket - EVENTI CORRETTI
    io.emit('nuovo-ordine', { ordine: nuovoOrdine });
    
    res.status(201).json({
      success: true,
      data: nuovoOrdine
    });
    
  } catch (error) {
    console.error('Errore creazione ordine:', error);
    res.status(500).json({
      success: false,
      error: 'Errore creazione ordine'
    });
  }
});

// PUT aggiorna ordine
app.put('/api/ordini/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updatedAt: new Date().toISOString() };
    
    const index = ordini.findIndex(o => o._id === id);
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Ordine non trovato'
      });
    }
    
    ordini[index] = { ...ordini[index], ...updateData };
    
    console.log(`📝 Ordine aggiornato: ${id}`);
    console.log(`📨 Emissione evento: ordine-aggiornato a ${io.engine.clientsCount} client connessi`);
    
    // Notifica WebSocket - EVENTI CORRETTI
    io.emit('ordine-aggiornato', { ordine: ordini[index] });
    
    res.json({
      success: true,
      data: ordini[index]
    });
    
  } catch (error) {
    console.error('Errore aggiornamento ordine:', error);
    res.status(500).json({
      success: false,
      error: 'Errore aggiornamento ordine'
    });
  }
});

// DELETE elimina ordine
app.delete('/api/ordini/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    
    const index = ordini.findIndex(o => o._id === id);
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Ordine non trovato'
      });
    }
    
    const ordineEliminato = ordini.splice(index, 1)[0];
    
    console.log(`🗑️ Ordine eliminato: ${id}`);
    console.log(`📨 Emissione evento: ordine-eliminato a ${io.engine.clientsCount} client connessi`);
    
    // Notifica WebSocket - EVENTI CORRETTI
    io.emit('ordine-eliminato', { ordineId: id });
    
    res.json({
      success: true,
      message: 'Ordine eliminato con successo'
    });
    
  } catch (error) {
    console.error('Errore eliminazione ordine:', error);
    res.status(500).json({
      success: false,
      error: 'Errore eliminazione ordine'
    });
  }
});

// ===== WEBSOCKET =====

const connessioni = new Map();

io.on('connection', (socket) => {
  console.log(`🔌 WebSocket connesso: ${socket.id}`);
  
  connessioni.set(socket.id, {
    socket,
    connessoDa: new Date()
  });
  
  socket.emit('connected', { 
    socketId: socket.id,
    timestamp: new Date().toISOString()
  });
  
  socket.on('authenticateUser', (data) => {
    console.log(`🔐 Autenticazione WebSocket: ${socket.id}`);
    socket.emit('authenticated', { success: true });
  });
  
  socket.on('join', (room) => {
    socket.join(room);
    console.log(`🏠 Socket ${socket.id} unito alla stanza: ${room}`);
  });
  
  socket.on('leave', (room) => {
    socket.leave(room);
    console.log(`🚪 Socket ${socket.id} uscito dalla stanza: ${room}`);
  });
  
  socket.on('ping', () => {
    socket.emit('pong');
  });
  
  socket.on('disconnect', (reason) => {
    console.log(`❌ WebSocket disconnesso: ${socket.id} - ${reason}`);
    connessioni.delete(socket.id);
  });
});

// ===== ERROR HANDLING =====

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trovata',
    path: req.originalUrl
  });
});

app.use((err, req, res, next) => {
  console.error('Errore del server:', err);
  res.status(500).json({
    success: false,
    message: 'Errore interno del server'
  });
});

// ===== SERVER STARTUP =====

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log('🚀 SERVER TEST AVVIATO CON SUCCESSO!');
  console.log('==========================================');
  console.log(`   URL: http://localhost:${PORT}`);
  console.log(`   Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Frontend: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`   Database: IN MEMORIA (solo per test)`);
  console.log(`   WebSocket: ATTIVO`);
  console.log('==========================================');
  console.log('🔑 Credenziali test: admin / admin123');
  console.log('📊 Statistiche:');
  console.log(`   Utenti: ${users.length}`);
  console.log(`   Ordini: ${ordini.length}`);
  console.log(`   Connessioni WebSocket: ${connessioni.size}`);
  console.log('==========================================');
  console.log('📡 Endpoint API:');
  console.log('   GET  /api/health');
  console.log('   POST /api/auth/login');
  console.log('   GET  /api/ordini');
  console.log('   POST /api/ordini');
  console.log('   PUT  /api/ordini/:id');
  console.log('   DELETE /api/ordini/:id');
  console.log('==========================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 Graceful shutdown...');
  server.close(() => {
    console.log('📡 Server chiuso');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 Graceful shutdown...');
  server.close(() => {
    console.log('📡 Server chiuso');
    process.exit(0);
  });
});