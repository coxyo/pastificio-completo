// pastificio-backend/models/PreferenzeNotifiche.js
import mongoose from 'mongoose';

const preferenzeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  email: {
    enabled: { 
      type: Boolean, 
      default: true 
    },
    address: {
      type: String,
      default: ''
    }
  },
  sms: {
    enabled: { 
      type: Boolean, 
      default: false 
    },
    phoneNumber: {
      type: String,
      default: ''
    }
  },
  browser: {
    enabled: { 
      type: Boolean, 
      default: true 
    }
  },
  orariNotifiche: {
    inizioGiorno: {
      type: String,
      default: '08:00'
    },
    fineGiorno: {
      type: String,
      default: '20:00'
    },
    weekendEnabled: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Indici
preferenzeSchema.index({ userId: 1 });

export default mongoose.model('PreferenzeNotifiche', preferenzeSchema);