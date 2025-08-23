// config/config.js
import dotenv from 'dotenv';
dotenv.config();

export default {
  email: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    senderName: 'Pastificio Nonna Claudia',
    from: process.env.EMAIL_FROM
  },
  sms: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER
  },
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000'
  }
};