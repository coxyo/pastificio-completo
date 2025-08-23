// clean-and-create-admin.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

// Schema flessibile per trovare tutti gli utenti
const UserFlexible = mongoose.model('UserFlex', new mongoose.Schema({}, { strict: false }), 'users');

// Schema corretto per creare il nuovo utente
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

async function cleanAndCreate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso a MongoDB\n');

    // Prima mostra tutti gli utenti esistenti
    console.log('🔍 Utenti esistenti:');
    const existingUsers = await UserFlexible.find({});
    existingUsers.forEach(user => {
      console.log(`  - Username: ${user.username}, Email: ${user.email}, ID: ${user._id}`);
    });

    // Elimina TUTTI gli utenti admin
    console.log('\n🗑️  Eliminazione di tutti gli admin...');
    await UserFlexible.deleteMany({ 
      $or: [
        { username: 'admin' },
        { email: 'admin@pastificio.com' }
      ]
    });
    console.log('✅ Tutti gli admin eliminati');

    // Verifica eliminazione
    const remainingUsers = await UserFlexible.find({});
    console.log(`\n📊 Utenti rimanenti: ${remainingUsers.length}`);

    // Crea nuovo admin
    console.log('\n🆕 Creazione nuovo admin...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const newAdmin = new User({
      username: 'admin',
      email: 'admin@pastificio.com',
      password: hashedPassword,
      ruolo: 'admin',
      attivo: true
    });
    
    await newAdmin.save();

    console.log('✅ Nuovo admin creato con successo!');
    console.log('\n📋 Credenziali:');
    console.log('   Email: admin@pastificio.com');
    console.log('   Password: admin123');
    console.log('   Username:', newAdmin.username);
    console.log('   Ruolo:', newAdmin.ruolo);
    
    // Test password
    const testMatch = await newAdmin.matchPassword('admin123');
    console.log('\n🧪 Test password:', testMatch ? '✅ FUNZIONA' : '❌ NON FUNZIONA');

  } catch (error) {
    console.error('❌ Errore:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Connessione chiusa');
  }
}

cleanAndCreate();