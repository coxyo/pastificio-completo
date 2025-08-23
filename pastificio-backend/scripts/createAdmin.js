// pastificio-backend/scripts/createAdmin.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Schema User semplificato
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  nome: String,
  cognome: String,
  ruolo: { type: String, default: 'admin' },
  attivo: { type: Boolean, default: true }
});

const User = mongoose.model('User', userSchema);

async function createAdmin() {
  try {
    // Connetti a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connesso a MongoDB');

    // Crea password hashata
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Crea o aggiorna l'admin
    const admin = await User.findOneAndUpdate(
      { email: 'admin@pastificio.it' },
      {
        email: 'admin@pastificio.it',
        password: hashedPassword,
        nome: 'Admin',
        cognome: 'Pastificio',
        ruolo: 'admin',
        attivo: true
      },
      { upsert: true, new: true }
    );

    console.log('✅ Admin creato/aggiornato:', admin.email);
    
    // Chiudi la connessione
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
}

createAdmin();