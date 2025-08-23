// debug-auth.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

// Schema User con tutti i possibili campi
const userSchema = new mongoose.Schema({}, { strict: false });

const User = mongoose.model('User', userSchema);

async function debugAuth() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso a MongoDB\n');

    // Trova tutti gli utenti
    const users = await User.find({});
    console.log(`📊 Totale utenti nel database: ${users.length}\n`);

    // Mostra dettagli di ogni utente
    for (const user of users) {
      console.log('👤 Utente trovato:');
      console.log('   ID:', user._id);
      console.log('   Username:', user.username);
      console.log('   Email:', user.email);
      console.log('   Ruolo:', user.ruolo);
      console.log('   Attivo:', user.attivo);
      console.log('   Password hash:', user.password ? user.password.substring(0, 20) + '...' : 'MANCANTE');
      
      // Test password
      if (user.password) {
        const testPassword = await bcrypt.compare('password123', user.password);
        console.log('   Test password123:', testPassword ? '✅ MATCH' : '❌ NO MATCH');
      }
      
      console.log('   Altri campi:', Object.keys(user.toObject()).filter(k => 
        !['_id', 'username', 'email', 'ruolo', 'attivo', 'password', '__v'].includes(k)
      ));
      console.log('─'.repeat(50));
    }

    // Trova specificamente l'admin
    const admin = await User.findOne({ email: 'admin@pastificio.com' });
    if (!admin) {
      console.log('\n❌ Nessun utente con email admin@pastificio.com');
    }

  } catch (error) {
    console.error('❌ Errore:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Connessione chiusa');
  }
}

debugAuth();