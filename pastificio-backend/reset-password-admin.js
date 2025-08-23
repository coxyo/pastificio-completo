// reset-password-admin.js
import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function resetPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connesso a MongoDB');

    // Trova l'admin
    const admin = await User.findOne({ email: 'admin@pastificio.com' });
    
    if (!admin) {
      console.log('Admin non trovato!');
      return;
    }

    // Resetta la password
    admin.password = 'Admin123!';
    await admin.save();

    console.log('Password resettata con successo!');
    console.log('Email: admin@pastificio.com');
    console.log('Password: Admin123!');
    
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('Errore:', error);
  }
}

resetPassword();