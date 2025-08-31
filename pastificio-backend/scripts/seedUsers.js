// scripts/seedUsers.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import logger from '../config/logger.js';

dotenv.config();

const users = [
  {
    nome: 'Amministratore',
    email: 'admin@pastificio.com',
    username: 'admin',
    password: 'Admin123!',
    role: 'admin',
    telefono: '+393401234567',
    isActive: true
  },
  {
    nome: 'Demo User',
    email: 'demo@pastificio.com',
    username: 'demo',
    password: 'Demo123!',
    role: 'operatore',
    telefono: '+393401234568',
    isActive: true
  },
  {
    nome: 'Test User',
    email: 'test@pastificio.com',
    username: 'test',
    password: 'Test123!',
    role: 'viewer',
    telefono: '+393401234569',
    isActive: true
  }
];

const seedUsers = async () => {
  try {
    // Connetti al database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pastificio');
    logger.info('Connesso al database');

    // Pulisci utenti esistenti (opzionale)
    // await User.deleteMany({});
    // logger.info('Utenti esistenti rimossi');

    // Crea nuovi utenti
    for (const userData of users) {
      try {
        // Verifica se l'utente esiste già
        const existingUser = await User.findOne({ 
          $or: [
            { email: userData.email },
            { username: userData.username }
          ]
        });

        if (existingUser) {
          logger.info(`Utente già esistente: ${userData.email}`);
          continue;
        }

        // Crea nuovo utente
        const user = await User.create(userData);
        logger.info(`Utente creato: ${user.email} - Role: ${user.role}`);
      } catch (error) {
        logger.error(`Errore creazione utente ${userData.email}:`, error.message);
      }
    }

    logger.info('Seed utenti completato');
    process.exit(0);
  } catch (error) {
    logger.error('Errore seed utenti:', error);
    process.exit(1);
  }
};

seedUsers();