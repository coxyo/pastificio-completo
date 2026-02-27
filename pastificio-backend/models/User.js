// models/User.js - ✅ AGGIORNATO: Sicurezza + Multi-utente + Ruoli
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const UserSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Nome richiesto'],
    trim: true,
    minlength: [2, 'Nome deve essere almeno 2 caratteri']
  },
  username: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true,
    minlength: [3, 'Username deve essere almeno 3 caratteri']
  },
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
    minlength: [8, 'La password deve avere almeno 8 caratteri'],
    validate: {
      validator: function(v) {
        // Almeno 8 caratteri e almeno 1 numero
        return /^(?=.*\d).{8,}$/.test(v);
      },
      message: 'La password deve avere almeno 8 caratteri e contenere almeno un numero'
    },
    select: false
  },

  // ✅ RUOLO SEMPLICE (stringa)
  role: {
    type: String,
    enum: ['admin', 'operatore', 'visualizzatore'],
    default: 'operatore'
  },

  isActive: {
    type: Boolean,
    default: true
  },

  telefono: {
    type: String,
    sparse: true
  },

  // ✅ BLOCCO TENTATIVI FALLITI
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date,
    default: null
  },

  // ✅ TRACCIABILITÀ
  lastLogin: Date,
  ultimoAccesso: Date,

  // ✅ TOKEN VERSION (per invalidare sessioni)
  tokenVersion: {
    type: Number,
    default: 0
  },

  // ✅ PASSWORD TEMPORANEA (reset da admin)
  passwordTemporanea: {
    type: Boolean,
    default: false
  },

  // Notifiche (mantenute per compatibilità)
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

  resetPasswordToken: String,
  resetPasswordExpire: Date
}, {
  timestamps: true
});

// Indici
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });

// ✅ VIRTUAL: Account è bloccato?
UserSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// ✅ Hash password prima del salvataggio
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ✅ Confronta password
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ✅ Genera JWT token - SCADENZA 12 ORE
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      role: this.role,
      tokenVersion: this.tokenVersion 
    }, 
    process.env.JWT_SECRET || 'pastificio-secret-key-2024',
    { expiresIn: '12h' }  // ✅ SCADENZA 12 ORE (era 30d)
  );
};

// ✅ Incrementa tentativi falliti
UserSchema.methods.incrementLoginAttempts = async function() {
  // Se il blocco è scaduto, resetta
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // Blocca dopo 5 tentativi per 15 minuti
  if (this.loginAttempts + 1 >= 5) {
    updates.$set = { lockUntil: Date.now() + 15 * 60 * 1000 }; // 15 minuti
  }

  return this.updateOne(updates);
};

// ✅ Reset tentativi dopo login riuscito
UserSchema.methods.resetLoginAttempts = async function() {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

// ✅ Incrementa token version (invalida tutte le sessioni)
UserSchema.methods.incrementTokenVersion = async function() {
  this.tokenVersion = (this.tokenVersion || 0) + 1;
  return this.save({ validateBeforeSave: false });
};

// ✅ Helper: è admin?
UserSchema.methods.isAdmin = function() {
  return this.role === 'admin';
};

// ✅ Genera reset password token
UserSchema.methods.getResetPasswordToken = function() {
  const resetToken = crypto.randomBytes(20).toString('hex');
  
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  
  return resetToken;
};

// Metodo per registrare una notifica (mantenuto per compatibilità)
UserSchema.methods.logNotification = async function(type, channel, success = true) {
  this.notificationHistory.push({ type, channel, success });
  this.lastNotificationSent = new Date();
  if (this.notificationHistory.length > 100) {
    this.notificationHistory = this.notificationHistory.slice(-100);
  }
  await this.save({ validateBeforeSave: false });
};

UserSchema.methods.canReceiveNotification = function(type, channel) {
  if (!this.notificationPreferences[channel]?.enabled) return false;
  if (channel === 'email' && this.notificationPreferences.email[type] !== undefined) {
    return this.notificationPreferences.email[type];
  }
  if (channel === 'sms' && this.notificationPreferences.sms.onlyCritical) {
    return ['lowStock', 'expiring'].includes(type);
  }
  return true;
};

const User = mongoose.model('User', UserSchema);

export default User;