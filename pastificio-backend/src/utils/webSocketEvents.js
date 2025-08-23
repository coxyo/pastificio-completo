// pastificio-backend/src/utils/webSocketEvents.js
import { io } from '../server.js';
import { logger } from '../config/logger.js';

export const initializeWebSocketEvents = () => {
  io.on('connection', (socket) => {
    logger.info(`Client connesso: ${socket.id}`);

    // Gestione sottoscrizione al dashboard
    socket.on('subscribeToDashboard', () => {
      socket.join('dashboard');
      logger.info(`Client ${socket.id} sottoscritto al dashboard`);
    });

    // Eventi per gli aggiornamenti
    socket.on('dashboardUpdate', (data) => {
      socket.to('dashboard').emit('dashboardDataUpdate', data);
    });

    // Gestione errori
    socket.on('error', (error) => {
      logger.error('WebSocket error:', error);
    });

    // Disconnessione
    socket.on('disconnect', () => {
      logger.info(`Client disconnesso: ${socket.id}`);
    });
  });
};

// Funzioni helper per emettere aggiornamenti
export const emitDashboardUpdate = (data) => {
  io.to('dashboard').emit('dashboardDataUpdate', data);
};

export const emitAlert = (alert) => {
  io.to('dashboard').emit('newAlert', alert);
};

export const emitSystemStatus = (status) => {
  io.to('dashboard').emit('systemStatusUpdate', status);
};