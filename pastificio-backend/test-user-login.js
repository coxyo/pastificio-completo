// test-user-login.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

// Importa il modello User
import User from './models/User.js';

async function testUserLogin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso a MongoDB\n');

    // Trova l'admin INCLUDENDO la password
    const admin = await User.findOne({ email: 'admin@pastificio.com' }).select('+password');
    
    if (!admin) {
      console.log('❌ Admin non trovato!');
      return;
    }

    console.log('👤 Admin trovato:');
    console.log('   ID:', admin._id);
    console.log('   Email:', admin.email);
    console.log('   Username:', admin.username);
    console.log('   Ruolo:', admin.ruolo);
    console.log('   Password presente:', !!admin.password);
    
    // Test password
    console.log('\n🧪 Test password...');
    const match = await admin.matchPassword('admin123');
    console.log('   Password "admin123" corretta:', match ? '✅ SÌ' : '❌ NO');
    
    if (match) {
      // Genera token
      const token = admin.getSignedJwtToken();
      console.log('\n✅ LOGIN SIMULATO CON SUCCESSO!');
      console.log('\n📋 TOKEN DA USARE:');
      console.log('━'.repeat(80));
      console.log(token);
      console.log('━'.repeat(80));
      console.log('\n📌 Copia il token sopra e usalo nei test API!');
    } else {
      console.log('\n❌ Password non corrisponde!');
    }

  } catch (error) {
    console.error('❌ Errore:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Connessione chiusa');
  }
}

testUserLogin();