// models/User.js (aggiornamento)
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Per favore fornisci un nome utente'],
    unique: true,
    trim: true,
    maxlength: [50, 'Nome utente non può essere più lungo di 50 caratteri']
  },
  password: {
    type: String,
    required: [true, 'Per favore fornisci una password'],
    minlength: [6, 'Password deve essere di almeno 6 caratteri'],
    select: false
  },
  nome: {
    type: String,
    required: [true, 'Per favore fornisci il nome'],
    trim: true,
    maxlength: [50, 'Nome non può essere più lungo di 50 caratteri']
  },
  cognome: {
    type: String,
    required: [true, 'Per favore fornisci il cognome'],
    trim: true,
    maxlength: [50, 'Cognome non può essere più lungo di 50 caratteri']
  },
  email: {
    type: String,
    required: [true, 'Per favore fornisci una email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Per favore fornisci una email valida'
    ]
  },
  ruolo: {
    type: mongoose.Schema.ObjectId,
    ref: 'Role',
    required: true
  },
  attivo: {
    type: Boolean,
    default: true
  },
  tokenVersion: {
    type: Number,
    default: 0
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  ultimoAccesso: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Cripta password
UserSchema.pre('save', async function(next) {
  // Procedi solo se la password è stata modificata
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Verifica match password
UserSchema.methods.matchPassword = async function(passwordInserita) {
  return await bcrypt.compare(passwordInserita, this.password);
};

// Genera JWT
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id, tokenVersion: this.tokenVersion },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '1d' }
  );
};

// Incrementa versione token (per invalidare sessioni)
UserSchema.methods.incrementTokenVersion = async function() {
  this.tokenVersion += 1;
  await this.save();
};

// Crea indici
UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ ruolo: 1 });

export default mongoose.model('User', UserSchema);