// fix-admin-password.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

// Schema User completo con metodo matchPassword
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  ruolo: String,
  attivo: Boolean
}, { strict: false });

// Aggiungi il metodo matchPassword
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

async function fixAdminPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso a MongoDB');

    // Trova l'admin
    const admin = await User.findOne({ email: 'admin@pastificio.com' });
    
    if (!admin) {
      console.log('❌ Admin non trovato!');
      return;
    }

    console.log('\n🔍 Controllo password attuale...');
    console.log('Password nel DB:', admin.password);
    
    // Verifica se la password attuale è già hashata
    const isHashed = admin.password && admin.password.startsWith('$2');
    console.log('Password hashata?', isHashed ? 'Sì' : 'No');
    
    if (!isHashed) {
      console.log('\n🔧 Hashing della password...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      admin.password = hashedPassword;
      await admin.save();
      console.log('✅ Password hashata e salvata!');
    }
    
    // Test della password
    console.log('\n🧪 Test password...');
    const match = await admin.matchPassword('admin123');
    console.log('Password "admin123" funziona?', match ? '✅ SÌ' : '❌ NO');
    
    // Test diretto con bcrypt
    const directMatch = await bcrypt.compare('admin123', admin.password);
    console.log('Test diretto bcrypt:', directMatch ? '✅ SÌ' : '❌ NO');
    
    console.log('\n📋 Dati finali admin:');
    console.log('   Email:', admin.email);
    console.log('   Username:', admin.username);
    console.log('   Password: admin123');
    console.log('   Ruolo:', admin.ruolo);
    console.log('   Attivo:', admin.attivo);

  } catch (error) {
    console.error('❌ Errore:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Connessione chiusa');
  }
}

fixAdminPassword();