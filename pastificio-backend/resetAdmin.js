import mongoose from 'mongoose';
import User from './models/User.js';

const resetAdmin = async () => {
  try {
    // SOSTITUISCI ******* CON LA PASSWORD VERA DI MONGODB
    const MONGODB_URI = 'mongodb+srv://pastificio:Pastificio2025@cluster0.mongodb.net/pastificio?retryWrites=true&w=majority';
    
    console.log('🔄 Connessione a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connesso a MongoDB Atlas!');
    
    // Trova l'utente admin
    console.log('🔍 Cerco utente admin@pastificio.it...');
    const admin = await User.findOne({ email: 'admin@pastificio.it' });
    
    if (!admin) {
      console.log('❌ Admin non trovato nel database!');
      console.log('💡 Utenti disponibili:');
      const users = await User.find().select('email role');
      users.forEach(u => console.log(`   - ${u.email} (${u.role})`));
      process.exit(1);
    }
    
    console.log('✅ Admin trovato:', admin.email);
    console.log('🔄 Reset password in corso...');
    
    // Reset password (verrà hashata automaticamente dal pre-save hook)
    admin.password = 'Pastificio2025!';
    admin.isActive = true; // Assicurati che sia attivo
    await admin.save();
    
    console.log('');
    console.log('🎉 ========================================');
    console.log('✅ PASSWORD RESETTATA CON SUCCESSO!');
    console.log('🎉 ========================================');
    console.log('');
    console.log('📧 Email:    admin@pastificio.it');
    console.log('🔑 Password: Pastificio2025!');
    console.log('');
    console.log('👉 Ora puoi fare login sul Raspberry Pi!');
    console.log('');
    
    await mongoose.disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('');
    console.error('❌ ========================================');
    console.error('❌ ERRORE!');
    console.error('❌ ========================================');
    console.error('');
    console.error('Errore:', error.message);
    console.error('');
    
    if (error.message.includes('ENOTFOUND')) {
      console.error('💡 Problema di connessione MongoDB:');
      console.error('   - Verifica che la password sia corretta');
      console.error('   - Verifica che MongoDB Atlas sia raggiungibile');
      console.error('   - Controlla la whitelist IP su MongoDB Atlas');
    }
    
    process.exit(1);
  }
};

console.log('');
console.log('🚀 Reset Password Admin - Pastificio Nonna Claudia');
console.log('');
resetAdmin();