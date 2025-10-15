// scripts/seedUsers.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configura __dirname per ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carica variabili d'ambiente
dotenv.config({ path: join(__dirname, '..', '.env') });

// Schema User inline (per evitare import problematici)
const userSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  ruolo: { type: String, enum: ['admin', 'operatore', 'viewer'], default: 'operatore' },
  attivo: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

const seedUsers = async () => {
  try {
    console.log('🔄 Connessione a MongoDB...');
    console.log('📍 URI:', process.env.MONGODB_URI ? 'Presente' : 'MANCANTE!');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso a MongoDB');

    // Verifica se esistono già utenti
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log(`⚠️ Ci sono già ${existingUsers} utenti nel database`);
      console.log('💡 Elimina gli utenti esistenti o usa credenziali diverse');
      
      // Mostra gli utenti esistenti
      const users = await User.find({}, 'email nome ruolo');
      console.log('📋 Utenti esistenti:');
      users.forEach(u => console.log(`   - ${u.email} (${u.nome}) - ${u.ruolo}`));
      
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log('🔐 Creazione password hashate...');
    
    // Crea password hashata per admin
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    // Crea utente admin
    const adminUser = await User.create({
      nome: 'Admin',
      email: 'admin@pastificio.com',
      password: hashedPassword,
      ruolo: 'admin',
      attivo: true
    });

    console.log('✅ Utente admin creato:', adminUser.email);
    
    // Crea password hashata per test
    const hashedPasswordTest = await bcrypt.hash('test123', salt);
    
    // Crea utente test
    const testUser = await User.create({
      nome: 'Test User',
      email: 'test@pastificio.com',
      password: hashedPasswordTest,
      ruolo: 'operatore',
      attivo: true
    });

    console.log('✅ Utente test creato:', testUser.email);
    
    console.log('');
    console.log('🎉 Seed completato con successo!');
    console.log('📋 Credenziali create:');
    console.log('   1. admin@pastificio.com / admin123 (admin)');
    console.log('   2. test@pastificio.com / test123 (operatore)');
    console.log('');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore durante il seed:', error.message);
    console.error('Stack trace:', error.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedUsers();