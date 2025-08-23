// create-new-admin.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);  // Corretto: una sola definizione

dotenv.config({ path: path.join(__dirname, '.env') });

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  ruolo: { type: String, default: 'operatore' },
  attivo: { type: Boolean, default: true }
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

async function createNewAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso a MongoDB');

    // Elimina vecchio admin se esiste
    await User.deleteOne({ email: 'admin@pastificio.com' });
    console.log('🗑️  Vecchio admin rimosso');

    // Crea nuovo admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const newAdmin = await User.create({
      username: 'admin',
      email: 'admin@pastificio.com',
      password: hashedPassword,
      ruolo: 'admin',
      attivo: true
    });

    console.log('✅ Nuovo admin creato!');
    console.log('📧 Email:', newAdmin.email);
    console.log('🔑 Password: admin123');
    
    // Test immediato
    const testMatch = await newAdmin.matchPassword('admin123');
    console.log('🧪 Test password:', testMatch ? '✅ FUNZIONA' : '❌ NON FUNZIONA');

  } catch (error) {
    console.error('❌ Errore:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Connessione chiusa');
  }
}

createNewAdmin();