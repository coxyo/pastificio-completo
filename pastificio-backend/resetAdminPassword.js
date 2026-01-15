// resetAdminPassword.js - Esegui nella cartella pastificio-backend
// Comando: node resetAdminPassword.js

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const resetPassword = async () => {
  try {
    console.log('🔄 Connessione a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso a MongoDB');

    // Schema User semplificato per questo script
    const userSchema = new mongoose.Schema({
      nome: String,
      email: String,
      password: String,
      role: String,
      ruolo: String,
      isActive: Boolean,
      attivo: Boolean
    }, { collection: 'users', strict: false });

    const User = mongoose.model('User', userSchema);

    // Lista utenti esistenti
    const users = await User.find({}, 'email nome role ruolo');
    console.log('\n📋 Utenti esistenti nel database:');
    users.forEach(u => {
      console.log(`   - ${u.email} (${u.nome || 'N/A'}) - ${u.role || u.ruolo || 'N/A'}`);
    });

    // Trova admin
    const admin = await User.findOne({ 
      $or: [
        { email: 'admin@pastificio.it' },
        { email: 'admin@pastificio.com' },
        { role: 'admin' },
        { ruolo: 'admin' }
      ]
    });

    if (!admin) {
      console.log('\n⚠️ Nessun admin trovato! Creo nuovo admin...');
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Pastificio2025!', salt);
      
      await User.create({
        nome: 'Amministratore',
        email: 'admin@pastificio.it',
        password: hashedPassword,
        role: 'admin',
        ruolo: 'admin',
        isActive: true,
        attivo: true
      });
      
      console.log('✅ Nuovo admin creato!');
      console.log('\n📋 Credenziali:');
      console.log('   Email: admin@pastificio.it');
      console.log('   Password: Pastificio2025!');
    } else {
      console.log(`\n✅ Admin trovato: ${admin.email}`);
      console.log('🔐 Reset password in corso...');
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Pastificio2025!', salt);
      
      await User.updateOne(
        { _id: admin._id },
        { 
          $set: { 
            password: hashedPassword,
            isActive: true,
            attivo: true
          }
        }
      );
      
      console.log('✅ Password resettata con successo!');
      console.log('\n📋 Credenziali aggiornate:');
      console.log(`   Email: ${admin.email}`);
      console.log('   Password: Pastificio2025!');
    }

    console.log('\n🎉 Operazione completata!');
    console.log('Ora puoi fare login con le credenziali sopra.');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

resetPassword();