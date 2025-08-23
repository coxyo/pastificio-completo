// scripts/createUsers.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carica variabili ambiente
dotenv.config({ path: join(__dirname, '..', '.env') });

// Schema User semplificato
const userSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String },
  password: { type: String, required: true },
  ruolo: { 
    type: String, 
    enum: ['admin', 'operatore', 'viewer'],
    default: 'operatore'
  },
  attivo: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Utenti da creare
const users = [
  {
    nome: "Amministratore",
    username: "admin",
    email: "admin@pastificio.it",
    password: "admin123",
    ruolo: "admin"
  },
  {
    nome: "Maria Rossi",
    username: "maria",
    email: "maria@pastificio.it", 
    password: "maria123",
    ruolo: "operatore"
  },
  {
    nome: "Giuseppe Verdi",
    username: "giuseppe",
    email: "giuseppe@pastificio.it",
    password: "giuseppe123",
    ruolo: "operatore"
  },
  {
    nome: "Anna Bianchi",
    username: "anna",
    email: "anna@pastificio.it",
    password: "anna123",
    ruolo: "operatore"
  }
];

async function createUsers() {
  try {
    // Connetti a MongoDB
    console.log('🔗 Connessione a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pastificio');
    console.log('✅ Connesso a MongoDB');

    // Elimina utenti esistenti (opzionale)
    console.log('🗑️  Pulizia utenti esistenti...');
    await User.deleteMany({});
    
    // Crea nuovi utenti
    console.log('👥 Creazione utenti...\n');
    
    for (const userData of users) {
      try {
        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        // Crea utente
        const user = new User({
          ...userData,
          password: hashedPassword
        });
        
        await user.save();
        
        console.log(`✅ Utente creato: ${userData.nome}`);
        console.log(`   Username: ${userData.username}`);
        console.log(`   Password: ${userData.password}`);
        console.log(`   Ruolo: ${userData.ruolo}`);
        console.log('   -------------------');
        
      } catch (error) {
        console.error(`❌ Errore creazione utente ${userData.username}:`, error.message);
      }
    }
    
    console.log('\n✨ Tutti gli utenti sono stati creati!');
    console.log('\n📋 CREDENZIALI DI ACCESSO:');
    console.log('========================');
    users.forEach(u => {
      console.log(`${u.ruolo.toUpperCase()}: ${u.username} / ${u.password}`);
    });
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Connessione chiusa');
  }
}

// Esegui
createUsers();