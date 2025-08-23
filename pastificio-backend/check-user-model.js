// check-user-model.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function checkUserModel() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso a MongoDB\n');

    // Importa il modello User dal progetto
    const User = (await import('./models/User.js')).default;
    
    console.log('📋 Controllo modello User...');
    console.log('Schema fields:', Object.keys(User.schema.paths));
    console.log('Methods:', Object.keys(User.schema.methods));
    console.log('Statics:', Object.keys(User.schema.statics));
    
    // Trova l'admin
    const admin = await User.findOne({ email: 'admin@pastificio.com' }).select('+password');
    
    if (admin) {
      console.log('\n👤 Admin trovato:');
      console.log('ID:', admin._id);
      console.log('Email:', admin.email);
      console.log('Username:', admin.username);
      console.log('Password (hash):', admin.password?.substring(0, 20) + '...');
      console.log('Ruolo:', admin.ruolo);
      
      // Test metodo matchPassword
      console.log('\n🧪 Test metodo matchPassword...');
      if (typeof admin.matchPassword === 'function') {
        try {
          const match = await admin.matchPassword('admin123');
          console.log('matchPassword risultato:', match);
        } catch (err) {
          console.log('Errore in matchPassword:', err.message);
        }
      } else {
        console.log('❌ Metodo matchPassword NON TROVATO!');
      }
    }

  } catch (error) {
    console.error('❌ Errore:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Connessione chiusa');
  }
}

checkUserModel();