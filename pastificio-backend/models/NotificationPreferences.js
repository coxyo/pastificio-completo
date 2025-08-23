// pastificio-backend/models/NotificationPreferences.js
import mongoose from 'mongoose';

const notificationPreferencesSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  email: {
    enabled: { type: Boolean, default: false },
    address: { type: String, default: '' }
  },
  sms: {
    enabled: { type: Boolean, default: false },
    phoneNumber: { type: String, default: '' }
  },
  browser: {
    enabled: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

export default mongoose.model('NotificationPreferences', notificationPreferencesSchema);