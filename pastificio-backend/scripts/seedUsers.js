// scripts/seedUsers.js - ✅ Crea i 3 utenti iniziali
// Eseguire UNA VOLTA con: node scripts/seedUsers.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

const utentiIniziali = [
  {
    nome: 'Maurizio',
    username: 'maurizio',
    email: 'maurizio@pastificiononnacaudia.it',
    password: 'Maurizio1', // ✅ 8+ char, 1 numero
    role: 'admin',
    isActive: true,
    passwordTemporanea: true // Dovrà cambiare al primo accesso
  },
  {
    nome: 'Francesca',
    username: 'francesca',
    email: 'francesca@pastificiononnacaudia.it',
    password: 'Francesca1',
    role: 'operatore',
    isActive: true,
    passwordTemporanea: true
  },
  {
    nome: 'Valentina',
    username: 'valentina',
    email: 'valentina@pastificiononnacaudia.it',
    password: 'Valentina1',
    role: 'operatore',
    isActive: true,
    passwordTemporanea: true
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connesso a MongoDB');

    for (const userData of utentiIniziali) {
      // Controlla se esiste già
      const existing = await User.findOne({
        $or: [
          { email: userData.email },
          { username: userData.username }
        ]
      });

      if (existing) {
        console.log(`⚠️  ${userData.nome} esiste già (${existing.email}), aggiorno ruolo...`);
        existing.role = userData.role;
        existing.isActive = true;
        await existing.save({ validateBeforeSave: false });
        continue;
      }

      const user = await User.create(userData);
      console.log(`✅ Creato: ${user.nome} (${user.username}) - Ruolo: ${user.role}`);
    }

    console.log('\n🎉 Seed completato!');
    console.log('\n📋 Credenziali iniziali:');
    console.log('   Maurizio  → username: maurizio  | password: Maurizio1  (ADMIN)');
    console.log('   Francesca → username: francesca | password: Francesca1 (OPERATORE)');
    console.log('   Valentina → username: valentina | password: Valentina1 (OPERATORE)');
    console.log('\n⚠️  Tutti dovranno cambiare password al primo accesso');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore seed:', error);
    process.exit(1);
  }
}

seed();