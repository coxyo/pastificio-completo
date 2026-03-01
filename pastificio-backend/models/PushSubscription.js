// models/PushSubscription.js - ✅ NUOVO: Subscription Web Push per notifiche native
import mongoose from 'mongoose';

const pushSubscriptionSchema = new mongoose.Schema({
  // Utente proprietario
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

  // Descrizione dispositivo (es: "PC - Chrome", "Tablet - Chrome")
  dispositivo: {
    type: String,
    default: 'Sconosciuto'
  },

  // Subscription Web Push (oggetto dal browser)
  subscription: {
    endpoint: { type: String, required: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true }
    }
  },

  // Preferenze notifiche per tipo
  preferenze: {
    chiamate: { type: Boolean, default: true },
    alertCritici: { type: Boolean, default: true },
    nuoviOrdini: { type: Boolean, default: false },
    ordiniModificati: { type: Boolean, default: false }
  },

  // Stato
  attiva: {
    type: Boolean,
    default: true
  },

  // Tracking
  ultimoUtilizzo: {
    type: Date,
    default: Date.now
  },
  erroriConsecutivi: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indice unico per endpoint (un browser = una subscription)
pushSubscriptionSchema.index({ 'subscription.endpoint': 1 }, { unique: true });

// Indice per query frequenti
pushSubscriptionSchema.index({ userId: 1, attiva: 1 });

// TTL: rimuovi subscription non usate da 90 giorni
pushSubscriptionSchema.index({ ultimoUtilizzo: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Metodi statici
pushSubscriptionSchema.statics.trovaPerUtente = function(userId) {
  return this.find({ userId, attiva: true });
};

pushSubscriptionSchema.statics.trovaTutte = function() {
  return this.find({ attiva: true });
};

// Trova subscription per tipo di notifica
pushSubscriptionSchema.statics.trovaPerTipo = function(tipo, escludiUserId = null) {
  const filtro = { attiva: true };
  filtro[`preferenze.${tipo}`] = true;
  
  if (escludiUserId) {
    filtro.userId = { $ne: escludiUserId };
  }
  
  return this.find(filtro);
};

// Segna errore (dopo 3 errori consecutivi, disattiva)
pushSubscriptionSchema.methods.segnaErrore = async function() {
  this.erroriConsecutivi += 1;
  if (this.erroriConsecutivi >= 3) {
    this.attiva = false;
  }
  return this.save();
};

// Reset errori (quando invio riesce)
pushSubscriptionSchema.methods.segnaSuccesso = async function() {
  this.erroriConsecutivi = 0;
  this.ultimoUtilizzo = new Date();
  return this.save();
};

const PushSubscription = mongoose.model('PushSubscription', pushSubscriptionSchema);
export default PushSubscription;