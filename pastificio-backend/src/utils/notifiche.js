// src/utils/notifiche.js
import { Server } from 'socket.io';
import { logger } from '../config/logger.js';

export let io;

export const initializeSocketIO = (server) => {
  io = new Server(server);
  
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Autenticazione richiesta'));
      }
      next();
    } catch (error) {
      logger.error('Errore autenticazione socket:', error);
      next(new Error('Errore di autenticazione'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Client connesso: ${socket.id}`);
    
    socket.on('disconnect', () => {
      logger.info(`Client disconnesso: ${socket.id}`);
    });
  });

  return io;
};

export const notificaNuovoOrdine = (ordine) => {
  if (io) {
    io.emit('nuovoOrdine', { ordine });
  }
};

export const notificaOrdineAggiornato = (ordine) => {
  if (io) {
    io.emit('ordineAggiornato', { ordine });
  }
};

export const notificaBackup = (info) => {
  if (io) {
    io.to('admin').emit('backupCompleto', info);
  }
};

export const notificaErrore = (error) => {
  if (io) {
    io.emit('errore', { error });
  }
};

export const notificaBroadcast = (tipo, messaggio) => {
  if (io) {
    io.emit(tipo, messaggio);
  }
};

export default {
  initializeSocketIO,
  notificaNuovoOrdine,
  notificaOrdineAggiornato,
  notificaBackup,
  notificaErrore,
  notificaBroadcast
};