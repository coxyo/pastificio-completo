// models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const UserSchema = new mongoose.Schema({
  // Campo nome per compatibilità con auth.js
  nome: {
    type: String,
    required: [true, 'Nome richiesto'],
    trim: true,
    minlength: [2, 'Nome deve essere almeno 2 caratteri']
  },
  // Username opzionale
  username: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    minlength: [3, 'Username deve essere almeno 3 caratteri']
  },
  // Email principale per autenticazione
  email: {
    type: String,
    required: [true, 'Email richiesta'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email non valida']
  },
  password: {
    type: String,
    required: [true, 'Password richiesta'],
    minlength: [6, 'Password deve essere almeno 6 caratteri'],
    select: false
  },
  // Campo role (non ruolo) per compatibilità
  role: {
    type: String,
    enum: ['admin', 'superadmin', 'operatore', 'viewer', 'user'],
    default: 'operatore'
  },
  // Campo isActive (non attivo) per compatibilità
  isActive: {
    type: Boolean,
    default: true
  },
  telefono: {
    type: String,
    sparse: true,
    match: [/^(\+39)?\s?3\d{2}\s?\d{6,7}$/, 'Numero di telefono non valido']
  },
  notificationPreferences: {
    email: {
      enabled: { type: Boolean, default: true },
      lowStock: { type: Boolean, default: true },
      expiring: { type: Boolean, default: true },
      orders: { type: Boolean, default: true },
      dailyReport: { type: Boolean, default: false }
    },
    sms: {
      enabled: { type: Boolean, default: false },
      onlyCritical: { type: Boolean, default: true }
    },
    browser: {
      enabled: { type: Boolean, default: true }
    },
    whatsapp: {
      enabled: { type: Boolean, default: true }
    }
  },
  lastNotificationSent: Date,
  notificationHistory: [{
    type: String,
    channel: String,
    sentAt: { type: Date, default: Date.now },
    success: Boolean
  }],
  lastLogin: Date,
  ultimoAccesso: Date,
  tentativi: { type: Number, default: 0 },
  bloccato: { type: Boolean, default: false },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  tokenVersion: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Indici
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });

// Hash password prima del salvataggio
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Confronta password
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Genera JWT token
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      tokenVersion: this.tokenVersion 
    }, 
    process.env.JWT_SECRET || 'pastificio-secret-key-2024',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// Genera reset password token
UserSchema.methods.getResetPasswordToken = function() {
  const resetToken = crypto.randomBytes(20).toString('hex');
  
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minuti
  
  return resetToken;
};

// Metodo per registrare una notifica
UserSchema.methods.logNotification = async function(type, channel, success = true) {
  this.notificationHistory.push({
    type,
    channel,
    success
  });
  
  this.lastNotificationSent = new Date();
  
  // Mantieni solo le ultime 100 notifiche
  if (this.notificationHistory.length > 100) {
    this.notificationHistory = this.notificationHistory.slice(-100);
  }
  
  await this.save();
};

// Metodo per verificare se può ricevere notifiche
UserSchema.methods.canReceiveNotification = function(type, channel) {
  if (!this.notificationPreferences[channel]?.enabled) {
    return false;
  }
  
  // Verifica preferenze specifiche per tipo
  if (channel === 'email' && this.notificationPreferences.email[type] !== undefined) {
    return this.notificationPreferences.email[type];
  }
  
  // Per SMS, solo notifiche critiche se specificato
  if (channel === 'sms' && this.notificationPreferences.sms.onlyCritical) {
    return ['lowStock', 'expiring'].includes(type);
  }
  
  return true;
};

// Metodo helper per verificare se è admin
UserSchema.methods.isAdmin = function() {
  return this.role === 'admin' || this.role === 'superadmin';
};

const User = mongoose.model('User', UserSchema);

export default User;