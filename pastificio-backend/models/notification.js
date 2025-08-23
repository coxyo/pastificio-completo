import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['ordine', 'magazzino', 'sistema', 'pagamento', 'promemoria', 'altro'],
    default: 'sistema'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  priority: {
    type: String,
    enum: ['bassa', 'media', 'alta', 'critica'],
    default: 'media'
  },
  read: {
    type: Boolean,
    default: false
  },
  actionRequired: {
    type: Boolean,
    default: false
  },
  actionLink: {
    type: String,
    default: null
  },
  relatedDocument: {
    type: {
      type: String,
      enum: ['ordine', 'utente', 'prodotto', 'fornitore', null],
      default: null
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    }
  },
  deliveryChannels: {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: false },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: false }
  },
  deliveryStatus: {
    inApp: { type: String, enum: ['pending', 'sent', 'failed', 'delivered'], default: 'pending' },
    email: { type: String, enum: ['pending', 'sent', 'failed', 'delivered'], default: 'pending' },
    sms: { type: String, enum: ['pending', 'sent', 'failed', 'delivered'], default: 'pending' },
    push: { type: String, enum: ['pending', 'sent', 'failed', 'delivered'], default: 'pending' }
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 giorni di default
  }
}, {
  timestamps: true
});

// Indici per migliorare le performance
NotificationSchema.index({ recipient: 1, read: 1 });
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Metodi di utility
NotificationSchema.methods.markAsRead = function() {
  this.read = true;
  return this.save();
};

NotificationSchema.methods.updateDeliveryStatus = function(channel, status) {
  if (this.deliveryChannels[channel]) {
    this.deliveryStatus[channel] = status;
    return this.save();
  }
  return Promise.resolve(this);
};

// Metodi statici
NotificationSchema.statics.getUnreadByUser = function(userId) {
  return this.find({ recipient: userId, read: false })
    .sort({ createdAt: -1 });
};

NotificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { recipient: userId, read: false },
    { $set: { read: true } }
  );
};

const Notification = mongoose.model('Notification', NotificationSchema);

export default Notification;