// models/Session.js - ✅ NUOVO: Gestione sessioni attive e logout remoto
import mongoose from 'mongoose';
import crypto from 'crypto';

const SessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  username: {
    type: String,
    required: true
  },
  // Hash del token JWT (non salvare mai il token in chiaro!)
  tokenHash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  dispositivo: {
    type: String,
    enum: ['PC', 'Tablet', 'Mobile', 'Sconosciuto'],
    default: 'Sconosciuto'
  },
  browser: {
    type: String,
    default: 'Sconosciuto'
  },
  ip: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  loginAt: {
    type: Date,
    default: Date.now
  },
  ultimaAttivita: {
    type: Date,
    default: Date.now
  },
  stato: {
    type: String,
    enum: ['attiva', 'scaduta', 'disconnessa'],
    default: 'attiva',
    index: true
  },
  disconnessoDa: {
    type: String,
    default: null
  },
  disconnessoAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indici composti per query frequenti
SessionSchema.index({ userId: 1, stato: 1 });
SessionSchema.index({ stato: 1, ultimaAttivita: 1 });
// TTL: rimuovi automaticamente sessioni disconnesse/scadute dopo 30 giorni
SessionSchema.index({ disconnessoAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// ✅ Helper statico: genera hash del token
SessionSchema.statics.hashToken = function(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// ✅ Helper statico: rileva dispositivo da User-Agent
SessionSchema.statics.parseUserAgent = function(ua) {
  if (!ua) return { dispositivo: 'Sconosciuto', browser: 'Sconosciuto' };

  let dispositivo = 'PC';
  let browser = 'Sconosciuto';

  // Dispositivo
  const uaLower = ua.toLowerCase();
  if (uaLower.includes('ipad') || uaLower.includes('tablet') || 
      (uaLower.includes('android') && !uaLower.includes('mobile'))) {
    dispositivo = 'Tablet';
  } else if (uaLower.includes('mobile') || uaLower.includes('iphone') || 
             uaLower.includes('android')) {
    dispositivo = 'Mobile';
  }

  // Browser (ordine importante: Edge contiene "Chrome", Chrome contiene "Safari")
  if (uaLower.includes('edg/') || uaLower.includes('edge')) {
    browser = 'Edge';
  } else if (uaLower.includes('firefox')) {
    browser = 'Firefox';
  } else if (uaLower.includes('chrome') && !uaLower.includes('edg')) {
    browser = 'Chrome';
  } else if (uaLower.includes('safari') && !uaLower.includes('chrome')) {
    browser = 'Safari';
  }

  return { dispositivo, browser };
};

// ✅ Helper statico: crea sessione al login
SessionSchema.statics.creaSessione = async function(user, token, req) {
  const tokenHash = this.hashToken(token);
  const ua = req.headers['user-agent'] || '';
  const { dispositivo, browser } = this.parseUserAgent(ua);

  // IP: prova vari header (proxy, Vercel, Railway, etc.)
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
             req.headers['x-real-ip'] ||
             req.connection?.remoteAddress ||
             req.ip ||
             null;

  const session = await this.create({
    userId: user._id,
    username: user.nome || user.username || user.email,
    tokenHash,
    dispositivo,
    browser,
    ip,
    userAgent: ua.substring(0, 500), // Tronca per sicurezza
    loginAt: new Date(),
    ultimaAttivita: new Date(),
    stato: 'attiva'
  });

  return session;
};

// ✅ Helper statico: verifica se una sessione è valida
SessionSchema.statics.verificaSessione = async function(token) {
  const tokenHash = this.hashToken(token);
  const session = await this.findOne({ tokenHash, stato: 'attiva' });
  return session;
};

// ✅ Helper statico: aggiorna ultima attività
SessionSchema.statics.aggiornaAttivita = async function(token) {
  const tokenHash = this.hashToken(token);
  return this.findOneAndUpdate(
    { tokenHash, stato: 'attiva' },
    { ultimaAttivita: new Date() },
    { new: true }
  );
};

// ✅ Helper statico: disconnetti una sessione specifica
SessionSchema.statics.disconnettiSessione = async function(sessionId, disconnessoDa) {
  return this.findByIdAndUpdate(sessionId, {
    stato: 'disconnessa',
    disconnessoDa,
    disconnessoAt: new Date()
  }, { new: true });
};

// ✅ Helper statico: disconnetti tutte le sessioni di un utente TRANNE una
SessionSchema.statics.disconnettiTutteTranneCorrente = async function(userId, tokenHashCorrente, disconnessoDa) {
  return this.updateMany(
    { 
      userId, 
      stato: 'attiva', 
      tokenHash: { $ne: tokenHashCorrente } 
    },
    {
      stato: 'disconnessa',
      disconnessoDa,
      disconnessoAt: new Date()
    }
  );
};

// ✅ Helper statico: disconnetti TUTTE le sessioni attive tranne la corrente (admin)
SessionSchema.statics.disconnettiTutteLeAltre = async function(tokenHashCorrente, disconnessoDa) {
  return this.updateMany(
    { 
      stato: 'attiva', 
      tokenHash: { $ne: tokenHashCorrente } 
    },
    {
      stato: 'disconnessa',
      disconnessoDa,
      disconnessoAt: new Date()
    }
  );
};

// ✅ Helper statico: segna come scadute le sessioni inattive da più di 12h
SessionSchema.statics.pulisciSessioniScadute = async function() {
  const dueOreFa = new Date(Date.now() - 12 * 60 * 60 * 1000);
  return this.updateMany(
    { 
      stato: 'attiva', 
      ultimaAttivita: { $lt: dueOreFa } 
    },
    {
      stato: 'scaduta'
    }
  );
};

const Session = mongoose.model('Session', SessionSchema);

export default Session;