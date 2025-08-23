// update-admin.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema);

async function updateAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso a MongoDB');

    const admin = await User.findOne({ username: 'admin' });
    
    if (admin) {
      // Aggiungi email
      admin.email = 'admin@pastificio.com';
      admin.attivo = true;
      await admin.save();
      
      console.log('✅ Admin aggiornato con successo!');
      console.log('\n📋 Credenziali aggiornate:');
      console.log('   Email: admin@pastificio.com');
      console.log('   Password: admin123');
      console.log('   Username:', admin.username);
      console.log('   Ruolo:', admin.ruolo);
    } else {
      console.log('❌ Admin non trovato!');
    }

  } catch (error) {
    console.error('❌ Errore:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Connessione chiusa');
  }
}

updateAdmin();