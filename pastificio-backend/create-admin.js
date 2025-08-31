import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function createAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pastificio');
        console.log('Connesso al database');
        
        // Verifica se esiste già
        const existing = await User.findOne({ email: 'admin@pastificio.com' });
        if (existing) {
            console.log('Admin già esistente');
            // Aggiorna password
            existing.password = 'Admin123!';
            existing.role = 'admin';
            existing.isActive = true;
            await existing.save();
            console.log('Password aggiornata per admin@pastificio.com');
        } else {
            // Crea nuovo
            const admin = await User.create({
                nome: 'Admin',
                email: 'admin@pastificio.com',
                password: 'Admin123!',
                role: 'admin',
                isActive: true
            });
            console.log('Admin creato:', admin.email);
        }
    } catch (error) {
        console.error('Errore:', error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

createAdmin();