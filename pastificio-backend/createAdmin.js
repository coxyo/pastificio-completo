// createAdmin.js - Versione ES Modules
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Schema User
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'viewer'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

async function createAdminUser() {
  try {
    // Connetti a MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pastificio';
    await mongoose.connect(mongoUri);
    console.log('✅ Connesso a MongoDB');

    // Controlla se admin esiste già
    const existingAdmin = await User.findOne({ username: 'admin' });
    
    if (existingAdmin) {
      console.log('⚠️  Utente admin esiste già');
      
      // Resetta la password
      const newPassword = 'admin123';
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      existingAdmin.password = hashedPassword;
      existingAdmin.isActive = true;
      existingAdmin.role = 'admin';
      await existingAdmin.save();
      
      console.log('✅ Password admin resettata');
      console.log('📝 Credenziali:');
      console.log('   Username: admin');
      console.log('   Password:', newPassword);
    } else {
      // Crea nuovo admin
      const password = 'admin123';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const adminUser = new User({
        username: 'admin',
        email: 'admin@pastificio.it',
        password: hashedPassword,
        role: 'admin',
        isActive: true
      });
      
      await adminUser.save();
      
      console.log('✅ Utente admin creato con successo!');
      console.log('📝 Credenziali:');
      console.log('   Username: admin');
      console.log('   Password:', password);
    }
    
    // Mostra tutti gli utenti esistenti
    console.log('\n📋 Utenti nel database:');
    const users = await User.find({}, 'username email role isActive');
    users.forEach(user => {
      console.log(`   - ${user.username} (${user.email}) - Ruolo: ${user.role} - Attivo: ${user.isActive}`);
    });
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Connessione chiusa');
    process.exit(0);
  }
}

// Esegui lo script
createAdminUser();