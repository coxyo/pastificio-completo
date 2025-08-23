// pastificio-backend/create-admin.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connesso a MongoDB');
    
    // Verifica se admin esiste già
    const existingAdmin = await User.findOne({ username: 'admin' });
    
    if (existingAdmin) {
      console.log('Admin già esistente, aggiorno la password...');
      existingAdmin.password = await bcrypt.hash('password123', 10);
      existingAdmin.attivo = true;
      existingAdmin.ruolo = 'admin';
      await existingAdmin.save();
      console.log('✅ Password admin aggiornata');
    } else {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const admin = new User({
        username: 'admin',
        email: 'admin@pastificio.com',
        password: hashedPassword,
        ruolo: 'admin',
        attivo: true
      });
      await admin.save();
      console.log('✅ Admin creato con successo');
    }
    
    console.log('Credenziali: username: admin, password: password123');
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
}

createAdmin();