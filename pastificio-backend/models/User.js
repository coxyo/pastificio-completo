// models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username richiesto'],
    unique: true,
    trim: true,
    minlength: [3, 'Username deve essere almeno 3 caratteri']
  },
  password: {
    type: String,
    required: [true, 'Password richiesta'],
    minlength: [6, 'Password deve essere almeno 6 caratteri'],
    select: false
  },
  ruolo: {
    type: String,
    enum: ['admin', 'operatore', 'viewer'],
    default: 'operatore'
  },
  attivo: {
    type: Boolean,
    default: true
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email non valida']
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
    }
  },
  lastNotificationSent: Date,
  notificationHistory: [{
    type: String,
    channel: String,
    sentAt: { type: Date, default: Date.now },
    success: Boolean
  }],
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
UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ ruolo: 1 });

// Hash password prima del salvataggio
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
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
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
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

const User = mongoose.model('User', UserSchema);

export default User;