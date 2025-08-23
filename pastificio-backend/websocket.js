// websocket.js
import { Server } from 'socket.io';
import logger from './config/logger.js';

let io;

// Inizializza il server WebSocket
export const initializeWebSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Nuova connessione WebSocket: ${socket.id}`, {
      service: 'websocket',
      socketId: socket.id
    });

    // Gestisci l'autenticazione del socket
    socket.on('authenticate', (token) => {
      // In una implementazione reale, verificheresti il token JWT
      // e assoceresti il socket all'utente
      socket.auth = true;
      socket.emit('authenticated');
      logger.info(`Socket autenticato: ${socket.id}`, {
        service: 'websocket',
        socketId: socket.id
      });
    });

    // Gestisci l'iscrizione a stanze specifiche
    socket.on('join', (room) => {
      socket.join(room);
      logger.info(`Socket ${socket.id} si è unito alla stanza: ${room}`, {
        service: 'websocket',
        socketId: socket.id,
        room
      });
    });

    // Gestisci l'uscita da stanze specifiche
    socket.on('leave', (room) => {
      socket.leave(room);
      logger.info(`Socket ${socket.id} ha lasciato la stanza: ${room}`, {
        service: 'websocket',
        socketId: socket.id,
        room
      });
    });

    // Gestisci la disconnessione
    socket.on('disconnect', () => {
      logger.info(`Socket disconnesso: ${socket.id}`, {
        service: 'websocket',
        socketId: socket.id
      });
    });
  });

  logger.info('Server WebSocket inizializzato', {
    service: 'websocket'
  });

  return io;
};

// Ottieni l'istanza di io
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io non è stato inizializzato. Chiama initializeWebSocket prima.');
  }
  return io;
};

// Notifica tutti i client
export const notifyAll = (event, data) => {
  if (!io) {
    logger.warn('Tentativo di inviare notifica prima dell\'inizializzazione di Socket.io', {
      service: 'websocket',
      event
    });
    return;
  }

  io.emit(event, data);
  logger.debug(`Notifica inviata a tutti i client: ${event}`, {
    service: 'websocket',
    event
  });
};

// Notifica stanza specifica
export const notifyRoom = (room, event, data) => {
  if (!io) {
    logger.warn('Tentativo di inviare notifica prima dell\'inizializzazione di Socket.io', {
      service: 'websocket',
      event,
      room
    });
    return;
  }

  io.to(room).emit(event, data);
  logger.debug(`Notifica inviata alla stanza ${room}: ${event}`, {
    service: 'websocket',
    event,
    room
  });
};

// Notifica utente specifico
export const notifyUser = (userId, event, data) => {
  if (!io) {
    logger.warn('Tentativo di inviare notifica prima dell\'inizializzazione di Socket.io', {
      service: 'websocket',
      event,
      userId
    });
    return;
  }

  // Nella tua implementazione, dovresti avere un modo per mappare userId ai socketId
  // Questa è una implementazione di esempio
  const room = `user:${userId}`;
  io.to(room).emit(event, data);
  logger.debug(`Notifica inviata all'utente ${userId}: ${event}`, {
    service: 'websocket',
    event,
    userId
  });
};